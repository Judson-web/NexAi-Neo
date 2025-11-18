import "dotenv/config";
import express from "express";
import router from "./webhook.js";

const app = express();

app.use(express.json());

// Telegram webhook endpoint
app.use("/webhook", router);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});