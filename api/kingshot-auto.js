import {redeemKingshot} from"../lib/kingshot-redeem.js";

const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const GIFT_SOURCE_URL="https://kingshot.net/api/gift-codes";
// Verified long-running fallback for codes that have been omitted from the upstream API feed.
// Revalidated against public Kingshot code listings; the redemption endpoint remains the final authority.
const VERIFIED_FALLBACK_CODES=[{code:"VIP777",expiresAt:Date.parse("2026-12-31T23:59:59Z"),createdAt:Date.parse("2026-08-03T00:00:00Z")}];

async function rpc(name,body){
 const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const d=await r.json().catch(()=>null);
 if(!r.ok)throw Error(d?.message||"Supabase request failed");
 return d;
}

const KNOWN_MIXED_CASE_CODES=new Set(["Kingshot888"]);
function isLikelyGiftCode(value){
 const code=String(value||"").trim();
 if(!code||code.length<6||code.length>32)return false;
 // Kingshot codes are case-sensitive. Current codes are overwhelmingly
 // uppercase A-Z/digits; preserve the documented mixed-case legacy code.
 if(!/^[A-Z0-9]+$/.test(code)&&!KNOWN_MIXED_CASE_CODES.has(code))return false;
 if(/^u00[0-9a-f]+/i.test(code))return false;
 // Never accept obvious page/UI prose even if it happens to be uppercase.
 const blocked=new Set(["ACTIVE","EXPIRED","CONTINUE","COPYCODE","SIGNINTOREDEEM","SHARELINK","GIFTCODES","REDEEMGIFTCODE","GIFTCODE","LOADING","COMMUNITY","FEATURES","LATEST","CURRENT","POPULAR","PROFILE","PLAYER","KINGDOM","SERVER","MESSAGE","SETTINGS"]);
 if(blocked.has(code.toUpperCase()))return false;
 return true;
}
function normalizeCodes(data){
 const rows=Array.isArray(data?.data?.giftCodes)?data.data.giftCodes:[];
 const now=Date.now(),seen=new Set();
 return rows.map(row=>{
  const code=String(row?.code||"").trim();
  const expiresAt=row?.expiresAt?Date.parse(row.expiresAt):null;
  const createdAt=row?.createdAt?Date.parse(row.createdAt):null;
  if(!isLikelyGiftCode(code))return null;
  if(expiresAt&&!Number.isNaN(expiresAt)&&expiresAt<=now)return null;
  if(seen.has(code.toUpperCase()))return null;
  seen.add(code.toUpperCase());
  return {code,expiresAt,createdAt};
 }).filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}

function decodeHtml(value){
 return String(value||"")
  .replace(/&amp;/gi,"&")
  .replace(/&quot;/gi,'"')
  .replace(/&#39;/gi,"'")
  .replace(/&lt;/gi,"<")
  .replace(/&gt;/gi,">");
}

function cleanPageLines(html){
 const text=decodeHtml(String(html||"")
  .replace(/<script[\s\S]*?<\/script>/gi," ")
  .replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<\/(?:p|div|section|article|li|h[1-6]|button|a|br|tr|td|header|footer)>/gi,"\n")
  .replace(/<[^>]+>/g," "));
 return text
  .split(/\r?\n/)
  .map(line=>line.replace(/\s+/g," ").trim())
  .filter(Boolean);
}

