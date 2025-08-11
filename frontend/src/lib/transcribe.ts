export async function transcribeAudio(blob: Blob, baseUrl = ""): Promise<string> {
  // baseUrl can be "", or import.meta.env.VITE_API_BASE_URL if you use it
  const buf = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

  const res = await fetch(`${baseUrl}/api/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audioBase64: base64 })
  });

  // Ensure the API always returns JSON (see backend)
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Transcribe failed: ${res.status}`);
  }
  return data?.text ?? "";
}
