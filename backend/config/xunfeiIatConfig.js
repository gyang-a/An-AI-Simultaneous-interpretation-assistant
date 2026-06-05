const DEFAULT_XUNFEI_IAT_URL = 'wss://iat-api.xfyun.cn/v2/iat';

export function getXunfeiIatConfig() {
  return {
    appId: process.env.XUNFEI_APP_ID || '',
    apiKey: process.env.XUNFEI_API_KEY || '',
    apiSecret: process.env.XUNFEI_API_SECRET || '',
    url: process.env.XUNFEI_IAT_URL || DEFAULT_XUNFEI_IAT_URL,
    language: process.env.XUNFEI_IAT_LANGUAGE || 'zh_cn',
    accent: process.env.XUNFEI_IAT_ACCENT || 'mandarin',
    domain: process.env.XUNFEI_IAT_DOMAIN || 'iat',
    vadEos: Number(process.env.XUNFEI_IAT_VAD_EOS || 5000),
    enableDynamicCorrection: process.env.XUNFEI_IAT_DWA !== 'false'
  };
}
