import { buildUrl } from "./api-client";

export interface UploadResult {
  url: string;
  filename: string;
  success: boolean;
  error?: string;
}

export class LocalStorageService {
  private uploadEndpoint = buildUrl("/upload");

  private async blobToBase64(b: Blob): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(b);
    });
    return dataUrl.split(",")[1] ?? "";
  }

  async uploadFile(file: File): Promise<UploadResult> {
    try {
      const fileBase64 = await this.blobToBase64(file);
      const res = await fetch(this.uploadEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileBase64
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      return { url: data.url, filename: data.filename, success: true };
    } catch (error) {
      return {
        url: "",
        filename: "",
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }
}

let localStorageInstance: LocalStorageService | null = null;
export const getLocalStorage = (): LocalStorageService => {
  if (!localStorageInstance) localStorageInstance = new LocalStorageService();
  return localStorageInstance;
};
