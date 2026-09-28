const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const GIFT_API_URL="http://ks-gift-code-api.whiteout-bot.com/giftcode_api.php";

async function rpc(name,body){
 const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const d=await r.json().catch(()=>null);
 if(!r.ok)throw Error(d?.message||"Supabase request failed");
 return d;
}

export default async function handler(req,res){
 const cronSecret=process.env.CRON_SECRET;
 if(!cronSecret||req.headers.authorization!=="Bearer "+cronSecret)return res.status(401).json({error:"Unauthorized"});
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const apiKey=process.env.GIFT_CODE_API_KEY;
 if(!apiKey)return res.status(503).json({error:"Gift code distribution API key is not configured."});
 try{
  const feed=await fetch(GIFT_API_URL,{headers:{"X-API-Key":apiKey,"accept":"application/json","user-agent":"Kingshot-Redeemer/1.0"},signal:AbortSignal.timeout(15000)});
  const raw=await feed.text();
  let data;try{data=JSON.parse(raw)}catch{return res.status(502).json({error:"Gift code source returned invalid JSON."})}
  if(!feed.ok||data?.error||data?.detail)throw Error(data?.error||data?.detail||"Gift code source failed");
  const codes=(Array.isArray(data?.codes)?data.codes:[]).map(x=>String(x).trim()).map(line=>{
   const m=line.match(/^([A-Za-z0-9_-]{1,64})(?:\\s+(\\d{2}\\.\\d{2}\\.\\d{4}))?$/);return m?{code:m[1],date:m[2]||null}:null;
  }).filter(Boolean);
  const players=await rpc("list_kingshot_autoredeem_players",{});
  const list=Array.isArray(players)?players:[];
  let attempted=0,success=0;
  const base="https://"+(process.env.VERCEL_URL||"nex-ai-neo-2um9.vercel.app");
  for(const item of codes){
   await rpc("upsert_kingshot_gift_code",{p_code:item.code,p_source_date:item.date?item.date.split(".").reverse().join("-"):null});
   for(const player of list){
    const rr=await fetch(base+"/api/kingshot-redeem",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({playerId:player.player_id,code:item.code,kid:player.kingdom_id}),signal:AbortSignal.timeout(35000)});
    const d=await rr.json().catch(()=>({error:"Invalid redemption response"}));
    attempted++;
    await rpc("record_kingshot_redemption",{p_player_id:player.player_id,p_code:item.code,p_status:d?.status||"ERROR",p_err_code:d?.errCode??null,p_message:d?.message||d?.error||null});
    if(d?.status==="SUCCESS")success++;
   }
  }
  return res.status(200).json({ok:true,codes:codes.length,players:list.length,attempted,success});
 }catch(e){console.error("Kingshot auto redeem:",e);return res.status(502).json({error:e.message||"Auto redemption failed."})}
}