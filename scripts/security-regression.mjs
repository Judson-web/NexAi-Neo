import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const checks=[];

function assertCheck(name,condition,detail){
 checks.push({name,ok:Boolean(condition),detail});
}

const auto=read("api/kingshot-auto.js");
const register=read("api/kingshot-register.js");
const support=read("api/kingshot-support.js");
const adminData=read("api/kingshot-admin-data.js");
const adminLogin=read("api/kingshot-admin-login.js");
const health=read("api/kingshot-health.js");

assertCheck("Worker keeps the handled-status terminal set",
 /HANDLED_STATUSES=new Set\\(\\[.*SUCCESS.*RECEIVED.*SAME TYPE EXCHANGE.*TIME_ERROR.*CDK_NOT_FOUND.*USAGE_LIMIT.*\\]\\)/.test(auto));
assertCheck("Worker processes only the newest outstanding code per player",
 /newest outstanding code for each player per run/.test(auto)&&/codes\.find\\(code=>!handled\.has/.test(auto));
assertCheck("Global expired-code lookup fails open instead of crashing the worker",
 /list_kingshot_expired_gift_codes.*catch\\(error=>/.test(auto));
assertCheck("Expired codes are filtered before redemption",
 /activeCodes=codes\.filter\\(item=>!expiredCodes\.has/.test(auto));
assertCheck("Worker health endpoint uses a server-only Supabase credential",
 /SUPABASE_SERVICE_ROLE_KEY\\|\\|process\\.env\\.SUPABASE_SECRET_KEY/.test(health));
assertCheck("Worker health endpoint rejects stale worker state",
 /ageMs<=12\\*60\\*1000/.test(health)&&/status===\"COMPLETED\"\\|\\|state\.last_status===\"RUNNING\"/.test(health));

assertCheck("Worker uses server-only Supabase credential",
 /SUPABASE_SERVICE_ROLE_KEY\|\|process\.env\.SUPABASE_SECRET_KEY/.test(auto));
assertCheck("Registration uses server-only Supabase credential",
 /SUPABASE_SERVICE_ROLE_KEY\|\|process\.env\.SUPABASE_SECRET_KEY/.test(register));
assertCheck("Support uses server-only Supabase credential",
 /SUPABASE_SERVICE_ROLE_KEY\|\|process\.env\.SUPABASE_SECRET_KEY/.test(support));
assertCheck("Worker has scheduler/authorization guard",
 /X-Kingshot-Scheduler-Token|KINGSHOT_SCHEDULER_TOKEN|scheduler/i.test(auto));
assertCheck("Registration has request rate limiting",
 /rateLimit\(req,res,"register",60,60000\)/.test(register));
assertCheck("Support has request rate limiting",
 /rateLimit\(req,res,"support",6,60000\)/.test(support));
assertCheck("Admin login has request rate limiting",
 /rateLimit\(req,res,"admin-login",5,900000\)/.test(adminLogin));
assertCheck("Admin data validates an admin session before privileged work",
 /kingshot_admin_validate_session/.test(adminData));
assertCheck("Admin player listing passes a session token hash",
 /kingshot_admin_list_players.*p_token_hash|p_token_hash.*kingshot_admin_list_players/.test(adminData));
assertCheck("Admin session cookie is HttpOnly/Secure/Strict",
 /HttpOnly; Secure; SameSite=Strict/.test(adminLogin));
assertCheck("Admin login uses a cryptographically random session token",
 /randomBytes\(32\)/.test(adminLogin));
assertCheck("Admin password path delegates verification to Supabase",
 /kingshot_admin_create_session/.test(adminLogin));

const migrationDir=path.join(root,"supabase","migrations");
const migrations=fs.existsSync(migrationDir)
 ? fs.readdirSync(migrationDir).filter(name=>name.endsWith(".sql")).sort().map(name=>read(path.join("supabase","migrations",name))).join("\n")
 : "";

assertCheck("Zero-argument admin player RPC is revoked from public roles",
 /revoke all on function public\.kingshot_admin_list_players\(\) from public, anon, authenticated/i.test(migrations));
assertCheck("Support RPC is revoked from public roles",
 /revoke all on function public\.submit_kingshot_support_ticket\(text,text\) from public, anon, authenticated/i.test(migrations));
assertCheck("Registration RPC is revoked from public roles",
 /revoke all on function public\.register_kingshot_player_v2\(text,text,text,text\) from public, anon, authenticated/i.test(migrations));
assertCheck("Worker claim RPC is revoked from public roles",
 /revoke all on function public\.claim_kingshot_worker_run\(\) from public, anon, authenticated/i.test(migrations));

const failed=checks.filter(item=>!item.ok);
for(const item of checks)console.log(`${item.ok?"PASS":"FAIL"}  ${item.name}${item.detail?": "+item.detail:""}`);
if(failed.length){
 console.error(`\\nSecurity regression checks failed: ${failed.length}/${checks.length}`);
 process.exit(1);
}
console.log(`\\nSecurity regression checks passed: ${checks.length}/${checks.length}`);

assertCheck("Admin data uses a server-only Supabase credential", /SUPABASE_SERVICE_ROLE_KEY\|\|process\.env\.SUPABASE_SECRET_KEY/.test(adminData));
assertCheck("Admin privileged RPC migration revokes public execute", /revoke all on function public\.kingshot_admin_upsert_announcement/.test(read("supabase/migrations/20260930162000_lock_admin_security_definer_rpcs.sql")));
