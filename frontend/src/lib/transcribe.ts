// Convert Blob -> base64 and POST JSON { audioBase64 } to /api/transcribe
async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return dataUrl.split(",")[1] ?? ""; // remove "data:*;base64,"
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || ""; // "" if same SWA

export async function transcribeAudio(blob: Blob): Promise<string> {
  const audioBase64 = await blobToBase64(blob);
  if (!audioBase64) throw new Error("Empty audio");

  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/transcribe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audioBase64 })
    });
  } catch {
    throw new Error("Transcription service unreachable");
  }
  const duration = performance.now() - start;
  console.info(`Transcription request took ${Math.round(duration)}ms`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Transcription failed");
  return data?.text ?? "";
}
