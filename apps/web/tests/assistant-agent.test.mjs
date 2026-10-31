import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {handle} from '../lib/api.mjs';
import {knowledgeStatus,searchKnowledge,checkGitHub} from '../lib/knowledge.mjs';
import {parseProposal} from '../lib/ai.mjs';
import {readThread,saveThread} from '../lib/assistant-memory.mjs';

function harness(){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
  const db={prepare(q){const stmt=sql.prepare(q);return {bind(...v){return {async first(){return stmt.get(...v)||null;},async all(){return {results:stmt.all(...v)};},async run(){return stmt.run(...v);}};}};}};
  const user={userId:'A'};
  const req=(path,body,fetcher=()=>{throw new Error('Unexpected fetch');},who=user,method)=>handle(new Request('https://studio.test/api/v1/'+path,{method:method??(body?'POST':'GET'),headers:{Origin:'https://studio.test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),{db,user:who,fetcher});
  const create=async()=>{const r=await req('projects',{name:'Fixture',authorized:true,files:[{path:'a.ts',content:'export const original = 1;'},{path:'b.ts',content:'PRIVATE SECOND FILE'}]});assert.equal(r.status,201);return r.json();};
  const release=()=>sql.prepare("DELETE FROM rate_limits WHERE owner LIKE 'service:%'").run();
  return {sql,db,user,req,create,release};
}
const reply=content=>async()=>Response.json({choices:[{message:{content},finish_reason:'stop'}]});
const question={version:1,prompt:'Olá',consent:true,useKnowledge:false};

test('REA repository retrieval returns actual pinned files and line references',()=>{
  const status=knowledgeStatus(),sources=searchKnowledge('Como analisar APK Android com JADX?');
  assert.equal(status.upstream.version,'6.8.0');assert.ok(status.documents>=90);assert.ok(status.chunks>900);
  assert.ok(sources.length>0);assert.ok(sources.some(s=>s.path==='rea-main/docs/android-analysis.md'));
  for(const s of sources){assert.equal(s.commit,status.commit);assert.match(s.url,/^https:\/\/github.com\/webluxfloripa-lab\/rea-engenharia-reversa\/blob\/[a-f0-9]{40}\/rea-main\//);assert.ok(s.start>0&&s.end>=s.start);assert.equal(s.sha256.length,64);}
  assert.ok(searchKnowledge('Quais os pré-requisitos para analisar APK com JADX?').some(s=>s.excerpt.includes('JDK 17')));
  assert.equal(searchKnowledge('qzxzyqxqzzunknown').length,0);
  assert.throws(()=>searchKnowledge('x'.repeat(4001)));
});

test('GitHub integration uses fixed public branch and no credential',async()=>{
  let called;
  const d=await checkGitHub(async(url,options)=>{called=url;assert.equal(new Headers(options.headers).has('Authorization'),false);assert.equal(options.redirect,'error');return Response.json({commit:{sha:'a'.repeat(40)}});});
  assert.equal(new URL(called).hostname,'api.github.com');assert.match(called,/\/branches\/feature%2Frea-studio-platform-v2$/);assert.equal(d.hasNewCommits,true);
  await assert.rejects(()=>checkGitHub(async()=>new Response('secret body',{status:403})),e=>e.status===429&&!e.message.includes('secret'));
  await assert.rejects(()=>checkGitHub(async()=>new Response('x'.repeat(200001))),e=>e.status===502);
});

test('conversations persist by owner, and recent history can be excluded',async()=>{
  const h=harness(),p=await h.create();
  const a=await h.req(`projects/${p.id}/assistant`,question,reply('Primeira resposta'));assert.equal(a.status,200);
  const saved=await (await h.req(`projects/${p.id}/assistant`)).json();assert.equal(saved.messages.length,2);assert.equal(saved.version,1);
  assert.equal((await h.req(`projects/${p.id}/assistant`,null,undefined,{userId:'B'})).status,404);
  h.release();let sent;
  const next=await h.req(`projects/${p.id}/assistant`,{...question,prompt:'Continue',threadVersion:1},async(_,options)=>{sent=JSON.parse(options.body);return Response.json({choices:[{message:{content:'Continuação'}}]});});assert.equal(next.status,200);assert.ok(sent.messages.some(m=>m.content==='Primeira resposta'));
  h.release();const final=await h.req(`projects/${p.id}/assistant`,{...question,useHistory:false,threadVersion:2},async(_,options)=>{sent=JSON.parse(options.body);return Response.json({choices:[{message:{content:'Sem histórico'}}]});});assert.equal(final.status,200);assert.equal(sent.messages.some(m=>m.content==='Primeira resposta'),false);
});

test('thread compare-and-swap prevents cross-tab overwrites and preserves ten turns',async()=>{
  const h=harness(),p=await h.create();
  await saveThread(h.db,p.id,'A',0,[{role:'user',content:'one'},{role:'assistant',content:'two'}]);
  await assert.rejects(()=>saveThread(h.db,p.id,'A',0,[]),e=>e.status===409);
  const messages=Array.from({length:30},(_,i)=>({id:String(i),role:i%2?'assistant':'user',content:'message '+i}));
  await saveThread(h.db,p.id,'A',1,messages);const result=await readThread(h.db,p.id,'A');assert.equal(result.messages.length,20);assert.equal(result.messages[0].id,'10');
  assert.deepEqual((await readThread(h.db,p.id,'B')).messages,[]);
});

test('selected-file analysis and source retrieval are real and do not include other private files',async()=>{
  const h=harness(),p=await h.create();let sent;
  const r=await h.req(`projects/${p.id}/assistant`,{...question,prompt:'Como analisar JavaScript com REA?',filePath:'a.ts',useKnowledge:true},async(_,options)=>{sent=JSON.parse(options.body);return Response.json({choices:[{message:{content:'Resposta [R1]'}}]});});
  assert.equal(r.status,200);const d=await r.json();assert.ok(d.sources.length>0);assert.deepEqual(d.steps.map(s=>s.tool),['rea.search','code.analyze-selected','ai.respond']);
  assert.ok(sent.messages.some(m=>m.content.includes('evidencia-estatica-local')));assert.equal(JSON.stringify(sent).includes('PRIVATE SECOND FILE'),false);
});

test('strict proposal schema rejects extra keys, changed paths and forbidden files',()=>{
  assert.equal(parseProposal('{"summary":"Soma","path":"sum.ts","content":"export const sum=1;"}','sum.ts').path,'sum.ts');
  for(const data of [{summary:'x',path:'sum.ts',content:'x',command:'execute'},{summary:'x',path:'other.ts',content:'x'},{summary:'x',path:'../sum.ts',content:'x'},{summary:'x',path:'a.exe',content:'x'}])assert.throws(()=>parseProposal(JSON.stringify(data),'sum.ts'));
});

test('generation is read-only until reviewed; application creates revision and preserves originals',async()=>{
  const h=harness(),p=await h.create();
  const result=await h.req(`projects/${p.id}/assistant`,{...question,mode:'generate',proposalPath:'a.ts',filePath:'a.ts'},reply(JSON.stringify({summary:'Melhoria proposta',path:'a.ts',content:'export const original = 2;'})));
  assert.equal(result.status,200);const d=await result.json();assert.ok(d.proposal.syntaxValid);
  assert.equal((await (await h.req(`projects/${p.id}`)).json()).files[0].content,'export const original = 1;');
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:1,messageId:d.messageId})).status,400);
  const applied=await h.req(`projects/${p.id}/apply-ai`,{version:1,messageId:d.messageId,confirm:true});assert.equal(applied.status,200);const doc=await applied.json();
  assert.equal(doc.version,2);assert.equal(doc.files.find(f=>f.path==='a.ts').content,'export const original = 2;');assert.equal(doc.original[0].content,'export const original = 1;');
  assert.equal(h.sql.prepare('SELECT count(*) n FROM revisions WHERE project=?').get(p.id).n,2);
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:2,messageId:d.messageId,confirm:true})).status,409);
});

