import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT category FROM consumption_logs WHERE category IS NOT NULL AND category <> '' ORDER BY category"
    );
    const categories = rows.map(r => r.category);
    context.res = jsonResponse(200, categories);
  } catch (err) {
    context.log.error('categories error:', err);
    context.res = jsonResponse(err.statusCode || 500, { error: err.message || 'Failed to fetch categories' });
  }
}
