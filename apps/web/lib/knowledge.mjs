import snapshot from './data/rea-knowledge.json' with {type:'json'};
import {fail,text} from './security.mjs';

const stop=new Set(['que','para','como','uma','com','por','dos','das','the','and','this','from','with','quero','sobre','explique','usar','qual','quais','pode','ser','meu','minha','rea']);
const aliases={'pre-requisitos':['requirements','prerequisite','jdk','java','supply'],requisitos:['requirements','prerequisite','jdk','java','supply'],jadx:['jdk','java'],apk:['android','jadx','manifest','package'],android:['jadx','apk'],site:['website','browser'],navegador:['browser','chromium','cdp'],codigo:['source','code'],instalar:['installation','setup'],instalacao:['installation','requirements'],ferramentas:['tools','mcp'],comandos:['commands','cli'],analise:['analysis','analyze'],javascript:['javascript','ast'],permissoes:['permissions','android'],memoria:['memory'],erros:['errors'],engenharia:['reverse','engineering'],reversa:['reverse'],captura:['capture','browser'],arquitetura:['architecture','imports'],testes:['tests','testing'],seguranca:['security'],dependencias:['dependencies','imports']};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const corpus=snapshot.documents.flatMap(document=>document.chunks.map(chunk=>({document,chunk,terms:new Set(chunk.terms),title:normalize(document.path)})));
export function knowledgeStatus(){return {repository:snapshot.repository,branch:snapshot.branch,commit:snapshot.commit,builtAt:snapshot.builtAt,documents:snapshot.documents.length,chunks:corpus.length,upstream:snapshot.upstream,mode:'snapshot-retrieval',license:'MIT',limitations:['Índice de documentação e arquivos selecionados; não é treinamento de um modelo novo.','Os motores CLI, Chromium e JADX do REA exigem execução externa; documentação não significa motor online.']};}
export function searchKnowledge(query,limit=4){
  const normalized=normalize(text(query,4000,'Consulta'));
  const original=[...new Set(normalized.match(/[a-z0-9_-]{3,}/g)||[])].filter(t=>!stop.has(t)).slice(0,24);
  const tokens=[...new Set(original.flatMap(t=>[t,...(aliases[t]||[])]))];
  const weights=new Map(original.map(t=>[t,4]));
  for(const term of original)for(const alias of aliases[term]||[])weights.set(alias,Math.max(weights.get(alias)||0,['pre-requisitos','requisitos'].includes(term)?7:2));
  if(!tokens.length)return [];
  const ranked=corpus.map(x=>{
    const headings=normalize(x.chunk.headingText??'');
    let score=0;for(const token of tokens){const weight=weights.get(token)||2;if(x.terms.has(token))score+=weight;if(x.title.includes(token))score+=weight*1.5;if(normalize(x.chunk.section??'').includes(token))score+=weight;if(headings.includes(token))score+=weight*3;}
    return {...x,score};
  }).filter(x=>x.score>2).sort((a,b)=>b.score-a.score||a.document.path.localeCompare(b.document.path)||a.chunk.start-b.chunk.start);
  const found=[],perFile=new Map();let budget=0;
  for(const r of ranked){if(found.length>=Math.min(6,Math.max(1,limit)))break;if((perFile.get(r.document.path)||0)>=2)continue;
    const excerpt=r.chunk.text.slice(0,1400);if(budget+excerpt.length>5600)continue;
    perFile.set(r.document.path,(perFile.get(r.document.path)||0)+1);budget+=excerpt.length;
    found.push({id:'R'+(found.length+1),path:r.document.path,start:r.chunk.start,end:r.chunk.end,commit:snapshot.commit,sha256:r.document.sha256,url:'https://github.com/'+snapshot.repository+'/blob/'+snapshot.commit+'/'+r.document.path+'#L'+r.chunk.start,excerpt});
  }
  return found;
}

export async function checkGitHub(fetcher=fetch){
  const endpoint='https://api.github.com/repos/'+snapshot.repository+'/branches/'+encodeURIComponent(snapshot.branch);
  let response;try{response=await fetcher(endpoint,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json','User-Agent':'REA-Studio','X-GitHub-Api-Version':'2026-03-10'}});}catch{fail('GitHub indisponível. A base já indexada continua disponível.',503);}
  if(!response.ok){await response.body?.cancel();fail(response.status===403||response.status===429?'Cota pública do GitHub atingida; use a base indexada.':'Não foi possível verificar o GitHub.',response.status===403||response.status===429?429:503);}
  const reader=response.body?.getReader();if(!reader)fail('Resposta vazia do GitHub.',502);
  let bytes=0;const chunks=[];
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>200000){await reader.cancel();fail('Resposta do GitHub excedeu o limite.',502);}chunks.push(value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(bytes);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}const raw=new TextDecoder().decode(data);
  let d;try{d=JSON.parse(raw);}catch{fail('Resposta inválida do GitHub.',502);}
  if(!/^[a-f0-9]{40}$/.test(d.commit?.sha))fail('Versão do GitHub inválida.',502);
  return {repository:snapshot.repository,branch:snapshot.branch,latestCommit:d.commit.sha,indexedCommit:snapshot.commit,hasNewCommits:d.commit.sha!==snapshot.commit,checkedAt:new Date().toISOString(),url:'https://github.com/'+snapshot.repository+'/commit/'+d.commit.sha};
}
