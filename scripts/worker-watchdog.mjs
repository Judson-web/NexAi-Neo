const url=(process.env.KINGSHOT_HEALTH_URL||"https://kingshot-autoredeemer.vercel.app/api/kingshot-health");
const response=await fetch(url,{headers:{"accept":"application/json"},signal:AbortSignal.timeout(10000)});
const body=await response.text();
console.log(`Worker health HTTP ${response.status}: ${body}`);
if(!response.ok)process.exit(1);
try{
 const data=JSON.parse(body);
 if(data.healthy!==true)process.exit(1);
}catch{
 process.exit(1);
}
