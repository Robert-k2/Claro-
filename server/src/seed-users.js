
// Run from the server folder:
// node src/seed-users.js

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, Case } from './models.js';

async function create({ name, role, key }) {
  // Remove accidental whitespace from names
  name = name.trim();

  const nameKey = name.toLowerCase();

  // Check BOTH unique identifiers before inserting
  const existing = key
    ? await User.findOne({
        $or: [
          { key },
          { nameKey }
        ]
      })
    : await User.findOne({ nameKey });

  if (existing) {
    console.log(`exists: ${name} (${existing.role})`);
    return;
  }

  const password = crypto.randomBytes(9).toString('base64url');

  const user = new User({
    name,
    role,
    key,
    mustChangePassword: true
  });

  await user.setPassword(password);
  await user.save();

  console.log(
    `created ${role}: ${name}   temporary password: ${password}`
  );
}

async function seedUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa'
    );

    console.log('Connected to MongoDB');

    await create({
      name: 'Admin',
      role: 'admin',
      key: null
    });

    await create({
      name: 'Martin',
      role: 'consultant',
      key: 'martin'
    });

    await create({
      name: 'Tereza',
      role: 'consultant',
      key: 'tereza'
    });

    const cases = await Case.find();

    for (const c of cases) {
      await create({
        name: c.name,
        role: 'client',
        key: c.key
      });
    }

    console.log('User seeding completed successfully');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
