import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const key='test-only-not-for-production-'+('a'.repeat(50));

test('executor requires token, validates paths, runs REA commands and returns persisted evidence',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'rea-executor-'));
 const rea=path.join(folder,'rea'),data=path.join(folder,'store');
 await mkdir(path.join(rea,'scripts'),{recursive:true});
 await mkdir(path.join(rea,'dist/cli-runtime'),{recursive:true});
 await writeFile(path.join(rea,'package.json'),JSON.stringify({version:'6.8.0'}));
 await writeFile(path.join(rea,'dist/cli-runtime/cli.js'),'// fixture');
 await writeFile(path.join(rea,'scripts/rea.mjs'),`import fs from 'node:fs';const [name,target]=process.argv.slice(2);console.log(JSON.stringify({ok:true,command:name,targetType:fs.statSync(target).isDirectory()?'directory':'file'}));`);
 const child=spawn(process.execPath,[path.join(here,'server.mjs')],{env:{...process.env,REA_EXECUTOR_TOKEN:key,REA_EXECUTOR_DATA_DIR:data,REA_EXECUTOR_REA_DIR:rea,REA_EXECUTOR_PORT:'0',REA_EXECUTOR_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
 let stderr='',stdout='',base='';
 child.stderr.on('data',x=>stderr+=x.toString());
 try{
  base=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('startup timeout '+stderr)),6000);
   child.stdout.on('data',b=>{stdout+=b.toString();const match=stdout.match(/REA_EXECUTOR_READY (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
   child.on('exit',code=>{clearTimeout(timer);reject(Error('unexpected exit '+code+' '+stderr))});
  });
  const api=(pathname,opt={})=>fetch(base+pathname,{...opt,headers:{Authorization:'Bearer '+key,...opt.headers}});
  let r=await fetch(base+'/v1/capabilities');assert.equal(r.status,401);
  r=await api('/v1/capabilities');assert.equal(r.status,200);assert.equal((await r.json()).version,'6.8.0');
  r=await api('/v1/artifact?project=cliente&name=src%2Fother.js',{method:'PUT',body:'x'});assert.equal(r.status,400);
  r=await api('/v1/artifact?project=cliente&name=app.js',{method:'PUT',body:'export default 1;'});assert.equal(r.status,201);
  r=await api('/v1/artifact?project=cliente&name=app.js',{method:'PUT',body:'overwrite'});assert.equal(r.status,409);
  r=await api('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'cliente',file:'app.js',operation:'javascript'})});
  assert.equal(r.status,202);const {id}=await r.json();
  let job;
  for(let i=0;i<60;i++){await new Promise(done=>setTimeout(done,50));job=await (await api('/v1/jobs?id='+id)).json();if(job.status!=='running')break;}
  assert.equal(job.status,'completed',JSON.stringify(job));assert.equal(job.result.command,'analyze-javascript-application');assert.equal(job.result.targetType,'directory');
  r=await api('/v1/artifact?project=cliente&name=sample.har',{method:'PUT',body:'{"log":{"entries":[]}}'});assert.equal(r.status,201);
  r=await api('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'cliente',file:'sample.har',operation:'network-har'})});assert.equal(r.status,202);
  const another=(await r.json()).id;
  for(let i=0;i<60;i++){await new Promise(done=>setTimeout(done,50));job=await (await api('/v1/jobs?id='+another)).json();if(job.status!=='running')break;}
  assert.equal(job.status,'completed',JSON.stringify(job));assert.equal(job.result.command,'inspect-web-network-capture');
  r=await api('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'cliente',file:'sample.har',operation:'android-package'})});assert.equal(r.status,400);
  r=await api('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'cliente',file:'app.js',operation:'nonexistent'})});assert.equal(r.status,400);
 }finally{child.kill();await rm(folder,{recursive:true,force:true});}
});
