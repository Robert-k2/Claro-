import 'dotenv/config';
import mongoose from 'mongoose';
import { Case, Slot } from './models.js';

const doc = (name, status, due, note) => ({ name, status, due: due || null, note: note || '', file: '' });

const cases = [
  {
    key: 'camila', name: 'Camila Reyes', from: 'Bogotá', uni: 'Charles University', status: 'Preparation',
    docs: [
      doc('Passport copy', 'Approved'),
      doc('University acceptance letter', 'Submitted', '2026-10-15'),
      doc('Proof of accommodation', 'Missing', '2026-10-20'),
      doc('Health insurance', 'Needs correction', '2026-10-23', 'Policy must cover at least 60,000 EUR and the full stay.'),
      doc('Proof of funds', 'Missing', '2026-10-30'),
    ],
  },
  {
    key: 'diego', name: 'Diego Paredes', from: 'Lima', uni: 'Masaryk University', status: 'Submitted',
    docs: ['Passport copy', 'University acceptance letter', 'Proof of accommodation', 'Health insurance', 'Proof of funds']
      .map((n) => doc(n, 'Approved')),
  },
];

const slots = [
  { consultant: 'tereza', date: '2026-10-13', time: '11:00', by: 'diego' },
  { consultant: 'tereza', date: '2026-10-13', time: '11:30', by: null },
  { consultant: 'tereza', date: '2026-10-20', time: '11:00', by: null },
  { consultant: 'martin', date: '2026-10-09', time: '09:00', by: null },
  { consultant: 'martin', date: '2026-10-09', time: '09:30', by: 'camila' },
  { consultant: 'martin', date: '2026-10-16', time: '10:00', by: null },
];

export async function seedIfEmpty() {
  if ((await Case.countDocuments()) === 0) await Case.insertMany(cases);
  if ((await Slot.countDocuments()) === 0) await Slot.insertMany(slots);
}

// `npm run seed` wipes and reseeds
if (process.argv.includes('--reset')) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa');
  await Case.deleteMany({});
  await Slot.deleteMany({});
  await seedIfEmpty();
  console.log('Database reset and seeded.');
  await mongoose.disconnect();
}
