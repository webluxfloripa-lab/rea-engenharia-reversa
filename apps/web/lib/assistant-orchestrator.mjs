import {prepareAiRequest,claimAiSlot,askAi} from './ai.mjs';
import {readThread,saveThread} from './assistant-memory.mjs';
import {analyze} from './analyze.mjs';
import {fail,sha256} from './security.mjs';

export async function runAssistant({db,owner,project,files,body,fetcher}){
  const input=prepareAiRequest(body,files),thread=await readThread(db,project,owner);
  if(body.threadVersion!==undefined&&(!Number.isInteger(body.threadVersion)||body.threadVersion!==thread.version))fail('A conversa mudou em outra aba. Recarregue antes de continuar.',409);
  const steps=[{tool:'rea.search',state:'completed',detail:input.sources.length+' trechos públicos recuperados'}];
  let ast=null;
  if(input.selected){
    const report=await analyze([input.selected]);
    ast={engine:report.engine,status:report.status,observations:report.observations.slice(0,24),warnings:report.warnings};
    steps.push({tool:'code.analyze-selected',state:'completed',detail:report.observations.length+' observações sintáticas; código não executado'});
  }
  await claimAiSlot(db);
  const result=await askAi({...input,history:input.useHistory?thread.messages:[],ast},fetcher);
  if(result.proposal){
    const report=await analyze([{path:result.proposal.path,content:result.proposal.content}]);
    result.proposal={...result.proposal,baseVersion:body.version,baseHash:input.selected?.path===result.proposal.path?await sha256(input.selected.content):null,syntaxValid:report.warnings.length===0,warnings:report.warnings};
  }
  steps.push({tool:'ai.respond',state:'completed',detail:result.provider+' / '+result.model});
  const messageId=crypto.randomUUID(),now=new Date().toISOString();
  const messages=[...thread.messages,{id:crypto.randomUUID(),role:'user',content:input.prompt,created:now,includedFile:input.selected?.path??null},
    {id:messageId,role:'assistant',content:result.answer,created:now,...result,sources:input.sources,steps}];
  const saved=await saveThread(db,project,owner,thread.version,messages);
  return {...result,messageId,sources:input.sources,steps,threadVersion:saved.version};
}
