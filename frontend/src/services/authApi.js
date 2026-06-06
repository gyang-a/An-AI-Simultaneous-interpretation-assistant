import {
  getAccessToken,
  saveAuthSession
} from './authStorage';

const AUTH_API_BASE = '/api/auth';

async function parseJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function requestAuthApi(path, { method = 'GET', body, accessToken } = {}) {
  const headers = {
    Accept: 'application/json'
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(payload?.error || '认证请求失败');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function persistAuthPayload(payload) {
  if (payload?.tokens?.accessToken) {
    // 前端只持久化 AT；RT 通过 HttpOnly Cookie 自动随请求发送。
    saveAuthSession(payload);
  }

  return payload;
}

export async function registerAuthUser({ name, account, password }) {
  const payload = await requestAuthApi('/register', {
    method: 'POST',
    body: { name, account, password }
  });

  return persistAuthPayload(payload);
}

export async function loginAuthUser({ account, password }) {
  const payload = await requestAuthApi('/login', {
    method: 'POST',
    body: { account, password }
  });

  return persistAuthPayload(payload);
}

export async function refreshAuthSession() {
  const payload = await requestAuthApi('/refresh', {
    method: 'POST'
  });

  return persistAuthPayload(payload);
}

export async function logoutAuthUser() {
  return requestAuthApi('/logout', {
    method: 'POST'
  });
}

export async function getCurrentAuthUser(accessToken = getAccessToken()) {
  return requestAuthApi('/me', {
    accessToken
  });
}
