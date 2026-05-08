/* routes/auth.js ─────────────────────────────────────────── */
'use strict';

const express    = require('express');
const jwt        = require('jsonwebtoken');
const { body }   = require('express-validator');
const { User }   = require('../models');
const { authenticate }          = require('../middleware/auth');
const { validate }              = require('../middleware/errorHandler');

const router = express.Router();

/* ── Token helpers ────────────────────────────────────── */
function signAccess(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function signRefresh(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

/* ══════════════════════════════════════════════════════════
   POST /api/auth/signup
   Create a new user account (requires admin approval to activate)
══════════════════════════════════════════════════════════ */
router.post('/signup',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required.'),
    body('lastName').trim().notEmpty().withMessage('Last name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid official email required.'),
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('confirmPassword').custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, employeeId, department, password } = req.body;

      const existing = await User.scope('withPassword').findOne({
        where: { email },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        employeeId,
        department,
        passwordHash: password,   // BeforeCreate hook hashes it
        isActive:     false,       // pending admin approval
        role:         'legal_officer',
      });

      res.status(201).json({
        success: true,
        message: 'Account request submitted. Awaiting admin approval.',
        data: {
          id:         user.id,
          name:       `${user.firstName} ${user.lastName}`,
          email:      user.email,
          employeeId: user.employeeId,
          department: user.department,
          status:     'pending_approval',
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/auth/signin
══════════════════════════════════════════════════════════ */
router.post('/signin',
  [
    body('email').notEmpty().withMessage('Email or Employee ID is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Support login by email OR employee ID
      const { Op } = require('sequelize');
      const user = await User.scope('withPassword').findOne({
        where: {
          [Op.or]: [
            { email:      email.toLowerCase() },
            { employeeId: email },
          ],
        },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const valid = await user.verifyPassword(password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is pending admin approval.',
        });
      }

      const accessToken  = signAccess(user.id);
      const refreshToken = signRefresh(user.id);

      // Persist refresh token (hashed in prod — kept plain for clarity here)
      await user.update({ refreshToken, lastLoginAt: new Date() });

      res.json({
        success: true,
        message: 'Sign in successful.',
        data: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '8h',
          user: {
            id:         user.id,
            name:       `${user.firstName} ${user.lastName}`,
            email:      user.email,
            employeeId: user.employeeId,
            department: user.department,
            role:       user.role,
          },
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   POST /api/auth/refresh
   Exchange a valid refresh token for a new access token
══════════════════════════════════════════════════════════ */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.scope('withPassword').findByPk(decoded.sub);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccess  = signAccess(user.id);
    const newRefresh = signRefresh(user.id);
    await user.update({ refreshToken: newRefresh });

    res.json({
      success: true,
      data: {
        accessToken:  newAccess,
        refreshToken: newRefresh,
      },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
    next(err);
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/auth/logout
══════════════════════════════════════════════════════════ */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await User.scope('withPassword').update(
      { refreshToken: null },
      { where: { id: req.user.id } }
    );
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   POST /api/auth/forgot-password
   (Stub — wire in email delivery in production)
══════════════════════════════════════════════════════════ */
router.post('/forgot-password',
  [body('email').isEmail().withMessage('Valid email required.')],
  validate,
  async (req, res) => {
    // Always return 200 to prevent email enumeration
    // In production: generate a signed reset token, email the link.
    res.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  }
);

/* ══════════════════════════════════════════════════════════
   GET /api/auth/me
══════════════════════════════════════════════════════════ */
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;