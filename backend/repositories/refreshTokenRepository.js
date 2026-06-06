import { ObjectId } from 'mongodb';
import { getDatabase } from '../database/mongoClient.js';

const REFRESH_TOKENS_COLLECTION = 'refreshTokens';
let indexesReady = false;

async function getRefreshTokensCollection() {
  const database = await getDatabase();
  const collection = database.collection(REFRESH_TOKENS_COLLECTION);

  if (!indexesReady) {
    await Promise.all([
      collection.createIndex({ tokenHash: 1 }, { unique: true }),
      collection.createIndex({ userId: 1 }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    ]);
    indexesReady = true;
  }

  return collection;
}

export async function createRefreshTokenRecord({ userId, tokenHash, expiresAt }) {
  const collection = await getRefreshTokensCollection();
  const now = new Date();

  await collection.insertOne({
    userId: new ObjectId(userId),
    tokenHash,
    expiresAt,
    revokedAt: null,
    createdAt: now,
    updatedAt: now
  });
}

export async function findActiveRefreshToken(tokenHash) {
  const collection = await getRefreshTokensCollection();
  const tokenRecord = await collection.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenRecord) {
    return null;
  }

  return {
    id: tokenRecord._id.toString(),
    userId: tokenRecord.userId.toString(),
    tokenHash: tokenRecord.tokenHash,
    expiresAt: tokenRecord.expiresAt
  };
}

export async function revokeRefreshToken(tokenHash) {
  const collection = await getRefreshTokensCollection();
  const now = new Date();

  await collection.updateOne(
    {
      tokenHash,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: now,
        updatedAt: now
      }
    }
  );
}
