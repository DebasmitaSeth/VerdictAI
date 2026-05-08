/* models/User.js ─────────────────────────────────────────── */
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  firstName: {
    type:      DataTypes.STRING(80),
    allowNull: false,
    validate:  { notEmpty: true, len: [1, 80] },
  },
  lastName: {
    type:      DataTypes.STRING(80),
    allowNull: false,
    validate:  { notEmpty: true, len: [1, 80] },
  },
  email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true },
  },
  employeeId: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    validate:  { notEmpty: true },
  },
  department: {
    type:      DataTypes.STRING(120),
    allowNull: false,
  },
  role: {
    type:         DataTypes.ENUM('admin', 'legal_officer', 'nodal_officer', 'secretary', 'viewer'),
    defaultValue: 'legal_officer',
    allowNull:    false,
  },
  passwordHash: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  isActive: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,  // requires admin approval
  },
  lastLoginAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
  refreshToken: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['passwordHash', 'refreshToken'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
});

/* ── Instance helpers ─────────────────────────────────── */
User.prototype.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

User.prototype.toPublic = function () {
  const { passwordHash, refreshToken, ...safe } = this.toJSON();
  return safe;
};

/* ── Class hooks ──────────────────────────────────────── */
User.beforeCreate(async (user) => {
  const SALT_ROUNDS = 12;
  user.passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    const SALT_ROUNDS = 12;
    user.passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
  }
});

module.exports = User;