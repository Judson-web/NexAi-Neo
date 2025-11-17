import TelegramBot from "node-telegram-bot-api";
import { config } from "../config.js";
import { registerMessageHandlers } from "./handlers.js";
import { registerInlineHandlers } from "./inline.js";

// Bot in webhook mode (DO NOT bind a port here)
export const bot = new TelegramBot(config.telegram.token, {
  webHook: true
});

// Set webhook
if (config.server.webhookUrl) {
  bot.setWebHook(`${config.server.webhookUrl}/webhook`);
  console.log("🌐 Webhook set to:", `${config.server.webhookUrl}/webhook`);
}

// Register handlers
registerMessageHandlers(bot);
registerInlineHandlers(bot);

console.log("🤖 Nexus Bot initialized");