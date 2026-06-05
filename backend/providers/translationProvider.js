import { getTranslationProviderConfig } from '../config/translationProviderConfig.js';

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

function buildContextText(context) {
  return context
    .filter((item) => item?.sourceText || item?.translatedText)
    .map((item, index) => {
      const sourceText = item.sourceText ? `原文：${item.sourceText}` : '';
      const translatedText = item.translatedText ? `译文：${item.translatedText}` : '';
      return `${index + 1}. ${[sourceText, translatedText].filter(Boolean).join('\n')}`;
    })
    .join('\n\n');
}

function extractTranslatedText(payload) {
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

export async function translateText({ text, context = [] }) {
  const config = getTranslationProviderConfig();

  if (!text?.trim()) {
    return '';
  }

  if (!config.apiKey) {
    throw new Error('Missing TRANSLATION_API_KEY or OPENAI_API_KEY');
  }

  const timeout = createTimeoutSignal(config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              `你是同声传译字幕翻译引擎。请把用户提供的语音识别文本翻译为${config.targetLanguage}。` +
              '只输出译文，不要解释。保持术语一致，自动纠正前文语境导致的翻译错误。'
          },
          {
            role: 'user',
            content: [
              '最近上下文：',
              buildContextText(context) || '无',
              '',
              '当前需要翻译的原文：',
              text
            ].join('\n')
          }
        ]
      }),
      signal: timeout.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const translatedText = extractTranslatedText(payload);

    if (!translatedText) {
      throw new Error('Translation response did not include translated text');
    }

    return translatedText;
  } finally {
    timeout.clear();
  }
}
