/**
 * functions/src/db/users.ts
 *
 * Simple Firestore helpers for Telegram user storage.
 * Exports:
 *    upsertUser(db, telegramUser)
 *
 * Firestore schema:
 *    users/{telegramId}
 *        id
 *        username
 *        first_name
 *        last_name
 *        language_code
 *        updatedAt
 *        createdAt
 */

import { FirebaseFirestore } from "firebase-admin";

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export async function upsertUser(db: FirebaseFirestore.Firestore, user: TelegramUser) {
  if (!user || !user.id) return;

  const ref = db.collection("users").doc(String(user.id));
  const snapshot = await ref.get();

  const data = {
    id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    language_code: user.language_code || null,
    updatedAt: Date.now(),
  };

  if (!snapshot.exists) {
    await ref.set({
      ...data,
      createdAt: Date.now(),
    });
  } else {
    await ref.update(data);
  }
}