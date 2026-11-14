import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Case, Slot, User, CASE_STATUSES } from './models.js';
import { seedIfEmpty } from './seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { requireAuth, requireRole } from './middleware/auth.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in server/.env');

const app = express();
app.use(cors());
app.use(express.json());

const TODAY = () => process.env.TODAY || new Date().toISOString().slice(0, 10);
const bad = (status, error) => Object.assign(new Error(error), { status });
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

const slotOut = (s) => ({ id: s._id.toString(), consultant: s.consultant, date: s.date, time: s.time, by: s.by });
const caseOut = (c) => ({
  key: c.key, name: c.name, from: c.from, uni: c.uni, status: c.status,
  docs: c.docs.map((d) => ({ name: d.name, status: d.status, due: d.due, note: d.note, file: d.file })),
});

const staff = requireRole('admin', 'consultant');
// A client may only touch their own case; staff may touch any.
const mayAccessCase = (req, key) => req.user.role !== 'client' || req.user.key === key;

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Login and user management (users live in MongoDB)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Everything below needs a logged-in user
app.use('/api', requireAuth);

// Everything the app needs in one call. Clients only receive their own case and free / own slots.
app.get('/api/state', wrap(async (req, res) => {
  const isClient = req.user.role === 'client';
  const caseFilter = isClient ? { key: req.user.key } : {};
  const slotFilter = isClient ? { $or: [{ by: null }, { by: req.user.key }] } : {};
  const [cases, slots] = await Promise.all([
    Case.find(caseFilter).sort('createdAt'),
    Slot.find(slotFilter).sort({ date: 1, time: 1 }),
  ]);
  res.json({
    cases: Object.fromEntries(cases.map((c) => [c.key, caseOut(c)])),
    slots: slots.map(slotOut),
  });
}));

// Staff: set case status (Preparation -> Submitted -> Approved / Rejected)
app.patch('/api/cases/:key/status', staff, wrap(async (req, res) => {
  if (!CASE_STATUSES.includes(req.body.status)) throw bad(400, 'Invalid case status');
  const c = await Case.findOneAndUpdate({ key: req.params.key }, { status: req.body.status }, { new: true });
  if (!c) throw bad(404, 'Case not found');
  res.json(caseOut(c));
}));

// Client uploads a document to their own case: only Missing / Needs correction -> Submitted
app.post('/api/cases/:key/docs/:i/upload', wrap(async (req, res) => {
  if (!mayAccessCase(req, req.params.key)) throw bad(403, 'Not your case');
  const i = Number(req.params.i);
  const file = String(req.body.file || '').trim();
  if (!Number.isInteger(i) || i < 0) throw bad(400, 'Invalid document');
  if (!file) throw bad(400, 'File name required');
  const path = `docs.${i}`;
  const c = await Case.findOneAndUpdate(
    { key: req.params.key, [`${path}.status`]: { $in: ['Missing', 'Needs correction'] } },
    { $set: { [`${path}.status`]: 'Submitted', [`${path}.note`]: '', [`${path}.file`]: file } },
    { new: true },
  );
  if (!c) throw bad(409, 'This document cannot be uploaded right now');
  res.json(caseOut(c));
}));

// Staff review a Submitted document: Approved, or Needs correction with a note
app.post('/api/cases/:key/docs/:i/review', staff, wrap(async (req, res) => {
  const i = Number(req.params.i);
  const { approve } = req.body;
  const note = String(req.body.note || '').trim();
  if (!approve && !note) throw bad(400, 'A correction note is required');
  const path = `docs.${i}`;
  const c = await Case.findOneAndUpdate(
    { key: req.params.key, [`${path}.status`]: 'Submitted' },
    { $set: { [`${path}.status`]: approve ? 'Approved' : 'Needs correction', [`${path}.note`]: approve ? '' : note } },
    { new: true },
  );
  if (!c) throw bad(409, 'Document is not waiting for review');
  res.json(caseOut(c));
}));

// Consultant creates an available 30-minute slot (for themselves; admins can choose the consultant)
app.post('/api/slots', staff, wrap(async (req, res) => {
  const consultant = req.user.role === 'consultant' ? req.user.key : req.body.consultant;
  const { date, time } = req.body;
  if (!['tereza', 'martin'].includes(consultant)) throw bad(400, 'Unknown consultant');
  if (date < TODAY()) throw bad(400, 'Date is in the past');
  try {
    res.status(201).json(slotOut(await Slot.create({ consultant, date, time })));
  } catch (e) {
    if (e.code === 11000) throw bad(409, 'You already have that slot');
    if (e.name === 'ValidationError') throw bad(400, 'Use YYYY-MM-DD and HH:MM');
    throw e;
  }
}));

// Only free slots can be removed; consultants only their own
app.delete('/api/slots/:id', staff, wrap(async (req, res) => {
  const filter = { _id: req.params.id, by: null };
  if (req.user.role === 'consultant') filter.consultant = req.user.key;
  const s = await Slot.findOneAndDelete(filter);
  if (!s) throw bad(409, 'Booked slots cannot be removed');
  res.json({ ok: true });
}));

// Atomic booking: the filter `by: null` guarantees one client per slot.
// For clients the booker is always the logged-in user, never taken from the request body.
app.post('/api/slots/:id/book', wrap(async (req, res) => {
  const by = req.user.role === 'client' ? req.user.key : req.body.by;
  if (!by || !(await Case.exists({ key: by }))) throw bad(400, 'Unknown client');
  const s = await Slot.findOneAndUpdate({ _id: req.params.id, by: null }, { by }, { new: true });
  if (!s) throw bad(409, 'Slot just taken');
  res.json(slotOut(s));
}));

app.post('/api/slots/:id/cancel', wrap(async (req, res) => {
  const by = req.user.role === 'client' ? req.user.key : req.body.by;
  const s = await Slot.findOneAndUpdate({ _id: req.params.id, by }, { by: null }, { new: true });
  if (!s) throw bad(409, 'Booking not found');
  res.json(slotOut(s));
}));

app.use((err, req, res, next) => {
  if (err.name === 'CastError') err = bad(400, 'Invalid id');
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
});

const PORT = process.env.PORT || 4000;
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa');
await Case.init(); await Slot.init(); await User.init();   // build indexes
await seedIfEmpty();
app.listen(PORT, '0.0.0.0', () => console.log(`API on :${PORT}`));