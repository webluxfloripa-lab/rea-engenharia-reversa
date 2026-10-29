import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAnalysisClient} from './RemoteAnalysisClient.mjs';
test('disabled without configuration',()=>assert.deepEqual(createAnalysisClient(),{configured:false}));
test('rejects unsafe configuration',()=>{for(const endpoint of ['http://example.com','https://u:p@example.com','https://example.com/path'])assert.throws(()=>createAnalysisClient({endpoint,token:'secret'}));});
test('trusted identity and idempotency required; redirects refused',async()=>{
 let observed;
 const c=createAnalysisClient({endpoint:'https://worker.example',token:'secret',fetcher:async(url,options)=>{observed=options;return Response.json({state:'queued'});}});
 assert.throws(()=>c.submit({}));
 assert.equal((await c.submit({owner:'A',projectId:'p',version:1,files:[],authorized:true,idempotencyKey:'k'})).state,'queued');
 assert.equal(observed.redirect,'error');assert.equal(JSON.parse(observed.body).owner,'A');assert.throws(()=>c.status('../private'));
});
test('remote errors do not disclose body',async()=>{const c=createAnalysisClient({endpoint:'https://worker.example',token:'secret',fetcher:async()=>new Response('private',{status:500})});await assert.rejects(c.health(),/unavailable \(500\)/);});
