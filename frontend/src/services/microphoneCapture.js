const TARGET_SAMPLE_RATE = 16000;
const PCM_CHUNK_DURATION_MS = 40;
const PCM_CHUNK_SIZE = Math.floor((TARGET_SAMPLE_RATE * PCM_CHUNK_DURATION_MS) / 1000);

function stopMediaStream(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

function downsampleBuffer(inputData, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return inputData;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(inputData.length / sampleRateRatio);
  const outputData = new Float32Array(outputLength);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const inputIndex = Math.floor(outputIndex * sampleRateRatio);
    outputData[outputIndex] = inputData[inputIndex];
  }

  return outputData;
}

function encodePcm16(inputData) {
  const outputData = new Int16Array(inputData.length);

  for (let index = 0; index < inputData.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, inputData[index]));
    outputData[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return outputData.buffer;
}

export async function createMicrophoneCapture({ onAudioChunk, onError }) {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
    throw new Error('Current browser does not support microphone recording');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  const audioContext = new AudioContext();
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
  let pendingSamples = [];

  processorNode.onaudioprocess = (event) => {
    try {
      const inputData = event.inputBuffer.getChannelData(0);
      const downsampledData = downsampleBuffer(
        inputData,
        audioContext.sampleRate,
        TARGET_SAMPLE_RATE
      );

      pendingSamples = pendingSamples.concat(Array.from(downsampledData));

      while (pendingSamples.length >= PCM_CHUNK_SIZE) {
        const chunkSamples = pendingSamples.slice(0, PCM_CHUNK_SIZE);
        pendingSamples = pendingSamples.slice(PCM_CHUNK_SIZE);
        onAudioChunk(encodePcm16(chunkSamples));
      }
    } catch (error) {
      onError?.(error);
    }
  };

  sourceNode.connect(processorNode);
  processorNode.connect(audioContext.destination);

  return {
    mimeType: 'audio/L16;rate=16000',
    sampleRate: TARGET_SAMPLE_RATE,
    encoding: 'raw',
    stop() {
      processorNode.disconnect();
      sourceNode.disconnect();
      stopMediaStream(stream);
      audioContext.close();
    }
  };
}
