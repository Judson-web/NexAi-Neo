import React,{useEffect,useState}from"react";
import{ShieldCheck}from"lucide-react";
export default function AdminApp(){
 const [ready,setReady]=useState(false);
 const [players,setPlayers]=useState([]);
 useEffect(()=>{fetch("/api/kingshot-admin-data",{credentials:"same-origin"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{setPlayers(d.players||[]);setReady(true)}).catch(()=>setReady(false))},[]);
 return <div className="app ks-app admin-app"><header><div className="brand ks-brand"><span className="brand-mark">K</span><span>Kingshot Admin</span></div><ShieldCheck size={16}/></header><main><section className="admin-panel"><h1>Registered <em>players.</em></h1>{ready?players.map(p=><div className="admin-row" key={p.id}><b>{p.player_name||"Kingshot Player"}</b><code>{p.player_id}</code><span>{p.kingdom_id||"—"}</span></div>):<p>Authentication required.</p>}</section></main></div>
}