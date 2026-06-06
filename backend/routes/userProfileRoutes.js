import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { updateCurrentUserAvatar } from '../services/userProfileService.js';

const router = Router();

function handleProfileError(error, res) {
  if (error.code === 'MONGODB_NOT_CONFIGURED') {
    res.status(503).json({
      error: 'MongoDB is not configured'
    });
    return;
  }

  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'User profile request failed'
  });
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleProfileError(error, res);
    }
  };
}

router.patch('/users/me/avatar', requireAuth, asyncRoute(async (req, res) => {
  const user = await updateCurrentUserAvatar(req.user.id, req.body.avatarDataUrl);
  res.json({ user });
}));

export default router;
