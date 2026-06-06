import { create } from 'zustand';

const MAX_TRANSLATION_HISTORY = 20;

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export const useListeningStore = create((set, get) => ({
  isListening: false,
  subtitleItems: [],
  translationHistory: [],
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
  setTranslationHistory: (translationHistory) =>
    set({
      translationHistory: Array.isArray(translationHistory)
        ? translationHistory.slice(0, MAX_TRANSLATION_HISTORY)
        : []
    }),
  clearTranslationHistory: () => set({ translationHistory: [] }),
  archiveCurrentSession: () => {
    const state = get();
    const items = state.subtitleItems.filter((item) => item.source || item.translation);

    if (!items.length) {
      return null;
    }

    const historyItem = {
      id: state.currentSessionId,
      startedAt: state.currentSessionStartedAt,
      endedAt: new Date().toISOString(),
      items
    };

    set((state) => {
      // 前端只维护内存副本；真正的翻译记录由后端按用户持久化。
      const history = [
        historyItem,
        ...state.translationHistory.filter((item) => item.id !== historyItem.id)
      ].slice(0, MAX_TRANSLATION_HISTORY);

      return {
        translationHistory: history
      };
    });

    return historyItem;
  },
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