function extractPageCodes(html){
 const source=String(html||"");
 const seen=new Set(),rows=[];
 const add=(value,expiresAt=null)=>{
  const code=decodeHtml(value).trim();
  const key=code.toUpperCase();
  if(!isLikelyGiftCode(code)||seen.has(key))return;
  if(expiresAt&&!Number.isNaN(expiresAt)&&expiresAt<=Date.now())return;
  seen.add(key);
  rows.push({code,expiresAt,createdAt:0,source:"page"});
 };

 // Handle explicit code attributes/links if the page exposes them.
 for(const match of source.matchAll(/(?:data-code|data-gift-code|giftCode|gift_code|["']code["'])\s*[:=]\s*["']([A-Za-z0-9_-]{4,64})["']/gi))add(match[1]);
 for(const match of source.matchAll(/\/gift-codes\/redeem\?code=([A-Za-z0-9_-]{4,64})/gi))add(match[1]);

 // Otherwise parse only the visible Active Gift Codes card sequence.
 // Each active card is rendered as: Active -> CODE -> optional Expires: DATE.
 const lines=cleanPageLines(source);
 const start=lines.findIndex(line=>/^Active Gift Codes$/i.test(line));
 const end=lines.findIndex((line,index)=>index>start&&/^Expired Gift Codes$/i.test(line));
 if(start>=0){
  const stop=end>start?end:lines.length;
  for(let i=start+1;i<stop;i++){
   if(!/^Active$/i.test(lines[i]))continue;
   const codeLine=lines[i+1];
   if(!codeLine)continue;
   const expiryLine=lines[i+2]||"";
   const expiryMatch=expiryLine.match(/^Expires:\s*(\d{1,2}\/\d{1,2}\/\d{4})$/i);
   const expiresAt=expiryMatch?Date.parse(expiryMatch[1]+" 23:59:59 UTC"):null;
   add(codeLine,expiresAt);
  }
 }
 return rows;
}
function mergeCodes(apiCodes,pageCodes){
 const map=new Map();
 for(const row of [...apiCodes,...pageCodes]){
  const key=row.code.toUpperCase();
  const existing=map.get(key);
  map.set(key,existing?{...existing,expiresAt:existing.expiresAt||row.expiresAt,createdAt:existing.createdAt||row.createdAt,source:existing.source==="api"?"api":"page"}:row);
 }
 return [...map.values()].filter(row=>!row.expiresAt||Number.isNaN(row.expiresAt)||row.expiresAt>Date.now())
  .sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}

const HANDLED_STATUSES=new Set(["SUCCESS","RECEIVED","SAME TYPE EXCHANGE","TIME_ERROR","CDK_NOT_FOUND","USAGE_LIMIT"]);
const PLAYER_CONCURRENCY=8;
const KINGDOM_REVALIDATION_MS=24*60*60*1000;

async function fetchCurrentKingshotPlayer(playerId){
 const key=process.env.MIGHTPULSE_API_KEY||process.env.KSS_API_KEY;
 if(!key)throw Error("MightPulse API key is not configured on the server.");
 const r=await fetch("https://api.mightpulse.com/v1/players/"+encodeURIComponent(playerId)+"?include=base",{
  headers:{Authorization:"Bearer "+key},
  signal:AbortSignal.timeout(15000)
 });
 const d=await r.json().catch(()=>({}));
 if(r.status===404)return {notFound:true};
 if(!r.ok)throw Error(d?.message||d?.error||"MightPulse revalidation failed.");
 return {player:d.player||d};
}

async function ensureCurrentKingdom(player){
 const checkedAt=player.last_kingdom_check_at?Date.parse(player.last_kingdom_check_at):0;
 if(checkedAt&&Date.now()-checkedAt<KINGDOM_REVALIDATION_MS)return {player,revalidated:false};

 const fresh=await fetchCurrentKingshotPlayer(player.player_id);
 if(fresh.notFound){
  await rpc("mark_kingshot_player_stale",{p_player_id:player.player_id,p_reason:"MIGHTPULSE_PLAYER_NOT_FOUND"});
  return {stale:true};
 }

 const p=fresh.player||{};
 const currentKingdom=String(p.kid??p.kingdom_id??"").replace(/\D/g,"");
 if(!currentKingdom)throw Error("MightPulse returned no kingdom for this player.");

 const result=await rpc("record_kingshot_kingdom_revalidation",{
  p_player_id:player.player_id,
  p_kingdom_id:currentKingdom,
  p_player_name:p.nick_name||p.name||p.nickname||null,
  p_avatar_url:p.avatar_url||p.avatar||p.avatarUrl||null
 });
 const updated=result?.player||player;
 if(result?.kingdom_changed)console.log("Kingshot kingdom changed:",{
  playerId:player.player_id,
  from:result.old_kingdom_id,
  to:result.new_kingdom_id
 });
 return {player:updated,revalidated:true,kingdomChanged:Boolean(result?.kingdom_changed)};
}

async function updateScraperHealth(source,codeCount,error=null){
 try{
  const result=await rpc("record_kingshot_scraper_health",{p_source:source,p_code_count:codeCount,p_error:error});
  const health=Array.isArray(result)?result[0]:result;
  const webhook=process.env.DISCORD_SCRAPER_WEBHOOK_URL;
  if(webhook&&(health?.alert||health?.recovered)){
   const prefix=health.alert?"🚨 Kingshot scraper alert":"✅ Kingshot scraper recovered";
   const detail=health.alert
    ? source+" returned no usable gift codes for 3 consecutive runs."
    : source+" is returning gift codes again.";
   await fetch(webhook,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({content:prefix+" — "+detail+" Count: "+String(codeCount)+"."}),signal:AbortSignal.timeout(5000)}).catch(()=>{});
  }
 }catch(error){console.error("Scraper health update failed:",source,error?.message||error)}
}

async function fetchSource(url,kind){
 try{
  const response=await fetch(url,{headers:kind==="api"?{"accept":"application/json","user-agent":"Nex-Kingshot-Redeemer/1.0"}:{"accept":"text/html","user-agent":"Nex-Kingshot-Redeemer/1.0"},signal:AbortSignal.timeout(15000)});
  const body=await response.text();
  if(!response.ok)throw Error("HTTP "+response.status);
  if(kind==="api"){
   let data=null;try{data=JSON.parse(body)}catch{}
   const codes=data?.status==="success"?normalizeCodes(data):[];
   await updateScraperHealth("kingshot-api",codes.length,data?.status==="success"?null:"Invalid API response");
   return {data,codes};
  }
  const codes=extractPageCodes(body);
  await updateScraperHealth("kingshot-page",codes.length,null);
  return {html:body,codes};
 }catch(error){
  await updateScraperHealth(kind==="api"?"kingshot-api":"kingshot-page",0,error?.message||"Source request failed");
  return kind==="api"?{data:null,codes:[]}:{html:"",codes:[]};
 }

}

async function redeemForPlayer(player,codes){
 const kingdomState=await ensureCurrentKingdom(player);
 if(kingdomState.stale)return {attempted:0,success:0,alreadyHandled:0,skipped:1,stale:1};
 if(!kingdomState.player?.kingdom_id)return {attempted:0,success:0,alreadyHandled:0,skipped:1,revalidationError:1};
 player=kingdomState.player;
 const history=await rpc("list_kingshot_player_redemptions",{p_player_id:player.player_id});
 const handled=new Set((Array.isArray(history)?history:[])
  .filter(row=>HANDLED_STATUSES.has(String(row?.status||"").toUpperCase()))
  .map(row=>String(row?.gift_code||"").toUpperCase()));

 // Process only the newest outstanding code for each player per run.
 // This keeps the request comfortably below pg_net's 5s HTTP timeout and
 // respects Kingshot's per-player TOO FREQUENT rate limit. Older missed
 // active codes are picked up on subsequent runs.
 const item=codes.find(code=>!handled.has(code.code.toUpperCase()));
 if(!item)return {attempted:0,success:0,alreadyHandled:codes.length,skipped:0};

 const claimed=await rpc("claim_kingshot_redemption",{p_player_id:player.player_id,p_code:item.code});
 if(!claimed)return {attempted:0,success:0,alreadyHandled:0,skipped:1};

 const d=await redeemKingshot({playerId:player.player_id,code:item.code,kid:player.kingdom_id});
 const status=String(d?.status||"ERROR").toUpperCase();
 await rpc("record_kingshot_redemption",{p_player_id:player.player_id,p_code:item.code,p_status:status,p_err_code:d?.errCode??null,p_message:d?.message||d?.error||null});
 return {attempted:1,success:status==="SUCCESS"?1:0,alreadyHandled:0,skipped:0};
}

async function runWithConcurrency(players,fn,limit){
 const results=new Array(players.length);
 let next=0;
 async function worker(){
  while(true){
   const i=next++;
   if(i>=players.length)return;
   try{results[i]=await fn(players[i])}catch(error){results[i]={error:error?.message||"Player processing failed"}}
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,players.length)},worker));
 return results;
}

export default async function handler(req,res){
 if(!["GET","POST"].includes(req.method))return res.status(405).json({error:"Method not allowed"});
 const cronSecret=process.env.CRON_SECRET;
 const schedulerToken=req.headers["x-kingshot-scheduler-token"];
 let authorized=Boolean(cronSecret&&req.headers.authorization==="Bearer "+cronSecret);
 if(!authorized&&schedulerToken){
  try{authorized=Boolean(await rpc("verify_kingshot_scheduler_token",{p_token:String(schedulerToken)}))}catch{}
 }
 if(!authorized)return res.status(401).json({error:"Unauthorized"});

 try{
  const [apiSource,pageSource,adminRows]=await Promise.all([
   fetchSource(GIFT_SOURCE_URL,"api"),
   fetchSource("https://kingshot.net/gift-codes","page"),
   rpc("list_kingshot_admin_gift_codes",{})
  ]);
  const data=apiSource.data;
  const apiCodes=apiSource.codes;
  const pageHtml=pageSource.html;
  const pageCodes=pageSource.codes;
  const adminCodes=(Array.isArray(adminRows)?adminRows:[]).filter(row=>row?.active!==false).map(row=>({
   code:String(row?.code||"").trim(),
   expiresAt:null,
   createdAt:row?.source_date?Date.parse(String(row.source_date)):Date.parse(String(row?.first_seen_at||"")),
   source:"admin"
  })).filter(row=>isLikelyGiftCode(row.code));
  const codes=mergeCodes(apiCodes,[...pageCodes,...VERIFIED_FALLBACK_CODES,...adminCodes]);
  if(!codes.length)throw Error("Kingshot gift-code sources returned no active codes.");
  console.log("Kingshot auto feed:",{apiActive:data?.data?.activeCount??null,apiCodes:apiCodes.map(x=>x.code),pageCodes:pageCodes.map(x=>x.code),adminCodes:adminCodes.map(x=>x.code),merged:codes.map(x=>x.code)});
  await Promise.all(codes.map(item=>rpc("upsert_kingshot_gift_code",{
   p_code:item.code,
   p_source_date:item.createdAt&&!Number.isNaN(item.createdAt)?new Date(item.createdAt).toISOString().slice(0,10):null
  })));
  const players=await rpc("list_kingshot_autoredeem_players",{});
  const list=Array.isArray(players)?players:[];
  console.log("Kingshot auto players:",{count:list.length,players:list.map(x=>x.player_id)});
  const results=await runWithConcurrency(list,p=>redeemForPlayer(p,codes),PLAYER_CONCURRENCY);
  console.log("Kingshot auto results:",results);
  const totals=results.reduce((a,r)=>{
   a.attempted+=(r?.attempted||0);a.success+=(r?.success||0);a.alreadyHandled+=(r?.alreadyHandled||0);a.skipped+=(r?.skipped||0);a.errors+=r?.error?1:0;return a;
  },{attempted:0,success:0,alreadyHandled:0,skipped:0,errors:0});
  return res.status(200).json({ok:true,source:"kingshot.net",codes:codes.length,players:list.length,...totals});
 }catch(e){
  console.error("Kingshot auto redeem:",e);
  return res.status(502).json({error:e.message||"Auto redemption failed."});
 }
}
