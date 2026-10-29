import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const token='REA-STUDIO-TEST-ONLY-TOKEN-0123456789';

test('API do REA Studio: autenticação, arquivos, análise e exportação', async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'rea-studio-test-'));
  const rea=path.join(temp,'rea'); const data=path.join(temp,'user-data');
  await mkdir(path.join(rea,'dist/cli-runtime'),{recursive:true});
  await mkdir(path.join(rea,'scripts'),{recursive:true});
  await writeFile(path.join(rea,'package.json'),' {"name":"rea-agents","version":"6.8.0"} ');
  await writeFile(path.join(rea,'dist/cli-runtime/cli.js'),'// stub');
  await writeFile(path.join(rea,'scripts/rea.mjs'),`console.log(JSON.stringify({ok:true,command:process.argv[2],file:process.argv[3]}));`);
  const child=spawn(process.execPath,[path.join(dir,'server.mjs')],{env:{...process.env,REA_STUDIO_TOKEN:token,REA_STUDIO_HOST:'127.0.0.1',REA_STUDIO_PORT:'0',REA_STUDIO_REA_DIR:rea,REA_STUDIO_DATA_DIR:data},stdio:['ignore','pipe','pipe']});
  let text='';let stderr='';child.stderr.on('data',d=>stderr+=d.toString());
  let url;
  try {
    url=await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error(`Server timeout: ${text}\n${stderr}`)),5000);
      child.stdout.on('data',d=>{text+=d.toString();const m=text.match(/REA_STUDIO_READY (http:\/\/localhost:\d+)/);if(m){clearTimeout(timeout);resolve(m[1])}});
      child.on('exit',code=>{clearTimeout(timeout);reject(new Error('Servidor saiu com '+code+' '+stderr))});
    });
    const req=(route,options={})=>fetch(url+route,{...options,headers:{'X-REA-Token':token,...(options.headers||{})}});
    const denied=await fetch(url+'/api/status');assert.equal(denied.status,401);
    const stat=await req('/api/status');assert.equal(stat.status,200);assert.equal((await stat.json()).built,true);
    const bad=await req('/api/upload?project=alvo&path=..%2Fsegredo.js',{method:'POST',body:'secret'});assert.equal(bad.status,400);
    const uploaded=await req('/api/upload?project=alvo&path=src%2Fexample.js',{method:'POST',body:'export const n = 42;'});assert.equal(uploaded.status,201);
    const lst=await req('/api/files?project=alvo');let files=(await lst.json()).files;assert.deepEqual(files.map(f=>f.path),['src/example.js']);
    const prev=await req('/api/file?project=alvo&path=src%2Fexample.js');assert.match((await prev.json()).content,/const n = 42/);
    const analyze=await req('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:'alvo',objective:'Investigar módulos'})});assert.equal(analyze.status,202);
    const id=(await analyze.json()).id;assert.ok(id);
    let job;
    for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,40));job=await (await req('/api/job?id='+id)).json();if(job.status!=='executando')break}
    assert.equal(job.status,'concluido',JSON.stringify(job));
    assert.equal(job.parsed.command,'analyze-javascript-application');
    const report=await req('/api/report?id='+id);assert.equal(report.status,200);assert.match(report.headers.get('content-disposition'),/attachment/);
    assert.equal((await report.json()).objective,'Investigar módulos');
  } finally {child.kill(); await rm(temp,{recursive:true,force:true})}
});
