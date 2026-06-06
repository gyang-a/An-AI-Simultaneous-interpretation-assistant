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
    const client = new MongoClient(config.uri);
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(config.dbName);
}
