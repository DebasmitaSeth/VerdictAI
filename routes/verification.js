/* routes/verification.js ─────────────────────────────────── */
'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const {
  QueueItem, Case, Extraction, ActionPlan, VerifiedRecord, User,
} = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   GET /api/verification/queue
   Return all pending queue items
══════════════════════════════════════════════════════════ */
router.get('/queue', async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const items = await QueueItem.findAll({
      where: status === 'all' ? {} : { status },
      include: [{
        model: Case, as: 'case',
        attributes: ['id', 'caseNo', 'nature', 'department', 'aiScore', 'status', 'dateOfOrder'],
      }],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        items,
        counts: {
          pending:  await QueueItem.count({ where: { status: 'pending' } }),
          approved: await QueueItem.count({ where: { status: 'approved' } }),
          rejected: await QueueItem.count({ where: { status: 'rejected' } }),
          flagged:  await QueueItem.count({ where: { status: 'flagged'  } }),
        },
      },
    });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/verification/queue/:itemId
   Single queue item with full extraction + action plan
══════════════════════════════════════════════════════════ */
router.get('/queue/:itemId',
  [param('itemId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const item = await QueueItem.findByPk(req.params.itemId, {
        include: [
          { model: Case, as: 'case' },
        ],
      });
      if (!item) return res.status(404).json({ success: false, message: 'Queue item not found.' });

      // Fetch linked extraction and action plan
      const [extraction, actionPlan] = await Promise.all([
        item.extractionId ? Extraction.findByPk(item.extractionId) : null,
        item.actionPlanId ? ActionPlan.findByPk(item.actionPlanId)  : null,
      ]);

      res.json({
        success: true,
        data: { item, extraction, actionPlan },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/verification/queue/:itemId/approve
   Approve extraction + action plan → creates VerifiedRecord
══════════════════════════════════════════════════════════ */
router.post('/queue/:itemId/approve',
  authorize('admin', 'nodal_officer', 'legal_officer', 'secretary'),
  [
    param('itemId').isUUID(),
    body('notes').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await QueueItem.findByPk(req.params.itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Queue item not found.' });
      if (item.status !== 'pending') {
        return res.status(409).json({ success: false, message: `Item is already ${item.status}.` });
      }

      const caseRecord = await Case.findByPk(item.caseId);
      const actionPlan = item.actionPlanId ? await ActionPlan.findByPk(item.actionPlanId) : null;

      // Determine deadline and urgency
      const timelines      = actionPlan?.case?.timelines || [];
      const firstDeadline  = timelines[0]?.date || null;
      const urgencyMap     = { red: 'urgent', amber: 'normal', blue: 'normal', green: 'safe' };
      const deadlineClass  = urgencyMap[timelines[0]?.urgency || 'green'] || 'normal';

      // Build verified action strings from action plan
      const actionStrings = (actionPlan?.actions || []).map(a => a.desc || a.title);

      // Create the VerifiedRecord
      const verifiedRecord = await VerifiedRecord.create({
        caseId:          item.caseId,
        caseNo:          item.caseNo,
        title:           `${caseRecord.petitioner} vs ${caseRecord.respondent}`,
        department:      caseRecord.department,
        actionType:      caseRecord.actionType,
        actions:         actionStrings,
        verifiedById:    req.user.id,
        verifiedByLabel: `${req.user.firstName} ${req.user.lastName} — ${capitalize(req.user.role.replace('_', ' '))}`,
        verifiedOn:      new Date().toISOString().slice(0, 10),
        deadline:        firstDeadline  || null,
        deadlineClass:   deadlineClass,
        isCritical:      deadlineClass === 'urgent',
        aiScore:         item.confidence,
        queueItemId:     item.id,
        extractionId:    item.extractionId,
        actionPlanId:    item.actionPlanId,
      });

      // Publish the action plan
      if (actionPlan) await actionPlan.update({ isPublished: true });

      // Update queue item
      await item.update({
        status:      'approved',
        reviewedBy:  req.user.id,
        reviewedAt:  new Date(),
        reviewNotes: req.body.notes || null,
      });

      // Update case status
      await Case.update({ status: 'verified' }, { where: { id: item.caseId } });

      res.json({
        success: true,
        message: 'Case approved and moved to Verified Records.',
        data: { verifiedRecord },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/verification/queue/:itemId/reject
   Reject with mandatory notes
══════════════════════════════════════════════════════════ */
router.post('/queue/:itemId/reject',
  authorize('admin', 'nodal_officer', 'legal_officer', 'secretary'),
  [
    param('itemId').isUUID(),
    body('notes').trim().notEmpty().withMessage('Rejection reason is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await QueueItem.findByPk(req.params.itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Queue item not found.' });
      if (item.status !== 'pending') {
        return res.status(409).json({ success: false, message: `Item is already ${item.status}.` });
      }

      await item.update({
        status:      'rejected',
        reviewedBy:  req.user.id,
        reviewedAt:  new Date(),
        reviewNotes: req.body.notes,
      });

      // Push case back for re-extraction
      await Case.update({ status: 'uploaded' }, { where: { id: item.caseId } });

      res.json({ success: true, message: 'Case rejected. Returned for re-extraction.' });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/verification/queue/:itemId/flag
   Flag for senior review
══════════════════════════════════════════════════════════ */
router.post('/queue/:itemId/flag',
  [
    param('itemId').isUUID(),
    body('notes').trim().notEmpty().withMessage('Flag reason is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await QueueItem.findByPk(req.params.itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Queue item not found.' });

      await item.update({
        status:      'flagged',
        reviewedBy:  req.user.id,
        reviewedAt:  new Date(),
        reviewNotes: req.body.notes,
      });

      res.json({ success: true, message: 'Item flagged for senior review.' });
    } catch (err) { next(err); }
  }
);

/* ── Helpers ─────────────────────────────────────────── */
function capitalize(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = router;