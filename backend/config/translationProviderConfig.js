const DEFAULT_TRANSLATION_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TRANSLATION_MODEL = 'gpt-4o-mini';

export function getTranslationProviderConfig() {
  return {
    apiUrl: process.env.TRANSLATION_API_URL || DEFAULT_TRANSLATION_API_URL,
    apiKey: process.env.TRANSLATION_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.TRANSLATION_MODEL || DEFAULT_TRANSLATION_MODEL,
    targetLanguage: process.env.TRANSLATION_TARGET_LANGUAGE || 'zh-CN',
    contextSegments: Number(process.env.TRANSLATION_CONTEXT_SEGMENTS || 6),
    timeoutMs: Number(process.env.TRANSLATION_TIMEOUT_MS || 15000)
  };
}
