// Server-only transport. Configuration never enables a public route by itself.
export function createAnalysisClient({endpoint,token,fetcher=fetch}={}) {
 if(!endpoint||!token)return {configured:false};
 const base=new URL(endpoint);
 if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('Expected configured HTTPS origin');
 async function request(path,body){
  const r=await fetcher(new URL(path,base),{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error(`Analysis service unavailable (${r.status})`);
  return r.json();
 }
 const id=x=>{if(typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(x))throw new Error('Invalid job ID');return x;};
 return {configured:true,health:()=>request('/v1/health'),
  submit:({owner,projectId,version,files,authorized,idempotencyKey})=>{
   if(!owner||!projectId||!Number.isInteger(version)||authorized!==true||!idempotencyKey)throw new Error('Trusted owner, project version, authorization and idempotency key required');
   return request('/v1/jobs',{owner,projectId,version,files,authorized,idempotencyKey,engine:'rea'});
  },status:job=>request(`/v1/jobs/${id(job)}`),cancel:job=>request(`/v1/jobs/${id(job)}/cancel`,{})};
}
