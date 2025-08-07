import crypto from 'node:crypto';
import { pool } from '../db.js';
import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  if (req.method === 'POST') {
    const {
      userId,
      product,
      brand,
      category,
      spend,
      companions,
      location,
      notes,
      mediaUrl,
      mediaType,
      captureMethod,
      aiAnalysis,
      points,
    } = req.body || {};
    try {
      const { rows } = await pool.query(
        `INSERT INTO consumption_logs(id,user_id,product,brand,category,spend,companions,location,notes,media_url,media_type,capture_method,ai_analysis,points)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          crypto.randomUUID(),
          userId,
          product,
          brand || null,
          category,
          spend,
          companions || null,
          location || null,
          notes || null,
          mediaUrl || null,
          mediaType || null,
          captureMethod,
          aiAnalysis ? JSON.stringify(aiAnalysis) : null,
          points,
        ],
      );
      context.res = jsonResponse(200, rows[0]);
    } catch (err) {
      context.log(err);
      context.res = jsonResponse(500, { message: 'Failed to create log' });
    }
  } else if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT * FROM consumption_logs ORDER BY created_at DESC',
    );
    context.res = jsonResponse(200, rows);
  } else {
    context.res = jsonResponse(405, { message: 'Method not allowed' });
  }
}
