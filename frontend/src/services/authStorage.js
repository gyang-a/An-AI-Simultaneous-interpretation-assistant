const AUTH_SESSION_STORAGE_KEY = 'ai-assistant.auth-session';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const sessionJson = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return sessionJson ? JSON.parse(sessionJson) : null;
  } catch (error) {
    // 本地登录态只是前端缓存，读取失败时直接回到未登录状态。
    return null;
  }
}

export function saveAuthSession(session) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function getAccessToken() {
  return readAuthSession()?.tokens?.accessToken || '';
}

export function getRefreshToken() {
  return readAuthSession()?.tokens?.refreshToken || '';
}
