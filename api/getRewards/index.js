import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { rows } = await pool.query(
    'SELECT * FROM rewards WHERE is_active = TRUE ORDER BY points_required'
  );
  context.res = jsonResponse(200, rows);
}
