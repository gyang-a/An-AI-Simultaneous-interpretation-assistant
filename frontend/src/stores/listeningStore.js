import { create } from 'zustand';

function createSubtitleItem(event) {
  return {
    id: event.segmentId,
    time: event.time,
    source: event.sourceText,
    translation: event.translatedText,
    status: event.status,
    type: event.type,
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
  setPlaybackOffsetMs: (playbackOffsetMs) => set({ playbackOffsetMs }),
  applySubtitleEvent: (event) =>
    set((state) => {
      const nextItem = createSubtitleItem(event);
      const itemIndex = state.subtitleItems.findIndex((item) => item.id === event.segmentId);
      const subtitleItems =
        itemIndex === -1
          ? [...state.subtitleItems, nextItem]
          : state.subtitleItems.map((item, index) => (index === itemIndex ? nextItem : item));

      return {
        subtitleItems,
        playbackOffsetMs: Number.isFinite(event.offsetMs)
          ? event.offsetMs
          : state.playbackOffsetMs
      };
    })
}));
