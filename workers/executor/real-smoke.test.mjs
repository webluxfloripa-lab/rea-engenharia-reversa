import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const secret='REA-REAL-SMOKE-ONLY-'+('c'.repeat(60));

test('real REA 6.8.0 through authenticated executor on owned JS fixture',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'rea-live-executor-'));
 const child=spawn(process.execPath,[path.join(projectRoot,'workers/executor/server.mjs')],{env:{...process.env,REA_EXECUTOR_TOKEN:secret,REA_EXECUTOR_DATA_DIR:dir,REA_EXECUTOR_REA_DIR:path.join(projectRoot,'rea-main'),REA_EXECUTOR_PORT:'0',REA_EXECUTOR_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
 let result='',stderr='',base;
 child.stderr.on('data',x=>stderr+=String(x));
 try{
  base=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('start timed out: '+stderr)),8000);
   child.stdout.on('data',x=>{result+=x;const m=result.match(/REA_EXECUTOR_READY (http:\/\/127\.0\.0\.1:\d+)/);if(m){clearTimeout(timeout);resolve(m[1]);}});
   child.on('exit',code=>{clearTimeout(timeout);reject(Error('server exited '+code+' '+stderr));});
  });
  const call=(p,options={})=>fetch(base+p,{...options,headers:{Authorization:'Bearer '+secret,...options.headers}});
  const input='export function sum(a, b) { return a + b; }\nexport default sum;\n';
  let r=await call('/v1/artifact?project=owned-fixture&name=module.js',{method:'PUT',body:input});assert.equal(r.status,201,await r.text());
  r=await call('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'owned-fixture',file:'module.js',operation:'javascript'})});
  assert.equal(r.status,202,await r.text());const {id}=await r.json();
  let job;for(let i=0;i<120;i++){await new Promise(x=>setTimeout(x,500));job=await (await call('/v1/jobs?id='+id)).json();if(job.status!=='running')break;}
  assert.equal(job.status,'completed',JSON.stringify(job).slice(0,2400));assert.equal(job.operation,'javascript');
  assert.ok(job.result!==null);
 }finally{child.kill();await rm(dir,{recursive:true,force:true});}
});
