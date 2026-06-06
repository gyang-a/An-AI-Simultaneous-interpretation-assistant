import { getAccessToken } from './authStorage';

const TRANSLATION_HISTORY_API_BASE = '/api/translation-history';

async function parseJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function requestTranslationHistoryApi(path = '', { method = 'GET', body } = {}) {
  const accessToken = getAccessToken();
  const headers = {
    Accept: 'application/json'
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${TRANSLATION_HISTORY_API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(payload?.error || '翻译记录请求失败');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchTranslationHistory() {
  const payload = await requestTranslationHistoryApi();
  return payload.historyItems || [];
}

export async function saveTranslationHistoryRecord(record) {
  if (!record) {
    return null;
  }

  const payload = await requestTranslationHistoryApi('', {
    method: 'POST',
    body: {
      sessionId: record.id,
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      items: record.items
    }
  });

  return payload.historyItem;
}

export async function clearTranslationHistoryRecords() {
  return requestTranslationHistoryApi('', {
    method: 'DELETE'
  });
}
