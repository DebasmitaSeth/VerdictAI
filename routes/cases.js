/* routes/cases.js ────────────────────────────────────────── */
'use strict';

const express  = require('express');
const { Op }   = require('sequelize');
const { body, query, param } = require('express-validator');
const { Case, Extraction, ActionPlan, QueueItem, VerifiedRecord } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   GET /api/cases
   List cases with search, filter, sort, pagination
══════════════════════════════════════════════════════════ */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['uploaded','processing','extracted','pending_verification','verified','critical','closed']),
    query('department').optional().isString(),
    query('actionType').optional().isIn(['compliance','appeal','review','none']),
    query('q').optional().isString().trim(),
    query('sortBy').optional().isIn(['dateOfOrder','caseNo','aiScore','createdAt']),
    query('order').optional().isIn(['ASC','DESC']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page       = req.query.page  || 1;
      const limit      = req.query.limit || 20;
      const offset     = (page - 1) * limit;
      const sortBy     = req.query.sortBy || 'createdAt';
      const order      = req.query.order  || 'DESC';

      const where = {};
      if (req.query.status)     where.status     = req.query.status;
      if (req.query.department) where.department  = { [Op.iLike]: `%${req.query.department}%` };
      if (req.query.actionType) where.actionType  = req.query.actionType;

      if (req.query.q) {
        const q = `%${req.query.q}%`;
        where[Op.or] = [
          { caseNo:     { [Op.iLike]: q } },
          { petitioner: { [Op.iLike]: q } },
          { respondent: { [Op.iLike]: q } },
          { department: { [Op.iLike]: q } },
        ];
      }

      const { count, rows } = await Case.findAndCountAll({
        where,
        order:   [[sortBy, order]],
        limit,
        offset,
        attributes: { exclude: ['documentPath'] },   // omit file path from list
      });

      res.json({
        success: true,
        data: {
          cases:      rows,
          pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   GET /api/cases/stats
   Dashboard summary numbers
══════════════════════════════════════════════════════════ */
router.get('/stats', async (req, res, next) => {
  try {
    const { sequelize } = require('../models');
    const [total, pendingVerification, verified, critical, compliance, appeal] = await Promise.all([
      Case.count(),
      Case.count({ where: { status: 'pending_verification' } }),
      Case.count({ where: { status: 'verified' } }),
      Case.count({ where: { status: 'critical' } }),
      Case.count({ where: { actionType: 'compliance' } }),
      Case.count({ where: { actionType: 'appeal' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        pendingVerification,
        verified,
        critical,
        byActionType: { compliance, appeal },
      },
    });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/cases/:id
   Single case with full nested data
══════════════════════════════════════════════════════════ */
router.get('/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const c = await Case.findByPk(req.params.id, {
        include: [
          { model: Extraction,     as: 'extraction',     required: false },
          { model: ActionPlan,     as: 'actionPlan',     required: false },
          { model: QueueItem,      as: 'queueItem',      required: false },
          { model: VerifiedRecord, as: 'verifiedRecord', required: false },
        ],
      });

      if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

      res.json({ success: true, data: c });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/cases
   Create a case manually (upload route creates them too)
══════════════════════════════════════════════════════════ */
router.post('/',
  authorize('admin', 'nodal_officer'),
  [
    body('caseNo').trim().notEmpty().withMessage('Case number is required.'),
    body('dateOfOrder').isDate().withMessage('Valid date required.'),
    body('department').trim().notEmpty(),
    body('nature').trim().notEmpty(),
    body('petitioner').trim().notEmpty(),
    body('respondent').trim().notEmpty(),
    body('court').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const exists = await Case.findOne({ where: { caseNo: req.body.caseNo } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Case number already exists.' });
      }

      const c = await Case.create({ ...req.body, uploadedBy: req.user.id });
      res.status(201).json({ success: true, data: c });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   PATCH /api/cases/:id
   Partial update (status, actionType, etc.)
══════════════════════════════════════════════════════════ */
router.patch('/:id',
  authorize('admin', 'nodal_officer', 'legal_officer'),
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const c = await Case.findByPk(req.params.id);
      if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

      // Only allow safe fields to be patched
      const allowed = ['status', 'actionType', 'aiScore', 'limitationPeriod', 'disposal', 'bench'];
      const updates = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

      await c.update(updates);
      res.json({ success: true, data: c });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   DELETE /api/cases/:id   (soft-delete via paranoid)
══════════════════════════════════════════════════════════ */
router.delete('/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const c = await Case.findByPk(req.params.id);
      if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

      await c.destroy();   // sets deleted_at (paranoid)
      res.json({ success: true, message: 'Case removed.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;