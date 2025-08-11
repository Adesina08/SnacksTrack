export interface AzureAIAnalysis {
  transcription?: string;
  detectedProducts?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence?: number;
  emotions?: string[];
  brands?: string[];
  categories?: string[];
  estimatedSpend?: string;
  location?: string;
}

export class AzureAIService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_API_BASE_URL || "";
  }

  async analyzeConsumption(
    transcription: string,
    mediaType: 'audio' | 'video',
    onProgress?: (progress: number) => void
  ): Promise<AzureAIAnalysis> {
    const response = await fetch(`${this.backendUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcription })
    });

    if (!response.ok) {
      let msg = 'Analysis failed';
      try {
        const err = await response.json();
        msg = err.message || msg;
      } catch {
        // ignore parse errors
      }
      console.error('Detailed analysis error:', msg);
      throw new Error(msg);
    }

    const data: {
      sentiment: string;
      confidence?: number;
      categories?: string[];
    } = await response.json();

    onProgress?.(100);

    return {
      transcription,
      sentiment: data.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
      confidence: data.confidence,
      categories: data.categories
    };
  }

  async analyzeImage(imageBlob: Blob): Promise<AzureAIAnalysis> {
    // Stubbed analysis - replace with Azure Vision API call later if needed
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          detectedProducts: ['Coca-Cola', 'French Fries'],
          brands: ['Coca-Cola', "McDonald's"],
          categories: ['Beverages', 'Fast Food'],
          confidence: 0.85,
          estimatedSpend: '$12.50',
          location: 'Restaurant/Fast Food Chain'
        });
      }, 2000);
    });
  }
}

export const azureAI = new AzureAIService();
