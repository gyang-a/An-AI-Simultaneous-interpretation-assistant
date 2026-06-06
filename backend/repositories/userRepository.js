import { ObjectId } from 'mongodb';
import { getDatabase } from '../database/mongoClient.js';

const USERS_COLLECTION = 'users';
let indexesReady = false;

function normalizeAccount(account) {
  return String(account || '').trim().toLowerCase();
}

async function getUsersCollection() {
  const database = await getDatabase();
  const collection = database.collection(USERS_COLLECTION);

  if (!indexesReady) {
    await collection.createIndex({ account: 1 }, { unique: true });
    indexesReady = true;
  }

  return collection;
}

function mapUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    account: user.account,
    avatarDataUrl: user.avatarDataUrl || '',
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function createUser({ name, account, passwordHash }) {
  const collection = await getUsersCollection();
  const now = new Date();
  const result = await collection.insertOne({
    name: String(name || '').trim() || 'AI User',
    account: normalizeAccount(account),
    passwordHash,
    createdAt: now,
    updatedAt: now
  });

  return mapUser(await collection.findOne({ _id: result.insertedId }));
}

export async function findUserByAccount(account) {
  const collection = await getUsersCollection();
  return mapUser(await collection.findOne({ account: normalizeAccount(account) }));
}

export async function findUserById(userId) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getUsersCollection();
  return mapUser(await collection.findOne({ _id: new ObjectId(userId) }));
}

export async function updateUserAvatar(userId, avatarDataUrl) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const collection = await getUsersCollection();
  const now = new Date();

  await collection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        avatarDataUrl,
        updatedAt: now
      }
    }
  );

  return mapUser(await collection.findOne({ _id: new ObjectId(userId) }));
}
