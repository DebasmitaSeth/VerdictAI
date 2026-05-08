/* models/QueueItem.js ────────────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QueueItem = sequelize.define('QueueItem', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  caseId: {
    type: DataTypes.UUID, allowNull: false,
  },
  caseNo: {
    type: DataTypes.STRING(60), allowNull: false,
  },
  description: {
    type: DataTypes.STRING(300),
  },
  confidence: {
    type: DataTypes.INTEGER, validate: { min: 0, max: 100 },
  },

  /* ── Workflow state ─────────────────────────────────── */
  status: {
    type:         DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
    defaultValue: 'pending',
    allowNull:    false,
  },
  assignedTo: {
    type:    DataTypes.UUID,
    comment: 'FK → users.id  — officer assigned to verify',
  },
  reviewedBy: {
    type:    DataTypes.UUID,
    comment: 'FK → users.id  — officer who submitted verdict',
  },
  reviewedAt: {
    type: DataTypes.DATE,
  },
  reviewNotes: {
    type: DataTypes.TEXT,
  },

  /* ── Linked records ─────────────────────────────────── */
  extractionId: {
    type: DataTypes.UUID,
  },
  actionPlanId: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'queue_items',
  indexes: [
    { fields: ['status'] },
    { fields: ['case_id'] },
    { fields: ['assigned_to'] },
  ],
});

module.exports = QueueItem;