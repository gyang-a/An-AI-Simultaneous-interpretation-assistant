import {
  clearTranslationHistoryByUserId,
  listTranslationHistoryByUserId,
  upsertTranslationHistoryRecord
} from '../repositories/translationHistoryRepository.js';

function createHistoryError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeHistoryItems(items) {
  return items
    .filter((item) => item?.source || item?.translation)
    .map((item) => ({
      id: item.id,
      eventId: item.eventId,
      time: item.time,
      source: item.source || '',
      translation: item.translation || '',
      offsetMs: item.offsetMs,
      status: item.status,
      type: item.type,
      revisionOf: item.revisionOf,
      revisionReason: item.revisionReason
    }));
}

function assertHistoryPayload(payload) {
  if (!payload?.sessionId || !payload?.startedAt || !payload?.endedAt) {
    throw createHistoryError('History record missing required fields', 400);
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw createHistoryError('History record must include subtitle items', 400);
  }
}

export async function listUserTranslationHistory(userId) {
  return listTranslationHistoryByUserId(userId);
}

export async function saveUserTranslationHistory(userId, payload) {
  assertHistoryPayload(payload);

  const items = sanitizeHistoryItems(payload.items);
  if (!items.length) {
    throw createHistoryError('History record must include subtitle items', 400);
  }

  // 保存前统一清洗字段，避免前端把额外 UI 状态写入数据库。
  return upsertTranslationHistoryRecord({
    userId,
    sessionId: payload.sessionId,
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    items
  });
}

export async function clearUserTranslationHistory(userId) {
  await clearTranslationHistoryByUserId(userId);
  return { success: true };
}
