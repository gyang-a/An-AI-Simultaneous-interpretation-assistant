export function getDatabaseConfig() {
  return {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || 'ai_interpreter'
  };
}
