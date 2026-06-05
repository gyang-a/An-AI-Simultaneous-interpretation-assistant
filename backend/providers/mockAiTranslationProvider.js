import { getMockSubtitleEvents } from '../mocks/subtitleEvents.js';
import { normalizeSubtitleEvent } from '../contracts/subtitleEventContract.js';

export function createMockAiTranslationSession({ onSubtitleEvent, onError }) {
  const timers = [];
  const audioSession = {
    chunkCount: 0,
    mimeType: '',
    startedAt: null
  };

  function start(metadata = {}) {
    stop();
    audioSession.mimeType = metadata.mimeType ?? '';
    audioSession.startedAt = Date.now();

    getMockSubtitleEvents().forEach((event) => {
      const timerId = setTimeout(() => {
        try {
          onSubtitleEvent(normalizeSubtitleEvent(event));
        } catch (error) {
          onError?.(error);
        }
      }, event.offsetMs);

      timers.push(timerId);
    });
  }

  function receiveAudioChunk() {
    audioSession.chunkCount += 1;
  }

  function stop() {
    timers.forEach((timerId) => clearTimeout(timerId));
    timers.length = 0;
    audioSession.mimeType = '';
  }

  function getSessionStats() {
    return {
      ...audioSession
    };
  }

  return {
    start,
    receiveAudioChunk,
    stop,
    getSessionStats
  };
}
