// /api/analyze/index.js
// POST JSON { text: "..." } (or { lines: [...] }) -> returns structured analysis

import { getTextAnalyticsClient, jsonResponse } from "../shared.js";

export default async function (context, req) {
  try {
    const body = req.body || {};
    const text =
      typeof body.text === "string" ? body.text.trim() :
      Array.isArray(body.lines) && body.lines.length ? String(body.lines.join(" ").trim()) : "";

    if (!text) {
      context.res = jsonResponse(400, { error: 'Missing text. Send { text: "..." } or { lines: ["..."] }' });
      return;
    }

    const client = await getTextAnalyticsClient();

    const docs = [text];
    const [sentiment] = await client.analyzeSentiment(docs);
    const [phrases]   = await client.extractKeyPhrases(docs);
    const [entities]  = await client.recognizeEntities(docs);

    const label = sentiment?.sentiment || "neutral";
    const cs = sentiment?.confidenceScores || { positive: 0, neutral: 0, negative: 0 };
    const confidence =
      label === "positive" ? cs.positive :
      label === "negative" ? cs.negative : cs.neutral;

    // Amount Spent (NGN/USD/GBP/EUR…)
    function normCur(s) {
      const t = String(s || "").toUpperCase();
      if (t.includes("₦") || t.includes("NAIRA") || t === "NGN" || t === "N") return "NGN";
      if (t.includes("$") || t === "USD") return "USD";
      if (t.includes("£") || t === "GBP") return "GBP";
      if (t.includes("€") || t === "EUR") return "EUR";
      return t || "NGN";
    }
    const r1 = /(?:(₦|NGN|Naira|N|\$|USD|£|GBP|€|EUR)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?))/i;
    const r2 = /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?)\s*(₦|NGN|Naira|N|\$|USD|£|GBP|€|EUR)/i;

    let amountSpent = null;
    if (entities?.entities?.length) {
      for (const e of entities.entities) {
        if ((e.category || "").toLowerCase() === "currency") {
          const after = text.slice(e.offset + e.length, e.offset + e.length + 20);
          const before = text.slice(Math.max(0, e.offset - 12), e.offset);
          const m = r1.exec(e.text + " " + after) || r2.exec(before + " " + e.text);
          if (m) {
            const cur = normCur(m[1] || m[2] || e.text);
            const raw = (m[2] || m[1] || "").replace(/[,]/g, ".");
            const amt = Number(raw.replace(/[^0-9.]/g, ""));
            if (!Number.isNaN(amt)) { amountSpent = { currency: cur, amount: amt, text: m[0] }; break; }
          }
        }
      }
    }
    if (!amountSpent) {
      const m = r1.exec(text) || r2.exec(text);
      if (m) {
        const cur = normCur(m[1] || m[2]);
        const raw = (m[2] || m[1] || "").replace(/[,]/g, ".");
        const amt = Number(raw.replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(amt)) amountSpent = { currency: cur, amount: amt, text: m[0] };
      }
    }

    // Nigerian foods detection
    const NIGERIAN_FOODS = new Set([
      "jollof rice","suya","pounded yam","egusi","pepper soup","chin chin",
      "plantain","akara","moi moi","fufu","garri","puff puff","meat pie",
      "meatpie","gala","buns","shawarma","chips","plantain chips","crisps",
      "biscuit","biscuits","cookie","cookies","cake","cupcake","chocolate",
      "candy","sweet","sweets","popcorn","nuts","peanuts","granola bar",
      "energy bar","yogurt","yoghurt","ice cream","sausage roll","pie",
      "donut","doughnut"
    ]);
    function norm(s) { return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim(); }
    const candidates = new Set();
    for (const kp of (phrases?.keyPhrases || [])) {
      const k = norm(kp);
      if (NIGERIAN_FOODS.has(k)) candidates.add(k);
      for (const t of k.split(/\s+/)) if (NIGERIAN_FOODS.has(t)) candidates.add(t);
    }
    for (const t of norm(text).split(/\s+/)) {
      if (!t) continue;
      const s = t.endsWith("s") ? t.slice(0, -1) : t;
      if (NIGERIAN_FOODS.has(t)) candidates.add(t);
      if (NIGERIAN_FOODS.has(s)) candidates.add(s);
    }
    const nigerianFoods = Array.from(candidates).sort();

    context.res = jsonResponse(200, {
      // original fields kept
      sentiment: sentiment?.sentiment || "neutral",
      confidenceScores: cs,
      sentences: (sentiment?.sentences || []).map(s => ({
        text: s.text, sentiment: s.sentiment, confidenceScores: s.confidenceScores
      })),
      keyPhrases: phrases?.keyPhrases || [],
      entities: entities?.entities || [],
      // tidy summary for your UI
      mood: label,
      confidence,
      nigerianFoods,
      amountSpent,
      said: text
    });
  } catch (err) {
    context.log.error(err);
    context.res = jsonResponse(500, { error: "Text analysis failed", details: err.message });
  }
}
