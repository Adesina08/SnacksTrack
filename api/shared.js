import fs from "fs";
import path from "path";
import crypto from "node:crypto";

export async function getBlobServiceClient() {
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("AZURE_STORAGE_CONNECTION_STRING missing");
  return BlobServiceClient.fromConnectionString(conn);
}

export async function getTextAnalyticsClient() {
  const { TextAnalyticsClient, AzureKeyCredential } = await import("@azure/ai-text-analytics");
  const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
  const key = process.env.AZURE_LANGUAGE_KEY;
  if (!endpoint || !key) throw new Error("AZURE_LANGUAGE_* missing");
  return new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
}

export async function getSpeechSdk() {
  const mod = await import("microsoft-cognitiveservices-speech-sdk");
  return mod.default || mod;
}

export async function uploadToAzure(filePath, originalName, mimeType) {
  const blobServiceClient = await getBlobServiceClient();
  const audioContainer = blobServiceClient.getContainerClient(process.env.AZURE_AUDIO_CONTAINER);
  const mediaContainer = blobServiceClient.getContainerClient(process.env.AZURE_MEDIA_CONTAINER);
  const container = mimeType.startsWith("audio/") ? audioContainer : mediaContainer;
  const blobName = `${Date.now()}-${crypto.randomUUID()}${path.extname(originalName)}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  const data = await fs.promises.readFile(filePath);
  await blockBlobClient.uploadData(data, { blobHTTPHeaders: { blobContentType: mimeType } });
  await fs.promises.unlink(filePath).catch(() => {});
  return { url: blockBlobClient.url, filename: blobName };
}

const allowedOrigins = process.env.CORS_ORIGIN || "*";
export function jsonResponse(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigins,
    },
    body,
  };
}
