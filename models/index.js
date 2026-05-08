/* models/index.js ────────────────────────────────────────── */
'use strict';

const { sequelize } = require('../config/db');
const User           = require('./User');
const Case           = require('./Case');
const Extraction     = require('./Extraction');
const ActionPlan     = require('./ActionPlan');
const QueueItem      = require('./QueueItem');
const VerifiedRecord = require('./VerifiedRecord');

/* ── Associations ─────────────────────────────────────── */

// A Case has one Extraction, one ActionPlan, one QueueItem, one VerifiedRecord
Case.hasOne(Extraction,     { foreignKey: 'caseId', as: 'extraction',     onDelete: 'CASCADE' });
Case.hasOne(ActionPlan,     { foreignKey: 'caseId', as: 'actionPlan',     onDelete: 'CASCADE' });
Case.hasOne(QueueItem,      { foreignKey: 'caseId', as: 'queueItem',      onDelete: 'CASCADE' });
Case.hasOne(VerifiedRecord, { foreignKey: 'caseId', as: 'verifiedRecord', onDelete: 'CASCADE' });

Extraction.belongsTo(Case,     { foreignKey: 'caseId', as: 'case' });
ActionPlan.belongsTo(Case,     { foreignKey: 'caseId', as: 'case' });
QueueItem.belongsTo(Case,      { foreignKey: 'caseId', as: 'case' });
VerifiedRecord.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });

// User relationships
User.hasMany(Case,           { foreignKey: 'uploadedBy',  as: 'uploadedCases' });
User.hasMany(QueueItem,      { foreignKey: 'assignedTo',  as: 'assignedItems' });
User.hasMany(QueueItem,      { foreignKey: 'reviewedBy',  as: 'reviewedItems' });
User.hasMany(VerifiedRecord, { foreignKey: 'verifiedById', as: 'verifiedRecords' });

Case.belongsTo(User,           { foreignKey: 'uploadedBy',  as: 'uploader' });
QueueItem.belongsTo(User,      { foreignKey: 'assignedTo',  as: 'assignee' });
QueueItem.belongsTo(User,      { foreignKey: 'reviewedBy',  as: 'reviewer' });
VerifiedRecord.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifier' });

module.exports = {
  sequelize,
  User,
  Case,
  Extraction,
  ActionPlan,
  QueueItem,
  VerifiedRecord,
};