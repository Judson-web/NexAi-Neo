import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

export function registerMessageHandlers(bot: TelegramBot) {

  // /start command — single message with image + full caption
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
      parse_mode: "Markdown" // Safe here—caption is controlled text
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

    // Use HTML to avoid Gemini markdown chaos
    await bot.sendMessage(msg.chat.id, reply, { parse_mode: "HTML" });
  });
}