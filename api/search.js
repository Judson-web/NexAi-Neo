export default async function handler(req, res) {
  const q = String(req.query.q || "").trim();
  const type = ["all", "images", "news", "videos"].includes(req.query.type) ? req.query.type : "all";
  const safe = ["off", "moderate", "strict"].includes(req.query.safe) ? req.query.safe : "moderate";
  if (!q) return res.status(400).json({ error: "Missing query" });

  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) {
    if (type !== "all") return res.status(503).json({ error: "This search section needs a web search provider key. Web search is available now." });
    try {
      const u = new URL("https://en.wikipedia.org/w/api.php");
      u.searchParams.set("action", "query"); u.searchParams.set("list", "search");
      u.searchParams.set("srsearch", q); u.searchParams.set("srlimit", "10");
      u.searchParams.set("format", "json"); u.searchParams.set("origin", "*");
      const r = await fetch(u);
      if (!r.ok) throw Error("provider");
      const d = await r.json();
      const results = (d.query?.search || []).map(x => ({
        title: x.title,
        url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")),
        description: x.snippet.replace(/<[^>]*>/g, ""),
        domain: "wikipedia.org"
      }));
      return res.status(200).json({ query: q, type, results, provider: "wikipedia" });
    } catch { return res.status(502).json({ error: "Search is temporarily unavailable." }); }
  }

  try {
    const endpoint = type === "images" ? "images/search" : type === "news" ? "news/search" : type === "videos" ? "videos/search" : "web/search";
    const u = new URL("https://api.search.brave.com/res/v1/" + endpoint);
    u.searchParams.set("q", q);
    u.searchParams.set("count", "12");
    if (type === "all") u.searchParams.set("safesearch", safe);
    const r = await fetch(u, { headers: { Accept: "application/json", "X-Subscription-Token": key } });
    if (!r.ok) throw Error("provider");
    const d = await r.json();

    let results = [];
    if (type === "images") {
      results = (d.images?.results || []).map(x => ({
        title: x.title || "",
        url: x.url || x.source_url || "",
        source_url: x.source_url || x.url || "",
        thumbnail: x.thumbnail?.src || x.thumbnail?.url || x.properties?.url || "",
        domain: domainOf(x.source_url || x.url || "")
      }));
    } else if (type === "news") {
      results = (d.results || []).map(x => ({
        title: x.title || "", url: x.url || "", description: x.description || "",
        thumbnail: x.thumbnail?.src || x.thumbnail?.original || "",
        age: x.age || x.page_age || "", domain: domainOf(x.url || "")
      }));
    } else if (type === "videos") {
      results = (d.results || []).map(x => ({
        title: x.title || "", url: x.url || "", description: x.description || "",
        thumbnail: x.thumbnail?.src || x.thumbnail?.url || "", domain: domainOf(x.url || "")
      }));
    } else {
      results = (d.web?.results || []).map(x => ({
        title: x.title || "", url: x.url || "", description: x.description || "",
        domain: domainOf(x.url || "")
      }));
    }
    return res.status(200).json({ query: q, type, results, provider: "brave" });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "The search provider is temporarily unavailable." });
  }
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
