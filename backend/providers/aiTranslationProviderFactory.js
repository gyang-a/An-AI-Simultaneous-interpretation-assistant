import { getAiProviderConfig } from '../config/aiProviderConfig.js';
import { createMockAiTranslationSession } from './mockAiTranslationProvider.js';
import { createXunfeiIatTranslationSession } from './xunfeiIatTranslationProvider.js';

const AI_PROVIDERS = {
  MOCK: 'mock',
  XUNFEI: 'xunfei'
};

export function createAiTranslationSession(options) {
  const { provider } = getAiProviderConfig();

  if (provider === AI_PROVIDERS.MOCK) {
    return createMockAiTranslationSession(options);
  }

  if (provider === AI_PROVIDERS.XUNFEI) {
    return createXunfeiIatTranslationSession(options);
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

export { AI_PROVIDERS };
