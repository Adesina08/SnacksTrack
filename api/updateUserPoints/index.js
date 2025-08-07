import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { id } = req.params;
  const { points } = req.body || {};
  try {
    const { rows } = await pool.query(
      'UPDATE users SET points = points + $1 WHERE id=$2 RETURNING *',
      [points, id]
    );
    if (rows.length === 0) {
      context.res = jsonResponse(404, { message: 'User not found' });
    } else {
      context.res = jsonResponse(200, rows[0]);
    }
  } catch (err) {
    context.log(err);
    context.res = jsonResponse(500, { message: 'Failed to update points' });
  }
}
