export async function convertToWav(blob: Blob): Promise<Blob> {
  const targetSampleRate = 16000;
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const resampledBuffer = await downsampleBuffer(audioBuffer, targetSampleRate);
  const wavBuffer = audioBufferToWav(resampledBuffer, targetSampleRate);
  await audioContext.close();
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function downsampleBuffer(buffer: AudioBuffer, targetRate: number): AudioBuffer {
  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: buffer.numberOfChannels,
    length: Math.ceil(buffer.duration * targetRate),
    sampleRate: targetRate,
  });

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}

function audioBufferToWav(buffer: AudioBuffer, sampleRate: number): ArrayBuffer {
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

  writeString('RIFF');
  writeUint32(36 + numFrames * numOfChan * 2);
  writeString('WAVE');
  writeString('fmt ');
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numOfChan);
  writeUint32(sampleRate);
  writeUint32(sampleRate * numOfChan * 2);
  writeUint16(numOfChan * 2);
  writeUint16(16); // 16-bit
  writeString('data');
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
