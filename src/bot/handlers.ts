import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

// Helper — split long messages safely for Telegram (max 4096 chars)
function chunkText(text: string, size = 3500) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

export function registerMessageHandlers(bot: TelegramBot) {

  // /start command — image + caption
  bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.from);

    const welcomeImage =
      "https://firebasestorage.googleapis.com/v0/b/crnn-b7d8f.appspot.com/o/files%2FIMG_20250717_215454_617.webp?alt=media&token=474c6c29-9eeb-48f6-bb8e-fbf0b167d476";

    const caption = `
👋 Welcome to Nexus!
I'm powered by Gemini 2.5 Pro + Supabase.

Ask me anything, or try:
• Inline mode — type @YourBot <query>
(⚠️ Image generation is currently disabled)
    `.trim();

    await bot.sendPhoto(msg.chat.id, welcomeImage, {
      caption,
      parse_mode: "Markdown"
    });
  });

  // /image command (disabled)
  bot.onText(/\/image (.+)/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Image generation is temporarily disabled while Nexus upgrades to a new image engine."
    );
  });

  // Default chat handler
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const prompt = msg.text || "";
    const reply = await generateText(prompt);

    const parts = chunkText(reply);

    for (const part of parts) {
      await bot.sendMessage(msg.chat.id, part, {
        parse_mode: "HTML"
      });
    }
  });
}