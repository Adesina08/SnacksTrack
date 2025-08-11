import { analyzeText } from "@/lib/analyze";

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
  async analyzeConsumption(
    transcription: string,
    _mediaType: 'audio' | 'video',
    onProgress?: (progress: number) => void
  ): Promise<AzureAIAnalysis> {
    try {
      const data: {
        sentiment: string;
        confidence?: number;
        categories?: string[];
      } = await analyzeText(transcription);

      onProgress?.(100);

      return {
        transcription,
        sentiment: data.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
        confidence: data.confidence,
        categories: data.categories
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      console.error('Detailed analysis error:', msg);
      throw new Error(msg);
    }
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
