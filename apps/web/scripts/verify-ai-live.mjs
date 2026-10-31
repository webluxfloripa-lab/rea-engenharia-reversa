// Opt-in live checks use only public REA references and a synthetic project.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {handle} from '../lib/api.mjs';
import {AI} from '../lib/ai.mjs';
if(!process.argv.includes('--allow-external-test'))throw new Error('Informe --allow-external-test para enviar duas consultas genéricas ao provedor gratuito.');
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const db={prepare(q){const stmt=sql.prepare(q);return {bind(...v){return {async first(){return stmt.get(...v)||null;},async all(){return {results:stmt.all(...v)};},async run(){return stmt.run(...v);}};}};}};
const user={userId:'synthetic-live-test'};
async function request(path,body){const r=await handle(new Request('https://integration.test/api/v1/'+path,{method:'POST',headers:{Origin:'https://integration.test','Content-Type':'application/json'},body:JSON.stringify(body)}),{db,user});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
const project=await request('projects',{name:'Synthetic live verification',authorized:true,files:[]});
const started=Date.now();
const rag=await request(`projects/${project.id}/assistant`,{version:1,consent:true,useKnowledge:true,useHistory:false,prompt:'Segundo as fontes do REA, quais são os pré-requisitos para analisar APK com JADX? Responda em até 80 palavras e cite as fontes.'});
assert.ok(rag.sources.length>0);console.log(JSON.stringify({check:'live-rag',at:new Date().toISOString(),provider:rag.provider,model:rag.model,sources:rag.sources.map(s=>({path:s.path,start:s.start,url:s.url})),answer:rag.answer,seconds:Math.round((Date.now()-started)/1000)}));
const delay=Math.max(0,started+AI.intervalMs+100-Date.now());if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
const generated=await request(`projects/${project.id}/assistant`,{version:1,threadVersion:rag.threadVersion,consent:true,useKnowledge:false,useHistory:false,mode:'generate',proposalPath:'sum.ts',prompt:'Crie um arquivo TypeScript pequeno com uma função exportada sum(a: number, b: number) que retorna a soma. Retorne o objeto JSON solicitado.'});
assert.ok(generated.proposal?.syntaxValid,JSON.stringify(generated));
const applied=await request(`projects/${project.id}/apply-ai`,{version:1,messageId:generated.messageId,confirm:true});
assert.equal(applied.version,2);assert.ok(applied.files.some(f=>f.path==='sum.ts'));
console.log(JSON.stringify({check:'live-generate-review-apply',at:new Date().toISOString(),provider:generated.provider,model:generated.model,path:generated.proposal.path,content:generated.proposal.content,syntaxValid:generated.proposal.syntaxValid,syntheticProjectVersion:applied.version,productionDataModified:false}));
