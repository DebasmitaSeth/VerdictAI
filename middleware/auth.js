/* middleware/auth.js ──────────────────────────────────────── */
'use strict';

const jwt  = require('jsonwebtoken');
const { User } = require('../models');

/**
 * authenticate — verifies Bearer token and attaches req.user.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.scope('withPassword').findByPk(decoded.sub, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account pending approval.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * authorize(...roles) — role-based guard.
 * Usage: router.delete('/cases/:id', authenticate, authorize('admin'), handler)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}.`,
      });
    }
    next();
  };
}

/**
 * optionalAuth — attaches req.user if a valid token is present, but
 * does not reject requests without one.  Useful for public-ish endpoints.
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const token   = header.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.scope('withPassword').findByPk(decoded.sub, {
        attributes: { exclude: ['passwordHash', 'refreshToken'] },
      });
      if (user?.isActive) req.user = user;
    }
  } catch (_) { /* ignore — treat as unauthenticated */ }
  next();
}

module.exports = { authenticate, authorize, optionalAuth };