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

function normalizeCodes(data){
 const rows=Array.isArray(data?.data?.giftCodes)?data.data.giftCodes:[];
 const now=Date.now(),seen=new Set();
 return rows.map(row=>{
  const code=String(row?.code||"").trim();
  const expiresAt=row?.expiresAt?Date.parse(row.expiresAt):null;
  const createdAt=row?.createdAt?Date.parse(row.createdAt):null;
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(code))return null;
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

function cleanPageText(html){
 return decodeHtml(String(html||"")
  .replace(/<script[\s\S]*?<\/script>/gi," ")
  .replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ")
  .replace(/\s+/g," ")
  .trim());
}

function extractPageCodes(html){
 const source=String(html||"");
 const seen=new Set(),rows=[];
 const add=(value)=>{
  const code=decodeHtml(value).trim();
  const key=code.toUpperCase();
  if(!/^[A-Za-z0-9_-]{4,64}$/.test(code)||seen.has(key))return;
  seen.add(key);
  rows.push({code,expiresAt:null,createdAt:0,source:"page"});
 };

 // First handle explicit code attributes/links used by the page UI.
 for(const match of source.matchAll(/(?:data-code|data-gift-code|giftCode|gift_code|["']code["'])\s*[:=]\s*["']([A-Za-z0-9_-]{4,64})["']/gi))add(match[1]);
 for(const match of source.matchAll(/\/gift-codes\/redeem\\?code=([A-Za-z0-9_-]{4,64})/gi))add(match[1]);

 // The page can be rendered without those attributes. In that case inspect only
 // the server-rendered Active Gift Codes section and ignore its navigation/UI words.
 const start=source.search(/Active\s+Gift\s+Codes/i);
 const end=source.search(/Expired\s+Gift\s+Codes/i);
 if(start>=0){
  const section=source.slice(start,end>start?end:Math.min(source.length,start+250000));
  const text=cleanPageText(section);
  const blocked=new Set([
   "active","gift","codes","code","copy","sign","in","to","redeem","share","link",
   "expires","not","specified","yet","view","image","rewards","discover","and",
   "exclusive","for","kingshot","players","total","expired"
  ]);
  for(const token of text.match(/[A-Za-z0-9_-]{4,64}/g)||[]){
   const key=token.toUpperCase();
   if(blocked.has(token.toLowerCase())||/^\\d{1,4}$/.test(token)||/^\\d{1,2}\/\\d{1,2}\/\\d{4}$/.test(token))continue;
   // Gift codes are normally compact alphanumeric/underscore/dash strings.
   // Require either a digit, mixed case, or an all-uppercase token of 6+ chars.
   if(!/\\d/.test(token)&&token===token.toLowerCase())continue;
   if(!/\\d/.test(token)&&token.length<6)continue;
   add(token);
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

async function redeemForPlayer(player,codes){
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
  const [apiResponse,pageResponse]=await Promise.all([
   fetch(GIFT_SOURCE_URL,{headers:{"accept":"application/json","user-agent":"Nex-Kingshot-Redeemer/1.0"},signal:AbortSignal.timeout(15000)}),
   fetch("https://kingshot.net/gift-codes",{headers:{"accept":"text/html","user-agent":"Nex-Kingshot-Redeemer/1.0"},signal:AbortSignal.timeout(15000)})
  ]);
  const raw=await apiResponse.text();
  let data;
  try{data=JSON.parse(raw)}catch{data=null}
  const apiCodes=apiResponse.ok&&data?.status==="success"?normalizeCodes(data):[];
  const pageHtml=pageResponse.ok?await pageResponse.text():"";
  const pageCodes=extractPageCodes(pageHtml);
  const codes=mergeCodes(apiCodes,[...pageCodes,...VERIFIED_FALLBACK_CODES]);
  if(!codes.length)throw Error("Kingshot gift-code sources returned no active codes.");
  console.log("Kingshot auto feed:",{apiActive:data?.data?.activeCount??null,apiCodes:apiCodes.map(x=>x.code),pageCodes:pageCodes.map(x=>x.code),merged:codes.map(x=>x.code)});
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
