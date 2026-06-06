import bcrypt from 'bcryptjs';
import { getAuthConfig } from '../config/authConfig.js';
import {
  createRefreshTokenRecord,
  findRefreshTokenByHash,
  isRefreshTokenRecordActive,
  markRefreshTokenReuse,
  revokeActiveRefreshTokensByUserId,
  revokeRefreshToken
} from '../repositories/refreshTokenRepository.js';
import {
  createUser,
  findUserByAccount,
  findUserById
} from '../repositories/userRepository.js';
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken
} from './tokenService.js';

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    account: user.account,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function assertAuthPayload({ account, password }) {
  if (!String(account || '').trim() || !String(password || '').trim()) {
    throw createAuthError('Account and password are required', 400);
  }
}

async function issueTokenPair(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();

  await createRefreshTokenRecord({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken.token),
    expiresAt: refreshToken.expiresAt
  });

  return {
    accessToken,
    refreshToken: refreshToken.token,
    refreshTokenExpiresAt: refreshToken.expiresAt
  };
}

export async function registerUser({ name, account, password }) {
  assertAuthPayload({ account, password });

  const existingUser = await findUserByAccount(account);
  if (existingUser) {
    throw createAuthError('Account already exists', 409);
  }

  const config = getAuthConfig();
  const passwordHash = await bcrypt.hash(password, config.passwordSaltRounds);
  const user = await createUser({
    name,
    account,
    passwordHash
  });
  const tokens = await issueTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function loginUser({ account, password }) {
  assertAuthPayload({ account, password });

  const user = await findUserByAccount(account);
  const isPasswordValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !isPasswordValid) {
    throw createAuthError('Invalid account or password', 401);
  }

  const tokens = await issueTokenPair(user);

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function refreshUserToken(refreshToken) {
  if (!refreshToken) {
    throw createAuthError('Refresh token is required', 400);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const tokenRecord = await findRefreshTokenByHash(tokenHash);

  if (!tokenRecord) {
    throw createAuthError('Invalid refresh token', 401);
  }

  if (!isRefreshTokenRecordActive(tokenRecord)) {
    // 旧 RT 再次出现时说明 Cookie 可能被盗用，标记复用并撤销该用户剩余白名单 RT。
    await markRefreshTokenReuse(tokenHash);
    await revokeActiveRefreshTokensByUserId(tokenRecord.userId);
    throw createAuthError('Refresh token reuse detected', 401);
  }

  const user = await findUserById(tokenRecord.userId);
  if (!user) {
    throw createAuthError('User not found', 401);
  }

  const tokens = await issueTokenPair(user);
  await revokeRefreshToken(tokenHash, {
    replacedByTokenHash: hashRefreshToken(tokens.refreshToken)
  });

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function logoutUser(refreshToken) {
  if (refreshToken) {
    await revokeRefreshToken(hashRefreshToken(refreshToken));
  }

  return { success: true };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw createAuthError('User not found', 404);
  }

  return sanitizeUser(user);
}
