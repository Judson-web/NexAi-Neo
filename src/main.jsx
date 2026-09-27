import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{Copy,Download,ExternalLink,Image as ImageIcon,Link2,Menu,RefreshCw,Search,ShieldCheck,Sparkles,X}from"lucide-react";
import"./styles.css";

const HISTORY_KEY="pfp-history";
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

function Logo(){return <a className="brand" href="/"><span className="brand-mark">D</span><span>Discord PFP Extractor</span></a>}

function normalize(value){
  const v=String(value||"").trim();
  const match=v.match(/(?:discord(?:app)?\.com\/users\/|discord(?:app)?\.com\/channels\/\d+\/\d+\/)?(\d{15,22})/i);
  if(match)return match[1];
  if(/^\d{15,22}$/.test(v))return v;
  return "";
}

function App(){
  const params=new URLSearchParams(location.search);
  const initial=normalize(params.get("id")||"");
  const[query,setQuery]=useState(initial);
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(!!initial);
  const[error,setError]=useState("");
  const[history,setHistory]=useState(()=>read(HISTORY_KEY,[]));
  const[menu,setMenu]=useState(false);
  const[toast,setToast]=useState("");

  const lookup=async(raw)=>{
    const id=normalize(raw);
    if(!id){setError("Enter a valid Discord user ID.");setUser(null);return}
    setQuery(id);setError("");setLoading(true);setUser(null);
    history.replaceState({}, "", "/?id="+encodeURIComponent(id));
    try{
      const r=await fetch("/api/discord-user?id="+encodeURIComponent(id));
      const d=await r.json();
      if(!r.ok)throw Error(d.error||"Could not retrieve this Discord user.");
      setUser(d);
      setHistory(prev=>{const n=[id,...prev.filter(x=>x!==id)].slice(0,8);write(HISTORY_KEY,n);return n});
    }catch(e){setError(e.message||"Could not retrieve this Discord user.")}finally{setLoading(false)}
  };

  useEffect(()=>{if(initial)lookup(initial);const pop=()=>{const id=normalize(new URLSearchParams(location.search).get("id")||"");setQuery(id);if(id)lookup(id);else{setUser(null);setError("")}};addEventListener("popstate",pop);return()=>removeEventListener("popstate",pop)},[]);

  const copy=async(text)=>{try{await navigator.clipboard.writeText(text);setToast("Copied")}catch{setToast("Copy failed")}setTimeout(()=>setToast(""),1600)};
  const download=async()=>{
    if(!user?.avatarUrl)return;
    try{
      const r=await fetch(user.avatarUrl);const b=await r.blob();const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(user.username||user.id)+"-avatar."+((user.avatarUrl.match(/\.(gif|png|jpe?g|webp)(?:\?|$)/i)||[])[1]||"png");a.click();URL.revokeObjectURL(a.href)
    }catch{window.open(user.avatarUrl,"_blank")}
  };

  return <div className="app">
    <header><Logo/><nav><a href="#extract">Extract</a><a href="#how">How it works</a></nav><button className="menu-btn" onClick={()=>setMenu(!menu)}><Menu size={19}/></button></header>
    {menu&&<div className="mobile-menu"><a href="#extract">Extract</a><a href="#how">How it works</a></div>}
    <main>
      <section className="hero" id="extract">
        <div className="eyebrow"><span/>DISCORD AVATAR TOOL</div>
        <h1>Pull the PFP.<br/><em>Keep the quality.</em></h1>
        <p className="hero-copy">Enter a Discord user ID and get the avatar in its available high-resolution form. No Discord login required.</p>
        <form className="extract-box" onSubmit={e=>{e.preventDefault();lookup(query)}}>
          <Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Paste a Discord user ID…" inputMode="numeric" autoComplete="off"/>{query&&<button type="button" onClick={()=>{setQuery("");setUser(null);setError("")}}><X size={17}/></button>}<button className="extract-btn">Extract <ExternalLink size={15}/></button>
        </form>
        <div className="hint"><ShieldCheck size={13}/> IDs only · No password or Discord token is requested from you</div>
        {error&&<div className="error"><b>Couldn’t extract that avatar.</b><span>{error}</span></div>}
        {loading&&<div className="loading-card"><div className="loader-avatar"/><div><i/><i/><i/></div></div>}
        {user&&!loading&&<Result user={user} copy={copy} download={download}/>}
      </section>
      <section className="features" id="how">
        <div className="section-title"><span>01</span><h2>Built for clean extraction.</h2></div>
        <div className="feature-grid">
          <article><ImageIcon/><b>High resolution</b><p>Uses Discord’s avatar CDN at 1024px when available, with the original format preserved.</p></article>
          <article><Link2/><b>Shareable URLs</b><p>Every lookup gets a simple <code>?id=</code> URL you can copy and send to someone else.</p></article>
          <article><Sparkles/><b>Fast & focused</b><p>No feed, no account system, no clutter. Just the avatar and the tools you need.</p></article>
        </div>
      </section>
      {history.length>0&&<section className="history"><div className="section-title"><span>02</span><h2>Recent extractions</h2></div><div className="history-row">{history.map(id=><button key={id} onClick={()=>lookup(id)}><span>{id.slice(-4)}</span><small>{id}</small></button>)}</div></section>}
    </main>
    <footer><Logo/><span>For public Discord avatar data. Not affiliated with Discord.</span></footer>
    {toast&&<div className="toast">{toast}</div>}
  </div>
}

function Result({user,copy,download}){
  return <section className="result">
    <div className="avatar-stage"><div className="avatar-glow"/><img src={user.avatarUrl} alt={user.username+" avatar"}/><span className="format">{user.animated?"GIF":"IMAGE"}</span></div>
    <div className="result-info">
      <div className="result-label">EXTRACTED AVATAR</div>
      <h2>{user.globalName||user.username}</h2>
      <p className="handle">@{user.username}{user.discriminator&&user.discriminator!=="0"?"#"+user.discriminator:""}</p>
      <div className="meta-grid"><div><small>USER ID</small><b>{user.id}</b></div><div><small>FORMAT</small><b>{user.format.toUpperCase()}</b></div><div><small>SIZE</small><b>1024 × 1024</b></div></div>
      <div className="actions"><button onClick={download}><Download size={16}/> Download PFP</button><button onClick={()=>copy(user.avatarUrl)}><Copy size={16}/> Copy URL</button><a href={user.avatarUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open original</a></div>
      <div className="cdn"><span>DISCORD CDN</span><code>{user.avatarUrl}</code></div>
    </div>
  </section>
}

createRoot(document.getElementById("root")).render(<App/>);