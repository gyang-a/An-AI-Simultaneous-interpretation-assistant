const AUDIO_CHUNK_INTERVAL_MS = 800;

const preferredAudioTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4'
];

function getSupportedAudioType() {
  return preferredAudioTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function stopMediaStream(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

export async function createMicrophoneCapture({ onAudioChunk, onError }) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error('Current browser does not support microphone recording');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  const mimeType = getSupportedAudioType();
  const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size > 0) {
      onAudioChunk(event.data);
    }
  });

  mediaRecorder.addEventListener('error', (event) => {
    onError?.(event.error ?? event);
  });

  mediaRecorder.start(AUDIO_CHUNK_INTERVAL_MS);

  return {
    mimeType: mediaRecorder.mimeType,
    stop() {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      stopMediaStream(stream);
    }
  };
}
