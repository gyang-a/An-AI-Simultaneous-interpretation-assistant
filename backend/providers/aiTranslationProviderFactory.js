import { getAiProviderConfig } from '../config/aiProviderConfig.js';
import { createMockAiTranslationSession } from './mockAiTranslationProvider.js';

const AI_PROVIDERS = {
  MOCK: 'mock'
};

export function createAiTranslationSession(options) {
  const { provider } = getAiProviderConfig();

  if (provider === AI_PROVIDERS.MOCK) {
    return createMockAiTranslationSession(options);
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

export { AI_PROVIDERS };
