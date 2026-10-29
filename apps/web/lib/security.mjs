import { sha256 as hashSha256 } from '@noble/hashes/sha2.js';
export const LIMITS = Object.freeze({projects:12,files:24,fileBytes:65536,totalBytes:262144,bodyBytes:700000,revisions:80,perMinute:45,zipBytes:1048576});
export function fail(message,status=400){throw Object.assign(new Error(message),{status});}
export function safePath(p){
  if(typeof p!=='string'||p.length>180||/[\\\x00-\x1f:]/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'||x.startsWith('.'))||! /\.(js|mjs|cjs|jsx|ts|tsx|html|css|json|md|txt|map)$/i.test(p)) fail('Caminho ou extensão não permitido.');
  return p;
}
export function text(value,max,label='Texto') {if(typeof value!=='string'||value.length>max)fail(`${label} inválido.`);return value;}
export function validateFiles(files){
  if(!Array.isArray(files)||files.length>LIMITS.files)fail('Limite de 24 arquivos.');
  const names=new Set();let total=0;
  for(const f of files){safePath(f.path);if(names.has(f.path))fail('Arquivo duplicado.');names.add(f.path);text(f.content,LIMITS.fileBytes,'Conteúdo');const n=new TextEncoder().encode(f.content).length;if(n>LIMITS.fileBytes||f.content.includes('\0'))fail('Arquivo binário ou maior que 64 KB.');total+=n;}
  if(total>LIMITS.totalBytes)fail('Projeto limitado a 256 KB de código.');
  return files.map(f=>({path:f.path,content:f.content}));
}
export async function readJson(req){
  if(!req.headers.get('content-type')?.startsWith('application/json'))fail('Envie JSON.',415);
  const reader=req.body?.getReader();if(!reader)fail('Corpo obrigatório.');let size=0;const chunks=[];
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>LIMITS.bodyBytes){await reader.cancel();fail('Pedido muito grande.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  let v;try{v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('JSON inválido.');}
  if(!v||typeof v!=='object'||Array.isArray(v))fail('Objeto JSON obrigatório.');return v;
}
export function checkOrigin(req){const origin=req.headers.get('origin');if(origin!==new URL(req.url).origin)fail('Origem não autorizada.',403);if(req.headers.get('sec-fetch-site')==='cross-site')fail('Pedido externo bloqueado.',403);}
export async function sha256(content){return Array.from(hashSha256(new TextEncoder().encode(content)),x=>x.toString(16).padStart(2,'0')).join('');}
export function validateTarget(value){
  let u;try{u=new URL(value);}catch{fail('URL inválida.');}
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))fail('Use HTTPS público, sem credenciais ou portas alternativas.');
  const host=u.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||!host.includes('.')||host.includes(':')||/^\d+\./.test(host))fail('Endereços locais, IPs e redes internas são bloqueados.');
  return u.href;
}
// HAR is projected onto a strict allowlist. Bodies, headers, cookies, query values,
// URL credentials/fragments and unknown keys are never persisted.
export function sanitizeHar(input){
  if(!input?.log||!Array.isArray(input.log.entries)||input.log.entries.length>300)fail('HAR inválido ou com mais de 300 entradas.');
  return {kind:'har-sanitized',entries:input.log.entries.map((entry,i)=>{
    let u;try{u=new URL(entry.request.url);}catch{fail(`URL inválida no evento ${i+1}.`);}
    if(!['http:','https:'].includes(u.protocol))fail('HAR deve conter URLs HTTP.');
    return {index:i+1,origin:u.origin,method:/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(entry.request.method)?entry.request.method:'OTHER',status:Number.isInteger(entry.response?.status)?entry.response.status:0,time:Number.isFinite(entry.time)?Math.max(0,entry.time):null};
  }),limitations:['Cabeçalhos, cookies, corpos, caminhos, consultas e fragmentos removidos por privacidade.','Origem e tempos são declarados pelo HAR; não foram capturados nem confirmados pela plataforma.']};
}
