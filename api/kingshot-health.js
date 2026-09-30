const SUPABASE_URL=process.env.SUPABASE_URL||"https://wocxvtptqapietlteshr.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;

export default async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 if(!SUPABASE_KEY)return res.status(503).json({healthy:false,error:"Health service is not configured."});
 try{
  const r=await fetch(SUPABASE_URL+"/rest/v1/kingshot_worker_state?select=last_started_at,last_finished_at,last_status,lock_until&id=eq.true&limit=1",{
   headers:{apikey:SUPABASE_KEY,authorization:"Bearer "+SUPABASE_KEY},
   signal:AbortSignal.timeout(5000)
  });
  const rows=await r.json().catch(()=>[]);
  if(!r.ok||!Array.isArray(rows)||!rows[0])return res.status(503).json({healthy:false,error:"Worker state unavailable."});
  const state=rows[0],now=Date.now();
  const started=state.last_started_at?Date.parse(state.last_started_at):NaN;
  const finished=state.last_finished_at?Date.parse(state.last_finished_at):NaN;
  const ageMs=state.last_status==="RUNNING"&&Number.isFinite(started)?now-started:Number.isFinite(finished)?now-finished:Infinity;
  const healthy=(state.last_status==="COMPLETED"||state.last_status==="RUNNING")&&ageMs<=12*60*1000;
  res.setHeader("Cache-Control","no-store");
  return res.status(healthy?200:503).json({
   healthy,
   status:String(state.last_status||"UNKNOWN"),
   lastCompletedAt:state.last_finished_at||null,
   runningSince:state.last_status==="RUNNING"?state.last_started_at:null,
   ageSeconds:Number.isFinite(ageMs)?Math.max(0,Math.round(ageMs/1000)):null,
   locked:Boolean(state.lock_until&&Date.parse(state.lock_until)>now)
  });
 }catch(error){
  return res.status(503).json({healthy:false,error:"Worker health check failed."});
 }
}
