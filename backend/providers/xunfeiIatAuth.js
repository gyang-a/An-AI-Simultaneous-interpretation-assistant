import crypto from 'crypto';

export function createXunfeiIatAuthUrl(hostUrl, apiKey, apiSecret) {
  const url = new URL(hostUrl);
  const date = new Date().toUTCString();
  const signatureOrigin = [
    `host: ${url.host}`,
    `date: ${date}`,
    `GET ${url.pathname} HTTP/1.1`
  ].join('\n');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64');
  const authorizationOrigin =
    `api_key="${apiKey}", algorithm="hmac-sha256", ` +
    `headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  url.searchParams.set('authorization', authorization);
  url.searchParams.set('date', date);
  url.searchParams.set('host', url.host);

  return url.toString();
}
