import { pool, dbReady } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  if (!dbReady) {
    context.log('Database failed to initialize');
    context.res = jsonResponse(503, { message: 'Service Unavailable' });
    return;
  }

  try {
    const email = req.params?.email;
    if (!email) {
      context.res = jsonResponse(400, { message: 'Email parameter is required' });
      return;
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (rows.length === 0) {
      context.res = jsonResponse(404, { message: 'User not found' });
    } else {
      context.res = jsonResponse(200, rows[0]);
    }
  } catch (err) {
    context.log(err);
    context.res = jsonResponse(500, { message: 'Error retrieving user' });
  }
}
