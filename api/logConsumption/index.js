// /api/logConsumption/index.js
import { saveLog } from "../lib/saveLog.js";

export default async function (context, req) {
  try {
    const b = req.body || {};

    const product = b.productName ?? b.product ?? b.name;
    const brand = b.brand;
    const category = b.category;
    const spend = b.amountSpent ?? b.spend ?? b.amount;
    const companions = b.companions;

    if (!product || !brand || !category || spend == null || !companions) {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "Missing required fields" }
      };
      return;
    }

    const id = await saveLog({ ...b, productName: product, spend }, context);

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, id }
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
