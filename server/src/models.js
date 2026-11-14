import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const CASE_STATUSES = ['Preparation', 'Submitted', 'Approved', 'Rejected'];
export const DOC_STATUSES = ['Missing', 'Submitted', 'Needs correction', 'Approved'];
export const ROLES = ['client', 'consultant', 'admin'];

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

// ---- Users (login accounts) ----
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  nameKey: { type: String, required: true, unique: true },   // lower-case name, used for login
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'client', required: true },
  // Links the account to existing data: a client's case key, or 'martin' / 'tereza' for consultants
  key: { type: String, default: null },
  active: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });

userSchema.pre('validate', function () {
  if (this.name) this.nameKey = this.name.trim().toLowerCase();
});
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.nameKey;
    delete ret.__v;
    return ret;
  },
});

export const Case = mongoose.model('Case', caseSchema);
export const Slot = mongoose.model('Slot', slotSchema);
export const User = mongoose.model('User', userSchema);