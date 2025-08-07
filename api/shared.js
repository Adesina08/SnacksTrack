import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { BlobServiceClient } from '@azure/storage-blob';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';

export const blobServiceClient = process.env.AZURE_STORAGE_CONNECTION_STRING
  ? BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
  : null;

export const audioContainer = blobServiceClient?.getContainerClient(
  process.env.AZURE_AUDIO_CONTAINER,
);

export const mediaContainer = blobServiceClient?.getContainerClient(
  process.env.AZURE_MEDIA_CONTAINER,
);

export async function uploadToAzure(filePath, originalName, mimeType) {
  if (!blobServiceClient) {
    return { url: `/uploads/${path.basename(filePath)}`, filename: path.basename(filePath) };
  }
  const container = mimeType.startsWith('audio/') ? audioContainer : mediaContainer;
  const blobName = `${Date.now()}-${crypto.randomUUID()}${path.extname(originalName)}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  const data = await fs.promises.readFile(filePath);
  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });
  await fs.promises.unlink(filePath).catch(() => {});
  return { url: blockBlobClient.url, filename: blobName };
}

export const speechConfig =
  process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION
    ? sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION,
      )
    : null;
if (speechConfig) {
  speechConfig.speechRecognitionLanguage = 'en-US';
}

export const textClient =
  process.env.AZURE_LANGUAGE_KEY && process.env.AZURE_LANGUAGE_ENDPOINT
    ? new TextAnalyticsClient(
        process.env.AZURE_LANGUAGE_ENDPOINT,
        new AzureKeyCredential(process.env.AZURE_LANGUAGE_KEY),
      )
    : null;

const allowedOrigins = process.env.CORS_ORIGIN || '*';
export function jsonResponse(status, body) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigins,
    },
    body,
  };
}
