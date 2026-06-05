const DEFAULT_AI_PROVIDER = 'mock';

export function getAiProviderConfig() {
  return {
    provider: process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER
  };
}
