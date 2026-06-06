import { MongoClient } from 'mongodb';
import { getDatabaseConfig } from '../config/databaseConfig.js';

let clientPromise = null;

export function createDatabaseConfigError() {
  const error = new Error('MongoDB is not configured');
  error.code = 'MONGODB_NOT_CONFIGURED';
  return error;
}

export async function getDatabase() {
  const config = getDatabaseConfig();

  if (!config.uri) {
    throw createDatabaseConfigError();
  }

  if (!clientPromise) {
    const client = new MongoClient(config.uri, {
      // 数据库不可达时快速失败，避免登录页一直停在提交中。
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMs
    });
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(config.dbName);
}

export async function closeDatabaseClient() {
  if (!clientPromise) {
    return;
  }

  const client = await clientPromise;
  await client.close();
  clientPromise = null;
}
