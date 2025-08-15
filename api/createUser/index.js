import crypto from 'node:crypto';
import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { firstName, lastName, email, phone, passwordHash, avatarUrl } =
    req.body || {};
  try {
    const { rows } = await pool.query(
      `INSERT INTO users(id,email,first_name,last_name,phone,password_hash,avatar_url) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        crypto.randomUUID(),
        email,
        firstName,
        lastName,
        phone || null,
        passwordHash,
        avatarUrl || null,
      ],
    );
    context.res = jsonResponse(200, rows[0]);
  } catch (err) {
    context.log(err);
    context.res = jsonResponse(500, { message: 'Error creating user' });
  }
}
