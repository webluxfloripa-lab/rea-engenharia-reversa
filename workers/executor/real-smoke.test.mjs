import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
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
  const started=await r.text();assert.equal(r.status,202,started);const {id}=JSON.parse(started);
  let job;for(let i=0;i<120;i++){await new Promise(x=>setTimeout(x,500));job=await (await call('/v1/jobs?id='+id)).json();if(job.status!=='running')break;}
  assert.equal(job.status,'completed',JSON.stringify(job).slice(0,2400));assert.equal(job.operation,'javascript');
  assert.ok(job.result!==null);
  // Offline HAR evidence: the source is a synthetic, locally generated network capture.
  const har=JSON.stringify({log:{version:'1.2',creator:{name:'REA-test',version:'1.0'},pages:[],entries:[{
    startedDateTime:'2026-10-01T00:00:00.000Z',time:12,
    request:{method:'GET',url:'https://example.org/',httpVersion:'HTTP/1.1',cookies:[],headers:[],queryString:[],headersSize:-1,bodySize:0},
    response:{status:200,statusText:'OK',httpVersion:'HTTP/1.1',cookies:[],headers:[],content:{size:0,mimeType:'text/html'},redirectURL:'',headersSize:-1,bodySize:0},
    cache:{},timings:{blocked:0,dns:0,connect:0,send:1,wait:10,receive:1,ssl:0}
  }]}});
  r=await call('/v1/artifact?project=owned-fixture&name=session.har',{method:'PUT',body:har});
  assert.equal(r.status,201,await r.text());
  r=await call('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'owned-fixture',file:'session.har',operation:'network-har'})});
  const harStart=await r.text();assert.equal(r.status,202,harStart);
  const harId=JSON.parse(harStart).id;let harJob;
  for(let i=0;i<120;i++){await new Promise(x=>setTimeout(x,500));harJob=await (await call('/v1/jobs?id='+harId)).json();if(harJob.status!=='running')break;}
  assert.equal(harJob.status,'completed',JSON.stringify(harJob).slice(0,1800));
  const dll=process.env.REA_SMOKE_DOTNET_ASSEMBLY;
  if(dll){
    const bytes=await readFile(dll);
    r=await call('/v1/artifact?project=owned-fixture&name=Fixture.dll',{method:'PUT',body:bytes});
    assert.equal(r.status,201,await r.text());
    r=await call('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'owned-fixture',file:'Fixture.dll',operation:'managed-artifact'})});
    const dllStart=await r.text();assert.equal(r.status,202,dllStart);
    const dllId=JSON.parse(dllStart).id;let dllJob;
    for(let i=0;i<120;i++){await new Promise(x=>setTimeout(x,500));dllJob=await (await call('/v1/jobs?id='+dllId)).json();if(dllJob.status!=='running')break;}
    assert.equal(dllJob.status,'completed',JSON.stringify(dllJob).slice(0,1800));
  }
 }finally{child.kill();await rm(dir,{recursive:true,force:true});}
});
