import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";

export function registerMessageHandlers(bot: TelegramBot) {

  // /start command
  bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.from);

    const message = `
👋 Welcome to Nexus!
I'm powered by Gemini 2.5 Pro + Supabase.

Ask me anything, or try:
• Inline mode — type @YourBot <query>
(⚠️ Image generation is currently disabled)
    `;

    await bot.sendMessage(msg.chat.id, message.trim());
  });

  // /image command (disabled)
  bot.onText(/\/image (.+)/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Image generation is temporarily disabled while Nexus upgrades to a new image engine."
    );
  });

  // Default message handler
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const prompt = msg.text || "";
    const reply = await generateText(prompt);

    await bot.sendMessage(msg.chat.id, reply, { parse_mode: "Markdown" });
  });
}