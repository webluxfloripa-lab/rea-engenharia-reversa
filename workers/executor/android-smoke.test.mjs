import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('REA/JADX inspects hash-verified public Appium ApiDemos through private gateway',async()=>{
 const apk=process.env.REA_TEST_APK,jar=process.env.REA_JADX_MCP_JAR;
 assert.ok(apk&&jar,'A fixed APK fixture and audited JADX JAR are required.');
 const buffer=await readFile(apk),dir=await mkdtemp(path.join(tmpdir(),'rea-test-apk-'));
 const token='REA-ANDROID-SMOKE-'+('x'.repeat(64));
 const child=spawn(process.execPath,[path.join(root,'workers/executor/server.mjs')],{env:{...process.env,REA_EXECUTOR_TOKEN:token,REA_EXECUTOR_REA_DIR:path.join(root,'rea-main'),REA_EXECUTOR_DATA_DIR:dir,REA_EXECUTOR_PORT:'0'},stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stderr.on('data',x=>stderr+=x.toString());
 try{
  const base=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Executor startup: '+stderr)),10000);
   child.stdout.on('data',x=>{stdout+=x.toString();const m=stdout.match(/REA_EXECUTOR_READY (http:\/\/127\.0\.0\.1:\d+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
   child.on('exit',code=>{clearTimeout(timer);reject(new Error('Executor exit '+code+': '+stderr));});
  });
  const request=(p,o={})=>fetch(base+p,{...o,headers:{Authorization:'Bearer '+token,...o.headers}});
  let r=await request('/v1/capabilities');assert.equal(r.status,200);assert.equal((await r.json()).androidReady,true);
  r=await request('/v1/artifact?project=apidemos&name=ApiDemos.apk',{method:'PUT',body:buffer});
  const upload=await r.text();assert.equal(r.status,201,upload);
  r=await request('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'apidemos',file:'ApiDemos.apk',operation:'android-package'})});
  const accepted=await r.text();assert.equal(r.status,202,accepted);
  const {id}=JSON.parse(accepted);
  let job;
  for(let i=0;i<170;i++){await new Promise(t=>setTimeout(t,1000));job=await (await request('/v1/jobs?id='+id)).json();if(job.status!=='running')break;}
  assert.equal(job.status,'completed',JSON.stringify(job).slice(0,3000));
  assert.ok(job.result!==null,'No REA Evidence was retained');
 }finally{child.kill();await rm(dir,{recursive:true,force:true,maxRetries:8,retryDelay:150});}
});
