import { Router } from "express";
import { bot } from "./bot/index.js";

const router = Router();

// Telegram webhook GET test
router.get("/", (req, res) => {
  res.status(200).send("Nexus Webhook Active");
});

// Telegram POST updates
router.post("/", async (req, res) => {
  try {
    await bot.processUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error");
  }
});

export default router;