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
    reuseDetectedAt: null,
    replacedByTokenHash: null,
    createdAt: now,
    updatedAt: now
  });
}

function mapRefreshTokenRecord(tokenRecord) {
  if (!tokenRecord) {
    return null;
  }

  return {
    id: tokenRecord._id.toString(),
    userId: tokenRecord.userId.toString(),
    tokenHash: tokenRecord.tokenHash,
    expiresAt: tokenRecord.expiresAt,
    revokedAt: tokenRecord.revokedAt,
    reuseDetectedAt: tokenRecord.reuseDetectedAt,
    replacedByTokenHash: tokenRecord.replacedByTokenHash
  };
}

export async function findRefreshTokenByHash(tokenHash) {
  const collection = await getRefreshTokensCollection();
  return mapRefreshTokenRecord(await collection.findOne({ tokenHash }));
}

export function isRefreshTokenRecordActive(tokenRecord) {
  return Boolean(
    tokenRecord &&
      !tokenRecord.revokedAt &&
      tokenRecord.expiresAt > new Date()
  );
}

export async function markRefreshTokenReuse(tokenHash) {
  const collection = await getRefreshTokensCollection();
  const now = new Date();

  await collection.updateOne(
    { tokenHash },
    {
      $set: {
        reuseDetectedAt: now,
        updatedAt: now
      }
    }
  );
}

export async function revokeRefreshToken(tokenHash, options = {}) {
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
        replacedByTokenHash: options.replacedByTokenHash || null,
        updatedAt: now
      }
    }
  );
}

export async function revokeActiveRefreshTokensByUserId(userId) {
  const collection = await getRefreshTokensCollection();
  const now = new Date();

  await collection.updateMany(
    {
      userId: new ObjectId(userId),
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
