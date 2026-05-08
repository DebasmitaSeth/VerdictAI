/* routes/verified.js ─────────────────────────────────────── */
'use strict';

const express = require('express');
const { Op }  = require('sequelize');
const { param, query } = require('express-validator');
const { VerifiedRecord, User } = require('../models');
const { authenticate }  = require('../middleware/auth');
const { validate }      = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   GET /api/verified
   Paginated, searchable, filterable verified records
══════════════════════════════════════════════════════════ */
router.get('/',
  [
    query('q').optional().isString().trim(),
    query('actionType').optional().isIn(['compliance','appeal','review','none','all']),
    query('critical').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['verifiedOn','deadline','aiScore','caseNo']),
    query('order').optional().isIn(['ASC','DESC']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page   = req.query.page  || 1;
      const limit  = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy || 'verifiedOn';
      const order  = req.query.order  || 'DESC';

      const where = {};
      if (req.query.actionType && req.query.actionType !== 'all') {
        where.actionType = req.query.actionType;
      }
      if (req.query.critical !== undefined) {
        where.isCritical = req.query.critical;
      }
      if (req.query.q) {
        const q = `%${req.query.q}%`;
        where[Op.or] = [
          { caseNo:     { [Op.iLike]: q } },
          { title:      { [Op.iLike]: q } },
          { department: { [Op.iLike]: q } },
        ];
      }

      const { count, rows } = await VerifiedRecord.findAndCountAll({
        where,
        include: [{
          model: User, as: 'verifier',
          attributes: ['id', 'firstName', 'lastName', 'role'],
        }],
        order:  [[sortBy, order]],
        limit,
        offset,
      });

      res.json({
        success: true,
        data: {
          records:    rows,
          pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   GET /api/verified/deadlines
   Upcoming deadlines sorted by urgency (for dashboard)
══════════════════════════════════════════════════════════ */
router.get('/deadlines', async (req, res, next) => {
  try {
    const today    = new Date();
    const in90days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const records = await VerifiedRecord.findAll({
      where: {
        deadline: { [Op.between]: [today, in90days] },
      },
      attributes: ['id', 'caseNo', 'title', 'deadline', 'deadlineClass', 'isCritical', 'department'],
      order: [['deadline', 'ASC']],
      limit: 10,
    });

    // Compute daysLeft for each
    const withDays = records.map(r => {
      const diff = Math.ceil((new Date(r.deadline) - today) / (1000 * 60 * 60 * 24));
      return { ...r.toJSON(), daysLeft: diff };
    });

    res.json({ success: true, data: withDays });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/verified/:id
   Single verified record (full detail)
══════════════════════════════════════════════════════════ */
router.get('/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const record = await VerifiedRecord.findByPk(req.params.id, {
        include: [{
          model: User, as: 'verifier',
          attributes: ['id', 'firstName', 'lastName', 'role', 'email'],
        }],
      });

      if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

      res.json({ success: true, data: record });
    } catch (err) { next(err); }
  }
);

module.exports = router;