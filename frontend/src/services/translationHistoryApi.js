import { refreshAuthSession } from './authApi';
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

async function requestTranslationHistoryApiWithRefresh(path, options) {
  try {
    return await requestTranslationHistoryApi(path, options);
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    // AT 失效时用 HttpOnly Cookie 中的 RT 换新 AT，再重试一次记录请求。
    await refreshAuthSession();
    return requestTranslationHistoryApi(path, options);
  }
}

export async function fetchTranslationHistory() {
  const payload = await requestTranslationHistoryApiWithRefresh();
  return payload.historyItems || [];
}

export async function saveTranslationHistoryRecord(record) {
  if (!record) {
    return null;
  }

  const payload = await requestTranslationHistoryApiWithRefresh('', {
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
  return requestTranslationHistoryApiWithRefresh('', {
    method: 'DELETE'
  });
}
