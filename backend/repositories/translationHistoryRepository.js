import { ObjectId } from 'mongodb';
import { getDatabase } from '../database/mongoClient.js';

const TRANSLATION_HISTORY_COLLECTION = 'translationHistory';
const DEFAULT_HISTORY_LIMIT = 20;
let indexesReady = false;

async function getTranslationHistoryCollection() {
  const database = await getDatabase();
  const collection = database.collection(TRANSLATION_HISTORY_COLLECTION);

  if (!indexesReady) {
    await Promise.all([
      collection.createIndex({ userId: 1, startedAt: -1 }),
      collection.createIndex({ userId: 1, sessionId: 1 }, { unique: true })
    ]);
    indexesReady = true;
  }

  return collection;
}

function mapHistoryRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.sessionId || record._id.toString(),
    databaseId: record._id.toString(),
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    items: record.items || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export async function listTranslationHistoryByUserId(userId, limit = DEFAULT_HISTORY_LIMIT) {
  const collection = await getTranslationHistoryCollection();
  const records = await collection
    .find({ userId: new ObjectId(userId) })
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();

  return records.map(mapHistoryRecord);
}

export async function upsertTranslationHistoryRecord({
  userId,
  sessionId,
  startedAt,
  endedAt,
  items
}) {
  const collection = await getTranslationHistoryCollection();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    {
      userId: new ObjectId(userId),
      sessionId
    },
    {
      $set: {
        startedAt: new Date(startedAt),
        endedAt: new Date(endedAt),
        items,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    {
      returnDocument: 'after',
      upsert: true
    }
  );

  return mapHistoryRecord(result);
}

export async function deleteTranslationHistoryBySessionId(userId, sessionId) {
  const collection = await getTranslationHistoryCollection();
  const result = await collection.deleteOne({
    userId: new ObjectId(userId),
    sessionId
  });

  return result.deletedCount > 0;
}
