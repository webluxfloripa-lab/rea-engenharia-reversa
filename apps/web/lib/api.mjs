import {LIMITS,fail,text,validateFiles,readJson,checkOrigin,validateTarget,sanitizeHar,sha256} from './security.mjs';
import {analyze} from './analyze.mjs';
import {exportZip,importZip} from './zip.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const visible=r=>({...JSON.parse(r.payload),id:r.id,name:r.name,version:r.version,archived:!!r.archived,created:r.created,updated:r.updated});
export const capabilities={code:{state:'available',engine:'Studio AST / Babel'},rea:{state:'offline',reason:'REA 6.8.0 disponível no laboratório local; worker de produção não conectado.'},website:{state:'blocked',reason:'Exige Chromium isolado e proteção de rede/DNS. Nenhum destino será acessado.'},apk:{state:'blocked',reason:'Exige worker isolado com JDK/JADX e quarentena. Upload binário não habilitado.'},ai:{state:'unavailable',reason:'Provedor e orçamento não configurados. Nenhum código é enviado a IA.'},appName:{state:'available',reason:'Metadados públicos da App Store (iOS), sem APK ou código.'},billing:{state:'disabled'}};
export async function handle(req,{db,user,fetcher=fetch}){
 try{
  const url=new URL(req.url),parts=url.pathname.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean),method=req.method;
  if(parts[0]==='capabilities'&&method==='GET')return json({capabilities,limits:LIMITS});
  if(parts[0]==='me'&&method==='GET')return json({user:user?{name:user.displayName,email:user.email}:null,limits:LIMITS});
  if(!user?.userId)fail('Entre com sua conta para acessar projetos privados.',401);
  if(!db)fail('Armazenamento indisponível.',503);
  const owner=user.userId;
  if(method!=='GET'){
    checkOrigin(req);
    const minute=Math.floor(Date.now()/60000);
    const quota=await db.prepare('INSERT INTO rate_limits(owner,window,count) VALUES(?,?,1) ON CONFLICT(owner) DO UPDATE SET window=excluded.window,count=CASE WHEN rate_limits.window=excluded.window THEN rate_limits.count+1 ELSE 1 END RETURNING count').bind(owner,minute).first();
    if(quota.count>LIMITS.perMinute)fail('Limite de pedidos atingido. Aguarde um minuto.',429);
  }
  const audit=async(action,project=null)=>db.prepare('INSERT INTO audit_events(id,owner,project,action,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),owner,project,action,new Date().toISOString()).run();
  if(parts[0]==='audit'&&method==='GET')return json({events:(await db.prepare('SELECT action,project,created FROM audit_events WHERE owner=? ORDER BY created DESC LIMIT 60').bind(owner).all()).results});
  if(parts[0]==='app-search'&&method==='POST'){
    const b=await readJson(req),term=text(b.term,80).trim();if(term.length<2)fail('Digite pelo menos dois caracteres.');
    // Fixed upstream origin/path; user input is only an encoded query parameter.
    const source='https://itunes.apple.com/search?entity=software&country=br&limit=8&term='+encodeURIComponent(term);
    let res;try{res=await fetcher(source,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{accept:'application/json'}});}catch{fail('Catálogo público indisponível no momento.',503);}
    if(!res.ok)fail('Catálogo público indisponível.',503);
    const content=await res.text();if(content.length>500000)fail('Resposta do catálogo excedeu o limite.',502);
    const result=JSON.parse(content);const results=(result.results||[]).slice(0,8).map(x=>({name:String(x.trackName||''),developer:String(x.artistName||''),version:String(x.version||''),platform:'iOS',url:/^https:\/\/apps\.apple\.com\//.test(x.trackViewUrl)?x.trackViewUrl:null}));
    await audit('metadata.search');return json({results,source,timestamp:new Date().toISOString(),limitations:['Somente metadados públicos iOS; nenhum APK, classe ou código foi recuperado.']});
  }
  if(parts[0]==='projects'&&parts.length===1){
    if(method==='GET')return json({projects:(await db.prepare('SELECT id,name,version,archived,created,updated FROM projects WHERE owner=? ORDER BY updated DESC').bind(owner).all()).results});
    if(method==='POST'){
      const b=await readJson(req);if(b.authorized!==true)fail('Confirme que tem autorização para analisar os arquivos.');
      const name=text(b.name,80,'Nome').trim();if(!name)fail('Informe um nome.');
      const files=validateFiles(b.files||[]),id=crypto.randomUUID(),now=new Date().toISOString();
      const payload=JSON.stringify({kind:'code',files,original:files,objective:text(b.objective||'',2000),report:null,label:'Projeto criado',authorization:{declared:true,at:now}});
      const result=await db.prepare('INSERT INTO projects(id,owner,name,payload,version,archived,created,updated) SELECT ?,?,?,?,1,0,?,? WHERE (SELECT count(*) FROM projects WHERE owner=?) < ? RETURNING *').bind(id,owner,name,payload,now,now,owner,LIMITS.projects).first();
      if(!result)fail('Limite de 12 projetos atingido.',409);await audit('project.create',id);return json(visible(result),201);
    }
  }
  if(parts[0]!=='projects'||!parts[1]||!/^[a-f0-9-]{36}$/.test(parts[1]))fail('Recurso não encontrado.',404);
  const id=parts[1],row=await db.prepare('SELECT * FROM projects WHERE id=? AND owner=?').bind(id,owner).first();
  if(!row)fail('Projeto não encontrado.',404);let doc=JSON.parse(row.payload);
  if(method==='GET'){
    if(parts[2]==='history')return json({revisions:(await db.prepare('SELECT version,label,created FROM revisions WHERE project=? ORDER BY version DESC').bind(id).all()).results});
    if(parts[2]==='revision') {const rev=Number(url.searchParams.get('version'));const r=await db.prepare('SELECT payload,version FROM revisions WHERE project=? AND version=?').bind(id,rev).first();if(!r)fail('Versão inexistente.',404);return json({...JSON.parse(r.payload),version:r.version});}
    if(parts[2]==='export'){const bytes=exportZip(visible(row));await audit('project.export',id);return new Response(bytes,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="rea-projeto.zip"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
    if(parts.length===2)return json(visible(row));fail('Recurso não encontrado.',404);
  }
  const b=await readJson(req);
  if(!Number.isInteger(b.version)||b.version!==row.version)fail('Conflito de versão: recarregue o projeto antes de salvar.',409);
  if(method==='DELETE'){
    if(!row.archived||b.confirm!==row.name)fail('Arquive e confirme o nome exato para excluir definitivamente.');
    const deleted=await db.prepare('DELETE FROM projects WHERE id=? AND owner=? AND version=? RETURNING id').bind(id,owner,b.version).first();if(!deleted)fail('Conflito de versão.',409);await audit('project.delete',id);return json({deleted:true});
  }
  if(method!=='POST')fail('Método não permitido.',405);
  if(row.version>=LIMITS.revisions)fail('Limite de 80 revisões. Exporte e crie outro projeto.',409);
  const action=parts[2];let name=row.name,archived=row.archived;
  if(row.archived&&!['archive','restore'].includes(action))fail('Restaure o projeto arquivado antes de editar.',409);
  if(action==='save'){doc.files=validateFiles(b.files);doc.report=null;doc.label='Edição salva';}
  else if(action==='import'){
    let incoming;if(b.zip){if(typeof b.zip!=='string'||b.zip.length>1400000)fail('ZIP excede limite.');incoming=importZip(Uint8Array.from(atob(b.zip),x=>x.charCodeAt(0)));}else incoming=validateFiles(b.files);
    const oldPaths=new Set(doc.files.map(f=>f.path));if(incoming.some(f=>oldPaths.has(f.path)))fail('Já existe um arquivo com esse nome. Renomeie antes de importar.');
    doc.files=validateFiles([...doc.files,...incoming]);doc.original=[...doc.original,...incoming];doc.report=null;doc.label='Importação autorizada';
  }
  else if(action==='analyze'){doc.report=await analyze(doc.files);doc.label='Análise estática';}
  else if(action==='checkpoint'){doc.label=text(b.label||'Checkpoint',100);}
  else if(action==='restore'){
    if(!Number.isInteger(b.targetVersion))fail('Versão inválida.');const rev=await db.prepare('SELECT payload FROM revisions WHERE project=? AND version=?').bind(id,b.targetVersion).first();if(!rev)fail('Versão inexistente.',404);const previous=JSON.parse(rev.payload);doc={...previous,original:doc.original,label:`Restaurada v${b.targetVersion} como nova revisão`};
  }
  else if(action==='rename'){name=text(b.name,80).trim();if(!name)fail('Nome obrigatório.');doc.label='Projeto renomeado';}
  else if(action==='archive'){if(typeof b.archived!=='boolean')fail('Estado inválido.');archived=b.archived?1:0;doc.label=archived?'Projeto arquivado':'Projeto reaberto';}
  else if(action==='target'){
    if(b.kind==='website'){doc.target={kind:'website',url:validateTarget(text(b.url,2048)),state:'blocked',reason:capabilities.website.reason};}
    else if(b.kind==='app'){doc.target={kind:'app',name:text(b.name,80),state:'metadata-only'};}
    else if(b.kind==='apk'){doc.target={kind:'apk',state:'blocked',reason:capabilities.apk.reason};}
    else fail('Tipo de alvo inválido.');doc.label='Alvo registrado; sem execução';
  }
  else if(action==='har'){doc.capture=sanitizeHar(b.har);doc.capture.sha256=await sha256(JSON.stringify(doc.capture));doc.label='HAR sanitizado importado';}
  else fail('Ação não disponível.',404);
  const payload=JSON.stringify(doc);if(new TextEncoder().encode(payload).length>850000)fail('Dados do projeto excedem o limite.',413);
  const result=await db.prepare('UPDATE projects SET name=?,payload=?,archived=?,version=version+1,updated=? WHERE id=? AND owner=? AND version=? RETURNING *').bind(name,payload,archived,new Date().toISOString(),id,owner,b.version).first();
  if(!result)fail('Conflito de versão: nenhuma alteração foi sobrescrita.',409);await audit('project.'+action,id);return json(visible(result));
 }catch(e){return json({error:e.status?e.message:'Operação indisponível. Tente novamente.',code:e.status||500},e.status||500);}
}
