import { blobToBase64 } from "./blobToBase64";

// If API is same SWA, baseUrl is "".
// If separate, set VITE_API_BASE_URL in GitHub secrets.
const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function transcribeAudio(blob: Blob): Promise<string> {
  const audioBase64 = await blobToBase64(blob);

  const res = await fetch(`${baseUrl}/api/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audioBase64 })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Transcribe failed: ${res.status}`);
  return data?.text ?? "";
}
