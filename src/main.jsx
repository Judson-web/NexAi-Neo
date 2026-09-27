import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";
import{createClient}from"@supabase/supabase-js";
import{Copy,Download,ExternalLink,Image as ImageIcon,Link2,LogIn,LogOut,Menu,Search,ShieldCheck,Sparkles,X}from"lucide-react";
import"./styles.css";

const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
const HISTORY_KEY="pfp-history";
const readHistory=()=>{try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]").filter(x=>/^\d{15,22}$/.test(x)).slice(0,6)}catch{return[]}};
const saveHistory=v=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(v))}catch{}};
const normalize=v=>{const s=String(v||"").trim();const m=s.match(/(?:discord(?:app)?\.com\/users\/|discord(?:app)?\.com\/channels\/\d+\/\d+\/)?(\d{15,22})/i);return m?m[1]:""};

const imageUrl=(user,size=1024,format=user.format)=>"/api/discord-avatar?id="+encodeURIComponent(user.id)+"&hash="+encodeURIComponent(user.avatar)+"&format="+encodeURIComponent(format)+"&size="+encodeURIComponent(size);
const getInitialId=()=>{const p=new URLSearchParams(location.search).get("id");return normalize(p)||normalize(location.pathname.match(/^\/user\/(\d{15,22})$/)?.[1]||"")};
function Logo(){return <a className="brand" href="/"><span className="brand-mark">D</span><span>Discord PFP Extractor</span></a>}

function App(){
 const [session,setSession]=useState(null),[authOpen,setAuthOpen]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
 const signOut=async()=>{await supabase.auth.signOut()};
 const initial=getInitialId(),[query,setQuery]=useState(initial),[user,setUser]=useState(null),[loading,setLoading]=useState(!!initial),[error,setError]=useState(""),[recentIds,setRecentIds]=useState(readHistory),[menu,setMenu]=useState(false),[toast,setToast]=useState("");
 const navigateToUser=id=>{window.history.replaceState(null,"","/user/"+id)};
 const lookup=async raw=>{const id=normalize(raw);if(!id){setError("Enter a valid Discord user ID or profile URL.");setUser(null);return}setQuery(id);setError("");setLoading(true);setUser(null);navigateToUser(id);try{const r=await fetch("/api/discord-user?id="+id);const d=await r.json();if(!r.ok)throw Error(d.error||"Could not retrieve this Discord user.");setUser(d);setRecentIds(prev=>{const n=[id,...prev.filter(x=>x!==id)].slice(0,6);saveHistory(n);return n})}catch(e){setError(e.message||"Could not retrieve this Discord user.")}finally{setLoading(false)}};
 useEffect(()=>{if(initial)lookup(initial);const pop=()=>{const id=getInitialId();setQuery(id);id?lookup(id):(setUser(null),setError(""))};addEventListener("popstate",pop);return()=>removeEventListener("popstate",pop)},[]);
 const copy=async text=>{try{await navigator.clipboard.writeText(text);setToast("Copied")}catch{setToast("Copy failed")}setTimeout(()=>setToast(""),1500)};
 return <div className="app"><header><Logo/><nav><a href="#extract">Extract</a><a href="#how">How it works</a></nav><div className="auth-area">{session?<button className="account-btn" onClick={signOut}><span>{session.user.email?.slice(0,1).toUpperCase()}</span><LogOut size={14}/><b>Sign out</b></button>:<button className="account-btn" onClick={()=>setAuthOpen(true)}><LogIn size={14}/><b>Sign in</b></button>}</div><button className="menu-btn" onClick={()=>setMenu(v=>!v)} aria-label="Menu"><Menu size={18}/></button></header>
 {authOpen&&<AuthModal close={()=>setAuthOpen(false)}/>} {menu&&<div className="mobile-menu"><a href="#extract" onClick={()=>setMenu(false)}>Extract</a><a href="#how" onClick={()=>setMenu(false)}>How it works</a></div>}
 <main><section className="hero" id="extract"><div className="eyebrow"><span/>DISCORD AVATAR EXTRACTOR</div><h1>Get the PFP.<br/><em>Keep the quality.</em></h1><p className="hero-copy">Paste a Discord user ID or profile URL. The lookup runs against Discord’s API and returns the user’s current custom avatar.</p>
 <form className="extract-box" onSubmit={e=>{e.preventDefault();lookup(query)}}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="User ID or Discord profile URL…" autoComplete="off"/>{query&&<button type="button" className="clear" onClick={()=>{setQuery("");setUser(null);setError("")}} aria-label="Clear"><X size={16}/></button>}<button className="extract-btn">Extract</button></form>
 <div className="hint"><ShieldCheck size={13}/> Your Discord password and bot token are never requested</div>{error&&<div className="error"><b>Couldn’t extract that avatar.</b><span>{error}</span></div>}{loading&&<div className="loading-card"><div className="loader-avatar"/><div className="loader-lines"><i/><i/><i/></div></div>}{user&&!loading&&<Result user={user} copy={copy}/>}</section>
 <section className="features" id="how"><div className="section-title"><span>01</span><h2>Only the useful stuff.</h2></div><div className="feature-grid"><article><ImageIcon/><b>Up to 4096px CDN image</b><p>Preview and download quality follow the selected CDN size.</p></article><article><Link2/><b>Shareable lookup</b><p>Each result gets a clean <code>/user/ID</code> URL.</p></article><article><Sparkles/><b>No account needed</b><p>No Discord login, password, or client token is collected.</p></article></div></section>
 {recentIds.length>0&&<section className="history"><div className="section-title"><span>02</span><h2>Recent lookups</h2></div><div className="history-row">{recentIds.map(id=><button key={id} onClick={()=>lookup(id)}><span>•••{id.slice(-4)}</span><small>{id}</small></button>)}</div></section>}</main>
 <footer><Logo/><span>Uses public Discord profile data. Not affiliated with Discord.</span></footer>{toast&&<div className="toast">{toast}</div>}</div>
}

function AuthModal({close}){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[mode,setMode]=useState("signin"),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage("");const fn=mode==="signin"?supabase.auth.signInWithPassword({email,password}):supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});const{data,error}=await fn;setBusy(false);if(error){setMessage(error.message);return}if(mode==="signup"&&!data.session)setMessage("Check your email to confirm your account.");else close()};
 const google=async()=>{setBusy(true);const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin}});if(error){setMessage(error.message);setBusy(false)}};
 return <div className="auth-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="auth-card"><button className="auth-close" onClick={close} aria-label="Close"><X size={17}/></button><div className="auth-icon"><LogIn size={18}/></div><div className="result-label">ACCOUNT</div><h2>{mode==="signin"?"Welcome back":"Create account"}</h2><p className="auth-copy">{mode==="signin"?"Sign in to keep your extractor experience synced.":"Create a free account for your extractor."}</p><button className="google-btn" onClick={google} disabled={busy}><span>G</span> Continue with Google</button><div className="auth-divider"><span>or</span></div><form onSubmit={submit}><input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/><input className="auth-input" type="password" placeholder="Password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="auth-submit" disabled={busy}>{busy?"Working…":mode==="signin"?"Sign in":"Create account"}</button></form>{message&&<div className="auth-message">{message}</div>}<button className="auth-switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("")}}>{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button></section></div>
}

function Result({user,copy}){
 const defaultFormat=user.animated?"gif":(user.format||"png"),[quality,setQuality]=useState(1024),[format,setFormat]=useState(defaultFormat),[status,setStatus]=useState("loaded");
 const availableFormats=user.animated?["gif","png","webp"]:["png","jpg","webp"];
 const currentUrl=imageUrl(user,quality,format);
 useEffect(()=>{setStatus("loading");const img=new Image;img.onload=()=>setStatus("loaded");img.onerror=()=>setStatus("error");img.src=currentUrl;return()=>{img.onload=null;img.onerror=null}},[currentUrl]);
 const download=async()=>{try{const r=await fetch(currentUrl);if(!r.ok)throw Error();const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=(user.username||user.id)+"-"+quality+"px."+format;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch{window.open(currentUrl,"_blank")}};
 return <section className="result">
  <div className={"avatar-stage "+(status==="loaded"?"is-loaded":status==="error"?"is-error":"is-loading")}><div className="avatar-glow"/>{status==="error"?<div className="avatar-placeholder"><ImageIcon size={28}/><b>Preview unavailable</b><span>That image format or size could not be loaded.</span></div>:<img src={currentUrl} alt={"Discord avatar "+quality+"px "+format}/>}<span className="format">{quality}px · {format.toUpperCase()}</span></div>
  <div className="result-info"><div className="result-label">CURRENT DISCORD AVATAR</div><h2>{user.globalName||user.username}</h2><p className="handle">@{user.username}</p>
   <div className="meta-grid"><div><small>USER ID</small><b>{user.id}</b></div><div><small>SOURCE</small><b>{defaultFormat.toUpperCase()}</b></div><div><small>PREVIEW</small><b>{quality} × {quality}</b></div></div>
   <div className="download-options"><label><span>QUALITY</span><select value={quality} onChange={e=>setQuality(Number(e.target.value))}>{[16,32,64,128,256,512,1024,2048,4096].map(size=><option key={size} value={size}>{size}px</option>)}</select></label><label><span>EXTENSION</span><select value={format} onChange={e=>setFormat(e.target.value)}>{availableFormats.map(ext=><option key={ext} value={ext}>{ext.toUpperCase()}</option>)}</select></label></div>
   <div className="actions"><button onClick={download}><Download size={15}/> Download</button><button onClick={()=>copy(user.avatarUrl)}><Copy size={15}/> Copy URL</button><a href={user.avatarUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open</a></div><div className="cdn"><span>DISCORD CDN</span><code>{user.avatarUrl}</code></div>
  </div>
 </section>
}

createRoot(document.getElementById("root")).render(<App/>);