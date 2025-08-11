const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function analyzeText(text: string) {
  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Text analysis failed");
  return data; // { sentiment, keyPhrases, ... }
}
