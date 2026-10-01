import { apiHeaders } from "../../lib/developer-api.js";

export default async function handler(req, res) {
  apiHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });

  return res.status(200).json({
    name: "Kingshot Auto Redeemer API",
    version: "1",
    status: "operational",
    endpoints: { redeem: { method: "POST", path: "/api/v1/redeem", authentication: "Bearer API key" } },
    authentication: { type: "bearer", header: "Authorization: Bearer ks_live_..." },
    notes: [
      "API keys are scoped to this service and never expose the upstream Kingshot signing secret.",
      "Responses use stable application-level status codes and JSON error objects."
    ]
  });
}
