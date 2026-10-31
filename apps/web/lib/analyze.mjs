import { parse } from '@babel/parser';
import { sha256,validateFiles } from './security.mjs';
export async function analyze(files){
  validateFiles(files);const started=Date.now(),observations=[],graphs=[],inventory=[],warnings=[];
  for(const f of files){
    const digest=await sha256(f.content);inventory.push({path:f.path,sha256:digest,bytes:new TextEncoder().encode(f.content).length});
    if(!/\.[cm]?[jt]sx?$/.test(f.path))continue;
    try{
      const ast=parse(f.content,{sourceType:'unambiguous',plugins:[...( /\.tsx?$/.test(f.path)?['typescript']:[]), 'jsx'],errorRecovery:false});
      const stack=[ast];let visited=0;
      while(stack.length){const node=stack.pop();if(!node||typeof node!=='object')continue;if(++visited>40000)throw new Error('Limite de nós atingido.');
        let fact;
        if(node.type==='ImportDeclaration'){fact=`Importa ${node.source.value}`;graphs.push({from:f.path,to:node.source.value,line:node.loc?.start.line});}
        if(node.type==='ExportNamedDeclaration'&&node.declaration){const d=node.declaration;fact=`Exporta ${d.id?.name||d.declarations?.map(x=>x.id?.name).filter(Boolean).join(', ')||d.type}`;}
        if(node.type==='ExportDefaultDeclaration')fact='Exportação padrão';
        if(node.type==='FunctionDeclaration'&&node.id)fact=`Função ${node.id.name} (${node.params.length} parâmetros)`;
        if(node.type==='ClassDeclaration'&&node.id)fact=`Classe ${node.id.name}`;
        if(fact&&observations.length<300)observations.push({id:`e${observations.length+1}`,kind:'observed',text:fact,source:f.path,line:node.loc?.start.line||1,sha256:digest,confidence:'Nó sintático encontrado no arquivo; comportamento em execução não verificado.'});
        for(const [key,value] of Object.entries(node)){if(['loc','start','end','comments','tokens','errors'].includes(key))continue;if(Array.isArray(value))stack.push(...value);else if(value&&typeof value==='object')stack.push(value);}
      }
    }catch(e){warnings.push({source:f.path,message:'Análise parcial: '+String(e.message).slice(0,180)});}
  }
  return {schema_version:1,engine:'Studio AST / Babel',engine_version:'1.0.0',status:warnings.length?'partial':'completed',timestamp:new Date().toISOString(),duration_ms:Date.now()-started,summary:`${inventory.length} arquivos inventariados; ${observations.length} observações sintáticas.`,observations,files:inventory,graphs,warnings,coverage:'Imports estáticos, declarações de funções/classes e exports de JS/TS. Limite de 300 observações.',limitations:['Este analisador leve é independente do REA 6.8.0.','Código não executado; imports dinâmicos, runtime e backend não recuperados.','Nenhuma conclusão de segurança ou equivalência funcional.']};
}
