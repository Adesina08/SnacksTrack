import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { rows } = await pool.query(
    'SELECT category, created_at, points FROM consumption_logs ORDER BY created_at DESC'
  );
  context.res = jsonResponse(200, rows);
}
