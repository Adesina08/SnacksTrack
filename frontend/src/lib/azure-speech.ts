import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export function createSpeechRecognizer(onText: (text: string) => void) {
  const key = import.meta.env.VITE_AZURE_SPEECH_KEY;
  const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error("Missing Azure speech credentials");
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = "en-US";
  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  recognizer.recognizing = (_s, e) => onText(e.result.text);
  recognizer.recognized = (_s, e) => onText(e.result.text);
  return {
    start: () => new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(resolve, reject);
    }),
    stop: () =>
      new Promise<void>((resolve) => {
        recognizer.stopContinuousRecognitionAsync(() => {
          recognizer.close();
          resolve();
        });
      }),
  };
}
