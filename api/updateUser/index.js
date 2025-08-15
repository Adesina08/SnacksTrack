import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { id } = req.params;
  const { firstName, lastName, phone, avatarUrl } = req.body;

  if (!firstName || !lastName) {
    context.res = jsonResponse(400, { message: 'First name and last name are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, avatar_url = $4 WHERE id = $5 RETURNING *',
      [firstName, lastName, phone, avatarUrl || null, id],
    );

    if (rows.length === 0) {
      context.res = jsonResponse(404, { message: 'User not found' });
    } else {
      context.res = jsonResponse(200, rows[0]);
    }
  } catch (error) {
    console.error(error);
    context.res = jsonResponse(500, { message: 'Error updating user' });
  }
}
