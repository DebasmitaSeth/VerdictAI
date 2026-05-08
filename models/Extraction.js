/* models/Extraction.js ───────────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Stores the structured data extracted from a court judgment by the AI.
 * Each case has at most one Extraction record (1-to-1).
 */
const Extraction = sequelize.define('Extraction', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  caseId: {
    type: DataTypes.UUID, allowNull: false, unique: true,
  },

  /* ── Core details (key-value pairs stored as JSONB) ─── */
  caseDetails: {
    type:    DataTypes.JSONB,
    comment: 'Array of { label, value } objects — case metadata',
  },
  parties: {
    type:    DataTypes.JSONB,
    comment: 'Array of { role, name, tag } objects',
  },

  /* ── Judgment substance ─────────────────────────────── */
  directions: {
    type:    DataTypes.JSONB,
    comment: 'Array of { text, type:"critical|important|standard", tag }',
  },
  timelines: {
    type:    DataTypes.JSONB,
    comment: 'Array of { event, date, daysLeft, urgency:"red|amber|blue|green" }',
  },

  /* ── AI metadata ────────────────────────────────────── */
  confidence: {
    type: DataTypes.INTEGER, validate: { min: 0, max: 100 },
  },
  modelVersion: {
    type: DataTypes.STRING(50),
  },
  rawText: {
    type:    DataTypes.TEXT,
    comment: 'Full OCR / extracted text of the document',
  },

  /* ── Human corrections log ──────────────────────────── */
  editsLog: {
    type:         DataTypes.JSONB,
    defaultValue: [],
    comment:      'Array of { field, oldValue, newValue, editedBy, reason, editedAt }',
  },
}, {
  tableName: 'extractions',
  indexes: [{ fields: ['case_id'] }],
});

module.exports = Extraction;