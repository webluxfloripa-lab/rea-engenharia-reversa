import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorizeMember,quotaRemaining,PolicyDenied} from './tenant-policy.mjs';
const organization={id:'org-1',status:'active'},actor={id:'usr-1'};
const membership=role=>({organizationId:'org-1',userId:'usr-1',role});
test('RBAC membership is tenant-bound and deny-by-default',()=>{
 assert.equal(authorizeMember({actor,organization,membership:membership('owner'),action:'org.delete'}).role,'owner');
 assert.equal(authorizeMember({actor,organization,membership:membership('editor'),action:'analysis.start'}).role,'editor');
 assert.equal(authorizeMember({actor,organization,membership:membership('viewer'),action:'project.read'}).role,'viewer');
 for(const [role,action] of [['viewer','analysis.start'],['editor','billing.manage'],['admin','team.promote']]){
  assert.throws(()=>authorizeMember({actor,organization,membership:membership(role),action}),PolicyDenied);
 }
 assert.throws(()=>authorizeMember({actor,organization,membership:{organizationId:'other',userId:'usr-1',role:'owner'},action:'project.read'}),PolicyDenied);
 assert.throws(()=>authorizeMember({actor,organization:{...organization,status:'suspended'},membership:membership('owner'),action:'project.read'}),PolicyDenied);
 assert.throws(()=>authorizeMember({actor,organization,membership:membership('owner'),action:'shell.exec'}),PolicyDenied);
 assert.throws(()=>authorizeMember({actor:{id:'usr-2'},organization,membership:membership('owner'),action:'project.read'}),PolicyDenied);
});
test('quota accounting includes reserved work and rejects invalid numbers',()=>{
 assert.deepEqual(quotaRemaining({maxJobs:5,usedJobs:2,pendingJobs:2,maxBytes:1024,usedBytes:512,newArtifactBytes:500}),{slots:1,availableBytes:512,canCreateJob:true});
 assert.equal(quotaRemaining({maxJobs:5,usedJobs:5,pendingJobs:0,maxBytes:1024,usedBytes:100}).canCreateJob,false);
 assert.equal(quotaRemaining({maxJobs:5,usedJobs:0,pendingJobs:0,maxBytes:1024,usedBytes:1000,newArtifactBytes:50}).canCreateJob,false);
 assert.throws(()=>quotaRemaining({maxJobs:-1,usedJobs:0,pendingJobs:0,maxBytes:1024,usedBytes:0}),PolicyDenied);
});
