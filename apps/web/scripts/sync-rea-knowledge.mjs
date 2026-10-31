import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2),root=args[args.indexOf('--repo')+1];
if(!args.includes('--repo')||!root)throw new Error('Use --repo /caminho/do/repositorio [--ref SHA].');
const git=(...a)=>execFileSync('git',['-C',path.resolve(root),...a],{encoding:'utf8',maxBuffer:8*1024*1024});
const ref=args.includes('--ref')?args[args.indexOf('--ref')+1]:'HEAD';
if(!/^(HEAD|[a-f0-9]{40})$/.test(ref))throw new Error('Use HEAD ou um SHA completo.');
const commit=git('rev-parse',ref+'^{commit}').trim();
const entries=git('ls-tree','-r',commit).trim().split('\n').map(line=>{const [meta,file]=line.split('\t');const [mode,type,sha]=meta.split(' ');return {mode,type,sha,path:file};});
const extra=new Set(['rea-main/README.md','rea-main/package.json','rea-main/scripts/rea.mjs','rea-main/src/cliCommandNames.ts','rea-main/src/cli/javascriptApplicationAnalysis.ts','rea-main/src/cli/applicationCommands.ts','rea-main/src/cliBrowserScenarioCommands.ts','rea-main/src/catalogIdentity.ts','rea-main/src/cliConfiguration.ts','rea-main/LICENSE']);
const selected=entries.filter(x=>x.type==='blob'&&x.mode!=='120000'&&(/^rea-main\/docs\/[^/]+\.md$/.test(x.path)||extra.has(x.path)));
const documents=[];
for(const file of selected){
  const content=git('show',commit+':'+file.path);
  if(Buffer.byteLength(content)>300000)throw new Error('Documento muito grande: '+file.path);
  const lines=content.split('\n'),chunks=[],headings=new Map(),sections=[];
  let fence=null,section=file.path;
  for(let i=0;i<lines.length;i++){
    const marker=lines[i].match(/^\s*(```+|~~~+)/)?.[1]?.[0];
    if(marker){if(fence===marker)fence=null;else if(!fence)fence=marker;}
    else if(!fence&&/^#{1,4} /.test(lines[i])){headings.set(i,lines[i]);section=lines[i];}
    sections[i]=section;
  }
  for(let start=0;start<lines.length;){
    let end=start,size=0;
    while(end<lines.length&&(size+lines[end].length<1200||end===start)){
      if(end>start&&size>250&&headings.has(end))break;
      size+=lines[end].length+1;end++;
    }
    const text=lines.slice(start,end).join('\n').slice(0,6000);
    const headingText=[...headings].filter(([line])=>line>=start&&line<end).map(([,value])=>value).join(' ');
    const words=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9_-]{3,}/g)||[];
    if(text.trim())chunks.push({start:start+1,end,text,section:sections[start],headingText,terms:[...new Set(words.flatMap(t=>[t,...t.split('-').filter(t=>t.length>=3)]))]});
    start=end;
  }
  documents.push({path:file.path,blobSha:file.sha,sha256:createHash('sha256').update(content).digest('hex'),lines:lines.length,chunks});
}
const pkg=JSON.parse(git('show',commit+':rea-main/package.json'));
const snapshot={formatVersion:1,repository:'webluxfloripa-lab/rea-engenharia-reversa',branch:'feature/rea-studio-platform-v2',commit,builtAt:new Date().toISOString(),upstream:{repository:'morluto/rea',version:pkg.version,tag:'rea-agents-6.8.0',commit:'160d821ac9a0310afcb8d1fc427862dd6508add5',license:'MIT'},documents};
const destination=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../lib/data/rea-knowledge.json');
mkdirSync(path.dirname(destination),{recursive:true});writeFileSync(destination,JSON.stringify(snapshot));
console.log(JSON.stringify({documents:documents.length,chunks:documents.reduce((n,d)=>n+d.chunks.length,0),commit,bytes:Buffer.byteLength(JSON.stringify(snapshot))}));
