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

function isPunctuationOnly(text) {
  return /^[\s，。！？、,.!?;；:：]+$/.test(text);
}

function endsWithSentencePunctuation(text) {
  return /[。！？.!?]\s*$/.test(text);
}

export function createXunfeiIatTranslationSession({ onSubtitleEvent, onError }) {
  const config = getXunfeiIatConfig();
  let iatSocket = null;
  let startedAt = 0;
  let hasSentFirstFrame = false;
  let isSessionActive = false;
  let pendingAudioChunks = [];
  let segmentIndex = 0;
  let activeSegmentId = '';
  let activeSegmentText = '';
  let recognizedPieces = new Map();

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
        vad_eos: config.vadEos,
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
    if (!isSessionActive) {
      return;
    }

    if (!iatSocket || iatSocket.readyState === WebSocket.CLOSED) {
      openIatSocket();
    }

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

  function getResultSerialNumber(result) {
    return Number.isInteger(result?.sn) ? result.sn : recognizedPieces.size + 1;
  }

  function removeReplacedPieces(result) {
    if (!Array.isArray(result?.rg) || result.rg.length < 2) {
      return null;
    }

    const [startSerialNumber, endSerialNumber] = result.rg;
    Array.from(recognizedPieces.keys()).forEach((serialNumber) => {
      if (serialNumber >= startSerialNumber && serialNumber <= endSerialNumber) {
        recognizedPieces.delete(serialNumber);
      }
    });

    return startSerialNumber;
  }

  function appendRecognizedPiece(result, text) {
    let serialNumber = getResultSerialNumber(result);

    if (result?.pgs === 'rpl') {
      serialNumber = removeReplacedPieces(result) ?? serialNumber;
    }

    if (isPunctuationOnly(text) && recognizedPieces.has(serialNumber - 1)) {
      recognizedPieces.set(serialNumber - 1, `${recognizedPieces.get(serialNumber - 1)}${text}`);
      return;
    }

    recognizedPieces.set(serialNumber, text);
  }

  function assembleRecognizedText() {
    return Array.from(recognizedPieces.entries())
      .sort(([leftSerialNumber], [rightSerialNumber]) => leftSerialNumber - rightSerialNumber)
      .map(([, text]) => text)
      .join('');
  }

  function resetActiveSegment() {
    activeSegmentId = '';
    activeSegmentText = '';
    recognizedPieces = new Map();
  }

  function handleIatMessage(message) {
    const payload = JSON.parse(message.toString());

    if (payload.code !== 0) {
      onError?.(new Error(payload.message || 'Xunfei IAT recognition failed'));
      return;
    }

    const text = extractIatText(payload.data?.result);
    if (!text) {
      if (payload.data?.status === 2) {
        resetCurrentIatSocket();
      }

      return;
    }

    const isReplacementResult = payload.data?.result?.pgs === 'rpl';
    if (
      activeSegmentId &&
      activeSegmentText &&
      !isReplacementResult &&
      !isPunctuationOnly(text) &&
      endsWithSentencePunctuation(activeSegmentText)
    ) {
      resetActiveSegment();
    }

    if (!activeSegmentId) {
      segmentIndex += 1;
      activeSegmentId = `xfyun-${segmentIndex}`;
    }

    appendRecognizedPiece(payload.data?.result, text);
    activeSegmentText = assembleRecognizedText();

    onSubtitleEvent(
      createSubtitleEvent({
        segmentId: activeSegmentId,
        offsetMs: Date.now() - startedAt,
        text: activeSegmentText,
        isFinal: payload.data?.status === 2 || endsWithSentencePunctuation(activeSegmentText)
      })
    );

    if (payload.data?.status === 2) {
      resetActiveSegment();
      resetCurrentIatSocket();
    }
  }

  function start() {
    assertConfig();
    stop();
    startedAt = Date.now();
    hasSentFirstFrame = false;
    isSessionActive = true;
    pendingAudioChunks = [];
    segmentIndex = 0;
    resetActiveSegment();
  }

  function receiveAudioChunk(audioChunk) {
    sendAudioFrame(Buffer.from(audioChunk));
  }

  function stop() {
    isSessionActive = false;
    pendingAudioChunks = [];
    resetActiveSegment();

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

  function resetCurrentIatSocket() {
    hasSentFirstFrame = false;

    if (iatSocket) {
      iatSocket.close(1000);
      iatSocket = null;
    }
  }

  function openIatSocket() {
    hasSentFirstFrame = false;

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

  return {
    start,
    receiveAudioChunk,
    stop,
    getSessionStats
  };
}
