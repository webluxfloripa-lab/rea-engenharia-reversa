(()=>{
'use strict';
const el=id=>document.getElementById(id);
let secret='',activeId=null,lastReport=null,totalJobs=0,stopped=false;
const show=(message,fail=false)=>{const node=el('feedback');node.textContent=message;node.className='notice '+(fail?'error':'ok');};
const setText=(id,value)=>{el(id).textContent=String(value);};
async function api(endpoint,options={}){
 if(!secret)throw Error('Informe o token privado do executor.');
 const response=await fetch(endpoint,{...options,cache:'no-store',headers:{Authorization:'Bearer '+secret,...options.headers}});
 let body;try{body=await response.json();}catch{throw Error('Resposta HTTP inesperada: '+response.status)}
 if(!response.ok)throw Error(body.error||'HTTP '+response.status);
 return body;
}
function syncOperation(){
 const operation=el('operation').value,needsFile=!operation.startsWith('browser-');
 el('artifact-field').hidden=!needsFile;
 el('browser-field').hidden=operation!=='browser-page';
 el('upload').disabled=!needsFile;
}
function projectName(){
 const name=el('project').value.trim();
 if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(name))throw Error('Nome do projeto inválido.');
 return name;
}
function chosenFile(){
 const file=el('file').files?.[0];
 if(!file)throw Error('Selecione primeiro um arquivo.');
 if(file.size>64*1024*1024)throw Error('Arquivo maior que 64 MB.');
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/.test(file.name)||file.name.includes('..')||file.name.startsWith('.'))throw Error('Nome inválido. Renomeie o arquivo sem espaços ou caracteres especiais.');
 return file;
}
async function connect(){
 const value=el('token').value.trim();
 if(value.length<32)throw Error('O segredo deve ter pelo menos 32 caracteres.');
 secret=value;el('token').value='';
 try{
  const status=await api('/v1/capabilities');
  setText('metric-engine','REA '+status.version);
  setText('metric-ready',status.built?'Compilado e pronto':'Compilação pendente');
  setText('metric-ops',status.operations.length);
  setText('connect-state','Conectado · privado');
  show('Conectado. APK depende de JDK/JADX; websites somente via Chromium local já aberto.');
 }catch(e){secret='';setText('connect-state','Desconectado');throw e}
}
async function upload(){
 const file=chosenFile(),project=projectName();
 show('Enviando '+file.name+'...');
 const result=await api('/v1/artifact?project='+encodeURIComponent(project)+'&name='+encodeURIComponent(file.name),{method:'PUT',body:file});
 show('Arquivo armazenado localmente. SHA-256: '+result.sha256.slice(0,16)+'...; '+result.bytes+' bytes.');
 return result;
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function startAnalysis(){
 if(activeId)throw Error('Já existe uma análise em andamento.');
 const project=projectName(),operation=el('operation').value;
 const body={project,operation};
 if(operation.startsWith('browser-')){
  if(operation==='browser-page'){
   const target=el('target').value.trim();
   if(!/^[A-Za-z0-9._-]{1,128}$/.test(target))throw Error('ID de aba inválido.');
   body.targetId=target;
  }
 }else{body.file=chosenFile().name;}
 setText('job-state','Solicitando REA...');
 const created=await api('/v1/jobs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 activeId=created.id;stopped=false;totalJobs++;setText('metric-jobs',totalJobs);
 el('run').disabled=true;el('cancel').disabled=false;el('download').disabled=true;lastReport=null;
 try{
  for(let round=0;round<200;round++){
   const job=await api('/v1/jobs?id='+encodeURIComponent(created.id));
   setText('job-state',job.status+' · '+job.operation+' · '+job.id.slice(0,8));
   if(job.status!=='running'){
    lastReport=job;setText('output',JSON.stringify(job,null,2));el('download').disabled=false;
    show(job.status==='completed'?'Análise concluída; confira limitações no JSON.':'REA finalizou com status '+job.status+'. Revise os detalhes.',job.status!=='completed');
    return;
   }
   await pause(1000);
  }
  show('A consulta excedeu o prazo do navegador; o job pode continuar no executor.',true);
 }finally{activeId=null;el('run').disabled=false;el('cancel').disabled=true;}
}
async function cancelJob(){
 if(!activeId)return;
 await api('/v1/jobs/cancel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:activeId})});
 show('Cancelamento solicitado.');
}
function download(){
 if(!lastReport)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='rea-evidence-'+lastReport.id+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function preflight(){
 const url=el('website').value.trim();
 const res=await api('/v1/website/preflight',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});
 setText('website-result',JSON.stringify(res,null,2));
 show('Pré-validação de URL concluída. Isso não iniciou navegação nem captura.');
}
const wrap=(id,action)=>el(id).addEventListener('click',()=>action().catch(e=>show(e.message,true)));
el('operation').addEventListener('change',syncOperation);
wrap('connect',connect);wrap('upload',upload);wrap('run',startAnalysis);wrap('cancel',cancelJob);wrap('download',async()=>download());
wrap('check-web',preflight);syncOperation();
})();
