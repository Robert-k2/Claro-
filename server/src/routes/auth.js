import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// POST /api/auth/login  { name, password, role? }
// role is optional: the client login screen sends role: 'client' so consultants cannot enter through it.
router.post('/login', loginLimiter, async (req, res) => {
  const { name, password, role } = req.body || {};
  const fail = () => res.status(401).json({ error: 'Wrong name or password' }); // same message for every failure
  if (typeof name !== 'string' || typeof password !== 'string') return fail();

  const user = await User.findOne({ nameKey: name.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !user.active) return fail();
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: 'Too many attempts. Try again later.' });
  }

  if (!(await user.checkPassword(password))) {
    user.failedLogins += 1;
    if (user.failedLogins >= MAX_FAILS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLogins = 0;
    }
    await user.save();
    return fail();
  }
  if (role && user.role !== role) return fail();

  user.failedLogins = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

// POST /api/auth/change-password  { oldPassword, newPassword }
router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!(await user.checkPassword(oldPassword || ''))) return res.status(401).json({ error: 'Wrong current password' });
  await user.setPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  res.json({ ok: true });
});

export default router;