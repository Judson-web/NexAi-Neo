import { apiHeaders } from "../../lib/developer-api.js";

export default async function handler(req, res) {
  apiHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  return res.status(200).json({ ok: true, service: "kingshot-auto-redeemer-api", version: "1", timestamp: new Date().toISOString() });
}
