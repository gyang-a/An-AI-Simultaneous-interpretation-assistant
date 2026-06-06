import { verifyAccessToken } from '../services/tokenService.js';

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [, accessToken] = authorization.match(/^Bearer\s+(.+)$/i) || [];

  if (!accessToken) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  try {
    const payload = verifyAccessToken(accessToken);
    req.user = {
      id: payload.sub,
      account: payload.account,
      name: payload.name
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
