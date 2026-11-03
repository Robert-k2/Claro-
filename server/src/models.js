import mongoose from 'mongoose';

export const CASE_STATUSES = ['Preparation', 'Submitted', 'Approved', 'Rejected'];
export const DOC_STATUSES = ['Missing', 'Submitted', 'Needs correction', 'Approved'];

const docSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: DOC_STATUSES, default: 'Missing' },
  due: { type: String, default: null },   // YYYY-MM-DD
  note: { type: String, default: '' },
  file: { type: String, default: '' },
}, { _id: false });

const caseSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  from: String,
  uni: String,
  status: { type: String, enum: CASE_STATUSES, default: 'Preparation' },
  docs: [docSchema],
}, { timestamps: true });

const slotSchema = new mongoose.Schema({
  consultant: { type: String, required: true },          // 'tereza' | 'martin'
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  by: { type: String, default: null },                   // case key of the client, or null when free
}, { timestamps: true });
slotSchema.index({ consultant: 1, date: 1, time: 1 }, { unique: true }); // no double slots

export const Case = mongoose.model('Case', caseSchema);
export const Slot = mongoose.model('Slot', slotSchema);
