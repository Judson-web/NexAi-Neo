import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft, ArrowUpRight, Bookmark, Check, ChevronDown, Clock3, ExternalLink,
  Globe2, Image as ImageIcon, Menu, Newspaper, Play, Search, Settings, Sparkles,
  SlidersHorizontal, Video, X
} from "lucide-react";
import "./styles.css";

const RECENT_KEY = "nexus-recent-searches";
const SAVED_KEY = "nexus-saved-searches";
const SETTINGS_KEY = "nexus-settings";
const TABS = [
  ["all", "Web", Search],
  ["images", "Images", ImageIcon],
  ["news", "News", Newspaper],
  ["videos", "Videos", Video],
];

const DEFAULT_SETTINGS = { safeSearch: "moderate", openResultsNewTab: true, compact: false };

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function getQuery() { return new URLSearchParams(window.location.search).get("q")?.trim() || ""; }
function getType() {
  const type = new URLSearchParams(window.location.search).get("type") || "all";
  return TABS.some(([key]) => key === type) ? type : "all";
}
function getPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/settings") return "settings";
  if (path === "/about") return "about";
  if (path === "/advanced") return "advanced";
  return "search";
}
function domain(url = "") {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function favicon(url = "") {
  const d = domain(url);
  return d ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=64` : "";
}

function SearchField({ value, onChange, onSubmit, large = false }) {
  return <form className={large ? "searchbox" : "top-search"} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
    <Search className="search-icon" size={large ? 21 : 18}/>
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={large ? "Search the web…" : "Search the web"} aria-label="Search the web"
      autoComplete="off" spellCheck="false"/>
    {value && <button type="button" className="icon-btn" onClick={() => onChange("")} aria-label="Clear"><X size={18}/></button>}
    <button type="submit" className={large ? "search-submit" : "go-btn"} aria-label="Search"><ArrowUpRight size={18}/></button>
  </form>;
}

function Header({ input, setInput, submit, page, onHome }) {
  return <header className="topbar">
    <a className="brand-mini" href="/" onClick={e => { e.preventDefault(); onHome(); }}>
      <span className="nexus-mark">N</span><span>Nexus</span>
    </a>
    {page === "search" && <SearchField value={input} onChange={setInput} onSubmit={submit}/>}
    <nav className="header-links">
      <a href="/settings" className={page === "settings" ? "active" : ""} aria-label="Settings"><Settings size={18}/></a>
      <a href="/about" className={page === "about" ? "active" : ""}>About</a>
    </nav>
    <button className="menu-btn" type="button" aria-label="Menu"><Menu size={20}/></button>
  </header>;
}

function Tabs({ query, type }) {
  if (!query) return null;
  return <nav className="tabs" aria-label="Search sections">
    <div className="tabs-inner">
      {TABS.map(([key, label, Icon]) => <a key={key}
        className={type === key ? "tab active" : "tab"} href={`/search?q=${encodeURIComponent(query)}&type=${key}`}>
        <Icon size={16}/>{label}
      </a>)}
      <a className="tab more-tab" href={`/advanced?q=${encodeURIComponent(query)}`}><SlidersHorizontal size={15}/>More</a>
    </div>
  </nav>;
}

function ResultCard({ item, settings }) {
  const url = typeof item?.url === "string" ? item.url : "";
  const title = item?.title || domain(url) || "Untitled result";
  const d = item?.domain || domain(url);
  const target = settings.openResultsNewTab ? "_blank" : "_self";
  return <article className="result">
    <div className="result-source">
      <span className="favicon-wrap">{favicon(url) ? <img src={favicon(url)} alt="" loading="lazy"/> : <Globe2 size={13}/>}</span>
      <span>{d || "Web result"}</span>
    </div>
    <a className="result-title" href={url || "#"} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={e => { if (!url) e.preventDefault(); }}>{title}</a>
    <p>{item?.description || "No description available."}</p>
    {url && <a className="result-url" href={url} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>{url}<ExternalLink size={12}/></a>}
  </article>;
}

function ImageResults({ results }) {
  return <div className="image-grid">{results.map((item, i) => {
    const image = item.thumbnail || item.image || item.src || "";
    return <a className="image-card" key={item.url || i} href={item.url || item.source_url || "#"} target="_blank" rel="noopener noreferrer">
      <div className="image-preview">{image ? <img src={image} alt={item.title || ""} loading="lazy"/> : <ImageIcon size={28}/>}</div>
      <div className="image-info"><strong>{item.title || "Image"}</strong><span>{item.domain || domain(item.source_url || item.url)}</span></div>
    </a>;
  })}</div>;
}

function NewsResults({ results }) {
  return <div className="news-list">{results.map((item, i) => <article className="news-card" key={item.url || i}>
    {item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy"/>}
    <div><div className="result-source">{item.domain || domain(item.url)}{item.age ? ` · ${item.age}` : ""}</div>
      <a className="result-title" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
      <p>{item.description || ""}</p></div>
  </article>)}</div>;
}

function VideoResults({ results }) {
  return <div className="video-list">{results.map((item, i) => <a className="video-card" key={item.url || i} href={item.url} target="_blank" rel="noopener noreferrer">
    <div className="video-thumb">{item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy"/> : <Play size={28}/>}<span><Play size={14} fill="currentColor"/></span></div>
    <div><strong>{item.title || "Video"}</strong><p>{item.description || ""}</p><small>{item.domain || domain(item.url)}</small></div>
  </a>)}</div>;
}

function SearchPage({ query, type, input, setInput, runSearch, results, loading, error, settings, saved, toggleSaved }) {
  const count = results.length;
  const emptyLabel = type === "images" ? "No images found" : type === "news" ? "No news found" : type === "videos" ? "No videos found" : "No results found";
  return <main className={`search-page ${settings.compact ? "compact" : ""}`}>
    <Tabs query={query} type={type}/>
    <div className="search-layout">
      <div className="results-column">
        <div className="results-toolbar">
          <span>{loading ? "Searching…" : error ? "Search error" : `${count} result${count === 1 ? "" : "s"}`}</span>
          {query && <button className={saved ? "save-query saved" : "save-query"} onClick={() => toggleSaved(query)}><Bookmark size={15} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save search"}</button>}
        </div>
        {loading && <div className="loading-list">{[1,2,3].map(i => <div className="skeleton-result" key={i}><span/><span/><span/><span/></div>)}</div>}
        {error && !loading && <div className="state-card"><div className="state-icon"><Globe2 size={21}/></div><div><strong>Search unavailable</strong><p>{error}</p><button className="retry-btn" onClick={() => runSearch(query, type)}>Try again</button></div></div>}
        {!loading && !error && !count && <div className="state-card empty"><div className="state-icon"><Search size={21}/></div><div><strong>{emptyLabel}</strong><p>Try a broader query or another section.</p></div></div>}
        {!loading && !error && type === "all" && results.map((r,i) => <ResultCard item={r} settings={settings} key={r.url || i}/>)}
        {!loading && !error && type === "images" && <ImageResults results={results}/>}
        {!loading && !error && type === "news" && <NewsResults results={results}/>}
        {!loading && !error && type === "videos" && <VideoResults results={results}/>}
      </div>
      {!loading && query && <aside className="side-panel">
        <div className="side-card"><Sparkles size={17}/><div><strong>Search tools</strong><p>Refine this search with another section or advanced options.</p></div></div>
        <a href={`/advanced?q=${encodeURIComponent(query)}`} className="side-link"><SlidersHorizontal size={15}/>Advanced Search<ArrowUpRight size={14}/></a>
      </aside>}
    </div>
  </main>;
}

function Home({ input, setInput, runSearch, recent, saved }) {
  const suggestions = ["latest technology", "science discoveries", "world news", "learn programming"];
  return <main className="home-main">
    <div className="hero-brand"><span className="hero-n">N</span><span>Nexus</span></div>
    <p className="tagline">Search beyond the obvious.</p>
    <SearchField value={input} onChange={setInput} onSubmit={() => runSearch(input) } large/>
    <div className="home-links"><a href="/advanced"><SlidersHorizontal size={15}/>Advanced Search</a><a href="/about"><Sparkles size={15}/>About Nexus</a></div>
    <div className="suggestion-row">{suggestions.map(x => <button key={x} onClick={() => runSearch(x)}>{x}</button>)}</div>
    {(recent.length || saved.length) > 0 && <section className="home-panels">
      {recent.length > 0 && <div className="panel"><div className="panel-head"><span><Clock3 size={15}/>Recent</span></div>{recent.slice(0,5).map(x => <button key={x} onClick={() => runSearch(x)}>{x}<ArrowUpRight size={14}/></button>)}</div>}
      {saved.length > 0 && <div className="panel"><div className="panel-head"><span><Bookmark size={15}/>Saved searches</span></div>{saved.slice(0,5).map(x => <button key={x} onClick={() => runSearch(x)}>{x}<ArrowUpRight size={14}/></button>)}</div>}
    </section>}
  </main>;
}

function SettingsPage({ settings, setSettings }) {
  const update = (key, value) => setSettings(s => ({...s, [key]: value}));
  return <main className="page-shell"><div className="page-heading"><span className="page-icon"><Settings size={21}/></span><div><h1>Settings</h1><p>Control how Nexus looks and behaves.</p></div></div>
    <section className="settings-card">
      <SettingRow title="Safe Search" description="Filter explicit or potentially unsafe results." control={<select value={settings.safeSearch} onChange={e => update("safeSearch", e.target.value)}><option value="moderate">Moderate</option><option value="strict">Strict</option><option value="off">Off</option></select>}/>
      <SettingRow title="Open results in new tabs" description="Keep Nexus open while visiting a result." control={<button className={`switch ${settings.openResultsNewTab ? "on" : ""}`} onClick={() => update("openResultsNewTab", !settings.openResultsNewTab)}><span/></button>}/>
      <SettingRow title="Compact results" description="Reduce spacing between search results." control={<button className={`switch ${settings.compact ? "on" : ""}`} onClick={() => update("compact", !settings.compact)}><span/></button>}/>
    </section>
    <div className="saved-note"><Check size={16}/> Settings are saved automatically on this device.</div>
  </main>;
}
function SettingRow({title, description, control}) { return <div className="setting-row"><div><strong>{title}</strong><p>{description}</p></div>{control}</div>; }

function About() {
  return <main className="page-shell about-page"><div className="page-heading"><span className="page-icon hero-mini">N</span><div><h1>About Nexus</h1><p>A focused search experience built to stay fast, clear, and useful.</p></div></div>
    <section className="about-grid"><div className="about-card"><Globe2 size={19}/><h2>Web search</h2><p>Search the open web and move directly from results to the source.</p></div><div className="about-card"><Sparkles size={19}/><h2>More than links</h2><p>Use dedicated sections for images, news, and video discovery.</p></div><div className="about-card"><Settings size={19}/><h2>Your preferences</h2><p>Safe Search, compact results, and tab behavior stay on your device.</p></div></section>
    <a className="github-card" href="https://github.com/Judson-web/NexAi-Neo" target="_blank" rel="noopener noreferrer"><span><strong>Nexus on GitHub</strong><small>View the project source</small></span><ArrowUpRight size={18}/></a>
  </main>;
}

function Advanced({ initialQuery, runSearch }) {
  const [q, setQ] = useState(initialQuery);
  const [exact, setExact] = useState("");
  const [exclude, setExclude] = useState("");
  const [site, setSite] = useState("");
  const [type, setType] = useState("all");
  const submit = () => {
    const parts = [];
    if (q.trim()) parts.push(q.trim());
    if (exact.trim()) parts.push(`"${exact.trim()}"`);
    if (exclude.trim()) parts.push(exclude.trim().split(/\s+/).map(x => `-${x}`).join(" "));
    if (site.trim()) parts.push(`site:${site.trim().replace(/^https?:\/\//, "")}`);
    runSearch(parts.join(" "), type);
  };
  return <main className="page-shell advanced-page"><div className="page-heading"><span className="page-icon"><SlidersHorizontal size={21}/></span><div><h1>Advanced Search</h1><p>Build a more precise query without memorizing operators.</p></div></div>
    <section className="advanced-card">
      <label>All these words<input value={q} onChange={e => setQ(e.target.value)} placeholder="climate science"/></label>
      <label>Exact phrase<input value={exact} onChange={e => setExact(e.target.value)} placeholder="renewable energy"/></label>
      <label>Exclude words<input value={exclude} onChange={e => setExclude(e.target.value)} placeholder="ads politics"/></label>
      <label>Site or domain<input value={site} onChange={e => setSite(e.target.value)} placeholder="example.com"/></label>
      <label>Section<select value={type} onChange={e => setType(e.target.value)}>{TABS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <button className="primary-btn" onClick={submit}>Search with these options <ArrowUpRight size={17}/></button>
    </section>
  </main>;
}

function App() {
  const [page, setPage] = useState(getPage);
  const [query, setQuery] = useState(getQuery);
  const [type, setType] = useState(getType);
  const [input, setInput] = useState(getQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(Boolean(getQuery()) && getPage() === "search");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(() => readStorage(RECENT_KEY, []));
  const [saved, setSaved] = useState(() => readStorage(SAVED_KEY, []));
  const [settings, setSettings] = useState(() => ({...DEFAULT_SETTINGS, ...readStorage(SETTINGS_KEY, {})}));
  const requestId = useRef(0);

  useEffect(() => { writeStorage(SETTINGS_KEY, settings); }, [settings]);

  const updateRecent = useCallback(q => setRecent(current => {
    const next = [q, ...current.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    writeStorage(RECENT_KEY, next); return next;
  }), []);

  const navigate = useCallback((url, replace = false) => {
    if (replace) history.replaceState({}, "", url); else history.pushState({}, "", url);
    setPage(getPage()); setQuery(getQuery()); setType(getType()); setInput(getQuery());
  }, []);

  const runSearch = useCallback(async (value, searchType = type, opts = {}) => {
    const q = String(value || "").trim();
    if (!q) return;
    const id = ++requestId.current;
    const nextUrl = `/search?q=${encodeURIComponent(q)}&type=${searchType}`;
    if (!opts.noNavigate) navigate(nextUrl);
    setQuery(q); setInput(q); setType(searchType); setLoading(true); setError("");
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${searchType}&safe=${settings.safeSearch}`, {headers:{Accept:"application/json"}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Search failed.");
      if (id !== requestId.current) return;
      setResults(Array.isArray(data.results) ? data.results : []);
      updateRecent(q);
    } catch (e) {
      if (id !== requestId.current) return;
      setResults([]); setError(e.message || "Something went wrong.");
    } finally { if (id === requestId.current) setLoading(false); }
  }, [navigate, settings.safeSearch, type, updateRecent]);

  useEffect(() => {
    const onPop = () => {
      requestId.current++;
      setPage(getPage()); setQuery(getQuery()); setType(getType()); setInput(getQuery());
      setError("");
      if (getPage() === "search" && getQuery()) runSearch(getQuery(), getType(), {noNavigate:true});
      else { setResults([]); setLoading(false); }
    };
    window.addEventListener("popstate", onPop);
    const q = getQuery();
    if (q && getPage() === "search") runSearch(q, getType(), {noNavigate:true});
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goHome = () => { requestId.current++; navigate("/"); setResults([]); setError(""); setLoading(false); };
  const toggleSaved = q => setSaved(current => {
    const next = current.includes(q) ? current.filter(x => x !== q) : [q, ...current].slice(0, 20);
    writeStorage(SAVED_KEY, next); return next;
  });

  const savedHere = saved.includes(query);
  return <div className={`app ${page === "search" && !query ? "home" : "inner-page"} `}>
    <Header input={input} setInput={setInput} submit={() => runSearch(input)} page={page} onHome={goHome}/>
    {page === "search" && !query && <Home input={input} setInput={setInput} runSearch={runSearch} recent={recent} saved={saved}/>}
    {page === "search" && query && <SearchPage query={query} type={type} input={input} setInput={setInput} runSearch={runSearch} results={results} loading={loading} error={error} settings={settings} saved={savedHere} toggleSaved={toggleSaved}/>}
    {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings}/>}
    {page === "about" && <About/>}
    {page === "advanced" && <Advanced initialQuery={query} runSearch={runSearch}/>}
    <footer><span>Nexus</span><span>·</span><a href="/about">About</a><span>·</span><a href="/settings">Settings</a><span>·</span><a href="https://github.com/Judson-web/NexAi-Neo" target="_blank" rel="noopener noreferrer">GitHub</a></footer>
  </div>;
}
createRoot(document.getElementById("root")).render(<App/>);
