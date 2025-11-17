import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users.js";
import { generateText } from "../ai/gemini.js";
import { generateImage } from "../ai/image.js";

export function registerMessageHandlers(bot: TelegramBot) {

  bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.from);

    const message = `
👋 Welcome to Nexus!
I'm powered by Gemini + Supabase.

Ask me anything, or try:
• /image <prompt>
• Inline mode — type @YourBot <query>
    `;

    await bot.sendMessage(msg.chat.id, message.trim());
  });

  bot.onText(/\/image (.+)/, async (msg, match) => {
    const prompt = match?.[1];
    if (!prompt) return bot.sendMessage(msg.chat.id, "Enter an image prompt.");

    await bot.sendMessage(msg.chat.id, "🎨 Creating your image...");

    const buffer = await generateImage(prompt);
    if (!buffer) return bot.sendMessage(msg.chat.id, "⚠️ Image generation failed.");

    await bot.sendPhoto(msg.chat.id, buffer, {
      caption: `🖼️ Generated: ${prompt}`
    });
  });

  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return;

    await upsertUser(msg.from);

    const prompt = msg.text || "";
    const reply = await generateText(prompt);

    await bot.sendMessage(msg.chat.id, reply, { parse_mode: "Markdown" });
  });
}