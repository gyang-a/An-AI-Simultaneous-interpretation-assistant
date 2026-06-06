const AUTH_SESSION_STORAGE_KEY = 'ai-assistant.auth-session';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function normalizeAuthSession(session) {
  if (!session) {
    return null;
  }

  return {
    user: session.user || null,
    tokens: {
      accessToken: session.tokens?.accessToken || '',
      refreshTokenExpiresAt: session.tokens?.refreshTokenExpiresAt || ''
    }
  };
}

export function readAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const sessionJson = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    return normalizeAuthSession(sessionJson ? JSON.parse(sessionJson) : null);
  } catch (error) {
    // 本地登录态只是前端缓存，读取失败时直接回到未登录状态。
    return null;
  }
}

export function saveAuthSession(session) {
  if (!canUseStorage()) {
    return;
  }

  // 这里只保存 AT 和用户信息；RT 由后端写入 HttpOnly Cookie。
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(normalizeAuthSession(session))
  );
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
