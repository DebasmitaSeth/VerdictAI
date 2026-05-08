/* middleware/errorHandler.js ─────────────────────────────── */
'use strict';

const { validationResult } = require('express-validator');

/**
 * validate — runs express-validator checks and short-circuits with 422
 * if any rule failed.  Always pass this AFTER your check() chain.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * notFound — 404 handler. Mount after all routes.
 */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

/**
 * globalError — catch-all error handler.  Mount last.
 */
// eslint-disable-next-line no-unused-vars
function globalError(err, req, res, next) {
  console.error('[ERROR]', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      success: false,
      message: 'Database validation error.',
      errors:  err.errors?.map(e => ({ field: e.path, message: e.message })),
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { validate, notFound, globalError };