import { Router } from 'express';
import { getAuthConfig } from '../config/authConfig.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser
} from '../services/authService.js';

const router = Router();

function getRefreshTokenCookieOptions() {
  const config = getAuthConfig();

  return {
    httpOnly: true,
    secure: config.refreshTokenCookieSecure,
    sameSite: config.refreshTokenCookieSameSite,
    path: config.refreshTokenCookiePath,
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  };
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const targetCookie = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));

  return targetCookie ? decodeURIComponent(targetCookie.split('=').slice(1).join('=')) : '';
}

function readRefreshTokenCookie(req) {
  return readCookie(req, getAuthConfig().refreshTokenCookieName);
}

function setRefreshTokenCookie(res, payload) {
  if (!payload.refreshToken) {
    return;
  }

  // RT 只写入 HttpOnly Cookie，避免前端 JS 读取后被 XSS 窃取。
  res.cookie(
    getAuthConfig().refreshTokenCookieName,
    payload.refreshToken,
    getRefreshTokenCookieOptions()
  );
}

function clearRefreshTokenCookie(res) {
  const config = getAuthConfig();

  res.clearCookie(config.refreshTokenCookieName, {
    path: config.refreshTokenCookiePath,
    secure: config.refreshTokenCookieSecure,
    sameSite: config.refreshTokenCookieSameSite
  });
}

function sendAuthResponse(res, payload) {
  setRefreshTokenCookie(res, payload);

  res.json({
    user: payload.user,
    tokens: {
      accessToken: payload.accessToken,
      refreshTokenExpiresAt: payload.refreshTokenExpiresAt
    }
  });
}

function handleAuthError(error, res) {
  if (error.code === 'MONGODB_NOT_CONFIGURED') {
    res.status(503).json({
      error: 'MongoDB is not configured'
    });
    return;
  }

  if (error.code === 11000) {
    res.status(409).json({
      error: 'Account already exists'
    });
    return;
  }

  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Authentication request failed'
  });
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleAuthError(error, res);
    }
  };
}

router.post('/auth/register', asyncRoute(async (req, res) => {
  const payload = await registerUser(req.body);
  res.status(201);
  sendAuthResponse(res, payload);
}));

router.post('/auth/login', asyncRoute(async (req, res) => {
  const payload = await loginUser(req.body);
  sendAuthResponse(res, payload);
}));

router.post('/auth/refresh', asyncRoute(async (req, res) => {
  const payload = await refreshUserToken(readRefreshTokenCookie(req));
  sendAuthResponse(res, payload);
}));

router.post('/auth/logout', asyncRoute(async (req, res) => {
  const payload = await logoutUser(readRefreshTokenCookie(req));
  clearRefreshTokenCookie(res);
  res.json(payload);
}));

router.get('/auth/me', requireAuth, asyncRoute(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  res.json({ user });
}));

export default router;
