import TelegramBot from "node-telegram-bot-api";
import { config } from "../config.js";
import { registerMessageHandlers } from "./handlers.js";
import { registerInlineHandlers } from "./inline.js";

// Create bot in webhook mode
export const bot = new TelegramBot(config.telegram.token, {
  webHook: {
    port: Number(config.server.port) || 3000
  }
});

// Set webhook URL once at startup
if (config.server.webhookUrl) {
  bot.setWebHook(config.server.webhookUrl);
  console.log("🌐 Webhook set to:", config.server.webhookUrl);
} else {
  console.warn("⚠️ No WEBHOOK_URL provided!");
}

// Register all bot features
registerMessageHandlers(bot);
registerInlineHandlers(bot);

console.log("🤖 Nexus Bot initialized");