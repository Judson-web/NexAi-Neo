import crypto from"node:crypto";
const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"sb_publishable_zF1yhk4TYTujQh8w5NyAJA_3H2K5CEg";
const COOKIE="ks_admin_session";
function hash(value){return crypto.createHash("sha256").update(String(value)).digest("hex")}
function getCookie(req){const raw=String(req.headers.cookie||"");const part=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));return part?decodeURIComponent(part.slice(COOKIE.length+1)):""}
function getVisitorCookie(req){const raw=String(req.headers.cookie||"");const part=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith("ks_ad_visitor="));return part?decodeURIComponent(part.slice("ks_ad_visitor=".length)):""}
function getVisitorIdentity(req){const cookie=getVisitorCookie(req);if(cookie)return cookie;const ip=String(req.headers["x-forwarded-for"]||req.headers["x-real-ip"]||"").split(",")[0].trim();const ua=String(req.headers["user-agent"]||"").slice(0,300);return "ip-fallback:"+hash(ip+"|"+ua+"|"+(process.env.KINGSHOT_API_SECRET||"visitor"))}
async function rpc(name,body){const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||"Admin data service unavailable.");return d}
export default async function handler(req,res){
 if(!["GET","POST","PATCH","DELETE"].includes(req.method))return res.status(405).json({error:"Method not allowed"});
 try{
  const publicMode=String(req.query?.public||"");
  if(req.method==="GET"&&publicMode==="ad"){
   const site=String(req.query?.site||"all"),placement=String(req.query?.placement||"top");
   let visitor=getVisitorCookie(req);
   if(!visitor){visitor=crypto.randomUUID();res.setHeader("Set-Cookie",`ks_ad_visitor=${encodeURIComponent(visitor)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`)}
   const visitorHash=hash(visitor);
   const row=await rpc("kingshot_public_banner_ad",{p_site:site,p_placement:placement,p_visitor_hash:visitorHash});
   const ad=Array.isArray(row)?row[0]:row;
   res.setHeader("Cache-Control","private, no-store");
   return res.status(200).json({ad:ad||null});
  }
  if(req.method==="GET"&&publicMode==="click"){
   const id=String(req.query?.id||"");
   if(!/^[0-9a-f-]{36}$/.test(id))return res.status(400).json({error:"Invalid advertisement."});
   let visitor=getVisitorCookie(req);if(!visitor){visitor=crypto.randomUUID();res.setHeader("Set-Cookie",`ks_ad_visitor=${encodeURIComponent(visitor)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`)}
   const visitorHash=hash(visitor);
   const url=await rpc("kingshot_public_banner_click",{p_id:id,p_visitor_hash:visitorHash});
   res.setHeader("Cache-Control","no-store");
   res.setHeader("Location",String(url));
   return res.status(302).end();
  }
  const session=getCookie(req);if(!session)return res.status(401).json({error:"Unauthorized"});
  const tokenHash=hash(session);
  const audit=async(action,targetType,targetId,details)=>rpc("kingshot_admin_audit",{p_token_hash:tokenHash,p_action:action,p_target_type:targetType||null,p_target_id:targetId||null,p_details:details||{}}).catch(()=>false);
  const valid=await rpc("kingshot_admin_validate_session",{p_token_hash:tokenHash});if(!valid)return res.status(401).json({error:"Unauthorized"});
  if(req.method==="POST"){
   const body=req.body||{};
   if(String(body.action||"").toUpperCase()==="TEST_WEBHOOK"){
    const webhook=process.env.DISCORD_KINGSHOT_WEBHOOK_URL||process.env.DISCORD_SCRAPER_WEBHOOK_URL;
    if(!webhook)return res.status(503).json({error:"Discord webhook is not configured."});
    const clean=(value,fallback,max)=>{const v=String(value??"").trim();return v?v.slice(0,max):fallback};
    const title=clean(body.title,"🧪 Webhook Test",256);
    const description=clean(body.description,"Kingshot Auto Redeem webhook is connected successfully.",1024);
    const status=clean(body.status,"Connected",1024);
    const triggeredBy=clean(body.triggeredBy,"Admin panel",1024);
    const footer=clean(body.footer,"Kingshot Redeemer",2048);
    const now=new Date();
    const payload={username:"Kingshot Auto Redeem",embeds:[{title,description,color:0x5865F2,fields:[{name:"Status",value:status,inline:true},{name:"Triggered by",value:triggeredBy,inline:true}],timestamp:now.toISOString(),footer:{text:footer}}]};
    const started=Date.now();
    const wr=await fetch(webhook,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(8000)});
    if(!wr.ok){
     const retryAfter=Number(wr.headers.get("retry-after")||"0");
     const detail=await wr.text().catch(()=>"");
     return res.status(502).json({error:"Discord webhook rejected the alert ("+wr.status+")."+(retryAfter? " Retry after "+Math.ceil(retryAfter)+"s.":"")+(detail? " "+detail.slice(0,180):"")});
    }
    await audit("TEST_WEBHOOK","webhook",null,{latencyMs:Date.now()-started});
    return res.status(200).json({ok:true,latencyMs:Date.now()-started});
   }
   if(String(body.adAction||"")==="upsert"){
    const id=body.id&&/^[0-9a-f-]{36}$/.test(String(body.id))?String(body.id):null;
    const ad=await rpc("kingshot_admin_upsert_banner_ad",{p_token_hash:tokenHash,p_id:id,p_name:String(body.name||""),p_advertiser:String(body.advertiser||""),p_site:String(body.site||"all"),p_placement:String(body.placement||"top"),p_image_url:body.image_url?String(body.image_url):null,p_click_url:String(body.click_url||""),p_alt_text:String(body.alt_text||"Advertisement"),p_headline:String(body.headline||""),p_cta_label:String(body.cta_label||"Learn more"),p_background:String(body.background||"#11131a"),p_active:body.active!==false,p_starts_at:body.starts_at||null,p_ends_at:body.ends_at||null});
    const bannerAds=await rpc("kingshot_admin_list_banner_ads",{p_token_hash:tokenHash});
    return res.status(200).json({ok:true,ad:Array.isArray(ad)?ad[0]:ad,bannerAds:Array.isArray(bannerAds)?bannerAds:[]});
   }
   const code=String(body.code||"").trim(),sourceDate=body.sourceDate?String(body.sourceDate).trim():null;
   if(!(code==="Kingshot888"||/^[A-Z0-9]{6,32}$/.test(code)))return res.status(400).json({error:"Invalid gift code. Use 6-32 letters/numbers, with an uppercase letter and either a digit or all-uppercase text."});
   if(sourceDate&&!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate))return res.status(400).json({error:"Invalid source date."});
   const existing=await rpc("kingshot_admin_add_gift_code",{p_token_hash:tokenHash,p_code:code,p_source_date:sourceDate});
   const giftCodes=await rpc("kingshot_admin_list_gift_codes",{p_token_hash:tokenHash});
   const row=Array.isArray(existing)?existing[0]:existing;
   const list=Array.isArray(giftCodes)?giftCodes:[];
   await audit("ADD_GIFT_CODE","gift_code",row?.id||null,{code:row?.code||code,sourceDate});
   return res.status(200).json({ok:true,code:row?.code||code,existing:Boolean(row?.first_seen_at&&row?.last_seen_at&&row.first_seen_at!==row.last_seen_at),giftCodes:list});
  }
  if(req.method==="DELETE"){
   const body=req.body||{};
   if(String(body.adAction||"")==="delete"){
    const id=String(body.id||"");if(!/^[0-9a-f-]{36}$/.test(id))return res.status(400).json({error:"Invalid advertisement."});
    const ok=await rpc("kingshot_admin_delete_banner_ad",{p_token_hash:tokenHash,p_id:id});
    const bannerAds=await rpc("kingshot_admin_list_banner_ads",{p_token_hash:tokenHash});
    await audit("DELETE_BANNER","banner",id,{});
    return res.status(200).json({ok:Boolean(ok),bannerAds:Array.isArray(bannerAds)?bannerAds:[]});
   }
   const playerId=String(body.playerId||"").trim();if(!/^[0-9]{5,20}$/.test(playerId))return res.status(400).json({error:"Invalid Player ID."});const ok=await rpc("kingshot_admin_set_player_enabled",{p_token_hash:tokenHash,p_player_id:playerId,p_enabled:false});await audit("REVOKE_PLAYER","player",playerId,{});return res.status(200).json({ok:Boolean(ok)});}
  if(req.method==="GET"){
   const [players,tickets,giftCodes,bannerAds,auditLog,scraperComparison]=await Promise.all([rpc("kingshot_admin_list_players",{}),rpc("kingshot_admin_list_tickets",{p_token_hash:tokenHash}),rpc("kingshot_admin_list_gift_codes",{p_token_hash:tokenHash}),rpc("kingshot_admin_list_banner_ads",{p_token_hash:tokenHash}),rpc("kingshot_admin_list_audit",{p_token_hash:tokenHash,p_limit:100}),rpc("kingshot_admin_scraper_comparison",{p_token_hash:tokenHash})]);
   return res.status(200).json({players:Array.isArray(players)?players:[],tickets:Array.isArray(tickets)?tickets:[],giftCodes:Array.isArray(giftCodes)?giftCodes:[],bannerAds:Array.isArray(bannerAds)?bannerAds:[],auditLog:Array.isArray(auditLog)?auditLog:[],scraperComparison:Array.isArray(scraperComparison)?scraperComparison:[]});
  }
  const body=req.body||{},action=String(body.action||"").toUpperCase(),ticketId=String(body.ticketId||"");
  if(!/^[0-9a-f-]{36}$/.test(ticketId))return res.status(400).json({error:"Invalid ticket."});
  if(!["REVOKE","CANCEL"].includes(action))return res.status(400).json({error:"Invalid action."});
  const ticket=await rpc("kingshot_admin_update_ticket",{p_token_hash:tokenHash,p_ticket_id:ticketId,p_action:action});
  await audit(action==="REVOKE"?"REVOKE_TICKET":"CANCEL_TICKET","support_ticket",ticketId,{});
  return res.status(200).json({ok:true,ticket:Array.isArray(ticket)?ticket[0]:ticket});
 }catch(e){return res.status(502).json({error:e.message||"Could not process admin request."})}
}