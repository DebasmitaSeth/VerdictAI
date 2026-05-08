/* routes/extraction.js ───────────────────────────────────── */
'use strict';

const express = require('express');
const { param, body } = require('express-validator');
const { Extraction, Case } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   GET /api/extraction
   List all extractions (overview — no raw text)
══════════════════════════════════════════════════════════ */
router.get('/', async (req, res, next) => {
  try {
    const extractions = await Extraction.findAll({
      attributes: { exclude: ['rawText'] },
      include: [{
        model: Case, as: 'case',
        attributes: ['id', 'caseNo', 'status', 'department', 'nature', 'aiScore'],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: extractions });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/extraction/:caseId
   Full extraction for a specific case
══════════════════════════════════════════════════════════ */
router.get('/:caseId',
  [param('caseId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const extraction = await Extraction.findOne({
        where: { caseId: req.params.caseId },
        include: [{
          model: Case, as: 'case',
          attributes: ['id', 'caseNo', 'status', 'department', 'nature', 'court', 'bench', 'aiScore'],
        }],
      });

      if (!extraction) {
        return res.status(404).json({ success: false, message: 'Extraction not found for this case.' });
      }

      res.json({ success: true, data: extraction });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   PATCH /api/extraction/:extractionId/field
   Human correction of a single extracted field.
   Appends to the editsLog for full audit trail.
══════════════════════════════════════════════════════════ */
router.patch('/:extractionId/field',
  authorize('admin', 'legal_officer', 'nodal_officer'),
  [
    param('extractionId').isUUID(),
    body('section').isIn(['caseDetails', 'parties', 'directions', 'timelines'])
      .withMessage('section must be caseDetails | parties | directions | timelines'),
    body('index').isInt({ min: 0 }).withMessage('index must be a non-negative integer'),
    body('field').trim().notEmpty().withMessage('field name is required'),
    body('newValue').notEmpty().withMessage('newValue is required'),
    body('reason').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const extraction = await Extraction.findByPk(req.params.extractionId);
      if (!extraction) {
        return res.status(404).json({ success: false, message: 'Extraction not found.' });
      }

      const { section, index, field, newValue, reason } = req.body;

      // Clone the JSONB array, apply change
      const arr = [...(extraction[section] || [])];
      if (!arr[index]) {
        return res.status(400).json({ success: false, message: `No item at index ${index} in ${section}.` });
      }

      const oldValue = arr[index][field];
      arr[index] = { ...arr[index], [field]: newValue };

      // Build audit entry
      const logEntry = {
        section,
        index,
        field,
        oldValue,
        newValue,
        reason:   reason || null,
        editedBy: req.user.id,
        editedByName: `${req.user.firstName} ${req.user.lastName}`,
        editedAt: new Date().toISOString(),
      };

      await extraction.update({
        [section]: arr,
        editsLog:  [...(extraction.editsLog || []), logEntry],
      });

      res.json({
        success: true,
        message: 'Field updated.',
        data: {
          section,
          index,
          updatedItem: arr[index],
          logEntry,
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   GET /api/extraction/:extractionId/edits
   Return the full edit audit trail for a given extraction
══════════════════════════════════════════════════════════ */
router.get('/:extractionId/edits',
  [param('extractionId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const extraction = await Extraction.findByPk(req.params.extractionId, {
        attributes: ['id', 'caseId', 'editsLog'],
      });
      if (!extraction) return res.status(404).json({ success: false, message: 'Extraction not found.' });

      res.json({ success: true, data: extraction.editsLog || [] });
    } catch (err) { next(err); }
  }
);

module.exports = router;