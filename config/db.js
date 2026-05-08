/* config/db.js
   ─────────────────────────────────────────────────────────
   Sequelize connection pool, dialect, and test helper.
   ───────────────────────────────────────────────────────── */
'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME   || 'ccms_db',
  process.env.DB_USER   || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      underscored:   true,   // snake_case columns
      timestamps:    true,
      paranoid:      true,   // soft-deletes (deleted_at)
      freezeTableName: false,
    },
  }
);

/**
 * Test the connection and optionally sync schema.
 * Called once at server start.
 */
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅  PostgreSQL connected successfully.');

    if (process.env.NODE_ENV === 'development') {
      // alter:true updates columns without dropping data
      await sequelize.sync({ alter: true });
      console.log('✅  Database schema synced.');
    }
  } catch (err) {
    console.error('❌  Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };