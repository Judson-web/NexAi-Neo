import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";
import{Copy,Download,ExternalLink,Image as ImageIcon,Link2,Menu,Search,ShieldCheck,Sparkles,X}from"lucide-react";
import"./styles.css";

const HISTORY_KEY="pfp-history";
const readHistory=()=>{try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]").filter(x=>/^\d{15,22}$/.test(x)).slice(0,6)}catch{return[]}};
const saveHistory=v=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(v))}catch{}};
const normalize=v=>{const s=String(v||"").trim();const m=s.match(/(?:discord(?:app)?\.com\/users\/|discord(?:app)?\.com\/channels\/\d+\/\d+\/)?(\d{15,22})/i);return m?m[1]:""};

const imageUrl=user=>"/api/discord-avatar?id="+encodeURIComponent(user.id)+"&hash="+encodeURIComponent(user.avatar)+"&format="+encodeURIComponent(user.format);

function getInitialId(){const p=new URLSearchParams(location.search).get("id");return normalize(p)||normalize(location.pathname.match(/^\/user\/(\d{15,22})$/)?.[1]||"")}

function Logo(){return <a className="brand" href="/"><span className="brand-mark">D</span><span>Discord PFP Extractor</span></a>}

function App(){
 const initial=getInitialId(),[query,setQuery]=useState(initial),[user,setUser]=useState(null),[loading,setLoading]=useState(!!initial),[error,setError]=useState(""),[recentIds,setRecentIds]=useState(readHistory),[menu,setMenu]=useState(false),[toast,setToast]=useState("");
 const navigateToUser=id=>{window.history.replaceState(null,"","/user/"+id)};
 const lookup=async raw=>{
  const id=normalize(raw);
  if(!id){setError("Enter a valid Discord user ID or profile URL.");setUser(null);return}
  setQuery(id);setError("");setLoading(true);setUser(null);navigateToUser(id);
  try{const r=await fetch("/api/discord-user?id="+id);const d=await r.json();if(!r.ok)throw Error(d.error||"Could not retrieve this Discord user.");setUser(d);setRecentIds(prev=>{const n=[id,...prev.filter(x=>x!==id)].slice(0,6);saveHistory(n);return n})}
  catch(e){setError(e.message||"Could not retrieve this Discord user.")}finally{setLoading(false)}
 };
 useEffect(()=>{if(initial)lookup(initial);const pop=()=>{const id=getInitialId();setQuery(id);id?lookup(id):(setUser(null),setError(""))};addEventListener("popstate",pop);return()=>removeEventListener("popstate",pop)},[]);
 const copy=async text=>{try{await navigator.clipboard.writeText(text);setToast("Copied")}catch{setToast("Copy failed")}setTimeout(()=>setToast(""),1500)};
 const download=async()=>{if(!user)return;try{const r=await fetch(imageUrl(user));if(!r.ok)throw Error();const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=(user.username||user.id)+"-avatar."+user.format;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch{window.open(user.avatarUrl,"_blank")}};
 return <div className="app">
  <header><Logo/><nav><a href="#extract">Extract</a><a href="#how">How it works</a></nav><button className="menu-btn" onClick={()=>setMenu(v=>!v)} aria-label="Menu"><Menu size={18}/></button></header>
  {menu&&<div className="mobile-menu"><a href="#extract" onClick={()=>setMenu(false)}>Extract</a><a href="#how" onClick={()=>setMenu(false)}>How it works</a></div>}
  <main>
   <section className="hero" id="extract">
    <div className="eyebrow"><span/>DISCORD AVATAR EXTRACTOR</div>
    <h1>Get the PFP.<br/><em>Keep the quality.</em></h1>
    <p className="hero-copy">Paste a Discord user ID or profile URL. The lookup runs against Discord’s API and returns the user’s current custom avatar.</p>
    <form className="extract-box" onSubmit={e=>{e.preventDefault();lookup(query)}}>
      <Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="User ID or Discord profile URL…" autoComplete="off"/>
      {query&&<button type="button" className="clear" onClick={()=>{setQuery("");setUser(null);setError("")}} aria-label="Clear"><X size={16}/></button>}
      <button className="extract-btn">Extract</button>
    </form>
    <div className="hint"><ShieldCheck size={13}/> Your Discord password and bot token are never requested</div>
    {error&&<div className="error"><b>Couldn’t extract that avatar.</b><span>{error}</span></div>}
    {loading&&<div className="loading-card"><div className="loader-avatar"/><div className="loader-lines"><i/><i/><i/></div></div>}
    {user&&!loading&&<Result user={user} copy={copy} download={download}/>}
   </section>
   <section className="features" id="how"><div className="section-title"><span>01</span><h2>Only the useful stuff.</h2></div><div className="feature-grid">
    <article><ImageIcon/><b>1024px CDN image</b><p>Uses Discord’s avatar CDN and preserves animated GIF avatars.</p></article>
    <article><Link2/><b>Shareable lookup</b><p>Each result gets a clean <code>/user/ID</code> URL.</p></article>
    <article><Sparkles/><b>No account needed</b><p>No Discord login, password, or client token is collected.</p></article>
   </div></section>
   {recentIds.length>0&&<section className="history"><div className="section-title"><span>02</span><h2>Recent lookups</h2></div><div className="history-row">{recentIds.map(id=><button key={id} onClick={()=>lookup(id)}><span>•••{id.slice(-4)}</span><small>{id}</small></button>)}</div></section>}
  </main>
  <footer><Logo/><span>Uses public Discord profile data. Not affiliated with Discord.</span></footer>
  {toast&&<div className="toast">{toast}</div>}
 </div>
}

function Result({user,copy,download}){return <section className="result">
 <div className="avatar-stage"><div className="avatar-glow"/><img src={imageUrl(user)} alt="Discord avatar" onError={e=>{e.currentTarget.style.display="none"}}/><span className="format">{user.animated?"GIF":"PNG"}</span></div>
 <div className="result-info"><div className="result-label">CURRENT DISCORD AVATAR</div><h2>{user.globalName||user.username}</h2><p className="handle">@{user.username}</p>
  <div className="meta-grid"><div><small>USER ID</small><b>{user.id}</b></div><div><small>FORMAT</small><b>{user.format.toUpperCase()}</b></div><div><small>DELIVERY</small><b>1024 × 1024</b></div></div>
  <div className="actions"><button onClick={download}><Download size={15}/> Download</button><button onClick={()=>copy(user.avatarUrl)}><Copy size={15}/> Copy URL</button><a href={user.avatarUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open</a></div>
  <div className="cdn"><span>DISCORD CDN</span><code>{user.avatarUrl}</code></div>
 </div>
 </section>}

createRoot(document.getElementById("root")).render(<App/>);