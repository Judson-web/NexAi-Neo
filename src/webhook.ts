import { Router } from "express";
import { bot } from "./bot/index.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).send("Error");
  }
});

export default router;