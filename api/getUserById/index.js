import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
  if (rows.length === 0) {
    context.res = jsonResponse(404, { message: 'User not found' });
  } else {
    context.res = jsonResponse(200, rows[0]);
  }
}
