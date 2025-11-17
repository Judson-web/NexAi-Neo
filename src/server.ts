import express from "express";
import router from "./webhook.js";

const app = express();

// Built-in JSON parser (no body-parser needed)
app.use(express.json());

// Webhook route
app.use("/webhook", router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});