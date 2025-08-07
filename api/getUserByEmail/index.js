import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { email } = req.params;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  context.res = jsonResponse(200, rows[0] || null);
}