test('new-file proposal can use another selected file as context',async()=>{
  const h=harness(),p=await h.create();const r=await h.req(`projects/${p.id}/assistant`,{...question,mode:'generate',proposalPath:'new.ts',filePath:'a.ts'},reply(JSON.stringify({summary:'Novo módulo',path:'new.ts',content:'export const newValue=2;'})));const d=await r.json();assert.equal(r.status,200);
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:1,messageId:d.messageId,confirm:true})).status,200);
});

test('stale or syntactically invalid proposals cannot change files',async()=>{
  const h=harness(),p=await h.create();
  let r=await h.req(`projects/${p.id}/assistant`,{...question,mode:'generate',proposalPath:'new.ts'},reply(JSON.stringify({summary:'Inválido',path:'new.ts',content:'export const = ;'})));let d=await r.json();assert.equal(d.proposal.syntaxValid,false);
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:1,messageId:d.messageId,confirm:true})).status,400);
  h.release();r=await h.req(`projects/${p.id}/assistant`,{...question,mode:'generate',proposalPath:'new.ts'},reply(JSON.stringify({summary:'Válido',path:'new.ts',content:'export const valid=1;'})));d=await r.json();
  assert.equal((await h.req(`projects/${p.id}/save`,{version:1,files:[{path:'a.ts',content:'export const changed=3;'}]})).status,200);
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:2,messageId:d.messageId,confirm:true})).status,409);
});

test('model output cannot select another file or cause command execution',async()=>{
  const h=harness(),p=await h.create();const r=await h.req(`projects/${p.id}/assistant`,{...question,mode:'generate',proposalPath:'new.ts'},reply(JSON.stringify({summary:'x',path:'other.ts',content:'export const x=1;'})));const d=await r.json();assert.equal(r.status,200);assert.equal(d.proposal,null);assert.ok(d.generationError);
  assert.equal((await h.req(`projects/${p.id}/apply-ai`,{version:1,messageId:d.messageId,confirm:true})).status,409);
});

test('deleting a project removes its private AI conversation',async()=>{
  const h=harness(),p=await h.create();assert.equal((await h.req(`projects/${p.id}/assistant`,question,reply('Saved'))).status,200);
  assert.equal((await h.req(`projects/${p.id}/archive`,{version:1,archived:true})).status,200);
  assert.equal((await h.req(`projects/${p.id}`,{version:2,confirm:'Fixture'},undefined,h.user,'DELETE')).status,200);
  assert.equal(h.sql.prepare('SELECT count(*) n FROM assistant_threads WHERE project=?').get(p.id).n,0);
});
