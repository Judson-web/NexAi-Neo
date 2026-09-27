import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Globe2,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import "./styles.css";

const RECENT_KEY = "nexus-recent-searches";
const MAX_RECENT = 8;

function getQuery() {
  return new URLSearchParams(window.location.search).get("q")?.trim() || "";
}

function getDomain(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getFavicon(url = "") {
  const domain = getDomain(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : "";
}

function loadRecent() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(items) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {}
}

function SearchField({ value, onChange, onSubmit, large = false }) {
  return (
    <form className={large ? "searchbox searchbox-large" : "top-search"} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Search className="search-icon" size={large ? 21 : 18} aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={large ? "Search the web…" : "Search the web"}
        aria-label="Search the web"
        autoComplete="off"
        spellCheck="false"
      />
      {value && (
        <button type="button" className="icon-btn" onClick={() => onChange("")} aria-label="Clear search">
          <X size={18} />
        </button>
      )}
      <button type="submit" className={large ? "search-submit" : "go-btn"} aria-label="Search">
        <ArrowUpRight size={large ? 19 : 18} />
      </button>
    </form>
  );
}

function App() {
  const [query, setQuery] = useState(getQuery);
  const [input, setInput] = useState(getQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(Boolean(getQuery()));
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(loadRecent);
  const requestId = useRef(0);

  const updateRecent = useCallback((q) => {
    setRecent((current) => {
      const next = [q, ...current.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const runSearch = useCallback(async (value, { push = true } = {}) => {
    const q = String(value || "").trim();
    if (!q) {
      setQuery("");
      setInput("");
      setResults([]);
      setError("");
      setLoading(false);
      if (push && window.location.pathname !== "/") window.history.pushState({}, "", "/");
      return;
    }

    const id = ++requestId.current;
    setQuery(q);
    setInput(q);
    setLoading(true);
    setError("");

    if (push) {
      const nextUrl = `/search?q=${encodeURIComponent(q)}`;
      if (window.location.pathname + window.location.search !== nextUrl) {
        window.history.pushState({}, "", nextUrl);
      }
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Search failed.");
      if (id !== requestId.current) return;
      setResults(Array.isArray(data.results) ? data.results : []);
      updateRecent(q);
    } catch (err) {
      if (id !== requestId.current) return;
      setResults([]);
      setError(err?.message || "Something went wrong.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [updateRecent]);

  useEffect(() => {
    const initial = getQuery();
    if (initial) runSearch(initial, { push: false });

    const onPopState = () => {
      const q = getQuery();
      setInput(q);
      if (q) {
        runSearch(q, { push: false });
      } else {
        requestId.current += 1;
        setQuery("");
        setResults([]);
        setError("");
        setLoading(false);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [runSearch]);

  const home = !query;
  const resultCount = useMemo(() => results.length, [results]);

  const goHome = (e) => {
    e.preventDefault();
    requestId.current += 1;
    setQuery("");
    setInput("");
    setResults([]);
    setError("");
    setLoading(false);
    window.history.pushState({}, "", "/");
  };

  return (
    <div className={`app ${home ? "home" : "results-page"}`}>
      <header className="topbar">
        <a className="brand-mini" href="/" onClick={goHome} aria-label="Nexus home">
          <span className="nexus-mark">N</span>
          <span>Nexus</span>
        </a>

        {!home && (
          <SearchField value={input} onChange={setInput} onSubmit={() => runSearch(input)} />
        )}

        <button className="menu-btn" type="button" aria-label="Menu">
          <Menu size={20} />
        </button>
      </header>

      {home ? (
        <main className="hero">
          <div className="hero-brand" aria-label="Nexus">
            <span className="hero-n">N</span>
            <span>Nexus</span>
          </div>
          <p className="tagline">Search beyond the obvious.</p>

          <SearchField
            value={input}
            onChange={setInput}
            onSubmit={() => runSearch(input)}
            large
          />

          <div className="quick">
            <Sparkles size={15} aria-hidden="true" />
            Fast, focused, and built to grow.
          </div>

          {recent.length > 0 && (
            <section className="recent" aria-label="Recent searches">
              <div className="section-label">
                <Clock3 size={14} aria-hidden="true" />
                Recent searches
              </div>
              <div className="recent-list">
                {recent.slice(0, 6).map((item) => (
                  <button key={item} type="button" onClick={() => runSearch(item)}>
                    <span>{item}</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="results">
          <div className="result-meta">
            {loading ? "Searching the web…" : error ? "Search error" : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </div>

          {loading && (
            <div className="loading-list" aria-label="Loading results">
              {[1, 2, 3].map((item) => (
                <div className="skeleton-result" key={item}>
                  <span className="skeleton-line small" />
                  <span className="skeleton-line title" />
                  <span className="skeleton-line text" />
                  <span className="skeleton-line text short" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="state-card">
              <div className="state-icon"><Globe2 size={22} /></div>
              <div>
                <strong>Search unavailable</strong>
                <p>{error}</p>
                <button type="button" className="retry-btn" onClick={() => runSearch(query)}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !results.length && (
            <div className="state-card empty">
              <div className="state-icon"><Search size={22} /></div>
              <div>
                <strong>No results found</strong>
                <p>Try different words or a broader search.</p>
              </div>
            </div>
          )}

          {!loading && !error && results.map((result, index) => {
            const url = typeof result?.url === "string" ? result.url : "";
            const domain = result?.domain || getDomain(url);
            const title = result?.title || domain || "Untitled result";
            const description = result?.description || "No description available.";
            return (
              <article className="result" key={url || `${title}-${index}`}>
                <div className="result-source">
                  <span className="favicon-wrap">
                    {getFavicon(url) ? <img src={getFavicon(url)} alt="" loading="lazy" /> : <Globe2 size={13} />}
                  </span>
                  <span>{domain || "Web result"}</span>
                </div>

                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-title"
                  onClick={(e) => { if (!url) e.preventDefault(); }}
                >
                  {title}
                </a>

                <p>{description}</p>

                {url && (
                  <a className="result-url" href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </article>
            );
          })}
        </main>
      )}

      <footer>
        <span>Nexus</span>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/Judson-web/NexAi-Neo" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
