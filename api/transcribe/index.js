import { IncomingForm } from 'formidable';
import fs from 'fs';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { speechConfig, jsonResponse } from '../shared.js';

export default async function (context, req) {
  const form = new IncomingForm({ multiples: false });
  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });
    const audio = files.audio;
    if (!audio) {
      context.res = jsonResponse(400, { message: 'No audio file uploaded' });
      return;
    }
    if (!speechConfig) {
      throw new Error('Azure Speech Service not configured');
    }
    const audioConfig = sdk.AudioConfig.fromFileInput(audio.filepath);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    const text = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(result.errorDetails);
          }
        },
        (err) => {
          recognizer.close();
          reject(err);
        },
      );
    });
    fs.unlink(audio.filepath, () => {});
    context.res = jsonResponse(200, { text: text.trim() });
  } catch (err) {
    context.log('Transcription failed', err);
    // remove temp file if exists
    if (err && err.path) {
      fs.unlink(err.path, () => {});
    }
    const msg = err instanceof Error ? err.message : 'Transcription failed';
    context.res = jsonResponse(500, { message: msg });
  }
}
