import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { userId } = req.params;
  const { rows } = await pool.query(
    'SELECT * FROM consumption_logs WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  context.res = jsonResponse(200, rows);
}
