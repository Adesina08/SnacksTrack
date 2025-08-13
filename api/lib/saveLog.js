// /api/lib/saveLog.js
import { pool } from "../db.js";

// helpers
const S = (v) => (v == null ? null : String(v).trim());
const N = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj && obj[k] !== undefined) return obj[k];
  return undefined;
};

/**
 * Accepts payloads from:
 * - your manual form (mealDetails, productName, brand, category, amountSpent, companions, notes)
 * - AI capture (may send snack/snacks, mood, amount, transcript/text/whatYouSaid, etc.)
 */
export async function saveLog(body, context) {
  const b = body || {};
  const analysis = b.analysis || {}; // if AI bundles fields under "analysis"

  // product name from several possible fields
  const productName =
    S(pick(b, "productName", "product_name", "name", "product")) ||
    S(pick(b, "snack", "item")) ||
    (Array.isArray(b.snacks) && S(b.snacks[0])) ||
    (Array.isArray(analysis.snacks) && S(analysis.snacks[0])) ||
    S(analysis.snack) ||
    null;

  const mealDetails = S(pick(b, "mealDetails", "meal_details"));
  const brand       = S(pick(b, "brand", "brandName"));
  const category    = S(pick(b, "category", "categoryName"));

  const amountSpent =
    N(pick(b, "amountSpent", "amount", "price", "cost")) ??
    N(analysis.amountSpent ?? analysis.amount);

  const currency    = S(pick(b, "currency")) || "NGN";
  const companions  = S(pick(b, "companions", "companion", "who", "whoWereYouWith"));
  const mood        = S(pick(b, "mood")) || S(analysis.mood);
  const notes       =
    S(pick(b, "notes", "note", "description", "comment")) ||
    S(pick(b, "transcript", "text", "whatYouSaid")) ||
    S(analysis.whatYouSaid);

  if (!productName) {
    const err = new Error("product/productName is required");
    err.statusCode = 400;
    throw err;
  }

  // If your table has no mood column, drop mood in the INSERT & params.
  const sql = `
    INSERT INTO consumption_logs
      (meal_details, product_name, brand, category, amount, currency, companions, notes, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
    RETURNING id
  `;
  const params = [mealDetails, productName, brand, category, amountSpent, currency, companions, notes];

  const result = await pool.query(sql, params);
  return Number(result.rows[0].id);
}
