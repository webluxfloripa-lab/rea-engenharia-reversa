#!/usr/bin/env node
/**
 * REA Studio trusted executor (developer/lab mode).
 * Local-only, single operator; NOT a public SaaS endpoint.
 * Full tenant separation requires a production broker, isolated workers and storage.
 */
import http from 'node:http';
import {randomBytes,randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preflightWebsite} from './website-preflight.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const reaRoot=path.resolve(process.env.REA_EXECUTOR_REA_DIR||path.join(root,'rea-main'));
const dataRoot=path.resolve(process.env.REA_EXECUTOR_DATA_DIR||path.join(root,'.rea-executor-data'));
const token=process.env.REA_EXECUTOR_TOKEN||'';
const host=process.env.REA_EXECUTOR_HOST||'127.0.0.1';
const port=Number(process.env.REA_EXECUTOR_PORT||4183);
const MAX_FILE=64*1024*1024;
const MAX_PROJECT=256*1024*1024;
const MAX_PROJECT_FILES=60;
const MAX_RESPONSE=8*1024*1024;
const TIMEOUT=180000;
const jobs=new Map();
let busy=false;
const allowedFiles=Object.freeze({
  javascript:['.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.css','.map','.vue','.svelte'],
  android:['.apk'],
  managed:['.dll','.exe'],
  artifact:['.asar','.zip','.pck','.bin','.wasm','.exe','.dll','.elf','.so','.a','.apk','.jar','.class','.pyc','.beam','.dtb','.gguf','.safetensors'],
  har:['.har'],saz:['.saz'],qlog:['.qlog']
});
const OPERATIONS=Object.freeze({
  'javascript':{type:'directory',command:'analyze-javascript-application'},
  'android-package':{type:'file',extensions:allowedFiles.android,command:'inspect-android-package',requires:'jadx'},
  'managed-artifact':{type:'file',extensions:allowedFiles.managed,command:'inspect-managed-artifact'},
  'managed-members':{type:'file',extensions:allowedFiles.managed,command:'inspect-managed-members'},
  'artifact':{type:'file',extensions:allowedFiles.artifact,command:'inspect-artifact'},
  'network-har':{type:'file',extensions:allowedFiles.har,command:'inspect-web-network-capture',format:'har'},
  'network-saz':{type:'file',extensions:allowedFiles.saz,command:'inspect-web-network-capture',format:'saz'},
  'network-qlog':{type:'file',extensions:allowedFiles.qlog,command:'inspect-web-network-capture',format:'qlog'},
  'browser-targets':{type:'browser-list',command:'list-browser-targets'},
  'browser-page':{type:'browser',command:'inspect-web-page'}
});
const permittedExtensions=new Set(Object.values(allowedFiles).flat());

