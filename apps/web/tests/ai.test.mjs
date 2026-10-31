import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {handle} from '../lib/api.mjs';
import {AI,askAi} from '../lib/ai.mjs';

function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(fs.readFileSync(new URL('../drizzle/0000_remarkable_silk_fever.sql',import.meta.url),'utf8'));
sql.exec(fs.readFileSync(new URL('../drizzle/0001_absent_pet_avengers.sql',import.meta.url),'utf8'));
  const db={prepare(q){const stmt=sql.prepare(q);return {bind(...v){return {async first(){return stmt.get(...v)||null;},async all(){return {results:stmt.all(...v)};},async run(){return stmt.run(...v);}};}};}};
  const owner={userId:'owner-A'},other={userId:'owner-B'};
  const request=async(path,body,user=owner,fetcher=()=>{throw new Error('Unexpected network');},origin='https://studio.test')=>handle(new Request('https://studio.test/api/v1/'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),{db,user,fetcher});
  const create=async(user=owner)=>{const r=await request('projects',{name:'Private',authorized:true,objective:'PRIVATE OBJECTIVE',files:[{path:'a.js',content:'export const SELECTED=1;'},{path:'secret.js',content:'UNSELECTED PRIVATE FILE'}]},user);assert.equal(r.status,201);return r.json();};
  return {sql,db,owner,other,request,create};
}
const success=()=>Response.json({choices:[{message:{content:'Sugestão de teste.'},finish_reason:'stop'}]});

test('AI availability does not allow anonymous requests',async()=>{
  const h=setup(),project=await h.create();let calls=0;
  const cap=await (await h.request('capabilities',null,null)).json();
  assert.equal(cap.capabilities.ai.mode,'anonymous-free');
  assert.equal(cap.capabilities.billing.state,'disabled');
  const r=await h.request(`projects/${project.id}/assistant`,{version:1,prompt:'hello',consent:true},null,()=>{calls++;return success();});
  assert.equal(r.status,401);assert.equal(calls,0);
});

test('another tenant and cross-origin cannot send project code',async()=>{
  const h=setup(),p=await h.create();let calls=0;
  const payload={version:1,prompt:'hello',consent:true,filePath:'a.js'};
  const fetcher=()=>{calls++;return success();};
  assert.equal((await h.request(`projects/${p.id}/assistant`,payload,h.other,fetcher)).status,404);
  assert.equal((await h.request(`projects/${p.id}/assistant`,payload,h.owner,fetcher,'https://evil.test')).status,403);
  assert.equal(calls,0);
});

test('consent, length, file ownership and revision validation happen before network',async()=>{
  const h=setup(),p=await h.create();let calls=0;
  for(const [extra,status] of [[{consent:false},400],[{prompt:'  '},400],[{prompt:'x'.repeat(4001)},400],[{filePath:'missing.js'},404],[{version:0},409]]){
    const r=await h.request(`projects/${p.id}/assistant`,{version:1,prompt:'hello',consent:true,...extra},h.owner,()=>{calls++;return success();});
    assert.equal(r.status,status);
  }
  assert.equal(calls,0);
});

