(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  let token = sessionStorage.getItem('rea-studio-token') || '';
  let activeJob = null;
  let previewContent = '';
  let activeFile = '';
  let activeProject = '';
  let fileSha = '';
  let editing = false;
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
  function setBusy(busy) {el('analyze-btn').disabled=busy;el('upload-btn').disabled=busy;el('save-code').disabled=busy||!editing;}
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
      const button=document.createElement('button');button.type='button';button.className='file-entry';button.dataset.path=file.path;button.textContent=`⌁  ${file.path}  ·  ${(file.bytes/1024).toFixed(1)} KB`;
      button.addEventListener('click',async()=>{
        if(editing && el('code-editor').value!==previewContent && !confirm('Descartar alterações não salvas?'))return;
        try{await openFile(name,file.path)}catch(e){feedback(e.message,true)}
      });
      if(activeFile===file.path && activeProject===name)button.classList.add('active');
      list.append(button);
    }
  }
  function setEditorMode(value) {
    editing=value;
    el('preview').hidden=value;
    el('code-editor').hidden=!value;
    el('save-code').hidden=!value;
    el('cancel-code').hidden=!value;
    el('edit-code').hidden=value;
    el('save-code').disabled=!value;
    if(value) el('code-editor').focus();
  }
  async function openFile(project,filename) {
    const d=await api(`/api/file?project=${encodeURIComponent(project)}&path=${encodeURIComponent(filename)}`);
    previewContent=d.content; fileSha=d.sha; activeFile=filename; activeProject=project;
    setText('preview-title',filename);setText('preview',d.content);
    el('code-editor').value=d.content;
    setEditorMode(false);
    el('copy-code').disabled=false;
    el('edit-code').disabled=false;
    el('download-code').disabled=false;
    const entries=Array.from(el('file-list').querySelectorAll('.file-entry'));
    for(const e of entries)e.classList.toggle('active',e.dataset.path===filename);
  }
  async function saveFile() {
    if(!editing||!activeFile) return;
    const content=el('code-editor').value;
    el('save-code').disabled=true;
    try{
      const d=await api('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:activeProject,filename:activeFile,content,expectedSha:fileSha})});
      previewContent=content;fileSha=d.sha;
      setText('preview',content);setEditorMode(false);
      feedback('Arquivo salvo com sucesso no espaço de trabalho privado.');
      await listFiles();
    }catch(e){feedback(e.message,true);el('save-code').disabled=false}
  }
  function downloadFile() {
    if(!activeFile)return;
    const content=editing?el('code-editor').value:previewContent;
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=activeFile.split('/').pop();document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function newFile() {
    const project=getProject();
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/.test(project))throw new Error('Nome do projeto inválido.');
    if(editing&&el('code-editor').value!==previewContent&&!confirm('Descartar alterações não salvas?'))return;
    const filename=prompt('Nome do arquivo novo (ex.: src/novo.js):','src/novo.js');
    if(!filename)return;
    const {files}=await api(`/api/files?project=${encodeURIComponent(project)}`);
    if(files.some(f=>f.path===filename))throw new Error('Esse arquivo já existe. Abra-o para editar.');
    await api(`/api/upload?project=${encodeURIComponent(project)}&path=${encodeURIComponent(filename)}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:''});
    await listFiles();await openFile(project,filename);setEditorMode(true);
    feedback('Arquivo criado. Edite e clique em Salvar.');
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
    el('review-ai').disabled=j.status!=='concluido';
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
  el('import-web-btn').addEventListener('click',async()=>{
    const button=el('import-web-btn');
    button.disabled=true;
    try {
      const sourceUrl=el('import-url').value.trim();
      if(!el('import-authorized').checked)throw new Error('Confirme autorização para importar a URL.');
      const result=await api('/api/import-web',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:getProject(),sourceUrl,authorized:true})});
      await listFiles();await openFile(getProject(),result.path);
      feedback('Texto público importado: '+result.title+(result.truncated?' (conteúdo limitado)':''));
    }catch(e){feedback(e.message,true)} finally{button.disabled=false}
  });
  el('review-ai').addEventListener('click',async()=>{
    if(!activeJob)return;
    if(!confirm('Enviar objetivo e parte das evidências para os provedores configurados na FreeLLMAPI? Não envie dados confidenciais.'))return;
    const button=el('review-ai');button.disabled=true;
    try {
      const result=await api('/api/review-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:activeJob,consent:true})});
      el('ai-review').hidden=false;
      el('ai-review').textContent='REVISÃO IA (não substitui evidência) — '+result.model+'\n\n'+result.review;
      feedback('Revisão de IA disponível acima do relatório técnico.');
    }catch(e){feedback(e.message,true)}finally{button.disabled=false}
  });
  el('project').addEventListener('change',()=>{
    if(editing&&el('code-editor').value!==previewContent&&!confirm('Descartar alterações não salvas?')){el('project').value=activeProject;return}
    activeFile='';activeProject='';previewContent='';fileSha='';
    setText('preview-title','Nenhum arquivo aberto');setText('preview','Selecione um arquivo.');
    el('copy-code').disabled=true;el('edit-code').disabled=true;el('download-code').disabled=true;setEditorMode(false);
    listFiles().catch(e=>feedback(e.message,true));
  });
  el('files-refresh').addEventListener('click',()=>listFiles().catch(e=>feedback(e.message,true)));
  el('refresh-btn').addEventListener('click',()=>status().catch(e=>feedback(e.message,true)));
  el('download-report').addEventListener('click',download);
  el('edit-code').addEventListener('click',()=>{if(activeFile)setEditorMode(true)});
  el('cancel-code').addEventListener('click',()=>{
    if(el('code-editor').value!==previewContent&&!confirm('Descartar alterações não salvas?'))return;
    el('code-editor').value=previewContent;setEditorMode(false);
  });
  el('save-code').addEventListener('click',saveFile);
  el('new-file').addEventListener('click',()=>newFile().catch(e=>feedback(e.message,true)));
  el('download-code').addEventListener('click',downloadFile);
  el('code-editor').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveFile()}});

  el('copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(editing?el('code-editor').value:previewContent);feedback('Código copiado para a área de transferência.')}catch{feedback('O navegador não permitiu copiar automaticamente.',true)}});
  init();
})();
