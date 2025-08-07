import crypto from 'node:crypto';
import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { firstName, lastName, email, phone, passwordHash } = req.body || {};
  try {
    const { rows } = await pool.query(
      `INSERT INTO users(id,email,first_name,last_name,phone,password_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [crypto.randomUUID(), email, firstName, lastName, phone || null, passwordHash]
    );
    context.res = jsonResponse(200, rows[0]);
  } catch (err) {
    context.log(err);
    context.res = jsonResponse(500, { message: 'Error creating user' });
  }
}
