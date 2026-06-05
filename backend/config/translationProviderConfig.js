const DEFAULT_XUNFEI_TRANSLATION_URL = 'https://ntrans.xfyun.cn/v2/ots';

export function getTranslationProviderConfig() {
  return {
    appId: process.env.XUNFEI_TRANSLATION_APP_ID || process.env.XUNFEI_APP_ID || '',
    apiKey: process.env.XUNFEI_TRANSLATION_API_KEY || process.env.XUNFEI_API_KEY || '',
    apiSecret: process.env.XUNFEI_TRANSLATION_API_SECRET || process.env.XUNFEI_API_SECRET || '',
    url: process.env.XUNFEI_TRANSLATION_URL || DEFAULT_XUNFEI_TRANSLATION_URL,
    from: process.env.XUNFEI_TRANSLATION_FROM || 'en',
    to: process.env.XUNFEI_TRANSLATION_TO || 'cn',
    debounceMs: Number(process.env.TRANSLATION_DEBOUNCE_MS || 100),
    timeoutMs: Number(process.env.TRANSLATION_TIMEOUT_MS || 15000)
  };
}
