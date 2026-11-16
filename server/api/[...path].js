import { app, initializeDatabase } from '../src/index.js';

export default async function handler(request, response) {
  await initializeDatabase();
  return app(request, response);
}
