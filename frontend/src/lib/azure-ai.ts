import { buildUrl } from './local-db';

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
    this.backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!this.backendUrl) {
      throw new Error('VITE_BACKEND_URL is not defined in the environment');
    }
  }

  async transcribeAudio(
    audioBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    let response: Response;
    try {
      const transcribeUrl = new URL('/api/transcribe', this.backendUrl).toString();
      response = await fetch(transcribeUrl, {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error('Network or CORS error:', err);
      throw new Error('Failed to connect to backend server');
    }

    let data: any;
    try {
      data = await response.json();
    } catch (err) {
      console.error('Failed to parse JSON from transcription response');
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      console.error('Transcription failed:', data.message || response.statusText);
      throw new Error(data.message || 'Transcription failed');
    }

    const transcript = data.text?.trim();
    if (!transcript) {
      console.error('Empty transcription response');
      throw new Error('No transcription text received');
    }

    onProgress?.(100);
    return transcript;
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
