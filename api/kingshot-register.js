const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const body=req.body||{};
 const playerId=String(body.playerId??"").replace(/\D/g,"");
 const kingdomId=String(body.kingdomId??"").replace(/\D/g,"");
 const playerName=String(body.playerName??"").trim().slice(0,120);
 const avatarUrl=String(body.avatarUrl??"").trim().slice(0,500);
 if(!/^\d{5,20}$/.test(playerId))return res.status(400).json({error:"Invalid player ID."});
 if(kingdomId&&!/^\d{1,10}$/.test(kingdomId))return res.status(400).json({error:"Invalid kingdom ID."});
 try{
  const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/register_kingshot_player_v2",{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify({p_player_id:playerId,p_kingdom_id:kingdomId||null,p_player_name:playerName||null,p_avatar_url:avatarUrl||null}),signal:AbortSignal.timeout(10000)});
  const d=await r.json().catch(()=>null);
  if(!r.ok)return res.status(502).json({error:d?.message||d?.hint||"Could not register this player."});
  const result=Array.isArray(d)?d[0]:d;
  return res.status(200).json({registered:true,alreadyRegistered:Boolean(result?.already_registered),player:result?.player||result});
 }catch(e){return res.status(504).json({error:"Registration service timed out."})}
}