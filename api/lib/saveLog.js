// /api/lib/saveLog.js
import { pool } from "../db.js";
import { randomUUID } from "crypto";

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
 * - your manual form (productName, brand, category, amountSpent, companions, notes)
 * - AI capture (may send snack/snacks, mood, amount, transcript/text/whatYouSaid, etc.)
 */
export async function saveLog(body, context) {
  const b = body || {};
  const analysis = b.analysis || {}; // if AI bundles fields under "analysis"

  const id = randomUUID();

  // primary product fields
  const product =
    S(pick(b, "product", "productName", "product_name", "name")) ||
    S(pick(b, "snack", "item")) ||
    (Array.isArray(b.snacks) && S(b.snacks[0])) ||
    (Array.isArray(analysis.snacks) && S(analysis.snacks[0])) ||
    S(analysis.snack) ||
    null;

  const productName =
    S(pick(b, "productName", "product_name")) ||
    product;

  const brand       = S(pick(b, "brand", "brandName"));
  const category    = S(pick(b, "category", "categoryName"));

  const spend =
    N(pick(b, "spend", "amountSpent", "price", "cost"));

  const amount =
    N(pick(b, "amount")) ?? N(analysis.amount);

  const currency    = S(pick(b, "currency")) || "NGN";
  const companions  = S(pick(b, "companions", "companion", "who", "whoWereYouWith"));
  const location    = S(pick(b, "location", "place"));

  const notes       =
    S(pick(b, "notes", "note", "description", "comment")) ||
    S(pick(b, "transcript", "text", "whatYouSaid")) ||
    S(analysis.whatYouSaid);

  const mediaUrl    = S(pick(b, "mediaUrl", "media_url"));
  const mediaType   = S(pick(b, "mediaType", "media_type"));
  const captureMethod = S(pick(b, "captureMethod", "capture_method")) || "manual";
  const aiAnalysis    = pick(b, "aiAnalysis", "ai_analysis", "analysis") || null;
  const points        = N(pick(b, "points"));

  if (!product && !productName) {
    const err = new Error("product/productName is required");
    err.statusCode = 400;
    throw err;
  }

  const sql = `
    INSERT INTO consumption_logs
      (id, product, brand, category, spend, companions, location, notes,
       media_url, media_type, capture_method, ai_analysis, created_at,
       points, product_name, amount, currency)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14,$15,$16)
    RETURNING id
  `;
  const params = [
    id,
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
    aiAnalysis ? JSON.stringify(aiAnalysis) : null,
    points,
    productName,
    amount,
    currency
  ];

  const result = await pool.query(sql, params);
  return result.rows[0].id;
}
