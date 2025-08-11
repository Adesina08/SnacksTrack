async function blobToBase64(b: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(b);
  });
  return dataUrl.split(",")[1] ?? "";
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || ""; // "" when same SWA

export async function uploadFile(file: File | Blob, name?: string) {
  const fileName =
    name ||
    (file as File).name ||
    `upload_${Date.now()}.${(file as File).type?.split("/")[1] || "bin"}`;

  const contentType = (file as File).type || "application/octet-stream";
  const fileBase64 = await blobToBase64(file);

  const res = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName, contentType, fileBase64 })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Upload failed");
  return data as { ok: boolean; blobName: string; url: string };
}
