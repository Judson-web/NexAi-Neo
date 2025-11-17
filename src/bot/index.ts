import TelegramBot from "node-telegram-bot-api";
import { config } from "../config.js";
import { registerMessageHandlers } from "./handlers.js";
import { registerInlineHandlers } from "./inline.js";

export const bot = new TelegramBot(config.telegram.token, {
  webHook: { port: Number(config.server.port) }
});

// Set webhook on startup
if (config.server.webhookUrl) {
  bot.setWebHook(`${config.server.webhookUrl}/webhook`);
  console.log("🌐 Webhook set to:", config.server.webhookUrl);
}

// Register handlers
registerMessageHandlers(bot);
registerInlineHandlers(bot);

console.log("🤖 Nexus Bot initialized");