(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  let token = sessionStorage.getItem('rea-studio-token') || '';
  let activeJob = null;
  let previewContent = '';
  let polling = null;
  const setText = (id, value) => { el(id).textContent = String(value); };
  function feedback(text, isError = false) { const n=el('feedback');n.textContent=text;n.className=`feedback ${isError?'error':'ok'}`; }
  function showModal(yes) {el('login-modal').classList.toggle('hidden',!yes);}
  async function api(endpoint, options={}) {
    const response=await fetch(endpoint,{...options,headers:{'X-REA-Token':token,...(options.headers||{})},cache:'no-store'});
    let payload;
    if(endpoint.startsWith('/api/report')&&response.ok)return response.blob();
    try {payload=await response.json()}catch{throw new Error(`Resposta inesperada (HTTP ${response.status})`)}
    if(!response.ok){if(response.status===401)showModal(true);throw new Error(payload.erro||`Erro HTTP ${response.status}`)}
    return payload;
  }
  const getProject=()=>el('project').value.trim();
  function setBusy(busy) {el('analyze-btn').disabled=busy;el('upload-btn').disabled=busy;}
  async function status() {
    const data=await api('/api/status');
    setText('engine',data.reaVersion||'—');
    setText('rea-version',data.reaVersion||'—');
    setText('node-chip',data.nodeVersion||'Node.js —');
    setText('engine-state',data.built?'pronto para análise':'compilação pendente');
    setText('project-count',data.projects.length);
    setText('job-count',data.jobCount);
    setText('status-live',data.built?'● Operacional':'● Instalação pendente');
    el('status-live').style.color=data.built?'#8eddb6':'#f4c788';
    return data;
  }
  function selected() {
    const files=Array.from(el('files').files||[]);
    if(!files.length){setText('selected','Nenhum arquivo selecionado.');return}
    setText('selected',`${files.length} arquivo(s) selecionado(s): ${files.slice(0,8).map(f=>f.name).join(' · ')}${files.length>8?'…':''}`);
  }
  async function uploadFiles() {
    const name=getProject();
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/.test(name))throw new Error('Nome do projeto inválido.');
    const files=Array.from(el('files').files||[]);
    if(!files.length){feedback('Selecione um ou mais arquivos primeiro.',true);return}
    setBusy(true);
    try {
      let done=0;
      for (const file of files) {
        if(file.size>10*1024*1024)throw new Error(`Arquivo muito grande: ${file.name}`);
        const p=file.webkitRelativePath||file.name;
        feedback(`Enviando ${done+1}/${files.length}: ${p}`);
        await api(`/api/upload?project=${encodeURIComponent(name)}&path=${encodeURIComponent(p)}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});
        done++;
      }
      feedback(`${done} arquivo(s) enviado(s) para ${name}.`);
      el('files').value=''; selected();
      await Promise.all([listFiles(),status()]);
    }finally{setBusy(false)}
  }
  async function listFiles() {
    const name=getProject(); if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/.test(name))return;
    const {files}=await api(`/api/files?project=${encodeURIComponent(name)}`);
    const list=el('file-list');list.replaceChildren();
    if(!files.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Nenhum arquivo neste projeto. Selecione e envie seus arquivos acima.';list.append(empty);return}
    for(const file of files){
      const button=document.createElement('button');button.type='button';button.className='file-entry';button.textContent=`⌁  ${file.path}  ·  ${(file.bytes/1024).toFixed(1)} KB`;
      button.addEventListener('click',async()=>{
        list.querySelectorAll('.file-entry').forEach(x=>x.classList.remove('active'));button.classList.add('active');
        try{const d=await api(`/api/file?project=${encodeURIComponent(name)}&path=${encodeURIComponent(file.path)}`);previewContent=d.content;setText('preview-title',file.path);setText('preview',d.content);el('copy-code').disabled=false}
        catch(e){feedback(e.message,true)}
      });
      list.append(button);
    }
  }
  function renderJob(j){
    const statusText=j.status==='executando'?'Análise em andamento…':j.status==='concluido'?'Análise concluída':'Análise encerrada com erro';
    setText('run-status',`${statusText} · ${j.project||'projeto'} · ${j.durationMs===undefined?'processando':(j.durationMs/1000).toFixed(1)+'s'}`);
    let display=j.stdout||j.stderr||j.error||'Executando o REA, aguarde a saída…';
    if(j.parsed!==null && j.parsed!==undefined)display=JSON.stringify(j.parsed,null,2);
    if(j.error)display=`${j.error}\n\n${display}`;
    if(j.stderr && j.stdout)display+=`\n\n--- Logs adicionais ---\n${j.stderr}`;
    setText('result-json',display);
    el('download-report').disabled=j.status==='executando';
    if(j.status!=='executando') {clearInterval(polling);polling=null;setBusy(false);status().catch(()=>{});feedback(j.status==='concluido'?'Relatório pronto. Veja a aba Resultados.':'O REA retornou um erro. Consulte o relatório.',j.status!=='concluido');}
  }
  async function pollJob(id) {try{const j=await api(`/api/job?id=${encodeURIComponent(id)}`);renderJob(j)}catch(e){clearInterval(polling);polling=null;setBusy(false);feedback(e.message,true)}}
  async function runAnalysis(evt) {
    evt.preventDefault();
    setBusy(true);
    try {
      const project=getProject(),objective=el('objective').value.trim();
      if(!objective)throw new Error('Descreva o que deseja investigar.');
      feedback('Iniciando análise local…');
      const j=await api('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,objective})});
      activeJob=j.id;
      el('download-report').disabled=true;
      setText('run-status','REA analisando os arquivos…');
      setText('result-json','Iniciando REA. Acompanhe os resultados nesta seção.');
      location.hash='resultados';
      await pollJob(activeJob);
      if(!polling)polling=setInterval(()=>pollJob(activeJob),1200);
    }catch(e){feedback(e.message,true);setBusy(false)}
  }
  async function download() {
    if(!activeJob)return;
    try{
      const blob=await api(`/api/report?id=${encodeURIComponent(activeJob)}`);
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`rea-relatorio-${activeJob}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    }catch(e){feedback(e.message,true)}
  }
  async function init() {
    selected();
    if(!token){showModal(true);return}
    try{await Promise.all([status(),listFiles()]);showModal(false)}catch(e){showModal(true);setText('login-error',e.message)}
  }
  el('login-form').addEventListener('submit',async(e)=>{
    e.preventDefault(); const candidate=el('token').value.trim();if(!candidate)return;
    token=candidate;
    try{await status();sessionStorage.setItem('rea-studio-token',token);showModal(false);await listFiles();setText('login-error','')}
    catch(e){token='';setText('login-error',e.message)}
  });
  el('files').addEventListener('change',selected);
  el('upload-btn').addEventListener('click',()=>uploadFiles().catch(e=>{feedback(e.message,true);setBusy(false)}));
  el('analysis-form').addEventListener('submit',runAnalysis);
  el('project').addEventListener('change',()=>listFiles().catch(e=>feedback(e.message,true)));
  el('files-refresh').addEventListener('click',()=>listFiles().catch(e=>feedback(e.message,true)));
  el('refresh-btn').addEventListener('click',()=>status().catch(e=>feedback(e.message,true)));
  el('download-report').addEventListener('click',download);
  el('copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(previewContent);feedback('Código copiado para a área de transferência.')}catch{feedback('O navegador não permitiu copiar automaticamente.',true)}});
  init();
})();
