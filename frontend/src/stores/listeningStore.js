import { create } from 'zustand';

const TRANSLATION_HISTORY_STORAGE_KEY = 'ai-assistant.translation-history';
const MAX_TRANSLATION_HISTORY = 20;

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readTranslationHistory() {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const historyJson = window.localStorage?.getItem(TRANSLATION_HISTORY_STORAGE_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    return Array.isArray(history) ? history : [];
  } catch (error) {
    return [];
  }
}

function persistTranslationHistory(history) {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage?.setItem(
      TRANSLATION_HISTORY_STORAGE_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    // History is a convenience feature; realtime subtitles should continue even if storage is unavailable.
  }
}

function createSubtitleItem(event) {
  const targetSegmentId = event.revisionOf || event.segmentId;

  return {
    id: targetSegmentId,
    eventId: event.segmentId,
    time: event.time,
    source: event.sourceText || '',
    translation: event.translatedText || '',
    offsetMs: event.offsetMs,
    status: event.status,
    type: event.type,
    revisionOf: event.revisionOf,
    revisionReason: event.revisionReason
  };
}

export const useListeningStore = create((set) => ({
  isListening: false,
  subtitleItems: [],
  translationHistory: readTranslationHistory(),
  currentSessionId: createSessionId(),
  currentSessionStartedAt: new Date().toISOString(),
  playbackOffsetMs: 0,
  setIsListening: (isListening) => set({ isListening }),
  resetListeningSession: () =>
    set({
      subtitleItems: [],
      currentSessionId: createSessionId(),
      currentSessionStartedAt: new Date().toISOString(),
      playbackOffsetMs: 0
    }),
  clearSubtitleItems: () => set({ subtitleItems: [] }),
  clearTranslationHistory: () => {
    persistTranslationHistory([]);
    set({ translationHistory: [] });
  },
  archiveCurrentSession: () =>
    set((state) => {
      const items = state.subtitleItems.filter((item) => item.source || item.translation);

      if (!items.length) {
        return state;
      }

      const historyItem = {
        id: state.currentSessionId,
        startedAt: state.currentSessionStartedAt,
        endedAt: new Date().toISOString(),
        items
      };
      const history = [
        historyItem,
        ...state.translationHistory.filter((item) => item.id !== historyItem.id)
      ].slice(0, MAX_TRANSLATION_HISTORY);

      persistTranslationHistory(history);

      return {
        translationHistory: history
      };
    }),
  setPlaybackOffsetMs: (playbackOffsetMs) => set({ playbackOffsetMs }),
  applySubtitleEvent: (event) =>
    set((state) => {
      const nextItem = createSubtitleItem(event);
      const targetSegmentId = event.revisionOf || event.segmentId;
      const itemIndex = state.subtitleItems.findIndex((item) => item.id === targetSegmentId);
      const subtitleItems =
        itemIndex === -1
          ? [...state.subtitleItems, nextItem]
          : state.subtitleItems.map((item, index) => (
              index === itemIndex
                ? {
                    ...item,
                    ...nextItem,
                    source: nextItem.source || item.source,
                    translation: nextItem.translation || item.translation
                  }
                : item
            ));

      return {
        subtitleItems,
        playbackOffsetMs: Number.isFinite(event.offsetMs)
          ? Math.max(state.playbackOffsetMs, event.offsetMs)
          : state.playbackOffsetMs
      };
    })
}));
