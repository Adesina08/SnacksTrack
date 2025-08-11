// Expects POST JSON { text: "..." } (or { lines: ["..."] }) and returns sentiment + key phrases.

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
        body: { error: "Missing text. Send { text: \"...\" } or { lines: [\"...\"] }" }
      };
      return;
    }

    const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;  // https://<res>.cognitiveservices.azure.com/
    const key = process.env.AZURE_LANGUAGE_KEY;
    if (!endpoint || !key) {
      context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "Missing AZURE_LANGUAGE_ENDPOINT / AZURE_LANGUAGE_KEY" } };
      return;
    }

    const { TextAnalyticsClient, AzureKeyCredential } = await import("@azure/ai-text-analytics");
    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));

    const docs = [text];
    const [sentiment] = await client.analyzeSentiment(docs);
    const [phrases] = await client.extractKeyPhrases(docs);

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        sentiment: sentiment?.sentiment || "neutral",
        confidenceScores: sentiment?.confidenceScores || null,
        sentences: (sentiment?.sentences || []).map(s => ({
          text: s.text, sentiment: s.sentiment, confidenceScores: s.confidenceScores
        })),
        keyPhrases: phrases?.keyPhrases || []
      }
    };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "Text analysis failed", details: err.message } };
  }
}
