// /api/logs/index.js
import { saveLog } from "../lib/saveLog.js";
import { pool } from "../db.js";

export default async function (context, req) {
  try {
    if (req.method === "GET") {
      // Optional: let the app fetch recent logs
      const userId = Number(req.query?.userId);
      if (!userId) {
        context.res = { status: 400, body: { error: "userId is required" } };
        return;
      }
      const r = await pool.query(
        `SELECT id, product_name, brand, category, amount, currency, companions, notes, meal_details, created_at
         FROM consumption_logs
         WHERE user_id=$1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );
      context.res = { status: 200, body: { ok: true, items: r.rows } };
      return;
    }

    // POST → create a log (same as logConsumption)
    const id = await saveLog(req.body, context);
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, id }
    };
  } catch (err) {
    context.log.error("logs error:", err);
    context.res = {
      status: err.statusCode || 500,
      headers: { "content-type": "application/json" },
      body: { error: err.message || "Insert failed" }
    };
  }
}
