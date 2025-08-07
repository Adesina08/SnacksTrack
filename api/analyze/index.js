import { textClient, jsonResponse } from '../shared.js';

export default async function (context, req) {
  const { text } = req.body || {};
  if (!text) {
    context.res = jsonResponse(400, { message: 'No text provided' });
    return;
  }
  try {
    if (!textClient) {
      throw new Error('Azure Text Analytics not configured');
    }
    const [sentimentResult] = await textClient.analyzeSentiment([text]);
    const sentiment = sentimentResult.sentiment;
    const confidence = sentimentResult.confidenceScores[sentiment];
    const [keyResult] = await textClient.extractKeyPhrases([text]);
    context.res = jsonResponse(200, {
      sentiment,
      confidence,
      categories: keyResult.keyPhrases,
    });
  } catch (err) {
    context.log('Text analysis failed', err);
    context.res = jsonResponse(500, { message: 'Text analysis failed' });
  }
}
