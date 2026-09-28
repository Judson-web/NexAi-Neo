const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const GIFT_SOURCE_URL="https://kingshot.net/api/gift-codes";
const NEW_CODE_WINDOW_MS=6*60*60*1000;
const NEW_PLAYER_WINDOW_MS=48*60*60*1000;

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
  const now=Date.now();
  let attempted=0,success=0,skipped=0;
  const base="https://"+(process.env.VERCEL_URL||"nex-ai-neo-2um9.vercel.app");

  for(const item of codes){
   await rpc("upsert_kingshot_gift_code",{p_code:item.code,p_source_date:item.createdAt&&!Number.isNaN(item.createdAt)?new Date(item.createdAt).toISOString().slice(0,10):null});
   const codeIsNew=item.createdAt&&!Number.isNaN(item.createdAt)&&(now-item.createdAt)<=NEW_CODE_WINDOW_MS;

   for(const player of list){
    const registeredAt=player.created_at?Date.parse(player.created_at):NaN;
    const playerIsNew=!Number.isNaN(registeredAt)&&(now-registeredAt)<=NEW_PLAYER_WINDOW_MS;

    // Existing players only receive recently published codes. A newly registered
    // player gets the current active catalogue once, so registration also works
    // when the code predates the registration.
    if(!codeIsNew&&!playerIsNew){skipped++;continue}

    const rr=await fetch(base+"/api/kingshot-redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playerId:player.player_id,code:item.code,kid:player.kingdom_id}),signal:AbortSignal.timeout(35000)});
    const d=await rr.json().catch(()=>({error:"Invalid redemption response"}));
    attempted++;
    await rpc("record_kingshot_redemption",{p_player_id:player.player_id,p_code:item.code,p_status:d?.status||"ERROR",p_err_code:d?.errCode??null,p_message:d?.message||d?.error||null});
    if(d?.status==="SUCCESS")success++;
   }
  }

  return res.status(200).json({ok:true,source:"kingshot.net",codes:codes.length,players:list.length,attempted,skipped,success});
 }catch(e){
  console.error("Kingshot auto redeem:",e);
  return res.status(502).json({error:e.message||"Auto redemption failed."});
 }
}