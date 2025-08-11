import { jsonResponse } from '../shared.js';
import { dbReady } from '../db.js';

export default async function (context) {
  try {
    await dbReady();
    context.res = jsonResponse(200, { message: 'Backend API is running 🎉' });
  } catch {
    context.res = jsonResponse(200, { message: 'Backend API running (DB disconnected)' });
  }
}
