/* models/VerifiedRecord.js ───────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Immutable, human-approved record created after a QueueItem is approved.
 * This is the "source of truth" table for decision-makers.
 */
const VerifiedRecord = sequelize.define('VerifiedRecord', {
  id: {
    type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true,
  },
  caseId: {
    type: DataTypes.UUID, allowNull: false, unique: true,
  },
  caseNo: {
    type: DataTypes.STRING(60), allowNull: false,
  },
  title: {
    type: DataTypes.STRING(300), allowNull: false,
  },
  department: {
    type: DataTypes.STRING(120),
  },
  actionType: {
    type: DataTypes.ENUM('compliance', 'appeal', 'review', 'none'),
    defaultValue: 'none',
  },

  /* ── Snapshot of approved action items ──────────────── */
  actions: {
    type:    DataTypes.JSONB,
    comment: 'Array of action strings visible on the verified card',
  },

  /* ── Verification provenance ─────────────────────────── */
  verifiedById: {
    type: DataTypes.UUID, allowNull: false,
    comment: 'FK → users.id',
  },
  verifiedByLabel: {
    type:    DataTypes.STRING(200),
    comment: 'Denormalized display string e.g. "S. Patel — Legal Officer"',
  },
  verifiedOn: {
    type: DataTypes.DATEONLY, allowNull: false,
  },

  /* ── Deadline tracking ───────────────────────────────── */
  deadline: {
    type: DataTypes.DATEONLY,
  },
  deadlineClass: {
    type:         DataTypes.ENUM('safe', 'normal', 'urgent'),
    defaultValue: 'normal',
  },
  isCritical: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },

  /* ── AI metadata snapshot ─────────────────────────────── */
  aiScore: {
    type: DataTypes.INTEGER, validate: { min: 0, max: 100 },
  },

  /* ── Linked records ─────────────────────────────────── */
  queueItemId: {
    type: DataTypes.UUID,
  },
  extractionId: {
    type: DataTypes.UUID,
  },
  actionPlanId: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'verified_records',
  indexes: [
    { fields: ['action_type'] },
    { fields: ['is_critical'] },
    { fields: ['deadline'] },
    { fields: ['department'] },
  ],
});

module.exports = VerifiedRecord;