// /api/upload/index.js
// Accept JSON { fileBase64, fileName?, contentType? } or { dataUrl } and upload to Blob Storage.

import crypto from "node:crypto";
import { getBlobServiceClient, jsonResponse } from "../shared.js";

export default async function (context, req) {
  try {
    const b = req.body || {};
    let { fileBase64, fileName, contentType, dataUrl } = b;

    if (!fileBase64 && typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
      fileBase64 = dataUrl.split(",", 2)[1] || "";
      const mt = dataUrl.slice(5, dataUrl.indexOf(";")); // "image/png"
      if (!contentType && mt) contentType = mt;
    }
    if (!fileBase64 || typeof fileBase64 !== "string") {
      context.res = jsonResponse(400, { error: "Send JSON { fileBase64: '<base64>' } (optionally fileName, contentType)" });
      return;
    }

    const service = await getBlobServiceClient();
    const isAudio = (contentType || "").startsWith("audio/");
    const containerName =
      (isAudio ? process.env.AZURE_AUDIO_CONTAINER : process.env.AZURE_MEDIA_CONTAINER) ||
      process.env.AZURE_MEDIA_CONTAINER || "uploads";
    const container = service.getContainerClient(containerName);
    await container.createIfNotExists();

    const ext = fileName && fileName.includes(".") ? "." + fileName.split(".").pop() : "";
    const blobName = fileName || `upload_${Date.now()}_${crypto.randomUUID()}${ext}`;
    const blob = container.getBlockBlobClient(blobName);

    const buffer = Buffer.from(fileBase64, "base64");
    await blob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" } });

    context.res = jsonResponse(200, { ok: true, url: blob.url, filename: blobName });
  } catch (err) {
    context.log.error("upload error:", err);
    context.res = jsonResponse(500, { error: "Upload failed", details: err.message });
  }
}
