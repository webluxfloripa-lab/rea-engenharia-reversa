import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

async function until(check,count=100,delay=150){
 for(let i=0;i<count;i++){try{const value=await check();if(value)return value;}catch{}await new Promise(r=>setTimeout(r,delay));}
 throw Error('CDP or REA executor did not initialize');
}
test('REA inspects owned Chromium fixture through loopback CDP; no external URL navigation',async()=>{
 const chrome=process.env.REA_TEST_CHROME;
 if(!chrome)throw Error('Set REA_TEST_CHROME to verified Chromium executable');
 const temp=await mkdtemp(path.join(tmpdir(),'rea-chromium-'));
 const fixture=http.createServer((req,res)=>{
  res.writeHead(200,{'content-type':req.url==='/fixture.js'?'application/javascript':'text/html'});
  res.end(req.url==='/fixture.js'?'window.REA_FIXTURE_TEST = 42;':'<!doctype html><html><head><title>REA Owned Fixture</title></head><body><h1 id="rea-fixture-heading">Fixture local aprovada</h1><script src="/fixture.js"></script></body></html>');
 });
 let browser=null,executor=null;
 try{
  await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
  const fixtureUrl='http://127.0.0.1:'+fixture.address().port+'/';
  browser=spawn(chrome,['--headless=new','--no-first-run','--disable-gpu','--disable-extensions','--disable-background-networking','--disable-sync','--no-proxy-server','--user-data-dir='+path.join(temp,'chromium'),'--remote-debugging-port=9223',fixtureUrl],{stdio:'ignore'});
  const cdp='http://127.0.0.1:9223';
  const list=await until(async()=>{const response=await fetch(cdp+'/json/list');if(!response.ok)return null;const tabs=await response.json();return tabs.find(t=>t.type==='page'&&t.url===fixtureUrl)?tabs:null;});
  const chosen=list.find(x=>x.type==='page'&&x.url===fixtureUrl);assert.match(chosen.id,/^[a-zA-Z0-9._-]+$/);
  const secret='REA-BROWSER-TEST-'+('k'.repeat(60));
  executor=spawn(process.execPath,[path.join(root,'workers/executor/server.mjs')],{env:{...process.env,REA_EXECUTOR_TOKEN:secret,REA_EXECUTOR_REA_DIR:path.join(root,'rea-main'),REA_EXECUTOR_DATA_DIR:path.join(temp,'data'),REA_EXECUTOR_PORT:'0',REA_BROWSER_CDP:cdp},stdio:['ignore','pipe','pipe']});
  let stdout='';const base=await until(()=>new Promise(resolve=>{
   executor.stdout.once('data',b=>{stdout+=b.toString();const m=stdout.match(/REA_EXECUTOR_READY (http:\/\/127\.0\.0\.1:\d+)/);resolve(m?.[1]);});
  }),15,100);
  const req=(route,options={})=>fetch(base+route,{...options,headers:{Authorization:'Bearer '+secret,...options.headers}});
  async function analyze(operation,targetId){
   const started=await req('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:'owned-web',operation,targetId})});
   assert.equal(started.status,202,await started.text());
   const {id}=await started.json();
   return until(async()=>{const job=await (await req('/v1/jobs?id='+id)).json();return job.status==='running'?null:job;},120,500);
  }
  const targets=await analyze('browser-targets');
  assert.equal(targets.status,'completed',JSON.stringify(targets).slice(0,2000));
  const inspection=await analyze('browser-page',chosen.id);
  assert.equal(inspection.status,'completed',JSON.stringify(inspection).slice(0,2000));
  assert.ok(inspection.result);
 }finally{
  browser?.kill('SIGKILL');executor?.kill('SIGKILL');
  await new Promise(resolve=>fixture.close(resolve));await rm(temp,{recursive:true,force:true,maxRetries:6,retryDelay:150});
 }
});
