const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const GIFT_SOURCE_URL="https://kingshot.net/api/gift-codes";

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
 }).filter(Boolean).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
}

const HANDLED_STATUSES=new Set(["SUCCESS","RECEIVED","SAME TYPE EXCHANGE","TIME_ERROR","CDK_NOT_FOUND","USAGE_LIMIT"]);

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
  const feed=await fetch(GIFT_SOURCE_URL,{headers:{"accept":"application/json","user-agent":"Nex-Kingshot-Redeemer/1.0"},signal:AbortSignal.timeout(15000)});
  const raw=await feed.text();
  let data;
  try{data=JSON.parse(raw)}catch{return res.status(502).json({error:"Kingshot gift-code source returned invalid JSON."})}
  if(!feed.ok||data?.status!=="success")throw Error(data?.message||"Kingshot gift-code source failed.");

  const codes=normalizeCodes(data);
  const players=await rpc("list_kingshot_autoredeem_players",{});
  const list=Array.isArray(players)?players:[];
  let attempted=0,success=0,skipped=0,alreadyHandled=0;
  const base="https://"+(process.env.VERCEL_URL||"nex-ai-neo-2um9.vercel.app");

  for(const player of list){
   const history=await rpc("list_kingshot_player_redemptions",{p_player_id:player.player_id});
   const handled=new Set(
    (Array.isArray(history)?history:[])
     .filter(row=>HANDLED_STATUSES.has(String(row?.status||"").toUpperCase()))
     .map(row=>String(row?.gift_code||"").toUpperCase())
   );

   for(const item of codes){
    if(handled.has(item.code.toUpperCase())){
     alreadyHandled++;
     continue;
    }

    const rr=await fetch(base+"/api/kingshot-redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playerId:player.player_id,code:item.code,kid:player.kingdom_id}),signal:AbortSignal.timeout(35000)});
    const d=await rr.json().catch(()=>({error:"Invalid redemption response"}));
    attempted++;
    const status=String(d?.status||"ERROR").toUpperCase();
    await rpc("record_kingshot_redemption",{p_player_id:player.player_id,p_code:item.code,p_status:status,p_err_code:d?.errCode??null,p_message:d?.message||d?.error||null});
    if(status==="SUCCESS")success++;
    if(HANDLED_STATUSES.has(status))handled.add(item.code.toUpperCase());
   }
  }

  return res.status(200).json({ok:true,source:"kingshot.net",codes:codes.length,players:list.length,attempted,alreadyHandled,skipped,success});
 }catch(e){
  console.error("Kingshot auto redeem:",e);
  return res.status(502).json({error:e.message||"Auto redemption failed."});
 }
}