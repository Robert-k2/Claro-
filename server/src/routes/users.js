import express from 'express';
import crypto from 'crypto';
import { User, Case } from '../models.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'consultant'));

const tempPassword = () => crypto.randomBytes(9).toString('base64url');

// Consultants may only manage clients. Admins manage everyone.
function canManage(actor, target) {
  return actor.role === 'admin' || target.role === 'client';
}

function sendError(res, err, duplicateMessage) {
  if (err.code === 11000) {
    return res.status(409).json({ error: duplicateMessage });
  }
  return res.status(400).json({ error: err.message });
}

// GET /api/users
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { role: 'client' };
  const users = await User.find(filter).sort({ name: 1 });
  res.json(users);
});

// POST /api/users  { name, role, key }
// Creates a user and returns a one-time temporary password.
// key: for a client, the key of their Case. For a consultant, e.g. 'martin'.
router.post('/', async (req, res) => {
  const body = req.body || {};
  const name = body.name;
  const role = body.role || 'client';
  const key = body.key || null;

  if (req.user.role !== 'admin' && role !== 'client') {
    return res.status(403).json({
      error: 'Consultants can only create clients',
    });
  }
  if (role === 'client' && key) {
    const caseExists = await Case.exists({ key });
    if (!caseExists) {
      return res.status(400).json({ error: 'No case with this key' });
    }
  }

  const password = tempPassword();
  try {
    const user = new User({ name, role, key, mustChangePassword: true });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ user, temporaryPassword: password });
  } catch (err) {
    sendError(res, err, 'A user with this name or key already exists');
  }
});

// PATCH /api/users/:id  { name, active, role }  (role: admin only)
router.patch('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const body = req.body || {};

  if (body.name !== undefined) {
    user.name = body.name;
  }

  if (body.active !== undefined) {
    const disablingSelf = user.id === req.user.id && body.active === false;
    if (disablingSelf) {
      return res.status(400).json({
        error: 'You cannot disable yourself',
      });
    }
    user.active = Boolean(body.active);
  }

  if (body.role !== undefined) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins change roles' });
    }
    user.role = body.role;
  }

  try {
    await user.save();
    res.json(user);
  } catch (err) {
    sendError(res, err, 'Name already in use');
  }
});

// POST /api/users/:id/reset-password
// Returns a new one-time temporary password.
router.post('/:id/reset-password', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (!canManage(req.user, user)) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const password = tempPassword();
  await user.setPassword(password);
  user.mustChangePassword = true;
  user.failedLogins = 0;
  user.lockedUntil = null;
  await user.save();
  res.json({ temporaryPassword: password });
});

export default router;