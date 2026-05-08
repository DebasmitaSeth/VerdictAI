/* routes/admin.js ────────────────────────────────────────── */
'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { validate }                = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate, authorize('admin'));

/* ══════════════════════════════════════════════════════════
   GET /api/admin/users
   List all users (admin view)
══════════════════════════════════════════════════════════ */
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   PATCH /api/admin/users/:id/activate
   Approve a pending user account
══════════════════════════════════════════════════════════ */
router.patch('/users/:id/activate',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      await user.update({ isActive: true });
      res.json({ success: true, message: `User ${user.email} activated.`, data: user });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   PATCH /api/admin/users/:id/role
   Change user role
══════════════════════════════════════════════════════════ */
router.patch('/users/:id/role',
  [
    param('id').isUUID(),
    body('role').isIn(['admin','legal_officer','nodal_officer','secretary','viewer'])
      .withMessage('Invalid role.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      await user.update({ role: req.body.role });
      res.json({ success: true, message: `Role updated to ${req.body.role}.`, data: user });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   DELETE /api/admin/users/:id
   Deactivate (soft-delete) a user
══════════════════════════════════════════════════════════ */
router.delete('/users/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      }
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      await user.update({ isActive: false });
      res.json({ success: true, message: 'User deactivated.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;