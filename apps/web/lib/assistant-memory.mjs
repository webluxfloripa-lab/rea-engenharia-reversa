import {fail} from './security.mjs';

export async function readThread(db,project,owner){
  const row=await db.prepare('SELECT payload,version FROM assistant_threads WHERE project=? AND owner=?').bind(project,owner).first();
  return {messages:row?JSON.parse(row.payload):[],version:row?.version??0};
}
export async function saveThread(db,project,owner,expectedVersion,messages){
  // Keep at most ten complete turns, independently from source-code revisions.
  let kept=messages.slice(-20),payload=JSON.stringify(kept);
  while(payload.length>260000&&kept.length>2){kept=kept.slice(2);payload=JSON.stringify(kept);}
  if(payload.length>260000)fail('A conversa excedeu o limite de armazenamento.',413);
  const now=new Date().toISOString();
  const row=expectedVersion===0
    ?await db.prepare('INSERT INTO assistant_threads(project,owner,version,payload,updated) VALUES(?,?,1,?,?) ON CONFLICT(project) DO NOTHING RETURNING version').bind(project,owner,payload,now).first()
    :await db.prepare('UPDATE assistant_threads SET version=version+1,payload=?,updated=? WHERE project=? AND owner=? AND version=? RETURNING version').bind(payload,now,project,owner,expectedVersion).first();
  if(!row)fail('A conversa mudou em outra aba. Recarregue antes de continuar.',409);
  return {messages:kept,version:row.version};
}
