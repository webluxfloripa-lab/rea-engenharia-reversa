import { unzipSync,zipSync,strToU8,strFromU8 } from 'fflate';
import { safePath,validateFiles,LIMITS,fail } from './security.mjs';
export function importZip(bytes){
  if(bytes.length>LIMITS.zipBytes)fail('ZIP limitado a 1 MB.');
  // Inspect central directory before inflation, including Unix symlink attributes.
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0)fail('ZIP inválido.');
  const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true);if(count>LIMITS.files||view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0)fail('ZIP dividido ou com arquivos demais.');
  let pos=start,total=0;const names=new Set();
  for(let i=0;i<count;i++){
    if(pos+46>end||view.getUint32(pos,true)!==0x02014b50)fail('Diretório ZIP inválido.');
    const compressed=view.getUint32(pos+20,true),expanded=view.getUint32(pos+24,true),len=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),mode=view.getUint32(pos+38,true)>>>16;
    if(pos+46+len+extra+comment>end)fail('ZIP truncado.');
    const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(pos+46,pos+46+len));
    if((mode&0xf000)===0xa000||(view.getUint16(pos+8,true)&1))fail('Symlinks ou ZIP criptografado não permitidos.');
    if(!name.endsWith('/')){safePath(name);if(names.has(name))fail('Nome duplicado.');names.add(name);}else {if(name.split('/').slice(0,-1).some(x=>!x||x==='..'||x.startsWith('.')))fail('Diretório inválido.');}
    total+=expanded;if(expanded>LIMITS.fileBytes||total>LIMITS.totalBytes||expanded>Math.max(compressed,1)*100)fail('ZIP excede limites de expansão.');
    pos+=46+len+extra+comment;
  }
  let raw;try{raw=unzipSync(bytes,{filter:f=>{if(f.originalSize>LIMITS.fileBytes)fail('Entrada ZIP muito grande.');return !f.name.endsWith('/');}});}catch(e){fail('ZIP recusado: '+e.message);}
  return validateFiles(Object.entries(raw).map(([path,b])=>({path,content:new TextDecoder('utf-8',{fatal:true}).decode(b)})));
}
export function exportZip(project){const entries=Object.create(null), fixed=new Date('2026-01-01T00:00:00Z');for(const f of validateFiles(project.files))entries['derived/'+f.path]=[strToU8(f.content),{mtime:fixed}];entries['manifest.json']=[strToU8(JSON.stringify({schema_version:1,name:project.name,version:project.version,report:project.report||null},null,2)),{mtime:fixed}];entries['README.md']=[strToU8('# Exportação REA Studio\nArquivos derivados editáveis. Os originais permanecem preservados no projeto.\nRevisar direitos e conteúdo antes de publicar.\n'),{mtime:fixed}];return zipSync(entries,{level:6,mtime:fixed});}
