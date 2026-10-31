'use client';
import {useState,useEffect,type FormEvent} from 'react';
import {Copy,Loader2,Send,BookOpen,GitBranch,Check,RefreshCw} from 'lucide-react';
import {diffLines} from 'diff';

type File={path:string;content:string};
type Source={id:string;path:string;start:number;end:number;url:string;commit:string;excerpt:string};
type Proposal={path:string;content:string;summary:string;baseVersion:number;syntaxValid:boolean};
type Message={id:string;role:string;content:string;proposal?:Proposal;sources?:Source[];includedFile?:string|null;steps?:{tool:string;detail:string}[];truncated?:boolean;generationError?:string};
export type AiInput={prompt:string;filePath:string|null;useKnowledge:boolean;useHistory:boolean;mode:string;proposalPath:string;threadVersion:number};
type Answer={answer:string;messageId:string;threadVersion:number;proposal?:Proposal;sources:Source[];steps:Message['steps'];truncated:boolean;generationError?:string};
type Props={demo:boolean;projectId:string;projectVersion:number;file?:File;files:File[];busy:boolean;onAsk:(input:AiInput)=>Promise<Answer>;onApply:(id:string)=>Promise<void>};
type Knowledge={repository:string;commit:string;builtAt:string;documents:number;chunks:number;upstream:{version:string}};
async function readApi<T>(response:Response):Promise<T>{const data=await response.json() as T&{error?:string};if(!response.ok)throw new Error(data.error||'Não foi possível consultar o serviço.');return data;}

function Sources({sources}:{sources:Source[]}){return <details className="ai-sources"><summary><BookOpen size={14}/> Fontes consultadas ({sources.length})</summary>{sources.map(s=><article key={s.id}><a href={s.url} target="_blank" rel="noreferrer">[{s.id}] {s.path} · L{s.start}–{s.end} ↗</a><p>{s.excerpt.slice(0,380)}{s.excerpt.length>380?'…':''}</p><small>Versão {s.commit.slice(0,8)}</small></article>)}</details>;}

