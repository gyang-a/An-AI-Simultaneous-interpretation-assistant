import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getAuthConfig } from '../config/authConfig.js';

function getRefreshTokenExpiresAt() {
  const config = getAuthConfig();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.refreshTokenTtlDays);
  return expiresAt;
}

export function hashRefreshToken(refreshToken) {
  const config = getAuthConfig();
  return crypto
    .createHmac('sha256', config.refreshTokenSecret)
    .update(refreshToken)
    .digest('hex');
}

export function createAccessToken(user) {
  const config = getAuthConfig();

  return jwt.sign(
    {
      sub: user.id,
      account: user.account,
      name: user.name
    },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenTtl
    }
  );
}

export function verifyAccessToken(accessToken) {
  const config = getAuthConfig();
  return jwt.verify(accessToken, config.accessTokenSecret);
}

export function createRefreshToken() {
  return {
    token: crypto.randomBytes(48).toString('base64url'),
    expiresAt: getRefreshTokenExpiresAt()
  };
}
