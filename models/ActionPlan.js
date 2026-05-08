/* models/ActionPlan.js ───────────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ActionPlan = sequelize.define('ActionPlan', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  caseId: {
    type: DataTypes.UUID, allowNull: false, unique: true,
  },

  recommendation: {
    type: DataTypes.STRING(80),
    comment: 'e.g. "COMPLY WITH ORDER" | "CONSIDER APPEAL"',
  },
  emoji: {
    type: DataTypes.STRING(10),
  },
  reason: {
    type: DataTypes.TEXT,
  },
  confidence: {
    type: DataTypes.INTEGER, validate: { min: 0, max: 100 },
  },

  /* ── Structured sections (JSONB) ────────────────────── */
  actions: {
    type:    DataTypes.JSONB,
    comment: 'Array of { title, desc, priority, icon, tags, bg }',
  },
  timeline: {
    type:    DataTypes.JSONB,
    comment: 'Array of { day, title, desc, state, date }',
  },
  departments: {
    type:    DataTypes.JSONB,
    comment: 'Array of { abbr, name, role, badge }',
  },
  risks: {
    type:    DataTypes.JSONB,
    comment: 'Array of { level, title, desc, cls }',
  },

  /* ── Status ─────────────────────────────────────────── */
  isPublished: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
    comment:      'True once approved through verification',
  },
}, {
  tableName: 'action_plans',
  indexes: [{ fields: ['case_id'] }, { fields: ['is_published'] }],
});

module.exports = ActionPlan;