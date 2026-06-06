import {
  getAccessToken,
  getRefreshToken,
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
  if (payload?.tokens?.accessToken && payload?.tokens?.refreshToken) {
    // 后端返回的双 Token 统一在这里落本地，页面层只关心登录结果。
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

export async function refreshAuthSession(refreshToken = getRefreshToken()) {
  const payload = await requestAuthApi('/refresh', {
    method: 'POST',
    body: { refreshToken }
  });

  return persistAuthPayload(payload);
}

export async function logoutAuthUser(refreshToken = getRefreshToken()) {
  return requestAuthApi('/logout', {
    method: 'POST',
    body: { refreshToken }
  });
}

export async function getCurrentAuthUser(accessToken = getAccessToken()) {
  return requestAuthApi('/me', {
    accessToken
  });
}
