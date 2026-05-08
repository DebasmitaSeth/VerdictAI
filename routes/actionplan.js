/* routes/actionplan.js ───────────────────────────────────── */
'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const { ActionPlan, Case } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   GET /api/actionplan
   List all action plans (published + unpublished)
══════════════════════════════════════════════════════════ */
router.get('/', async (req, res, next) => {
  try {
    const plans = await ActionPlan.findAll({
      include: [{
        model: Case, as: 'case',
        attributes: ['id', 'caseNo', 'status', 'department', 'nature', 'actionType'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/actionplan/:caseId
   Action plan for a specific case
══════════════════════════════════════════════════════════ */
router.get('/:caseId',
  [param('caseId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const plan = await ActionPlan.findOne({
        where: { caseId: req.params.caseId },
        include: [{
          model: Case, as: 'case',
        }],
      });

      if (!plan) {
        return res.status(404).json({ success: false, message: 'Action plan not found for this case.' });
      }

      res.json({ success: true, data: plan });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   PATCH /api/actionplan/:planId
   Allow authorised officers to tweak recommendation / actions
══════════════════════════════════════════════════════════ */
router.patch('/:planId',
  authorize('admin', 'nodal_officer', 'legal_officer'),
  [
    param('planId').isUUID(),
    body('recommendation').optional().isString(),
    body('reason').optional().isString(),
    body('actions').optional().isArray(),
    body('timeline').optional().isArray(),
    body('departments').optional().isArray(),
    body('risks').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const plan = await ActionPlan.findByPk(req.params.planId);
      if (!plan) return res.status(404).json({ success: false, message: 'Action plan not found.' });

      const allowed = ['recommendation', 'emoji', 'reason', 'confidence', 'actions', 'timeline', 'departments', 'risks'];
      const updates = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

      await plan.update(updates);
      res.json({ success: true, data: plan });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/actionplan/:planId/export
   Generate a PDF/JSON report snapshot
   (Stub — wire in a PDF generator in production)
══════════════════════════════════════════════════════════ */
router.post('/:planId/export',
  [param('planId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const plan = await ActionPlan.findByPk(req.params.planId, {
        include: [{ model: Case, as: 'case' }],
      });
      if (!plan) return res.status(404).json({ success: false, message: 'Action plan not found.' });

      // In production: generate PDF with puppeteer/pdfkit, return download URL
      res.json({
        success: true,
        message: 'Export queued. Download link will be emailed.',
        data: {
          planId:  plan.id,
          caseNo:  plan.case.caseNo,
          format:  req.body.format || 'pdf',
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;