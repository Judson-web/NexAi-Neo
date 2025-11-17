import TelegramBot from "node-telegram-bot-api";
import { config } from "../config";
import { registerMessageHandlers } from "./handlers";
import { registerInlineHandlers } from "./inline";

// Webhook mode must be explicitly enabled
export const bot = new TelegramBot(config.telegram.token, {
  webHook: {
    port: Number(config.server.port)
  }
});

// Set Webhook URL (Render, Railway, etc.)
if (config.server.webhookUrl) {
  bot.setWebHook(`${config.server.webhookUrl}`);
  console.log("🌐 Webhook set to:", config.server.webhookUrl);
} else {
  console.warn("⚠️ WEBHOOK_URL not defined. Bot will not receive updates.");
}

// Register bot features
registerMessageHandlers(bot);
registerInlineHandlers(bot);

console.log("🤖 Nexus Telegram Bot initialized.");