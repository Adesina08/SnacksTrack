import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { id } = req.params;
  const { firstName, lastName, phone, avatarUrl } = req.body || {};

  const fields = [];
  const values = [];
  let i = 1;

  if (firstName !== undefined) {
    fields.push(`first_name = $${i++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    fields.push(`last_name = $${i++}`);
    values.push(lastName);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${i++}`);
    values.push(phone);
  }
  if (avatarUrl !== undefined) {
    fields.push(`avatar_url = $${i++}`);
    values.push(avatarUrl);
  }

  if (fields.length === 0) {
    context.res = jsonResponse(400, { message: 'No fields to update' });
    return;
  }

  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;

  try {
    const { rows } = await pool.query(query, values);
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
