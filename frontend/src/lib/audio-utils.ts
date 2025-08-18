export class WavAudioHelper {
  public static async convertToWav(blob: Blob): Promise<Blob> {
    const targetSampleRate = 16000;
    const audioContext = new AudioContext({ sampleRate: targetSampleRate });
    const arrayBuffer = await blob.arrayBuffer();

    // The following line can throw an error if the audio format is not supported.
    // By wrapping it in a try-catch, we can provide a better error message.
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Failed to decode audio data:", error);
      // Attempt to re-wrap the blob to fix potential container issues
      try {
        const reWrappedBlob = new Blob([blob], { type: blob.type });
        const reWrappedArrayBuffer = await reWrappedBlob.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(reWrappedArrayBuffer);
      } catch (finalError) {
        console.error("Failed to decode audio data after re-wrapping:", finalError);
        throw new Error("Unsupported audio format or corrupt file.");
      }
    }


    const resampledBuffer = await this.downsampleBuffer(audioBuffer, targetSampleRate, audioContext);
    const wavBuffer = this.audioBufferToWav(resampledBuffer, targetSampleRate);
    await audioContext.close();
    return new Blob([wavBuffer], { type: "audio/wav" });
  }

  private static downsampleBuffer(
    buffer: AudioBuffer,
    targetRate: number,
    audioContext: BaseAudioContext
  ): Promise<AudioBuffer> {
    // We don't need to downsample if the sample rate is already correct
    if (buffer.sampleRate === targetRate) {
      return Promise.resolve(buffer);
    }

    const offlineCtx = new OfflineAudioContext({
      numberOfChannels: buffer.numberOfChannels,
      length: Math.ceil((buffer.duration * targetRate) / buffer.sampleRate),
      sampleRate: targetRate,
    });

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    return offlineCtx.startRendering();
  }

  private static audioBufferToWav(buffer: AudioBuffer, sampleRate: number): ArrayBuffer {
    const numOfChan = buffer.numberOfChannels;
    const numFrames = buffer.length;
    const bufferLength = 44 + numFrames * numOfChan * 2;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    let offset = 0;
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    };
    const writeUint32 = (d: number) => {
      view.setUint32(offset, d, true);
      offset += 4;
    };
    const writeUint16 = (d: number) => {
      view.setUint16(offset, d, true);
      offset += 2;
    };

    writeString("RIFF");
    writeUint32(36 + numFrames * numOfChan * 2);
    writeString("WAVE");
    writeString("fmt ");
    writeUint32(16);
    writeUint16(1); // PCM
    writeUint16(numOfChan);
    writeUint32(sampleRate);
    writeUint32(sampleRate * numOfChan * 2);
    writeUint16(numOfChan * 2);
    writeUint16(16); // 16-bit
    writeString("data");
    writeUint32(numFrames * numOfChan * 2);

    const channels: Float32Array[] = [];
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < numFrames; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = channels[channel][i];
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }
}
