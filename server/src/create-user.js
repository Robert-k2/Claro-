// Run from the server folder. Creates a login account (and a case for new clients).
//
//   node src/create-user.js client "Ana Novak" "Colombia" "Charles University"
//   node src/create-user.js consultant "Martin Novák" martin
//   node src/create-user.js admin "Jana Admin"
//
// Prints a one-time temporary password. The person must change it at first login.
import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, Case } from './models.js';

const [role, name, arg3, arg4] = process.argv.slice(2);
const CONSULTANTS = ['martin', 'tereza']; // the slots code only knows these two

function fail(message) {
  console.log(message);
  process.exit(1);
}

if (!['client', 'consultant', 'admin'].includes(role) || !name) {
  fail('Usage: node src/create-user.js <client|consultant|admin> "<name>" [...]');
}

const slug = (text) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa';
await mongoose.connect(uri);

if (await User.findOne({ nameKey: name.trim().toLowerCase() })) {
  await mongoose.disconnect();
  fail(`A user named "${name}" already exists.`);
}

let key = null;

if (role === 'client') {
  key = slug(name);
  if (await Case.findOne({ key })) {
    await mongoose.disconnect();
    fail(`A case with key "${key}" already exists. Use a different name.`);
  }
  // Copy the document list from an existing case, all set to Missing
  const template = await Case.findOne().sort('createdAt');
  const docs = (template ? template.docs : []).map((d) => ({
    name: d.name,
    status: 'Missing',
    due: d.due,
    note: '',
    file: '',
  }));
  await Case.create({ key, name, from: arg3 || '', uni: arg4 || '', docs });
  console.log(`Created case "${key}" with ${docs.length} documents.`);
}

if (role === 'consultant') {
  key = arg3;
  if (!CONSULTANTS.includes(key)) {
    await mongoose.disconnect();
    fail(`For a consultant, the third value must be one of: ${CONSULTANTS.join(', ')}`);
  }
}

const password = crypto.randomBytes(9).toString('base64url');
const user = new User({ name, role, key, mustChangePassword: true });
await user.setPassword(password);
await user.save();

console.log(`Created ${role}: ${name}   temporary password: ${password}`);
await mongoose.disconnect();