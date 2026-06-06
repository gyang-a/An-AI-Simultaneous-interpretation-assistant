const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30;
const DEFAULT_PASSWORD_SALT_ROUNDS = 12;

export function getAuthConfig() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev-access-token-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-token-secret',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || DEFAULT_ACCESS_TOKEN_TTL,
    refreshTokenTtlDays: Number(
      process.env.REFRESH_TOKEN_TTL_DAYS || DEFAULT_REFRESH_TOKEN_TTL_DAYS
    ),
    passwordSaltRounds: Number(
      process.env.PASSWORD_SALT_ROUNDS || DEFAULT_PASSWORD_SALT_ROUNDS
    ),
    refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'ai_interpreter_rt',
    refreshTokenCookieSecure:
      process.env.REFRESH_TOKEN_COOKIE_SECURE === 'true' || isProduction,
    refreshTokenCookieSameSite: process.env.REFRESH_TOKEN_COOKIE_SAME_SITE || 'lax',
    refreshTokenCookiePath: process.env.REFRESH_TOKEN_COOKIE_PATH || '/api/auth'
  };
}
