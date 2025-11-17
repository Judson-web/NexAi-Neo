import express from "express";
import { json } from "body-parser";
import router from "./webhook";

const app = express();

app.use(json());
app.use("/webhook", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));