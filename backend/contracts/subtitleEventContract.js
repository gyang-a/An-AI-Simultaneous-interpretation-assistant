const SUBTITLE_EVENT_TYPES = {
  REVISION: 'revision'
};

const requiredTextFields = [
  'segmentId',
  'offsetMs',
  'time',
  'sourceText',
  'status'
];

function assertRequiredFields(event) {
  requiredTextFields.forEach((field) => {
    if (!(field in event) || event[field] === null || event[field] === undefined || event[field] === '') {
      throw new Error(`Subtitle event missing required field: ${field}`);
    }
  });
}

export function normalizeSubtitleEvent(event) {
  if (!event.type) {
    throw new Error('Subtitle event missing required field: type');
  }

  assertRequiredFields(event);

  if (!('translatedText' in event)) {
    event.translatedText = '';
  }

  if (event.type === SUBTITLE_EVENT_TYPES.REVISION) {
    if (!event.revisionReason) {
      throw new Error('Revision subtitle event missing required field: revisionReason');
    }

    return {
      ...event,
      revisionOf: event.revisionOf || event.segmentId
    };
  }

  return {
    ...event,
    revisionOf: event.revisionOf || null
  };
}
