import jwt from 'jsonwebtoken';
import { User } from '../models.js';

// Every protected request is checked against MongoDB, so deactivating a user
// takes effect immediately, even for tokens that were already issued.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not logged in' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ error: 'Account disabled or not found' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Not allowed' });