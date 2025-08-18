import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      // console.log(message); // Uncomment for debugging
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  }
  return ffmpeg;
}

export class Mp3AudioHelper {
  public static async convertToMp3(blob: Blob): Promise<Blob> {
    const ffmpegInstance = await getFFmpeg();
    const inputFileName = "input.webm";
    const outputFileName = "output.mp3";

    await ffmpegInstance.writeFile(inputFileName, await fetchFile(blob));

    await ffmpegInstance.exec([
      "-i",
      inputFileName,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-b:a",
      "128k",
      outputFileName,
    ]);

    const data = await ffmpegInstance.readFile(outputFileName);
    return new Blob([data], { type: "audio/mpeg" });
  }
}

