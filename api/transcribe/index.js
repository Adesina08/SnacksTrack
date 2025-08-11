
// /api/transcribe/index.js
export default async function (context, req) {
  try {
    const body = req.body || {};
    let audioBase64 =
      typeof body.audioBase64 === "string" ? body.audioBase64.trim() :
      typeof body.audio === "string" ? body.audio.trim() :
      "";

    // Accept data URLs too: "data:audio/webm;base64,AAAA..."
    if (audioBase64.startsWith("data:")) {
      const parts = audioBase64.split(",", 2);
      audioBase64 = parts[1] || "";
    }

    if (!audioBase64) {
      context.log.warn(`transcribe 400: missing audioBase64. ct=${req.headers?.["content-type"]}`);
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "audioBase64 missing. Send JSON with { audioBase64: '<base64>' } and header content-type=application/json" }
      };
      return;
    }

    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "Missing AZURE_SPEECH_KEY/REGION" } };
      return;
    }

    const mod = await import("microsoft-cognitiveservices-speech-sdk");
    const sdk = mod.default || mod;

    const audioBuffer = Buffer.from(audioBase64, "base64");
    if (audioBuffer.length < 256) {
      context.res = { status: 400, headers: { "content-type": "application/json" }, body: { error: "audioBase64 too small" } };
      return;
    }

    const push = sdk.AudioInputStream.createPushStream();
    push.write(audioBuffer); push.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(push);
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    // speechConfig.speechRecognitionLanguage = "en-US"; // optional

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(resolve, reject);
    });
    recognizer.close();

    context.res = { status: 200, headers: { "content-type": "application/json" }, body: { text: result?.text || "" } };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: err.message } };
  }
}
