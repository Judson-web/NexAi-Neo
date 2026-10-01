const SUPABASE_URL = process.env.SUPABASE_URL || "https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_KEY) throw Error("Supabase service key is not configured on the server.");

async function query(path) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: {
      apikey: SUPABASE_KEY,
      authorization: "Bearer " + SUPABASE_KEY,
      accept: "application/json"
    },
    signal: AbortSignal.timeout(8000)
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw Error(data?.message || "Supabase request failed");
  return data;
}

async function count(table) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=*&limit=1", {
    headers: {
      apikey: SUPABASE_KEY,
      authorization: "Bearer " + SUPABASE_KEY,
      Prefer: "count=exact",
      Range: "0-0"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) return null;
  const range = response.headers.get("content-range");
  const match = range?.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function safeWorker(row) {
  const summary = row?.summary && typeof row.summary === "object" ? row.summary : {};
  return {
    slot: row?.slot_id ?? null,
    status: row?.last_status ?? null,
    startedAt: row?.last_started_at ?? null,
    finishedAt: row?.last_finished_at ?? null,
    error: row?.last_error ? String(row.last_error).slice(0, 200) : null,
    summary: {
      players: Number(summary.players || 0),
      attempted: Number(summary.attempted || 0),
      success: Number(summary.success || 0),
      alreadyHandled: Number(summary.alreadyHandled || 0),
      skipped: Number(summary.skipped || 0),
      stale: Number(summary.stale || 0),
      errors: Number(summary.errors || 0),
      redemptionFailures: Array.isArray(summary.redemptionFailures)
        ? summary.redemptionFailures.length
        : 0
    }
  };
}

function safeScraper(row) {
  return {
    source: row?.source ?? null,
    codeCount: Number(row?.code_count || 0),
    consecutiveEmptyRuns: Number(row?.consecutive_empty_runs || 0),
    consecutiveErrors: Number(row?.consecutive_errors || 0),
    lastSuccessAt: row?.last_success_at ?? null,
    alertState: row?.alert_state ?? null,
    lastError: row?.last_error ? String(row.last_error).slice(0, 160) : null
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const [
      workers,
      scrapers,
      recentRuns,
      players,
      giftCodes,
      redemptions,
      events,
      scraperRuns,
      supportTickets,
      announcements
    ] = await Promise.all([
      query("kingshot_worker_slots?select=slot_id,last_status,last_started_at,last_finished_at,last_error,summary&order=slot_id"),
      query("kingshot_scraper_health?select=source,consecutive_empty_runs,consecutive_errors,code_count,last_success_at,last_error,alert_state&order=source"),
      query("kingshot_scraper_runs?select=*&order=started_at.desc&limit=20"),
      count("kingshot_autoredeem"),
      count("kingshot_gift_codes"),
      count("kingshot_redemptions"),
      count("kingshot_player_events"),
      count("kingshot_scraper_runs"),
      count("kingshot_support_tickets"),
      count("kingshot_announcements")
    ]);

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json({
      ok: true,
      service: "kingshot-auto-redeemer",
      generatedAt: new Date().toISOString(),
      workers: Array.isArray(workers) ? workers.map(safeWorker) : [],
      scrapers: Array.isArray(scrapers) ? scrapers.map(safeScraper) : [],
      recentScraperRuns: Array.isArray(recentRuns)
        ? recentRuns.slice(0, 20).map(row => ({
            source: row?.source ?? null,
            startedAt: row?.started_at ?? null,
            finishedAt: row?.finished_at ?? null,
            httpStatus: row?.http_status ?? null,
            codeCount: Number(row?.code_count || 0),
            parseOk: row?.parse_ok ?? null,
            errorCategory: row?.error_category ?? null,
            error: row?.error_message ? String(row.error_message).slice(0, 160) : null
          }))
        : [],
      counts: {
        players,
        giftCodes,
        redemptions,
        playerEvents: events,
        scraperRuns,
        supportTickets,
        announcements
      }
    });
  } catch (error) {
    console.error("Logs API failed:", error?.message || error);
    return res.status(502).json({
      ok: false,
      error: "Logs temporarily unavailable."
    });
  }
}
