// /api/analyze/index.js
// POST JSON { text: "..." }  -> returns structured analysis including snacks, mood, confidence, amountSpent, said

export default async function (context, req) {
  try {
    const body = req.body || {};
    const text =
      typeof body.text === "string" ? body.text.trim() :
      Array.isArray(body.lines) && body.lines.length ? String(body.lines.join(" ").trim()) : "";

    if (!text) {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: 'Missing text. Send { text: "..." } or { lines: ["..."] }' }
      };
      return;
    }

    const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;  // e.g. https://<name>.cognitiveservices.azure.com/
    const key = process.env.AZURE_LANGUAGE_KEY;
    if (!endpoint || !key) {
      context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "Missing AZURE_LANGUAGE_ENDPOINT / AZURE_LANGUAGE_KEY" } };
      return;
    }

    // --- Azure Language SDK (lazy import) ---
    const { TextAnalyticsClient, AzureKeyCredential } = await import("@azure/ai-text-analytics");
    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));

    // --- Run sentiment, key phrases, entities ---
    const docs = [text];
    const [sentiment] = await client.analyzeSentiment(docs);
    const [phrases]   = await client.extractKeyPhrases(docs);
    const [entities]  = await client.recognizeEntities(docs);

    // --- Mood + confidence ---
    const label = sentiment?.sentiment || "neutral";
    const cs = sentiment?.confidenceScores || { positive: 0, neutral: 0, negative: 0 };
    const confidence =
      label === "positive" ? cs.positive :
      label === "negative" ? cs.negative : cs.neutral;

    // --- Amount Spent (try NER first, then regex fallback) ---
    function normalizeCurrency(symOrWord) {
      const s = (symOrWord || "").toString().toUpperCase();
      if (s.includes("₦") || s.includes("NAIRA") || s === "NGN" || s === "N") return "NGN";
      if (s.includes("$") || s === "USD") return "USD";
      if (s.includes("£") || s === "GBP") return "GBP";
      if (s.includes("€") || s === "EUR") return "EUR";
      return s || "NGN";
    }

    let amountSpent = null;

    // regexes:
    //  ₦500 / NGN 500 / 500 NGN / 500 naira / $3.50 / 3.50 USD / £2 / €4
    const r1 = /(?:(₦|NGN|Naira|N|\$|USD|£|GBP|€|EUR)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?))/i;
    const r2 = /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+)?)\s*(₦|NGN|Naira|N|\$|USD|£|GBP|€|EUR)/i;

    // try entities
    if (entities?.entities?.length) {
      // Look around any "Currency" entity for a number substring
      for (const e of entities.entities) {
        if ((e.category || "").toLowerCase() === "currency") {
          // naive neighbor search in text
          const after = text.slice(e.offset + e.length, e.offset + e.length + 20);
          const before = text.slice(Math.max(0, e.offset - 12), e.offset);
          const try1 = r1.exec(e.text + " " + after);
          const try2 = r2.exec(before + " " + e.text);
          const m = try1 || try2;
          if (m) {
            const cur = normalizeCurrency(m[1] || m[2] || e.text);
            const raw = (m[2] || m[1] || "").replace(/[,]/g, ".");
            const amount = Number(raw.replace(/[^0-9.]/g, ""));
            if (!Number.isNaN(amount)) {
              amountSpent = { currency: cur, amount, text: m[0] };
              break;
            }
          }
        }
      }
    }

    // fallback regex over whole text
    if (!amountSpent) {
      const m = r1.exec(text) || r2.exec(text);
      if (m) {
        const cur = normalizeCurrency(m[1] || m[2]);
        const raw = (m[2] || m[1] || "").replace(/[,]/g, ".");
        const amount = Number(raw.replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(amount)) amountSpent = { currency: cur, amount, text: m[0] };
      }
    }

    // --- Snacks detection (simple dictionary + key phrases) ---
    const SNACKS = new Set([
      "chips","plantain chips","crisps","biscuit","biscuits","cookie","cookies",
      "cake","cupcake","chocolate","candy","sweet","sweets","popcorn","nuts","peanuts",
      "granola bar","energy bar","yogurt","yoghurt","ice cream","meat pie","sausage roll",
      "gala","puff puff","chin chin","meatpie","pie","donut","doughnut","shawarma","buns"
    ]);

    function norm(s) { return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim(); }
    const candidates = new Set();

    // from key phrases
    for (const kp of (phrases?.keyPhrases || [])) {
      const k = norm(kp);
      if (SNACKS.has(k)) candidates.add(k);
      // split phrases to catch single-word snacks
      for (const part of k.split(/\s+/)) {
        if (SNACKS.has(part)) candidates.add(part);
      }
    }

    // quick token scan over the text
    for (const tok of norm(text).split(/\s+/)) {
      if (!tok) continue;
      const singular = tok.endsWith("s") ? tok.slice(0, -1) : tok;
      if (SNACKS.has(tok)) candidates.add(tok);
      if (SNACKS.has(singular)) candidates.add(singular);
    }

    const snacks = Array.from(candidates).sort();

    // --- Build response ---
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        // keep originals for backward-compat
        sentiment: sentiment?.sentiment || "neutral",
        confidenceScores: cs,
        sentences: (sentiment?.sentences || []).map(s => ({
          text: s.text, sentiment: s.sentiment, confidenceScores: s.confidenceScores
        })),
        keyPhrases: phrases?.keyPhrases || [],
        entities: entities?.entities || [],

        // new tidy summary
        mood: label,                        // "positive" | "neutral" | "negative"
        confidence,                         // 0..1
        snacks,                             // ["chips","yogurt",...]
        amountSpent,                        // { currency:"NGN", amount:500, text:"₦500" } | null
        said: text                          // echo input
      }
    };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "Text analysis failed", details: err.message } };
  }
}
