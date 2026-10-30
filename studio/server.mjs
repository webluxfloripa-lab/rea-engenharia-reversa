#!/usr/bin/env node
/** REA Studio: private Codespaces UI for authorized local artifact analysis. */
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWebPage, reviewReaEvidence } from './integrations.mjs';

const studioDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(studioDir, '..');
const reaDir = path.resolve(process.env.REA_STUDIO_REA_DIR || path.join(root, 'rea-main'));
const dataDir = path.resolve(process.env.REA_STUDIO_DATA_DIR || path.join(root, '.rea-studio-data'));
const inputsDir = path.join(dataDir, 'alvos');
const reportsDir = path.join(dataDir, 'relatorios');
const tokenPath = path.join(root, '.rea-studio-token');
const host = process.env.REA_STUDIO_HOST || '0.0.0.0';
const port = Number(process.env.PORT || process.env.REA_STUDIO_PORT || '4173');
const MAX_UPLOAD = 10 * 1024 * 1024;
const MAX_TOTAL = 60 * 1024 * 1024;
const MAX_BODY = 32 * 1024;
const MAX_OUTPUT = 5 * 1024 * 1024;
const TIMEOUT_MS = 180_000;
const JOB_LIMIT = 20;
const allowedExtensions = new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.json','.html','.htm','.css','.map','.vue','.svelte','.txt','.md']);
const jobs = new Map();
let runningJob = null;

