import express from "express";
import { bot } from "./bot";
import { config } from "./config";

const app = express();

// Telegram requires body to be parsed as JSON
app.use(express.json());

// Telegram Webhook Endpoint
app.post("/webhook", (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).send("Internal Error");
  }
});

// Health Check Route
app.get("/", (req, res) => {
  res.send("Nexus AI Bot is running 🚀");
});

// Start Server
app.listen(config.server.port, () => {
  console.log(`🚀 Server listening on port ${config.server.port}`);

  if (config.server.webhookUrl) {
    console.log("🌐 Webhook URL:", config.server.webhookUrl);
  } else {
    console.warn("⚠️ WARNING: No WEBHOOK_URL is set. Telegram will not send updates.");
  }
});