test('only opted-in saved file is sent; no auth, paid routing, mutations or content logging',async()=>{
  const h=setup(),p=await h.create();let sent;
  const r=await h.request(`projects/${p.id}/assistant`,{version:1,prompt:'Explain this',consent:true,filePath:'a.js',endpoint:'https://evil.test',model:'paid',apiKey:'IGNORED'},h.owner,async(url,options)=>{
    assert.equal(url,AI.endpoint);assert.equal(options.redirect,'error');
    assert.equal(new Headers(options.headers).has('Authorization'),false);
    sent=JSON.parse(options.body);return success();
  });
  assert.equal(r.status,200);const d=await r.json();
  assert.equal(d.includedFile,'a.js');assert.equal(d.billing,'disabled');assert.equal(sent.model,AI.model);
  assert.equal(JSON.stringify(sent).includes('UNSELECTED PRIVATE FILE'),false);
  assert.equal(JSON.stringify(sent).includes('PRIVATE OBJECTIVE'),false);
  assert.equal(JSON.stringify(sent).includes('SELECTED=1'),true);
  assert.ok(sent.messages.length>=3);
  assert.equal(h.sql.prepare('SELECT version FROM projects WHERE id=?').get(p.id).version,1);
  assert.equal(h.sql.prepare('SELECT count(*) n FROM revisions WHERE project=?').get(p.id).n,1);
  const audit=JSON.stringify(h.sql.prepare('SELECT * FROM audit_events').all());
  assert.match(audit,/ai.request/);assert.equal(audit.includes('Explain this'),false);assert.equal(audit.includes('SELECTED'),false);assert.equal(audit.includes('Sugestão'),false);
});

test('no file is included by default',async()=>{
  const h=setup(),p=await h.create();let sent;
  const r=await h.request(`projects/${p.id}/assistant`,{version:1,prompt:'Write a small example',consent:true},h.owner,async(_,options)=>{sent=JSON.parse(options.body);return success();});
  assert.equal(r.status,200);assert.equal((await r.json()).includedFile,null);
  assert.ok(sent.messages.length>=2);assert.equal(JSON.stringify(sent).includes('SELECTED=1'),false);
});

test('shared quota is atomic across concurrent users',async()=>{
  const h=setup(),a=await h.create(),b=await h.create(h.other);let calls=0;
  const fetcher=async()=>{calls++;return success();};
  const results=await Promise.all([h.request(`projects/${a.id}/assistant`,{version:1,prompt:'hello',consent:true},h.owner,fetcher),h.request(`projects/${b.id}/assistant`,{version:1,prompt:'hello',consent:true},h.other,fetcher)]);
  assert.deepEqual(results.map(x=>x.status).sort(),[200,429]);assert.equal(calls,1);
});

test('large files and archived projects are not submitted',async()=>{
  const h=setup(),p=await h.create();let calls=0;
  const saved=await h.request(`projects/${p.id}/save`,{version:1,files:[{path:'big.js',content:'x'.repeat(12001)}]});assert.equal(saved.status,200);
  const result=await h.request(`projects/${p.id}/assistant`,{version:2,prompt:'hello',consent:true,filePath:'big.js'},h.owner,()=>{calls++;return success();});assert.equal(result.status,413);
  assert.equal((await h.request(`projects/${p.id}/archive`,{version:2,archived:true})).status,200);
  assert.equal((await h.request(`projects/${p.id}/assistant`,{version:3,prompt:'hello',consent:true},h.owner,()=>{calls++;return success();})).status,409);
  assert.equal(calls,0);
});

test('provider failure has no paid fallback and no leaked provider details',async()=>{
  for(const status of [401,404,429,500]){
    let calls=0;
    await assert.rejects(()=>askAi({prompt:'hello',selected:null},async()=>{calls++;return new Response('INTERNAL SECRET',{status});}),e=>e.status===(status===429?429:503)&&!e.message.includes('SECRET'));
    assert.equal(calls,1);
  }
  await assert.rejects(()=>askAi({prompt:'hello'},async()=>{throw Object.assign(new Error('SECRET'),{name:'TimeoutError'});}),e=>e.status===504&&!e.message.includes('SECRET'));
});

test('malformed, empty and oversized provider output are rejected',async()=>{
  for(const response of [()=>new Response('not json'),()=>Response.json({choices:[{message:{content:''}}]}),()=>new Response('x'.repeat(AI.responseBytes+1))]){
    await assert.rejects(()=>askAi({prompt:'hello',selected:null},async()=>response()),e=>e.status===502);
  }
  const d=await askAi({prompt:'hello'},async()=>Response.json({choices:[{message:{content:'Partial answer'},finish_reason:'length'}]}));assert.equal(d.truncated,true);
});
