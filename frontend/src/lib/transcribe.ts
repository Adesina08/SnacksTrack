import { blobToBase64 } from "./blobToBase64";

const baseUrl = import.meta.env.VITE_API_BASE_URL || ""; // "" if same SWA

export async function transcribeAudio(blob: Blob): Promise<string> {
  const audioBase64 = await blobToBase64(blob);
  if (!audioBase64) throw new Error("Empty audio");

  const res = await fetch(`${baseUrl}/api/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audioBase64 })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Transcription failed");
  return data?.text ?? "";
}
