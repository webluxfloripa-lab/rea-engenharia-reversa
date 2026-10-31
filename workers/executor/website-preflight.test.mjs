import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicAddress,preflightWebsite} from './website-preflight.mjs';
test('preflight refuses private, metadata and mapped addresses',()=>{
 for(const v of ['127.0.0.1','10.8.1.7','192.168.1.1','169.254.169.254','172.31.255.2','100.64.0.1','8.8.8.8.8','::1','fe80::1','fd00::1','::ffff:127.0.0.1','2001:db8::1'])assert.equal(publicAddress(v),false,v);
 assert.equal(publicAddress('8.8.8.8'),true);
 assert.equal(publicAddress('1.1.1.1'),true);
 assert.equal(publicAddress('2606:4700:4700::1111'),true);
});
test('URLs must be explicitly approved, HTTPS and resolve only globally routable IPs',async()=>{
 const resolver=async()=>[{address:'93.184.215.14',family:4}];
 const input={resolver,allowedHosts:['approved.example.com']};
 const result=await preflightWebsite('https://approved.example.com/path?x=1',input);
 assert.equal(result.status,'preflight_only');
 assert.equal(result.host,'approved.example.com');
 await assert.rejects(()=>preflightWebsite('http://approved.example.com/',input));
 await assert.rejects(()=>preflightWebsite('https://localhost/',input));
 await assert.rejects(()=>preflightWebsite('https://not-approved.example.com/',input));
 await assert.rejects(()=>preflightWebsite('https://user:password@approved.example.com/',input));
 await assert.rejects(()=>preflightWebsite('https://approved.example.com:8443/',input));
 await assert.rejects(()=>preflightWebsite('https://approved.example.com/',{...input,resolver:async()=>[{address:'93.184.215.14'},{address:'127.0.0.1'}]}));
});
