export const SUBTITLE_EVENT_TYPES = {
  PARTIAL: 'partial',
  FINAL: 'final',
  REVISION: 'revision'
};

export const mockSubtitleEvents = [
  {
    type: SUBTITLE_EVENT_TYPES.PARTIAL,
    segmentId: 'seg-001',
    offsetMs: 600,
    time: '00:00:01',
    sourceText: 'The rapid advancement of AI is transforming',
    translatedText: '人工智能的快速发展正在改变',
    status: '翻译中'
  },
  {
    type: SUBTITLE_EVENT_TYPES.FINAL,
    segmentId: 'seg-001',
    offsetMs: 1600,
    time: '00:00:02',
    sourceText: 'The rapid advancement of AI is transforming the way we work and live.',
    translatedText: '人工智能的快速发展正在改变我们的工作和生活方式。',
    status: '已确认'
  },
  {
    type: SUBTITLE_EVENT_TYPES.PARTIAL,
    segmentId: 'seg-002',
    offsetMs: 2600,
    time: '00:00:04',
    sourceText: 'It can improve productivity and automate routine tasks,',
    translatedText: '它可以提高产量，并自动完成日常任务，',
    status: '翻译中'
  },
  {
    type: SUBTITLE_EVENT_TYPES.FINAL,
    segmentId: 'seg-002',
    offsetMs: 3800,
    time: '00:00:05',
    sourceText: 'It can improve productivity and automate routine tasks,',
    translatedText: '它可以提高产量，并自动完成日常任务，',
    status: '已确认'
  },
  {
    type: SUBTITLE_EVENT_TYPES.PARTIAL,
    segmentId: 'seg-003',
    offsetMs: 5000,
    time: '00:00:07',
    sourceText: 'and create new opportunities across various industries.',
    translatedText: '并在多个行业创造新的机会。',
    status: '翻译中'
  },
  {
    type: SUBTITLE_EVENT_TYPES.REVISION,
    segmentId: 'seg-002',
    offsetMs: 6200,
    time: '00:00:05',
    sourceText: 'It can improve productivity and automate routine tasks,',
    translatedText: '它可以提高生产力，并自动化常规任务，',
    status: '已修正',
    revisionReason: '结合后文技术语境，将“提高产量”修正为“提高生产力”，并将“自动完成日常任务”调整为“自动化常规任务”。'
  },
  {
    type: SUBTITLE_EVENT_TYPES.FINAL,
    segmentId: 'seg-003',
    offsetMs: 7600,
    time: '00:00:08',
    sourceText: 'and create new opportunities across various industries.',
    translatedText: '并在各个行业创造新的机会。',
    status: '已确认'
  }
];

export const mockRealtimeStatusSamples = [
  { offsetMs: 0, latencyMs: 0, accuracy: 0 },
  { offsetMs: 600, latencyMs: 1320, accuracy: 94.2 },
  { offsetMs: 1600, latencyMs: 1180, accuracy: 95.6 },
  { offsetMs: 2600, latencyMs: 1060, accuracy: 96.1 },
  { offsetMs: 3800, latencyMs: 970, accuracy: 96.8 },
  { offsetMs: 5000, latencyMs: 1030, accuracy: 96.4 },
  { offsetMs: 6200, latencyMs: 920, accuracy: 97.2 },
  { offsetMs: 7600, latencyMs: 880, accuracy: 97.4 }
];

export function getMockSubtitleEvents() {
  return mockSubtitleEvents.map((event) => ({ ...event }));
}

export function getMockRealtimeStatus(offsetMs) {
  const safeOffsetMs = Math.max(0, offsetMs);
  const currentSample = [...mockRealtimeStatusSamples]
    .reverse()
    .find((sample) => sample.offsetMs <= safeOffsetMs);

  return {
    ...(currentSample ?? mockRealtimeStatusSamples[0]),
    translatedDurationMs: safeOffsetMs
  };
}
