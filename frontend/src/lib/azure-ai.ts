// /frontend/src/lib/azure-ai.ts
export type AzureAIAnalysis = {
  mood: string;
  confidence: number | null;
  nigerianFoods: string[];
  amountSpent: { currency: string; amount: number; text: string } | null;
  said: string;
  // keep originals (optional)
  sentiment?: string;
  confidenceScores?: { positive: number; neutral: number; negative: number };
  keyPhrases?: string[];
  entities?: any[];
  sentences?: any[];
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const azureAI = {
  async analyzeConsumption(
    text: string,
    _mediaType?: "audio" | "video" | "text",
    onProgress?: (p: number) => void
  ): Promise<AzureAIAnalysis> {
    if (!text?.trim()) throw new Error("Missing text");
    onProgress?.(15);
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Text analysis failed");
    onProgress?.(100);
    return data as AzureAIAnalysis;
  }
};
