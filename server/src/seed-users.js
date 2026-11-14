// Run once from the server folder: node src/seed-users.js
// Creates an admin, the two consultants, and one client login for every Case already in the database.
import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, Case } from './models.js';

async function create({ name, role, key }) {
  if (await User.findOne({ nameKey: name.toLowerCase() })) return console.log(`exists: ${name}`);
  const password = crypto.randomBytes(9).toString('base64url');
  const user = new User({ name, role, key, mustChangePassword: true });
  await user.setPassword(password);
  await user.save();
  console.log(`created ${role}: ${name}   temporary password: ${password}`);
}

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa');

await create({ name: 'Admin', role: 'admin', key: null });
await create({ name: 'Martin ', role: 'consultant', key: 'martin' });
await create({ name: 'Tereza', role: 'consultant', key: 'tereza' });
for (const c of await Case.find()) await create({ name: c.name, role: 'client', key: c.key });

await mongoose.disconnect();