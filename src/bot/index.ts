import TelegramBot from "node-telegram-bot-api";
import { config } from "../config.js";
import { registerMessageHandlers } from "./handlers.js";
import { registerInlineHandlers } from "./inline.js";

// Create bot in webhook mode
export const bot = new TelegramBot(config.telegram.token, {
  webHook: true
});

// Set full webhook URL
const webhookUrl = `${config.server.webhookUrl}/webhook`;

bot.setWebHook(webhookUrl)
  .then(() => console.log("🌐 Webhook set:", webhookUrl))
  .catch(err => console.error("Webhook error:", err));

// Attach handlers
registerMessageHandlers(bot);
registerInlineHandlers(bot);

console.log("🤖 Nexus Telegram Bot initialized.");