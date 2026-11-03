import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Case, Slot, CASE_STATUSES } from './models.js';
import { seedIfEmpty } from './seed.js';

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

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Everything the app needs in one call
app.get('/api/state', wrap(async (req, res) => {
  const [cases, slots] = await Promise.all([Case.find().sort('createdAt'), Slot.find().sort({ date: 1, time: 1 })]);
  res.json({
    cases: Object.fromEntries(cases.map((c) => [c.key, caseOut(c)])),
    slots: slots.map(slotOut),
  });
}));

// Admin: set case status (Preparation -> Submitted -> Approved / Rejected)
app.patch('/api/cases/:key/status', wrap(async (req, res) => {
  if (!CASE_STATUSES.includes(req.body.status)) throw bad(400, 'Invalid case status');
  const c = await Case.findOneAndUpdate({ key: req.params.key }, { status: req.body.status }, { new: true });
  if (!c) throw bad(404, 'Case not found');
  res.json(caseOut(c));
}));

// Client uploads a document: only Missing / Needs correction -> Submitted
app.post('/api/cases/:key/docs/:i/upload', wrap(async (req, res) => {
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

// Consultant reviews a Submitted document: Approved, or Needs correction with a note
app.post('/api/cases/:key/docs/:i/review', wrap(async (req, res) => {
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

// Consultant creates an available 30-minute slot
app.post('/api/slots', wrap(async (req, res) => {
  const { consultant, date, time } = req.body;
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

// Only free slots can be removed
app.delete('/api/slots/:id', wrap(async (req, res) => {
  const s = await Slot.findOneAndDelete({ _id: req.params.id, by: null });
  if (!s) throw bad(409, 'Booked slots cannot be removed');
  res.json({ ok: true });
}));

// Atomic booking: the filter `by: null` guarantees one client per slot
app.post('/api/slots/:id/book', wrap(async (req, res) => {
  if (!(await Case.exists({ key: req.body.by }))) throw bad(400, 'Unknown client');
  const s = await Slot.findOneAndUpdate({ _id: req.params.id, by: null }, { by: req.body.by }, { new: true });
  if (!s) throw bad(409, 'Slot just taken');
  res.json(slotOut(s));
}));

app.post('/api/slots/:id/cancel', wrap(async (req, res) => {
  const s = await Slot.findOneAndUpdate({ _id: req.params.id, by: req.body.by }, { by: null }, { new: true });
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
await Case.init(); await Slot.init();   // build indexes
await seedIfEmpty();
app.listen(PORT, '0.0.0.0', () => console.log(`API on :${PORT}`));
