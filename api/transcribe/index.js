
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
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "audioBase64 too small" },
      };
      return;
    }

    const transcribeChunk = (buffer) => {
      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(buffer);
      pushStream.close();
      const audioCfg = sdk.AudioConfig.fromStreamInput(pushStream);
      const speechCfg = sdk.SpeechConfig.fromSubscription(key, region);
      return new Promise((resolve, reject) => {
        const rec = new sdk.SpeechRecognizer(speechCfg, audioCfg);
        rec.recognizeOnceAsync(
          (r) => {
            rec.close();
            resolve(r?.text || "");
          },
          (err) => {
            rec.close();
            reject(err);
          },
        );
      });
    };

    // Split large audio into chunks and transcribe in parallel for speed
    const chunkSize = 32000 * 10; // ~10s for 16kHz mono PCM
    const chunks = [];
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      chunks.push(audioBuffer.slice(i, i + chunkSize));
    }

    let text = "";
    if (chunks.length === 1) {
      text = await transcribeChunk(audioBuffer);
    } else {
      const results = await Promise.all(chunks.map((c) => transcribeChunk(c)));
      text = results.join(" ");
    }

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { text },
    };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: err.message } };
  }
}