function problem(message,status=400){const err=new Error(message);err.status=status;return err;}
function json(res,status,body){const bytes=Buffer.from(JSON.stringify(body));res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':bytes.length,'cache-control':'private, no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'"});res.end(bytes);}
function safeSegment(value){if(typeof value!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value))throw problem('Invalid project identifier.');return value;}
function safeFilename(value){
 if(typeof value!=='string'||value.length>140||! /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)||value.includes('..')||value.startsWith('.'))throw problem('Invalid filename.');
 if(!permittedExtensions.has(path.extname(value).toLowerCase()))throw problem('Unsupported extension.');
 return value;
}
async function body(req,maxBytes){
 const chunks=[];let size=0;
 for await (const item of req){size+=item.length;if(size>maxBytes)throw problem('Payload too large.',413);chunks.push(item);}
 return Buffer.concat(chunks);
}
async function document(req){if(!req.headers['content-type']?.startsWith('application/json'))throw problem('JSON body required.',415);let d;try{d=JSON.parse((await body(req,8192)).toString('utf8'));}catch(e){if(e.status)throw e;throw problem('Invalid JSON.');}if(!d||Array.isArray(d)||typeof d!=='object')throw problem('JSON object required.');return d;}
function authorized(req){
 const received=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';
 const left=Buffer.from(received),right=Buffer.from(token);
 return !!token && left.length===right.length && timingSafeEqual(left,right);
}
async function confined(project,filename,create=false){
 safeSegment(project);safeFilename(filename);
 const dir=path.join(dataRoot,'projects',project);
 if(create)await fs.mkdir(dir,{recursive:true,mode:0o700});
 const actual=await fs.realpath(dir).catch(()=>{throw problem('Project not found.',404);});
 const base=await fs.realpath(path.join(dataRoot,'projects'));
 if(!actual.startsWith(base+path.sep))throw problem('Unsafe directory.',403);
 const file=path.join(actual,filename);
 const stat=await fs.lstat(file).catch(()=>null);
 if(stat && (!stat.isFile()||stat.isSymbolicLink()))throw problem('Unsafe file.',403);
 return file;
}
function category(name,operation){const type=OPERATIONS[operation];if(!type)throw problem('Unsupported operation.');if(type.extensions&&!type.extensions.includes(path.extname(name).toLowerCase()))throw problem('Artifact type does not match operation.');return type;}
async function inspectRoot(rootPath){await fs.mkdir(rootPath,{recursive:true,mode:0o700});const s=await fs.lstat(rootPath);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Data root must be a real directory.');}
async function checkJadx(){const jar=process.env.REA_JADX_MCP_JAR;if(!jar)return false;return fs.stat(jar).then(s=>s.isFile()).catch(()=>false);}
function limitedText(source,limit,stop){
 let value='',size=0;source.on('data',c=>{size+=c.length;if(size>limit)stop('output_exceeded');else value+=c.toString('utf8');});return ()=>value;
}
async function runCli(job,artifact){
 const op=OPERATIONS[job.operation];
 let args=[path.join(reaRoot,'scripts/rea.mjs'),op.command];
 if(op.type==='browser'||op.type==='browser-list'){
  const cdp=process.env.REA_BROWSER_CDP||'';
  if(!/^http:\/\/127\.0\.0\.1:(?:[1-9][0-9]{1,4})$/.test(cdp))throw new Error('Local CDP endpoint not configured');
  args.push(cdp);
  if(op.type==='browser')args.push(job.targetId);
 }else{
  const relative=path.resolve(artifact);
  if(op.type==='directory')args.push(path.dirname(relative));else args.push(relative);
 }
 if(op.format)args.push(op.format);
 args.push('--json');
 const env={PATH:process.env.PATH||'',HOME:process.env.HOME||os.homedir(),TEMP:process.env.TEMP||os.tmpdir(),TMPDIR:process.env.TMPDIR||os.tmpdir(),NO_COLOR:'1'};
 if(process.env.REA_JADX_MCP_JAR)env.REA_JADX_MCP_JAR=process.env.REA_JADX_MCP_JAR;
 if(process.env.JAVA_HOME)env.JAVA_HOME=process.env.JAVA_HOME;
 await new Promise((resolve)=>{
  const child=spawn(process.execPath,args,{cwd:reaRoot,env,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});
  let reason=null;
  const kill=why=>{if(reason)return;reason=why;try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}};
  job.cancel=kill;
  if(job.cancelRequested)kill('cancelled_by_user');
  const stdout=limitedText(child.stdout,MAX_RESPONSE,kill);
  const stderr=limitedText(child.stderr,64*1024,kill);
  const timer=setTimeout(()=>kill('timeout'),TIMEOUT);
  const finish=async(code,signal)=>{
   clearTimeout(timer);
   let parsed;try{parsed=JSON.parse(stdout());}catch{}
   const ok=!reason&&code===0&&parsed!==undefined;
   job.status=ok?'completed':reason==='cancelled_by_user'?'cancelled':'failed';job.finishedAt=new Date().toISOString();
   delete job.cancel;
   job.result=ok?parsed:null;
   job.error=ok?null:reason||('REA exited '+code+(signal?' ('+signal+')':'')+'. '+stderr().slice(0,2500));
   try{await fs.writeFile(path.join(dataRoot,'reports',job.id+'.json'),JSON.stringify({id:job.id,operation:job.operation,project:job.project,file:job.file,status:job.status,finishedAt:job.finishedAt,result:job.result,error:job.error}),{mode:0o600,flag:'wx'});}catch{job.error=job.error||'Report persistence failed';}
   resolve();
  };
  child.on('error',e=>{reason=String(e.message);});
  child.on('close',finish);
 });
}
function prune(){if(jobs.size<=30)return;for(const [id,j] of jobs){if(j.status!=='running'){jobs.delete(id);if(jobs.size<=25)break;}}}
export async function createServer(){
 if(!token||Buffer.byteLength(token)<32)throw Error('REA_EXECUTOR_TOKEN must be a random secret of at least 32 bytes.');
 if(host!=='127.0.0.1'&&host!=='::1')throw Error('Executor must bind exclusively to loopback.');
 await inspectRoot(dataRoot);await inspectRoot(path.join(dataRoot,'projects'));await inspectRoot(path.join(dataRoot,'reports'));
 const reaVersion=JSON.parse(await fs.readFile(path.join(reaRoot,'package.json'),'utf8')).version;
 const built=await fs.stat(path.join(reaRoot,'dist/cli-runtime/cli.js')).then(s=>s.isFile()).catch(()=>false);
 const server=http.createServer(async(req,res)=>{
  try{
   if(!authorized(req))return json(res,401,{error:'Authentication required'});
   const route=new URL(req.url||'/', 'http://localhost');
   if(req.method==='POST'&&route.pathname==='/v1/website/preflight'){
    const input=await document(req),allow=(process.env.REA_APPROVED_WEBSITE_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
    if(!allow.length)throw problem('Website capture disabled: configure explicit approved hosts and sandboxed Chromium before navigation.',503);
    let result;try{result=await preflightWebsite(input.url,{allowedHosts:allow});}catch(e){throw problem(e.message,400);}
    return json(res,200,result);
   }
   if(req.method==='GET'&&route.pathname==='/v1/health'){
    return json(res,200,{service:'rea-executor',ready:built,busy,jobsInMemory:jobs.size,mode:'local-only',timestamp:new Date().toISOString()});
   }
   if(req.method==='GET'&&route.pathname==='/v1/capabilities'){
    return json(res,200,{engine:'REA',version:reaVersion,built,operations:Object.keys(OPERATIONS),androidReady:await checkJadx(),browser:process.env.REA_BROWSER_CDP?'local CDP inspection only, no navigation':'preflight-only; isolated Chromium not configured',deployment:'loopback-single-operator',publicSafe:false,multiTenant:false,maxUploadBytes:MAX_FILE});
   }
   if(req.method==='PUT'&&route.pathname==='/v1/artifact'){
    const project=safeSegment(route.searchParams.get('project')),filename=safeFilename(route.searchParams.get('name'));
    const contents=await body(req,MAX_FILE);
    if(!contents.length)throw problem('Empty upload.');
    const file=await confined(project,filename,true);
    const exists=await fs.lstat(file).catch(()=>null);if(exists)throw problem('Refusing to overwrite an existing artifact.',409);
    const entries=await fs.readdir(path.dirname(file),{withFileTypes:true});
    if(entries.length>=MAX_PROJECT_FILES)throw problem('Project file count limit reached.',413);
    let used=0;
    for(const item of entries){if(!item.isFile())throw problem('Unexpected project filesystem entry.',403);used+=(await fs.stat(path.join(path.dirname(file),item.name))).size;if(used>MAX_PROJECT)break;}
    if(used+contents.length>MAX_PROJECT)throw problem('Project storage quota reached.',413);
    await fs.writeFile(file,contents,{flag:'wx',mode:0o600});
    return json(res,201,{project,file:filename,bytes:contents.length,sha256:createHash('sha256').update(contents).digest('hex')});
   }
   if(req.method==='POST'&&route.pathname==='/v1/jobs'){
    if(!built)throw problem('REA build missing.',503);
    if(busy)throw problem('Executor busy. Try later.',429);
    const input=await document(req),project=safeSegment(input.project),op=OPERATIONS[input.operation];
    if(!op)throw problem('Unsupported operation.');
    const browsing=op.type==='browser'||op.type==='browser-list';
    const file=browsing?'browser-session':safeFilename(input.file);
    if(!browsing)category(file,input.operation);
    if(op.requires==='jadx'&&!(await checkJadx()))throw problem('JADX is not configured. Set REA_JADX_MCP_JAR and install JDK 17+.',503);
    const cdp=process.env.REA_BROWSER_CDP||'';
    if(browsing&&!/^http:\/\/127\.0\.0\.1:(?:[1-9][0-9]{1,4})$/.test(cdp))throw problem('Only local dedicated CDP sessions are supported.',503);
    const targetId=op.type==='browser'?input.targetId:null;
    if(op.type==='browser'&&!(typeof targetId==='string'&&/^[A-Za-z0-9._-]{1,128}$/.test(targetId)))throw problem('Invalid browser target ID.');
    let target=null;
    if(!browsing){
      target=await confined(project,file);
      if(!(await fs.stat(target).then(s=>s.isFile()).catch(()=>false)))throw problem('Artifact not found.',404);
      if(op.type==='directory'&&!allowedFiles.javascript.includes(path.extname(file).toLowerCase()))throw problem('JavaScript input required.');
    }
    const id=randomUUID(),job={id,project,file,operation:input.operation,targetId,status:'running',startedAt:new Date().toISOString(),result:null,error:null,cancelRequested:false};
    jobs.set(id,job);busy=true;prune();
    void runCli(job,target).catch(e=>{job.status='failed';job.error=String(e.message);}).finally(()=>{busy=false;});
    return json(res,202,{id,status:job.status});
   }
   if(req.method==='POST'&&route.pathname==='/v1/jobs/cancel'){
    const input=await document(req);const id=input.id;
    if(typeof id!=='string'||! /^[0-9a-f-]{36}$/.test(id))throw problem('Invalid job id.');
    const job=jobs.get(id);if(!job)throw problem('Job not found.',404);
    if(job.status!=='running')throw problem('Job is no longer running.',409);
    job.cancelRequested=true;job.cancel?.('cancelled_by_user');
    return json(res,202,{id,cancellationRequested:true});
   }
   if(req.method==='GET'&&route.pathname==='/v1/jobs'){
    const id=route.searchParams.get('id');if(!id||! /^[0-9a-f-]{36}$/.test(id))throw problem('Invalid job id.');
    let job=jobs.get(id);
    if(!job){try{job=JSON.parse(await fs.readFile(path.join(dataRoot,'reports',id+'.json'),'utf8'));}catch{throw problem('Job not found.',404);}}
    return json(res,200,job);
   }
   return json(res,404,{error:'Not found'});
  }catch(e){return json(res,e.status||500,{error:e.status?e.message:'Internal error'});}
 });
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 createServer().then(server=>server.listen(port,host,()=>console.log('REA_EXECUTOR_READY http://'+host+':'+server.address().port))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