function error(message, status = 400) { const e = new Error(message); e.status = status; return e; }
function send(res, status, body, type = 'application/json; charset=utf-8', extras = {}) {
  const payload = Buffer.isBuffer(body) ? body : type.startsWith('application/json') ? Buffer.from(JSON.stringify(body)) : Buffer.from(String(body));
  res.writeHead(status, { 'Content-Type': type, 'Content-Length': payload.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY', 'Referrer-Policy':'no-referrer', 'Content-Security-Policy': "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; style-src 'self'; script-src 'self'; connect-src 'self'", ...extras });
  res.end(payload);
}
function slug(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/.test(value)) throw error('Nome de projeto inválido. Use letras, números, - e _.'); return value; }
function relativeFile(value) {
  if (typeof value !== 'string' || !value || value.length > 320 || /[\x00-\x1f\\]/.test(value)) throw error('Caminho inválido.');
  const parts = value.split('/');
  if (parts.length > 15 || parts.some(s=> !s || s === '.' || s === '..' || s.startsWith('.') || s.length > 100)) throw error('Caminho inválido.');
  if (!allowedExtensions.has(path.extname(value).toLowerCase())) throw error('Tipo de arquivo não permitido.');
  return parts.join('/');
}
async function boundedStream(req, cap) {
  const parts = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > cap) throw error('O arquivo ou pedido excedeu o limite permitido.',413);
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}
async function bodyJson(req) { let value; try { value = JSON.parse((await boundedStream(req, MAX_BODY)).toString('utf8')); } catch (e) { if (e.status) throw e; throw error('JSON inválido.'); } if (!value || Array.isArray(value) || typeof value !== 'object') throw error('Pedido inválido.'); return value; }
async function ensurePathWithin(project, relative, create = false) {
  const base = path.join(inputsDir, slug(project));
  if (create) await fs.mkdir(base, {recursive:true});
  const realInputs = await fs.realpath(inputsDir);
  const realBase = await fs.realpath(base).catch(()=>{throw error('Projeto não encontrado.',404)});
  if (!realBase.startsWith(realInputs + path.sep)) throw error('Diretório de projeto não autorizado.',403);
  const file = path.join(realBase, relativeFile(relative));
  if (!file.startsWith(realBase + path.sep)) throw error('Arquivo fora do projeto.',403);
  if (create) await fs.mkdir(path.dirname(file), {recursive:true});
  const realParent = await fs.realpath(path.dirname(file)).catch(()=>{throw error('Pasta não encontrada.',404)});
  if (!realParent.startsWith(realBase + path.sep) && realParent !== realBase) throw error('Pasta não autorizada.',403);
  const existing = await fs.lstat(file).catch(()=>null);
  if (existing?.isSymbolicLink() || existing?.isDirectory()) throw error('Arquivo inválido.',403);
  return file;
}
async function inventory(project) {
  const base = path.join(inputsDir, slug(project));
  const stat = await fs.lstat(base).catch(()=>null);
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) return [];
  const items = [];
  async function walk(dir, prefix='', depth=0) {
    if (depth > 15 || items.length > 150) return;
    for (const e of await fs.readdir(dir, {withFileTypes:true})) {
      if (e.name.startsWith('.') || e.isSymbolicLink()) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(path.join(dir,e.name),rel,depth+1);
      else if (e.isFile() && allowedExtensions.has(path.extname(rel).toLowerCase())) { const s = await fs.stat(path.join(dir,e.name)); items.push({path:rel,bytes:s.size}); }
    }
  }
  await walk(base);
  return items.slice(0,150).sort((a,b)=>a.path.localeCompare(b.path));
}
async function projectList() {
  const entries = await fs.readdir(inputsDir, {withFileTypes:true});
  const names = entries.filter(e=>e.isDirectory() && !e.isSymbolicLink() && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/.test(e.name)).map(e=>e.name);
  return Promise.all(names.map(async name=>{const files=await inventory(name);return {name,files:files.length,bytes:files.reduce((a,x)=>a+x.bytes,0)}}));
}
async function runAnalysis(job) {
  const args=['scripts/rea.mjs','analyze-javascript-application',path.join(inputsDir,job.project),'--json'];
  const started=Date.now(); let stdout=''; let stderr=''; let capped=false;
  try {
    const child = spawn(process.execPath,args,{cwd:reaDir,env:{...process.env,NO_COLOR:'1'},detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
    const kill=()=>{try { if(process.platform!=='win32') process.kill(-child.pid,'SIGKILL'); else child.kill('SIGKILL'); } catch { /* process exited */ }};
    const timeout=setTimeout(()=>{job.timedOut=true;kill()},TIMEOUT_MS);
    const add = (key, chunk) => {
      const t=chunk.toString('utf8');
      if (key==='out') { if (stdout.length + t.length > MAX_OUTPUT) {capped=true;kill();} else stdout+=t; }
      else { if (stderr.length + t.length > MAX_OUTPUT) {capped=true;kill();} else stderr+=t; }
    };
    child.stdout.on('data',chunk=>add('out',chunk)); child.stderr.on('data',chunk=>add('err',chunk));
    const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
    clearTimeout(timeout);
    job.exitCode=code;
    job.status=code===0&&!capped&&!job.timedOut?'concluido':'falhou';
    if(capped) job.error='Saída muito grande; análise interrompida.';
    if(job.timedOut) job.error='Limite de execução de 3 minutos excedido.';
  } catch(e) { job.status='falhou';job.error=String(e.message||e); }
  finally {
    job.durationMs=Date.now()-started;
    job.finishedAt=new Date().toISOString();
    job.stdout=stdout;job.stderr=stderr;
    try {job.parsed=JSON.parse(stdout)} catch {job.parsed=null}
    await fs.writeFile(path.join(reportsDir,`${job.id}.json`),JSON.stringify(job,null,2),{mode:0o600}).catch(()=>{});
    runningJob=null;
  }
}
async function getStatus() {
  let version = 'desconhecida';
  try {version=JSON.parse(await fs.readFile(path.join(reaDir,'package.json'),'utf8')).version;} catch {}
  const built=await fs.stat(path.join(reaDir,'dist/cli-runtime/cli.js')).then(x=>x.isFile()).catch(()=>false);
  return {app:'REA Studio',reaVersion:version,nodeVersion:process.version,built,projects:await projectList(),runningJob,jobCount:jobs.size};
}
async function main() {
  await fs.mkdir(inputsDir,{recursive:true,mode:0o700}); await fs.mkdir(reportsDir,{recursive:true,mode:0o700});
  let token = process.env.REA_STUDIO_TOKEN;
  if (!token) {
    token = await fs.readFile(tokenPath,'utf8').then(s=>s.trim()).catch(async()=>{
      const newToken=crypto.randomBytes(24).toString('hex');
      await fs.writeFile(tokenPath,newToken+'\n',{flag:'wx',mode:0o600}).catch(e=>{if(e.code!=='EEXIST')throw e;});
      return fs.readFile(tokenPath,'utf8').then(s=>s.trim());
    });
  }
  if (!token || token.length < 20) throw new Error('Token do REA Studio muito curto.');
  const server=http.createServer(async(req,res)=>{
    try {
      const url = new URL(req.url,'http://local.invalid');
      if (req.method==='GET' && (url.pathname==='/' || url.pathname==='/app.js' || url.pathname==='/styles.css')) {
        const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
        const type=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8';
        return send(res,200,await fs.readFile(path.join(studioDir,name)),type);
      }
      if (!url.pathname.startsWith('/api/')) return send(res,404,{erro:'Rota não encontrada.'});
      const presented = req.headers['x-rea-token'];
      if (typeof presented!=='string' || !crypto.timingSafeEqual(Buffer.from(presented.padEnd(128,' ').slice(0,128)),Buffer.from(token.padEnd(128,' ').slice(0,128))) || presented!==token) return send(res,401,{erro:'Token inválido. Use o token no arquivo .rea-studio-token.'});
      if (req.method==='GET' && url.pathname==='/api/status') return send(res,200,await getStatus());
      if (req.method==='POST' && url.pathname==='/api/import-web') {
        if (runningJob) throw error('Aguarde a conclusão da análise.',409);
        const { project, sourceUrl, authorized } = await bodyJson(req);
        const name = slug(project);
        if (authorized !== true) throw error('Confirme autorização para pesquisar o conteúdo público.');
        const page = await readWebPage(sourceUrl).catch(e=>{throw error(e.message,422)});
        const filename = 'pesquisa-web/' + crypto.createHash('sha256').update(page.source).digest('hex').slice(0,16) + '.txt';
        const content = ['Origem: ' + page.source,'Título: ' + page.title,'Descrição: ' + page.description,'Texto extraído (não é código-fonte privado):',page.text].join('\n\n');
        const encoded = Buffer.from(content, 'utf8');
        const files = await inventory(name);
        if (files.length >= 100) throw error('Limite de 100 arquivos por projeto.',413);
        if (files.reduce((n,x)=>n+x.bytes,0) + encoded.length > MAX_TOTAL) throw error('Limite de 60 MB por projeto.',413);
        const file = await ensurePathWithin(name,filename,true);
        await fs.writeFile(file,encoded,{flag:'wx',mode:0o600}).catch(e=>{if(e.code==='EEXIST')throw error('Esta URL já foi importada neste projeto.',409);throw e});
        return send(res,201,{ok:true,path:filename,source:page.source,title:page.title,truncated:page.truncated,bytes:encoded.length});
      }
      if (req.method==='POST' && url.pathname==='/api/review-ai') {
        const { id, consent } = await bodyJson(req);
        if (consent !== true) throw error('Autorize o envio das evidências ao provedor de IA.');
        if (process.env.REA_STUDIO_AI_REVIEW !== '1') throw error('Revisão por IA desabilitada. Configure REA_STUDIO_AI_REVIEW=1.',503);
        const job=jobs.get(id);
        if (!job) throw error('Relatório não encontrado.',404);
        const result=await reviewReaEvidence(job).catch(e=>{throw error(e.message,503)});
        return send(res,200,result);
      }
      if (req.method==='GET' && url.pathname==='/api/files') return send(res,200,{files:await inventory(slug(url.searchParams.get('project')))});
      if (req.method==='GET' && url.pathname==='/api/file') {
        const file=await ensurePathWithin(slug(url.searchParams.get('project')),relativeFile(url.searchParams.get('path')));
        const stat=await fs.stat(file).catch(()=>{throw error('Arquivo não encontrado.',404)});
        if (stat.size>512*1024) throw error('Prévia limitada a 512 KB.',413);
        const content=await fs.readFile(file,'utf8');
        const sha=crypto.createHash('sha256').update(content).digest('hex');
        return send(res,200,{content,sha});
      }
      if (req.method==='POST' && url.pathname==='/api/save') {
        if (runningJob) throw error('Aguarde a conclusão da análise antes de editar arquivos.',409);
        const {project,filename,content,expectedSha}=await (async()=>{
          let value;
          try { value=JSON.parse((await boundedStream(req,600*1024)).toString('utf8')); }
          catch(e){if(e.status)throw e;throw error('JSON inválido.')}
          if(!value||Array.isArray(value)||typeof value!=='object')throw error('Pedido inválido.');
          return value;
        })();
        if(typeof content!=='string')throw error('O conteúdo precisa ser texto UTF-8.');
        const encoded=Buffer.from(content,'utf8');
        if(encoded.length>512*1024)throw error('Editor limitado a arquivos de até 512 KB.',413);
        if(typeof expectedSha!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha))throw error('Identificador da versão anterior inválido.');
        const name=slug(project);
        const relative=relativeFile(filename);
        const file=await ensurePathWithin(name,relative);
        const original=await fs.readFile(file).catch(e=>{if(e.code==='ENOENT')throw error('Arquivo não encontrado.',404);throw e;});
        if(original.length>512*1024)throw error('Este arquivo é grande demais para o editor.',413);
        const sha=crypto.createHash('sha256').update(original).digest('hex');
        if(sha!==expectedSha)throw error('Este arquivo mudou desde que foi aberto. Atualize antes de salvar.',409);
        const all=await inventory(name);
        const total=all.reduce((n,x)=>n+x.bytes,0)-original.length+encoded.length;
        if(total>MAX_TOTAL)throw error('Limite de 60 MB por projeto excedido.',413);
        const tmp=file+'.rea-'+crypto.randomBytes(7).toString('hex')+'.tmp';
        try{
          await fs.writeFile(tmp,encoded,{mode:0o600,flag:'wx'});
          await fs.rename(tmp,file);
        }finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
        return send(res,200,{ok:true,sha:crypto.createHash('sha256').update(encoded).digest('hex'),bytes:encoded.length});
      }
      if (req.method==='POST' && url.pathname==='/api/upload') {
        const project=slug(url.searchParams.get('project'));const relative=relativeFile(url.searchParams.get('path'));
        const file=await ensurePathWithin(project,relative,true);
        const incoming=await boundedStream(req,MAX_UPLOAD);
        const files=await inventory(project);
        const existing=files.find(f=>f.path===relative);
        if (!existing && files.length>=100) throw error('Limite de 100 arquivos por projeto.',413);
        const sum=files.reduce((a,f)=>a+f.bytes,0)-(existing?.bytes||0)+incoming.length;
        if(sum>MAX_TOTAL) throw error('Limite de 60 MB por projeto.',413);
        await fs.writeFile(file,incoming,{mode:0o600});
        return send(res,201,{ok:true,project,path:relative,bytes:incoming.length});
      }
      if (req.method==='POST' && url.pathname==='/api/analyze') {
        if(runningJob) throw error('Já existe uma análise em andamento.',409);
        const {project,objective}=await bodyJson(req);
        const name=slug(project);
        if(typeof objective!=='string' || !objective.trim() || objective.length>2000) throw error('Descreva o objetivo da investigação (até 2.000 caracteres).');
        const files=await inventory(name);
        if(!files.length) throw error('Envie pelo menos um arquivo antes de analisar.');
        const built=await fs.stat(path.join(reaDir,'dist/cli-runtime/cli.js')).then(s=>s.isFile()).catch(()=>false);
        if(!built) throw error('REA ainda não compilado. Execute bash INSTALAR_REA_LINUX_MAC.sh no terminal.',503);
        const id=crypto.randomUUID();
        const job={id,project:name,objective:objective.trim(),files:files.map(f=>f.path),startedAt:new Date().toISOString(),status:'executando',command:'node scripts/rea.mjs analyze-javascript-application <diretório autorizado> --json'};
        jobs.set(id,job);
        while(jobs.size>JOB_LIMIT)jobs.delete(jobs.keys().next().value);
        runningJob=id;
        runAnalysis(job);
        return send(res,202,{id,status:job.status});
      }
      if (req.method==='GET' && url.pathname==='/api/job') {
        const job=jobs.get(url.searchParams.get('id')); if(!job) throw error('Execução não encontrada.',404);
        return send(res,200,job);
      }
      if (req.method==='GET' && url.pathname==='/api/jobs') return send(res,200,{jobs:Array.from(jobs.values()).reverse().map(({id,project,objective,status,startedAt,durationMs})=>({id,project,objective,status,startedAt,durationMs}))});
      if (req.method==='GET' && url.pathname==='/api/report') {
        const id=url.searchParams.get('id');
        if(!/^[a-f0-9-]{36}$/.test(id||'')) throw error('Relatório inválido.');
        const file=path.join(reportsDir,`${id}.json`);
        const content=await fs.readFile(file).catch(()=>{throw error('Relatório indisponível.',404)});
        return send(res,200,content,'application/json; charset=utf-8',{'Content-Disposition':`attachment; filename="rea-relatorio-${id}.json"`});
      }
      return send(res,404,{erro:'Recurso não encontrado.'});
    }catch(e){send(res,e.status||500,{erro:e.status?e.message:'Erro interno do servidor.'});if(!e.status)console.error('[REA Studio]',e)}
  });
  server.listen(port,host,()=>{
    const actual=server.address().port;
    console.log(`REA_STUDIO_READY http://localhost:${actual}`);
    console.log('Segurança: mantenha a porta 4173 PRIVADA no GitHub Codespaces.');
    console.log(process.env.REA_STUDIO_TOKEN?'Token configurado por variável de ambiente.':'Token para entrar no painel: cat .rea-studio-token');
  });
}
main().catch(e=>{console.error(e);process.exitCode=1});
