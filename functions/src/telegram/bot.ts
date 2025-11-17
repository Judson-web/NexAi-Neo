/**
 * functions/src/telegram/bot.ts
 *
 * Creates a Telegram bot instance using grammY.
 * The returned bot has:
 *  - Message handlers
 *  - Commands (/start etc.)
 *  - Inline query handling (delegates to inlineHandlers.ts)
 *  - Gemini text generation integrated
 *  - Firestore user upsert on each message
 */

import { Bot, InlineKeyboard } from "grammy";
import { FirebaseFirestore, Storage } from "firebase-admin";
import { generateText } from "../genai/geminiClient";
import { upsertUser } from "../db/users";
import { handleInlineQuery } from "./inlineHandlers";

interface NexusBotOptions {
  token: string;
  db: FirebaseFirestore.Firestore;
  storage: Storage.Storage;
}

export function createTelegramBot({ token, db, storage }: NexusBotOptions) {
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN missing in bot.ts");
  }

  const bot = new Bot(token);

  /**
   * Basic command: /start
   */
  bot.command("start", async (ctx) => {
    const user = ctx.from;
    if (user) {
      await upsertUser(db, user);
    }

    await ctx.reply(
      `Nexus online. Your AI companion is ready.\n` +
        `Type something or use inline mode (@NexusBot <query>).`,
    );
  });

  /**
   * Message Handler
   * For every incoming message, we:
   *  1) Save user to Firestore
   *  2) Use Gemini to produce a response
   *  3) Reply with generated text
   */
  bot.on("message:text", async (ctx) => {
    const user = ctx.from;
    if (user) await upsertUser(db, user);

    const prompt = ctx.message.text.trim();
    if (!prompt) return;

    // Gemini text generation
    const replyText = await generateText({
      prompt,
      apiKey: process.env.GEMINI_API_KEY || "",
    });

    await ctx.reply(replyText || "I tried to think but my circuits hummed. Try again?");
  });

  /**
   * Inline query handler
   * This allows: @NexusBot <query> from anywhere in Telegram
   */
  bot.on("inline_query", async (ctx) => {
    const inlineQuery = ctx.inlineQuery;
    const results = await handleInlineQuery(inlineQuery, {
      db,
      storage,
      generateText,
    });

    // GrammY expects: ctx.answerInlineQuery(arrayOfResults)
    await ctx.answerInlineQuery(results, { cache_time: 2 });
  });

  /**
   * Fallback handler
   */
  bot.catch((err) => {
    console.error("Telegram bot error:", err);
  });

  return bot;
}