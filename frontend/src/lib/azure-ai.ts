async transcribeAudio(
  audioBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  // convert to base64
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(audioBlob);
  });
  const fileBase64 = dataUrl.split(',')[1] ?? '';
  onProgress?.(25);

  let response: Response;
  try {
    const transcribeUrl = new URL('/api/transcribe', this.backendUrl).toString();
    response = await fetch(transcribeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contentType: (audioBlob as any).type || 'audio/webm',
        fileBase64
      })
    });
  } catch (err) {
    console.error('Network or CORS error:', err);
    throw new Error('Failed to connect to backend server');
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    console.error('Failed to parse JSON from transcription response');
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    console.error('Transcription failed:', data.message || response.statusText);
    throw new Error(data.message || 'Transcription failed');
  }

  const transcript = data.text?.trim();
  if (!transcript) {
    console.error('Empty transcription response');
    throw new Error('No transcription text received');
  }

  onProgress?.(100);
  return transcript;
}