export default function AiAssistant({demo,projectId,projectVersion,file,files,busy,onAsk,onApply}:Props){
  const [prompt,setPrompt]=useState(''),[includeFile,setIncludeFile]=useState(false),[useKnowledge,setUseKnowledge]=useState(true),[useHistory,setUseHistory]=useState(true),[mode,setMode]=useState('chat'),[proposalPath,setProposalPath]=useState('src/sugestao.ts');
  const [messages,setMessages]=useState<Message[]>([]),[threadVersion,setThreadVersion]=useState(0),[loading,setLoading]=useState(!demo),[error,setError]=useState(''),[sending,setSending]=useState(false),[copied,setCopied]=useState(''),[reviewed,setReviewed]=useState('');
  const [knowledge,setKnowledge]=useState<Knowledge|null>(null),[query,setQuery]=useState(''),[searchResults,setSearchResults]=useState<Source[]>([]),[checking,setChecking]=useState(false),[githubStatus,setGithubStatus]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/v1/knowledge',{signal:controller.signal}).then(r=>readApi<{knowledge:Knowledge}>(r)).then(d=>setKnowledge(d.knowledge)).catch(()=>{});
    if(!demo){setLoading(true);fetch(`/api/v1/projects/${projectId}/assistant`,{cache:'no-store',signal:controller.signal}).then(r=>readApi<{messages:Message[];version:number}>(r)).then(d=>{setMessages(d.messages);setThreadVersion(d.version);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});}
    return()=>controller.abort();
  },[projectId,demo]);
  const tooLarge=!!file&&file.content.length>12000;
  async function submit(event:FormEvent){
    event.preventDefault();if(sending||busy||loading||!prompt.trim())return;
    setSending(true);setError('');setReviewed('');
    const question=prompt;
    try{
      const answer=await onAsk({prompt:question,filePath:includeFile&&file&&!tooLarge?file.path:null,useKnowledge,useHistory,mode,proposalPath,threadVersion});
      setMessages(m=>[...m,{id:'user-'+answer.messageId,role:'user',content:question},{id:answer.messageId,role:'assistant',content:answer.answer,...answer}].slice(-20));
      setThreadVersion(answer.threadVersion);setPrompt('');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível consultar a IA.');}
    finally{setSending(false);}
  }
  async function search(event:FormEvent){
    event.preventDefault();setError('');try{const r=await fetch('/api/v1/knowledge?q='+encodeURIComponent(query));const d=await readApi<{sources:Source[]}>(r);setSearchResults(d.sources);}catch(e){setError(e instanceof Error?e.message:'Busca indisponível.');}
  }
  async function checkGithub(){
    setChecking(true);setError('');try{const r=await fetch('/api/v1/knowledge/check-github',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await readApi<{hasNewCommits:boolean}>(r);setGithubStatus(d.hasNewCommits?'Há commits posteriores. Esta consulta usa a versão indexada indicada nas fontes.':'A versão indexada corresponde à branch consultada.');}catch(e){setError(e instanceof Error?e.message:'GitHub indisponível.');}finally{setChecking(false);}
  }
  return <div className="ai-assistant ai-workspace">
    <div className="between"><span className="badge green">REA IA · GRATUITO</span><span className="tiny">Llama 3.3 70B / OVHcloud</span></div>
    <p>Investigue, converse e construa com referências do REA. O código gerado passa pela sua revisão.</p>
    <details className="ai-knowledge" open={demo||undefined}><summary><GitBranch size={15}/> Base GitHub do REA {knowledge&&<span>{knowledge.documents} documentos · {knowledge.chunks} trechos</span>}</summary>
      {knowledge&&<p className="tiny">{knowledge.repository} · REA {knowledge.upstream.version} · índice {knowledge.commit.slice(0,8)} de {new Date(knowledge.builtAt).toLocaleDateString('pt-BR')}. Documentação e arquivos selecionados, com fontes fixadas por versão.</p>}
      <form className="ai-knowledge-search" onSubmit={search}><input aria-label="Buscar na base REA" maxLength={300} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex.: analisar APK com JADX"/><button className="button small" disabled={!query.trim()}>Pesquisar base</button></form>
      {searchResults.length>0&&<Sources sources={searchResults}/>}
      {!demo&&<button className="text-link" type="button" disabled={checking} onClick={checkGithub}><RefreshCw size={13}/>{checking?'Consultando GitHub…':'Verificar atualizações no GitHub'}</button>}
      {githubStatus&&<p className="tiny" role="status">{githubStatus}</p>}
    </details>
    {demo?<div className="notice-box"><div><b>Explore as fontes acima.</b><p>Entre no seu workspace e abra um projeto para conversar, guardar histórico e gerar propostas de código.</p><a className="button primary" href="/workspace">Abrir meu workspace ↗</a></div></div>:<>
      <div className="ai-conversation" aria-label="Conversa privada do projeto" aria-live="polite">
        {loading&&<p role="status">Carregando conversa privada…</p>}
        {!loading&&!messages.length&&<div className="ai-empty"><BookOpen size={26}/><h3>O que você quer descobrir ou construir?</h3><p>Ex.: “Como analisar um APK com REA?” ou “Gere uma função de validação para meu projeto”.</p></div>}
        {messages.map(message=><article className={'ai-message '+message.role} key={message.id}>
          <div className="between"><b>{message.role==='user'?'Você':'REA IA'}</b>{message.role==='assistant'&&<button className="button small" aria-label="Copiar resposta" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(message.proposal?.content??message.content);setCopied(message.id);}catch{setError('Selecione o texto para copiar.');}}}><Copy size={13}/>{copied===message.id?'Copiado':'Copiar'}</button>}</div>
          <pre>{message.content}</pre>
          {!!message.sources?.length&&<Sources sources={message.sources}/>}
          {message.steps&&<details className="ai-steps"><summary>Etapas realizadas</summary>{message.steps.map(s=><p className="tiny" key={s.tool}><Check size={12}/> {s.detail}</p>)}</details>}
          {message.proposal&&<div className="ai-proposal"><b>Proposta: {message.proposal.path}</b><p className="tiny">{message.proposal.syntaxValid?'Formato e sintaxe suportada verificados; não executado.':'Há problemas sintáticos; aplicação bloqueada.'} Base: v{message.proposal.baseVersion}.</p>
            <details><summary>Revisar comparação e código</summary><div className="diff-view">{diffLines(files.find(f=>f.path===message.proposal?.path)?.content??'',message.proposal.content).map((part,i)=><pre className={part.added?'added':part.removed?'removed':''} key={i}>{part.added?'+ ':part.removed?'- ':'  '}{part.value}</pre>)}</div></details>
            {message.proposal.baseVersion===projectVersion&&message.proposal.syntaxValid?<><label className="checkbox"><input type="checkbox" checked={reviewed===message.id} onChange={e=>setReviewed(e.target.checked?message.id:'')}/>Revisei a proposta e quero aplicá-la.</label><button className="button primary" disabled={busy||sending||reviewed!==message.id} onClick={async()=>{setError('');try{await onApply(message.id);setReviewed('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível aplicar.');}}}>Aplicar e criar revisão <Check size={15}/></button></>:<p className="tiny">{message.proposal.baseVersion!==projectVersion?'A versão do projeto mudou. Gere outra proposta para aplicar mudanças.':'Corrija a proposta antes de aplicar.'}</p>}
          </div>}
          {message.truncated&&<p className="warning-text">Limite de resposta atingido. Peça uma resposta ou arquivo menor.</p>}
          {message.generationError&&<p className="warning-text">{message.generationError}</p>}
        </article>)}
      </div>
      <form onSubmit={submit} className="ai-composer">
        <div className="ai-mode"><label htmlFor="ai-mode">Como posso ajudar?<select id="ai-mode" value={mode} onChange={e=>setMode(e.target.value)} disabled={busy||sending}><option value="chat">Conversar e investigar</option><option value="generate">Gerar proposta de arquivo</option></select></label>{mode==='generate'&&<label htmlFor="ai-path">Caminho do arquivo<input id="ai-path" value={proposalPath} onChange={e=>setProposalPath(e.target.value)} maxLength={180} required disabled={busy||sending}/></label>}</div>
        {mode==='generate'&&file&&<button className="text-link" type="button" disabled={tooLarge||busy||sending} onClick={()=>{setProposalPath(file.path);setIncludeFile(true);}}>Propor melhoria em {file.path}</button>}
        <label htmlFor="ai-prompt">Descreva o que quer descobrir ou construir<textarea id="ai-prompt" rows={4} maxLength={4000} required value={prompt} disabled={sending||busy||loading} onChange={e=>setPrompt(e.target.value)} placeholder="Descreva seu objetivo…"/></label>
        <div className="ai-options"><label className="checkbox"><input type="checkbox" checked={useKnowledge} disabled={busy||sending} onChange={e=>setUseKnowledge(e.target.checked)}/>Consultar base pública REA</label><label className="checkbox"><input type="checkbox" checked={useHistory} disabled={busy||sending} onChange={e=>setUseHistory(e.target.checked)}/>Usar histórico recente</label>
        {file&&<label className="checkbox"><input type="checkbox" disabled={sending||busy||tooLarge} checked={includeFile&&!tooLarge} onChange={e=>setIncludeFile(e.target.checked)}/><span>Incluir arquivo: <b>{file.path}</b>{tooLarge&&' (acima de 12.000 caracteres)'}</span></label>}</div>
        <p className="tiny">Ao enviar, a OVHcloud recebe a pergunta e os contextos marcados. Até 10 turnos ficam guardados neste projeto privado; até 8 mensagens recentes entram no contexto. Remova segredos. Cota compartilhada de até 2 pedidos/minuto, sem cartão nem alternativa paga.</p>
        <button className="button primary" disabled={sending||busy||loading||!prompt.trim()}>{sending?<Loader2 size={16} className="spin"/>:<Send size={16}/>} {sending?'REA está consultando…':mode==='generate'?'Gerar proposta':'Enviar à REA IA'}</button>
        {sending&&<p className="tiny" role="status">Consulta em andamento; limite de espera de 45 segundos.</p>}
      </form>
    </>}
    {error&&<p className="warning-text" role="alert">{error}</p>}
  </div>;
}
