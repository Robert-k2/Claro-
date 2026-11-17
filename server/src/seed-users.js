
// Run from the server folder:
// node src/seed-users.js

import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Case } from './models.js';

async function create({ name, role, key, password }) {
  name = name.trim();

  const nameKey = name.toLowerCase();

  // Check existing users
  const existing = key
    ? await User.findOne({
        $or: [{ key }, { nameKey }]
      })
    : await User.findOne({ nameKey });

  if (existing) {
    console.log(`exists: ${name} (${existing.role})`);

    // Update password for existing users
    await existing.setPassword(password);
    existing.mustChangePassword = true;
    await existing.save();

    console.log(`Password updated for: ${name}`);
    return;
  }

  const user = new User({
    name,
    role,
    key,
    mustChangePassword: true
  });

  // Hash password before saving
  await user.setPassword(password);
  await user.save();

  console.log(`created ${role}: ${name}`);
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
      key: null,
      password: 'admin123'
    });

    await create({
      name: 'Martin',
      role: 'consultant',
      key: 'martin',
      password: 'martin123'
    });

    await create({
      name: 'Tereza',
      role: 'consultant',
      key: 'tereza',
      password: 'tereza123'
    });

    const cases = await Case.find();

    for (const c of cases) {
      await create({
        name: c.name,
        role: 'client',
        key: c.key,
        password: 'client123'
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
