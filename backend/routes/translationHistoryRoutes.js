import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  deleteUserTranslationHistory,
  listUserTranslationHistory,
  saveUserTranslationHistory
} from '../services/translationHistoryService.js';

const router = Router();

function handleHistoryError(error, res) {
  if (error.code === 'MONGODB_NOT_CONFIGURED') {
    res.status(503).json({ error: 'MongoDB is not configured' });
    return;
  }

  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Translation history request failed'
  });
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleHistoryError(error, res);
    }
  };
}

router.get('/translation-history', requireAuth, asyncRoute(async (req, res) => {
  const historyItems = await listUserTranslationHistory(req.user.id);
  res.json({ historyItems });
}));

router.post('/translation-history', requireAuth, asyncRoute(async (req, res) => {
  const historyItem = await saveUserTranslationHistory(req.user.id, req.body);
  res.status(201).json({ historyItem });
}));

router.delete('/translation-history/:sessionId', requireAuth, asyncRoute(async (req, res) => {
  const payload = await deleteUserTranslationHistory(req.user.id, req.params.sessionId);
  res.json(payload);
}));

export default router;
