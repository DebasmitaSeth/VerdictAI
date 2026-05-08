/* models/Case.js ─────────────────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Case = sequelize.define('Case', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  caseNo: {
    type:      DataTypes.STRING(60),
    allowNull: false,
    unique:    true,
    validate:  { notEmpty: true },
  },
  dateOfOrder: {
    type:      DataTypes.DATEONLY,
    allowNull: false,
  },
  department: {
    type:      DataTypes.STRING(120),
    allowNull: false,
  },
  nature: {
    type:      DataTypes.STRING(120),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'uploaded',
      'processing',
      'extracted',
      'pending_verification',
      'verified',
      'critical',
      'closed'
    ),
    defaultValue: 'uploaded',
    allowNull:    false,
  },
  aiScore: {
    type:     DataTypes.INTEGER,
    validate: { min: 0, max: 100 },
  },
  petitioner: {
    type:      DataTypes.STRING(300),
    allowNull: false,
  },
  respondent: {
    type:      DataTypes.STRING(300),
    allowNull: false,
  },
  court: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  bench: {
    type:      DataTypes.STRING(300),
  },
  disposal: {
    type: DataTypes.STRING(120),
  },
  limitationPeriod: {
    type: DataTypes.STRING(120),
  },
  actionType: {
    type: DataTypes.ENUM('compliance', 'appeal', 'review', 'none'),
    defaultValue: 'none',
  },
  documentPath: {
    type:      DataTypes.STRING(500),
    allowNull: true,
    comment:   'Relative path to the uploaded PDF',
  },
  uploadedBy: {
    type:      DataTypes.UUID,
    allowNull: true,
    comment:   'FK → users.id (loose ref, no hard constraint for resilience)',
  },
}, {
  tableName: 'cases',
  indexes: [
    { fields: ['status'] },
    { fields: ['department'] },
    { fields: ['date_of_order'] },
    { fields: ['action_type'] },
  ],
});

module.exports = Case;