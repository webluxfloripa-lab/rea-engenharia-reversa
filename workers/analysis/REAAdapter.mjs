/** Local adapter only. Never expose this process runner as an anonymous HTTP API. */
import {spawn} from 'node:child_process';
import {realpath,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
export class REAAdapter {
 constructor({reaDirectory,authorizedRoot}){this.reaDirectory=reaDirectory;this.authorizedRoot=authorizedRoot;}
 async capabilities(){const p=JSON.parse(await readFile(path.join(this.reaDirectory,'package.json'),'utf8'));const built=await stat(path.join(this.reaDirectory,'dist/cli-runtime/cli.js')).then(s=>s.isFile()).catch(()=>false);return {version:p.version,built,operations:built?['analyze-javascript-application']:[],android:'not-configured',browser:'not-configured'};}
 async analyze(directory,{signal}={}){
  const root=await realpath(this.authorizedRoot),target=await realpath(directory);
  if(target!==root&&!target.startsWith(root+path.sep))throw new Error('Target outside authorized artifact root');
  if(!(await stat(target)).isDirectory())throw new Error('A directory is required');
  if(signal?.aborted)throw new Error('Cancelled');
  return new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/rea.mjs','analyze-javascript-application',target,'--json','--full-output'],{cwd:this.reaDirectory,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,NO_COLOR:'1'}});
   let output='',stderr='',reason=null;
   const stop=(why)=>{reason=why;try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}};
   const cancel=()=>stop('Cancelled'),timer=setTimeout(()=>stop('180 second deadline exceeded'),180000);
   signal?.addEventListener('abort',cancel,{once:true});
   const finish=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};
   child.stdout.on('data',chunk=>{if(Buffer.byteLength(output)+chunk.length>4194304)stop('Output limit exceeded');else output+=chunk.toString('utf8');});
   child.stderr.on('data',chunk=>{if(Buffer.byteLength(stderr)+chunk.length>262144)stop('Diagnostic limit exceeded');else stderr+=chunk.toString('utf8');});
   child.once('error',e=>{finish();reject(e);});
   child.once('close',code=>{finish();if(reason)return reject(new Error(reason));let evidence;try{evidence=JSON.parse(output);}catch{return reject(new Error('Invalid REA JSON; exit '+code));}resolve({exitCode:code,evidence,diagnostics:stderr,status:code===0&&evidence.ok===true?'completed':'failed'});});
  });
 }
}
