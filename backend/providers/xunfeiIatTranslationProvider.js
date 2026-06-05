import { WebSocket } from 'ws';
import { getXunfeiIatConfig } from '../config/xunfeiIatConfig.js';
import { getTranslationProviderConfig } from '../config/translationProviderConfig.js';
import { translateText } from './translationProvider.js';
import { createXunfeiIatAuthUrl } from './xunfeiIatAuth.js';

const IAT_FRAME_STATUS = {
  FIRST: 0,
  CONTINUE: 1,
  LAST: 2
};

function createSubtitleEvent({ segmentId, offsetMs, text, translatedText, isFinal }) {
  return {
    type: isFinal ? 'final' : 'partial',
    segmentId,
    offsetMs,
    time: formatTime(offsetMs),
    sourceText: text,
    translatedText: translatedText || (isFinal ? '翻译中' : ''),
    status: isFinal ? (translatedText ? '已翻译' : '翻译中') : '识别中'
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

function startsWithSentencePunctuation(text) {
  return /^[\s.!?\u3002\uff01\uff1f]/.test(text);
}

function removeDuplicateSentencePunctuation(leftText, rightText) {
  if (!endsWithSentencePunctuation(leftText) || !startsWithSentencePunctuation(rightText)) {
    return rightText;
  }

  return rightText.replace(/^[\s.!?\u3002\uff01\uff1f]+/, '');
}

function splitLeadingPunctuation(text) {
  const match = text.match(/^([\s.,!?;:\u3002\uff0c\uff01\uff1f\uff1b\uff1a\u3001]+)(.*)$/);

  if (!match) {
    return {
      leadingPunctuation: '',
      remainingText: text
    };
  }

  return {
    leadingPunctuation: match[1],
    remainingText: match[2]
  };
}

export function createXunfeiIatTranslationSession({ onSubtitleEvent, onError }) {
  const config = getXunfeiIatConfig();
  const translationConfig = getTranslationProviderConfig();
  let iatSocket = null;
  let startedAt = 0;
  let hasSentFirstFrame = false;
  let isSessionActive = false;
  let pendingAudioChunks = [];
  let segmentIndex = 0;
  let activeSegmentId = '';
  let recognizedPieces = new Map();
  let segmentMetas = new Map();
  let translatedSegments = new Map();
  let pendingTranslations = new Map();
  let scheduledTranslations = new Map();
  let translationVersions = new Map();
  let emittedSegmentTexts = new Map();
  let lastNonReplacementResultAt = 0;

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
      return {
        didReplace: false,
        replacementSegmentId: null,
        startSerialNumber: null
      };
    }

    const [startSerialNumber, endSerialNumber] = result.rg;
    let didReplace = false;
    let replacementSegmentId = null;
    Array.from(recognizedPieces.keys()).forEach((serialNumber) => {
      if (serialNumber >= startSerialNumber && serialNumber <= endSerialNumber) {
        replacementSegmentId = replacementSegmentId ?? recognizedPieces.get(serialNumber)?.segmentId;
        recognizedPieces.delete(serialNumber);
        didReplace = true;
      }
    });

    return {
      didReplace,
      replacementSegmentId,
      startSerialNumber
    };
  }

  function getOrderedPieces() {
    return Array.from(recognizedPieces.entries())
      .sort(([leftSerialNumber], [rightSerialNumber]) => leftSerialNumber - rightSerialNumber);
  }

  function getSegmentText(segmentId) {
    return getOrderedPieces()
      .filter(([, piece]) => piece.segmentId === segmentId)
      .map(([, piece]) => piece.text)
      .join('');
  }

  function getVisibleSegmentIds() {
    const seenSegmentIds = new Set();

    return getOrderedPieces()
      .map(([, piece]) => piece.segmentId)
      .filter((segmentId) => {
        if (!segmentId || seenSegmentIds.has(segmentId) || !getSegmentText(segmentId)) {
          return false;
        }

        seenSegmentIds.add(segmentId);
        return true;
      });
  }

  function getLastRecognizedPieceEntry() {
    return getOrderedPieces().at(-1) ?? null;
  }

  function hasRecognitionPause(now) {
    return (
      lastNonReplacementResultAt > 0 &&
      now - lastNonReplacementResultAt >= config.segmentSilenceMs
    );
  }

  function createSegment(now) {
    segmentIndex += 1;
    activeSegmentId = `xfyun-${segmentIndex}`;
    segmentMetas.set(activeSegmentId, {
      offsetMs: now - startedAt
    });

    return activeSegmentId;
  }

  function appendToPreviousPiece(text) {
    const lastPieceEntry = getLastRecognizedPieceEntry();
    if (!lastPieceEntry) {
      return false;
    }

    const [serialNumber, piece] = lastPieceEntry;
    const textToAppend =
      endsWithSentencePunctuation(piece.text) && startsWithSentencePunctuation(text)
        ? text.replace(/^[\s.!?\u3002\uff01\uff1f]+/, '')
        : text;

    if (!textToAppend) {
      return true;
    }

    recognizedPieces.set(serialNumber, {
      ...piece,
      text: `${piece.text}${textToAppend}`
    });

    return true;
  }

  function upsertRecognizedPiece({ serialNumber, segmentId, text, shouldMergePunctuation = true }) {
    if (shouldMergePunctuation && isPunctuationOnly(text) && recognizedPieces.has(serialNumber - 1)) {
      const previousPiece = recognizedPieces.get(serialNumber - 1);
      recognizedPieces.set(serialNumber - 1, {
        ...previousPiece,
        text: `${previousPiece.text}${text}`
      });
      return;
    }

    recognizedPieces.set(serialNumber, {
      segmentId,
      text
    });
  }

  function emitSubtitleSegments(now) {
    const displaySegments = getVisibleSegmentIds().map((segmentId) => ({
      segmentId,
      text: getSegmentText(segmentId)
    }));

    displaySegments.forEach((segment, index) => {
      const { leadingPunctuation, remainingText } = splitLeadingPunctuation(segment.text);

      if (!leadingPunctuation) {
        return;
      }

      segment.text = remainingText;

      if (index === 0) {
        return;
      }

      const previousSegment = displaySegments[index - 1];
      previousSegment.text = `${previousSegment.text}${removeDuplicateSentencePunctuation(
        previousSegment.text,
        leadingPunctuation
      )}`;
    });

    displaySegments
      .filter((segment) => segment.text)
      .forEach(({ segmentId, text }) => {
      const segmentMeta = segmentMetas.get(segmentId);
      const translatedSegment = translatedSegments.get(segmentId);
      const translatedText =
        translatedSegment?.sourceText === text ? translatedSegment.translatedText : '';
      const isFinal = segmentId !== activeSegmentId || endsWithSentencePunctuation(text);
      emittedSegmentTexts.set(segmentId, text);

      onSubtitleEvent(
        createSubtitleEvent({
          segmentId,
          offsetMs: segmentMeta?.offsetMs ?? now - startedAt,
          text,
          translatedText,
          isFinal
        })
      );

      scheduleSegmentTranslation({
        segmentId,
        sourceText: text,
        offsetMs: segmentMeta?.offsetMs ?? now - startedAt,
        immediate: isFinal
      });
    });
  }

  function clearScheduledTranslation(segmentId) {
    const scheduledTranslation = scheduledTranslations.get(segmentId);
    if (!scheduledTranslation) {
      return;
    }

    clearTimeout(scheduledTranslation.timerId);
    scheduledTranslations.delete(segmentId);
  }

  function scheduleSegmentTranslation({ segmentId, sourceText, offsetMs, immediate }) {
    if (!sourceText?.trim()) {
      return;
    }

    const currentTranslation = translatedSegments.get(segmentId);
    if (currentTranslation?.sourceText === sourceText) {
      return;
    }

    const scheduledTranslation = scheduledTranslations.get(segmentId);
    if (scheduledTranslation?.sourceText === sourceText && !immediate) {
      return;
    }

    clearScheduledTranslation(segmentId);
    const nextVersion = (translationVersions.get(segmentId) || 0) + 1;
    translationVersions.set(segmentId, nextVersion);

    if (immediate) {
      translateSegment({
        segmentId,
        sourceText,
        offsetMs,
        version: nextVersion
      });
      return;
    }

    const timerId = setTimeout(() => {
      scheduledTranslations.delete(segmentId);
      translateSegment({
        segmentId,
        sourceText,
        offsetMs,
        version: nextVersion
      });
    }, translationConfig.debounceMs);

    scheduledTranslations.set(segmentId, {
      sourceText,
      timerId
    });
  }

  async function translateSegment({ segmentId, sourceText, offsetMs, version }) {
    const currentTranslation = translatedSegments.get(segmentId);
    if (currentTranslation?.sourceText === sourceText) {
      return;
    }

    if (pendingTranslations.get(segmentId) === sourceText) {
      return;
    }

    pendingTranslations.set(segmentId, sourceText);

    try {
      const translatedText = await translateText({
        text: sourceText
      });

      if (
        translationVersions.get(segmentId) !== version ||
        emittedSegmentTexts.get(segmentId) !== sourceText
      ) {
        return;
      }

      translatedSegments.set(segmentId, {
        sourceText,
        translatedText
      });

      onSubtitleEvent(
        createSubtitleEvent({
          segmentId,
          offsetMs,
          text: sourceText,
          translatedText,
          isFinal: true
        })
      );
    } catch (error) {
      onError?.(error);
    } finally {
      if (pendingTranslations.get(segmentId) === sourceText) {
        pendingTranslations.delete(segmentId);
      }
    }
  }

  function resetActiveRecognitionState() {
    activeSegmentId = '';
    recognizedPieces = new Map();
    segmentMetas = new Map();
    lastNonReplacementResultAt = 0;
  }

  function resetRecognitionState() {
    resetActiveRecognitionState();
    scheduledTranslations.forEach(({ timerId }) => clearTimeout(timerId));
    translatedSegments = new Map();
    pendingTranslations = new Map();
    scheduledTranslations = new Map();
    translationVersions = new Map();
    emittedSegmentTexts = new Map();
  }

  function handleIatMessage(message) {
    const payload = JSON.parse(message.toString());

    if (payload.code !== 0) {
      onError?.(new Error(payload.message || 'Xunfei IAT recognition failed'));
      return;
    }

    let text = extractIatText(payload.data?.result);
    if (!text) {
      if (payload.data?.status === 2) {
        resetCurrentIatSocket();
      }

      return;
    }

    const now = Date.now();
    const result = payload.data?.result;
    const isReplacementResult = payload.data?.result?.pgs === 'rpl';

    if (isReplacementResult) {
      const replacement = removeReplacedPieces(result);
      if (!replacement.didReplace || !replacement.replacementSegmentId) {
        return;
      }

      upsertRecognizedPiece({
        serialNumber: getResultSerialNumber(result),
        segmentId: replacement.replacementSegmentId,
        text,
        shouldMergePunctuation: false
      });
      emitSubtitleSegments(now);
    } else {
      const activeSegmentText = activeSegmentId ? getSegmentText(activeSegmentId) : '';
      const shouldCreateSegment =
        !activeSegmentId ||
        (
          activeSegmentText &&
          !isPunctuationOnly(text) &&
          (endsWithSentencePunctuation(activeSegmentText) || hasRecognitionPause(now))
        );

      if (shouldCreateSegment) {
        const { leadingPunctuation, remainingText } = splitLeadingPunctuation(text);
        if (leadingPunctuation && !remainingText) {
          appendToPreviousPiece(leadingPunctuation);
          emitSubtitleSegments(now);
          return;
        }

        createSegment(now);
      }

      const serialNumber = getResultSerialNumber(result);
      const segmentId = activeSegmentId || createSegment(now);
      upsertRecognizedPiece({
        serialNumber,
        segmentId,
        text
      });

      if (!isPunctuationOnly(text)) {
        lastNonReplacementResultAt = now;
      }

      emitSubtitleSegments(now);
    }

    if (payload.data?.status === 2) {
      resetActiveRecognitionState();
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
    resetRecognitionState();
  }

  function receiveAudioChunk(audioChunk) {
    sendAudioFrame(Buffer.from(audioChunk));
  }

  function stop() {
    isSessionActive = false;
    pendingAudioChunks = [];
    resetRecognitionState();

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
