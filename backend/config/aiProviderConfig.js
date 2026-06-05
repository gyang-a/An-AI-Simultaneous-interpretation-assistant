const DEFAULT_AI_PROVIDER = 'xunfei';

export function getAiProviderConfig() {
  return {
    provider: process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER
  };
}
