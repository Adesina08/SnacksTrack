import { jsonResponse } from '../shared.js';
import { dbReady } from '../db.js';

export default async function (context, req) {
  if (dbReady) {
    context.res = jsonResponse(200, { message: 'Backend API is running 🎉' });
  } else {
    context.res = jsonResponse(200, { message: 'Backend API running (DB disconnected)' });
  }
}
