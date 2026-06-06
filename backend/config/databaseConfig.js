export function getDatabaseConfig() {
  return {
    uri: String(process.env.MONGODB_URI || '').trim(),
    dbName: process.env.MONGODB_DB_NAME || 'ai_interpreter',
    serverSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000)
  };
}
