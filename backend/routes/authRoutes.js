import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser
} from '../services/authService.js';

const router = Router();

function sendAuthResponse(res, payload) {
  res.json({
    user: payload.user,
    tokens: {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
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
  const payload = await refreshUserToken(req.body.refreshToken);
  sendAuthResponse(res, payload);
}));

router.post('/auth/logout', asyncRoute(async (req, res) => {
  const payload = await logoutUser(req.body.refreshToken);
  res.json(payload);
}));

router.get('/auth/me', requireAuth, asyncRoute(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  res.json({ user });
}));

export default router;
