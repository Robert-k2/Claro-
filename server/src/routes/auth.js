
import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { password, role } = req.body || {};

    // Accept name, username or account key
    const identifier = req.body?.name ||
                      req.body?.username ||
                      req.body?.key;

    if (
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      !identifier.trim()
    ) {
      return res.status(401).json({
        error: 'Wrong name or password'
      });
    }

    const normalized = identifier.trim().toLowerCase();

    // Search by full name OR account key
    const user = await User.findOne({
      $or: [
        { nameKey: normalized },
        { key: normalized }
      ]
    }).select('+passwordHash');

    if (!user || !user.active) {
      return res.status(401).json({
        error: 'Wrong name or password'
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Too many attempts. Try again later.'
      });
    }

    // Verify password
    const validPassword = await user.checkPassword(password);

    if (!validPassword) {
      user.failedLogins += 1;

      if (user.failedLogins >= MAX_FAILS) {
        user.lockedUntil = new Date(
          Date.now() + LOCK_MINUTES * 60 * 1000
        );
        user.failedLogins = 0;
      }

      await user.save();

      return res.status(401).json({
        error: 'Wrong name or password'
      });
    }

    // Check role if supplied
    if (
      role &&
      user.role !== String(role).toLowerCase()
    ) {
      return res.status(401).json({
        error: 'Wrong name or password'
      });
    }

    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();

    await user.save();

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.json({
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findById(req.user.id)
      .select('+passwordHash');

    if (!user || !(await user.checkPassword(oldPassword || ''))) {
      return res.status(401).json({
        error: 'Wrong current password'
      });
    }

    await user.setPassword(newPassword);
    user.mustChangePassword = false;

    await user.save();

    res.json({ ok: true });

  } catch (error) {
    console.error('Password change error:', error);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
