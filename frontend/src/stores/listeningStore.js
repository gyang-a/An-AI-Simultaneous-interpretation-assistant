import { create } from 'zustand';

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
  playbackOffsetMs: 0,
  setIsListening: (isListening) => set({ isListening }),
  resetListeningSession: () =>
    set({
      subtitleItems: [],
      playbackOffsetMs: 0
    }),
  clearSubtitleItems: () => set({ subtitleItems: [] }),
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
