/**
 * functions/src/index.ts
 * Entry point for Firebase Cloud Functions (HTTPS webhook + basic admin tasks).
 *
 * Expects the following modules to exist in the repo (created next):
 *  - ./telegram/bot.ts            -> exports `createTelegramBot()` (Grammy/Telegraf wrapper)
 *  - ./genai/geminiClient.ts     -> exports `generateText()` and `generateImage()`
 *  - ./storage/imageUploader.ts  -> exports `uploadBufferToStorage()`
 *  - ./db/users.ts               -> exports Firestore helpers like `upsertUser()`
 *  - ./telegram/inlineHandlers.ts-> exports `handleInlineQuery()`
 *
 * Secrets: prefer `firebase functions:config:set telegram.token="..." gemini.key="..."`
 * Local dev: use process.env or `.env` (do NOT commit secrets).
 *
 * Runtime: Node 20 recommended. Set in firebase.json:
 *  "functions": { "runtime": "node20" }
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import { createTelegramBot } from "./telegram/bot";
import { handleInlineQuery } from "./telegram/inlineHandlers";
import { generateText, generateImage } from "./genai/geminiClient";
import { uploadBufferToStorage } from "./storage/imageUploader";
import { upsertUser } from "./db/users";

// Initialize Firebase Admin (automatic in Functions environment)
admin.initializeApp();

// Convenience: Firestore + Storage clients
const db = admin.firestore();
const storage = admin.storage();

// Read secret config (prefer firebase functions:config)
const cfg = functions.config() || {};
const TELEGRAM_TOKEN = cfg.telegram?.token || process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_KEY = cfg.gemini?.key || process.env.GEMINI_API_KEY;

if (!TELEGRAM_TOKEN) {
  // don't throw in top-level during deploy; instead log and allow local dev to fail loudly
  functions.logger.warn("TELEGRAM_BOT_TOKEN not set (firebase functions:config or env)");
}
if (!GEMINI_KEY) {
  functions.logger.warn("GEMINI_KEY not set (firebase functions:config or env)");
}

/**
 * Express app used as HTTPS entrypoint for Telegram webhook and HTTP utilities.
 */
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

/**
 * Health check (useful for GitHub Actions & debugging)
 */
app.get("/health", async (req: Request, res: Response) => {
  try {
    // quick Firestore ping
    await db.doc("__health_check/ping").set({ ts: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true, project: process.env.GCP_PROJECT || functions.config().project_id || null });
  } catch (err) {
    functions.logger.error("health-check failed", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Telegram webhook receiver
 *
 * We use a lightweight pattern: the Telegram library instance is created per cold start
 * (it caches handlers internally). The library will provide a request handler we can
 * call from express. This keeps flexibility if you want to reuse the same functions
 * entry for admin endpoints.
 */
app.post("/telegram/webhook", async (req: Request, res: Response) => {
  try {
    const bot = createTelegramBot({ token: TELEGRAM_TOKEN, db, storage }); // custom factory in telegram/bot.ts
    // Let the bot process the incoming telegram update JSON
    await bot.handleUpdate(req.body);
    // Respond quickly to Telegram
    res.status(200).send("OK");
  } catch (err) {
    functions.logger.error("telegram webhook handler error", err);
    // Telegram expects 200 for successful receipts — return 500 so function logs show error.
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Inline query endpoint (optionally used for client test; main inline handling should be in bot)
 * Kept for quick external tests.
 */
app.post("/telegram/inline", async (req: Request, res: Response) => {
  try {
    const inlineQuery = req.body;
    await handleInlineQuery(inlineQuery, { db, storage, generateImage, uploadBufferToStorage });
    res.status(200).json({ ok: true });
  } catch (err) {
    functions.logger.error("inline handler failed", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Example: generate an image via Gemini and store it in Cloud Storage.
 * This is an admin-only endpoint — protect it in production (IAM / header token).
 */
app.post("/admin/generate-image", async (req: Request, res: Response) => {
  try {
    // Basic guard - replace with proper auth in production
    const ADMIN_SECRET = cfg.admin?.secret || process.env.ADMIN_SECRET;
    if (ADMIN_SECRET && req.headers["x-admin-secret"] !== ADMIN_SECRET) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const { prompt, filename } = req.body;
    if (!prompt) return res.status(400).json({ ok: false, error: "missing prompt" });

    // Call Gemini image generation (returns Buffer)
    const imageBuffer = await generateImage({ prompt, apiKey: GEMINI_KEY });

    // Upload to storage (example path 'generated-images/<filename or timestamp>.png')
    const name = filename || `generated-${Date.now()}.png`;
    const publicUrl = await uploadBufferToStorage({
      buffer: imageBuffer,
      destinationPath: `generated-images/${name}`,
      contentType: "image/png",
    });

    // Save metadata to Firestore
    await db.collection("generated_images").add({
      prompt,
      path: `generated-images/${name}`,
      url: publicUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ ok: true, url: publicUrl });
  } catch (err) {
    functions.logger.error("generate-image failed", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Expose the express app as a single Cloud Function.
 * This function is the canonical place to route webhooks and admin traffic.
 */
export const api = functions
  .runWith({
    // Node 20 runtime will be set in firebase.json; use generous memory/time for genai.
    memory: "1GB",
    timeoutSeconds: 120,
  })
  .https.onRequest(app);

/**
 * Example scheduled function — can be used for cleanup, analytics, or retraining triggers.
 * Cron schedule example: every 24 hours.
 */
export const dailyHousekeeping = functions
  .runWith({ memory: "256MB" })
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    functions.logger.info("dailyHousekeeping running", { project: process.env.GCP_PROJECT || null });
    // Example: delete images older than 30 days (implement actual logic in storage/imageUploader.ts)
    // await cleanupOldGeneratedImages(30);
    return null;
  });

/**
 * Helpful export for local tests
 */
export default { api };