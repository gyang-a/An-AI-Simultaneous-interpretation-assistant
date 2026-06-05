import crypto from 'crypto';
import { getTranslationProviderConfig } from '../config/translationProviderConfig.js';

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function createRequestBody({ appId, from, to, text }) {
  return JSON.stringify({
    common: {
      app_id: appId
    },
    business: {
      from,
      to
    },
    data: {
      text: Buffer.from(text, 'utf8').toString('base64')
    }
  });
}

function createDigest(body) {
  const bodyHash = crypto
    .createHash('sha256')
    .update(body)
    .digest('base64');

  return `SHA-256=${bodyHash}`;
}

function createAuthorizationHeader({ apiKey, apiSecret, host, pathname, date, digest }) {
  const signatureOrigin = [
    `host: ${host}`,
    `date: ${date}`,
    `POST ${pathname} HTTP/1.1`,
    `digest: ${digest}`
  ].join('\n');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64');

  return `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`;
}

function createRequestHeaders({ apiKey, apiSecret, url, body }) {
  const requestUrl = new URL(url);
  const date = new Date().toUTCString();
  const digest = createDigest(body);

  return {
    Accept: 'application/json,version=1.0',
    Authorization: createAuthorizationHeader({
      apiKey,
      apiSecret,
      host: requestUrl.host,
      pathname: requestUrl.pathname,
      date,
      digest
    }),
    'Content-Type': 'application/json',
    Date: date,
    Digest: digest,
    Host: requestUrl.host
  };
}

function extractTranslatedText(payload) {
  return payload?.data?.result?.trans_result?.dst?.trim() || '';
}

export async function translateText({ text }) {
  const config = getTranslationProviderConfig();

  if (!text?.trim()) {
    return '';
  }

  if (!config.appId || !config.apiKey || !config.apiSecret) {
    throw new Error('Missing Xunfei translation credentials');
  }

  const body = createRequestBody({
    appId: config.appId,
    from: config.from,
    to: config.to,
    text
  });
  const timeout = createTimeoutSignal(config.timeoutMs);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: createRequestHeaders({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        url: config.url,
        body
      }),
      body,
      signal: timeout.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Xunfei translation request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    if (payload.code !== 0) {
      throw new Error(payload.message || 'Xunfei translation failed');
    }

    const translatedText = extractTranslatedText(payload);
    if (!translatedText) {
      throw new Error('Xunfei translation response did not include translated text');
    }

    return translatedText;
  } finally {
    timeout.clear();
  }
}
