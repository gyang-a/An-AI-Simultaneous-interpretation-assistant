import { refreshAuthSession } from './authApi';
import { getAccessToken } from './authStorage';

const USER_PROFILE_API_BASE = '/api/users/me';

async function parseJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function requestUserProfileApi(path = '', { method = 'GET', body } = {}) {
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

  const response = await fetch(`${USER_PROFILE_API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(payload?.error || '用户资料请求失败');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function requestUserProfileApiWithRefresh(path, options) {
  try {
    return await requestUserProfileApi(path, options);
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    // AT 过期时复用已有刷新流程，RT 仍只通过 HttpOnly Cookie 自动携带。
    await refreshAuthSession();
    return requestUserProfileApi(path, options);
  }
}

export async function uploadCurrentUserAvatar(avatarDataUrl) {
  const payload = await requestUserProfileApiWithRefresh('/avatar', {
    method: 'PATCH',
    body: { avatarDataUrl }
  });

  return payload.user;
}
