import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  try {
    const { rows } = await pool.query(
      "SELECT id, first_name || ' ' || last_name AS name, points FROM users WHERE email <> 'admin@inicio-insights.com' ORDER BY points DESC"
    );
    context.res = jsonResponse(200, rows);
  } catch (err) {
    context.log(err);
    context.res = jsonResponse(500, { message: 'Error getting leaderboard' });
  }
}
