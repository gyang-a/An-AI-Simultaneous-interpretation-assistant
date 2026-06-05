import { WebSocket } from 'ws';
import { getXunfeiIatConfig } from '../config/xunfeiIatConfig.js';
import { createXunfeiIatAuthUrl } from './xunfeiIatAuth.js';

const IAT_FRAME_STATUS = {
  FIRST: 0,
  CONTINUE: 1,
  LAST: 2
};

function createSubtitleEvent({ segmentId, offsetMs, text, isFinal }) {
  return {
    type: isFinal ? 'final' : 'partial',
    segmentId,
    offsetMs,
    time: formatTime(offsetMs),
    sourceText: text,
    translatedText: text,
    status: isFinal ? '已识别' : '识别中'
  };
}

function formatTime(offsetMs) {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function extractIatText(result) {
  return result?.ws
    ?.flatMap((wordGroup) => wordGroup.cw ?? [])
    .map((word) => word.w)
    .join('');
}

export function createXunfeiIatTranslationSession({ onSubtitleEvent, onError }) {
  const config = getXunfeiIatConfig();
  let iatSocket = null;
  let startedAt = 0;
  let hasSentFirstFrame = false;
  let pendingAudioChunks = [];
  let segmentIndex = 0;

  function assertConfig() {
    if (!config.appId || !config.apiKey || !config.apiSecret) {
      throw new Error('Missing Xunfei IAT credentials');
    }
  }

  function createFirstFrame(audioBuffer) {
    return {
      common: {
        app_id: config.appId
      },
      business: {
        language: config.language,
        domain: config.domain,
        accent: config.accent,
        dwa: config.enableDynamicCorrection ? 'wpgs' : undefined
      },
      data: {
        status: IAT_FRAME_STATUS.FIRST,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audioBuffer.toString('base64')
      }
    };
  }

  function createAudioFrame(audioBuffer, status = IAT_FRAME_STATUS.CONTINUE) {
    return {
      data: {
        status,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audioBuffer.toString('base64')
      }
    };
  }

  function sendAudioFrame(audioBuffer) {
    if (!iatSocket || iatSocket.readyState !== WebSocket.OPEN) {
      pendingAudioChunks.push(audioBuffer);
      return;
    }

    const frame = hasSentFirstFrame
      ? createAudioFrame(audioBuffer)
      : createFirstFrame(audioBuffer);

    iatSocket.send(JSON.stringify(frame));
    hasSentFirstFrame = true;
  }

  function flushPendingAudioChunks() {
    const chunks = pendingAudioChunks;
    pendingAudioChunks = [];
    chunks.forEach((chunk) => sendAudioFrame(chunk));
  }

  function handleIatMessage(message) {
    const payload = JSON.parse(message.toString());

    if (payload.code !== 0) {
      onError?.(new Error(payload.message || 'Xunfei IAT recognition failed'));
      return;
    }

    const text = extractIatText(payload.data?.result);
    if (!text) {
      return;
    }

    segmentIndex += 1;
    onSubtitleEvent(
      createSubtitleEvent({
        segmentId: `xfyun-${segmentIndex}`,
        offsetMs: Date.now() - startedAt,
        text,
        isFinal: payload.data?.status === 2
      })
    );
  }

  function start() {
    assertConfig();
    stop();
    startedAt = Date.now();
    hasSentFirstFrame = false;
    pendingAudioChunks = [];
    segmentIndex = 0;

    iatSocket = new WebSocket(
      createXunfeiIatAuthUrl(config.url, config.apiKey, config.apiSecret)
    );

    iatSocket.on('open', flushPendingAudioChunks);
    iatSocket.on('message', handleIatMessage);
    iatSocket.on('error', (error) => onError?.(error));
    iatSocket.on('close', () => {
      iatSocket = null;
    });
  }

  function receiveAudioChunk(audioChunk) {
    sendAudioFrame(Buffer.from(audioChunk));
  }

  function stop() {
    pendingAudioChunks = [];

    if (iatSocket?.readyState === WebSocket.OPEN && hasSentFirstFrame) {
      iatSocket.send(JSON.stringify(createAudioFrame(Buffer.alloc(0), IAT_FRAME_STATUS.LAST)));
    }

    if (iatSocket) {
      iatSocket.close(1000);
      iatSocket = null;
    }
  }

  function getSessionStats() {
    return {
      provider: 'xunfei',
      startedAt
    };
  }

  return {
    start,
    receiveAudioChunk,
    stop,
    getSessionStats
  };
}
