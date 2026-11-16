import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/claro_visa');
const users = await User.find().lean();
console.table(users.map(({ _id, password, passwordHash, ...rest }) => rest));
await mongoose.disconnect();