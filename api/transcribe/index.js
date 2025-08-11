// Classic Azure Functions (context, req) — no formidable, no Node streams.
// Expects: { "audioBase64": "<base64-encoded audio bytes>" }
// Returns: { "text": "..." }

export default async function (context, req) {
  try {
    const { audioBase64 } = req.body || {};
    if (!audioBase64) {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "audioBase64 missing" }
      };
      return;
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      context.res = {
        status: 500,
        headers: { "content-type": "application/json" },
        body: { error: "Missing AZURE_SPEECH_KEY/REGION" }
      };
      return;
    }

    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Lazy-load Speech SDK so other functions don’t break on startup
    const mod = await import("microsoft-cognitiveservices-speech-sdk");
    const sdk = mod.default || mod;

    // Push the buffer into a stream the SDK can read
    const push = sdk.AudioInputStream.createPushStream();
    push.write(audioBuffer);
    push.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(push);
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    // Optional: choose language (uncomment if you need)
    // speechConfig.speechRecognitionLanguage = "en-US";

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(resolve, reject);
    });
    recognizer.close();

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { text: result?.text || "" }
    };
  } catch (err) {
    context.log.error(err);
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { error: err.message }
    };
  }
}
