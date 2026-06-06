import {
  findUserById,
  updateUserAvatar
} from '../repositories/userRepository.js';

const MAX_AVATAR_DATA_URL_LENGTH = 240 * 1024;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function createProfileError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    account: user.account,
    avatarDataUrl: user.avatarDataUrl || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function assertAvatarDataUrl(avatarDataUrl) {
  if (!String(avatarDataUrl || '').trim()) {
    throw createProfileError('Avatar image is required', 400);
  }

  if (avatarDataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw createProfileError('Avatar image is too large', 413);
  }

  // 头像由前端压缩成 Data URL，后端只接受常见图片格式，避免写入任意文本。
  if (!AVATAR_DATA_URL_PATTERN.test(avatarDataUrl)) {
    throw createProfileError('Avatar image format is invalid', 400);
  }
}

export async function updateCurrentUserAvatar(userId, avatarDataUrl) {
  assertAvatarDataUrl(avatarDataUrl);

  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw createProfileError('User not found', 404);
  }

  const user = await updateUserAvatar(userId, avatarDataUrl);
  return sanitizeUser(user);
}
