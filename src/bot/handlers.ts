import TelegramBot from "node-telegram-bot-api";
import { upsertUser } from "../db/users";
import { generateText } from "../ai/gemini";
import { generateImage } from "../ai/image";

export function registerMessageHandlers(bot: TelegramBot) {
  // /start command
  bot.onText(/\/start/, async (ctx) => {
    await upsertUser(ctx.from);

    const message =
      "👋 Welcome to Nexus!\n" +
      "I'm powered by Gemini + Supabase.\n\n" +
      "Ask me anything, or try:\n" +
      "• /image <prompt> — generate an AI image\n" +
      "• Inline mode — type @YourBot <query>";

    await bot.sendMessage(ctx.chat.id, message);
  });

  // /image command
  bot.onText(/\/image (.+)/, async (ctx, match) => {
    const prompt = match?.[1];
    if (!prompt) {
      return bot.sendMessage(ctx.chat.id, "Please enter an image prompt.");
    }

    await bot.sendMessage(ctx.chat.id, "🎨 Creating your image...");

    const buffer = await generateImage(prompt);

    if (!buffer) {
      return bot.sendMessage(ctx.chat.id, "⚠️ Failed to generate image.");
    }

    await bot.sendPhoto(ctx.chat.id, buffer, {
      caption: `🖼️ Image generated for: ${prompt}`
    });
  });

  // Default text message handler
  bot.on("message", async (ctx) => {
    // Ignore /start and /image handling
    if (ctx.text?.startsWith("/")) return;

    await upsertUser(ctx.from);

    const prompt = ctx.text || "";
    const reply = await generateText(prompt);

    await bot.sendMessage(ctx.chat.id, reply, {
      parse_mode: "Markdown"
    });
  });
}