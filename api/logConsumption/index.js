// /api/logConsumption/index.js
import { pool } from "../db.js";

function S(v) { return v == null ? null : String(v).trim(); }
function N(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function (context, req) {
  try {
    const b = req.body || {};

    // REQUIRED
    const productName = S(b.productName ?? b.product ?? b.name);
    const brand       = S(b.brand);
    const category    = S(b.category);
    const amountSpent = N(b.amountSpent ?? b.amount);
    const currency    = S(b.currency) || "NGN";
    const companions  = S(b.companions);
    const notes       = S(b.notes ?? b.note);

    // Manual entry must have all fields except notes
    if (!productName || !brand || !category || amountSpent == null || !currency || !companions) {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "Missing required fields" }
      };
      return;
    }

    const sql = `
      INSERT INTO consumption_logs
      (product_name, brand, category, amount, currency, companions, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
      RETURNING id
    `;
    const params = [productName, brand, category, amountSpent, currency, companions, notes];

    const result = await pool.query(sql, params);

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, id: result.rows[0].id }
    };
  } catch (err) {
    context.log.error("logConsumption error", err);
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { error: "DB insert failed", details: err.message }
    };
  }
}
