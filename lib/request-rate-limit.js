const buckets=new Map();

function clientKey(req,scope){
 const forwarded=String(req.headers["x-forwarded-for"]||"").split(",")[0].trim();
 const ip=forwarded||String(req.headers["x-real-ip"]||"").trim()||"unknown";
 return scope+":"+ip;
}

export function rateLimit(req,res,scope,limit=20,windowMs=60000){
 const now=Date.now();
 const key=clientKey(req,scope);
 let bucket=buckets.get(key);
 if(!bucket||bucket.resetAt<=now) bucket={count:0,resetAt:now+windowMs};
 bucket.count++;
 buckets.set(key,bucket);
 if(buckets.size>5000){
  for(const [k,v] of buckets) if(v.resetAt<=now) buckets.delete(k);
 }
 res.setHeader("X-RateLimit-Limit",String(limit));
 res.setHeader("X-RateLimit-Remaining",String(Math.max(0,limit-bucket.count)));
 if(bucket.count>limit){
  const retry=Math.max(1,Math.ceil((bucket.resetAt-now)/1000));
  res.setHeader("Retry-After",String(retry));
  res.setHeader("Cache-Control","no-store");
  return false;
 }
 return true;
}
