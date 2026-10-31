/**
 * Pure policy for future authenticated, persistent SaaS broker.
 * Deliberately NOT wired to the single-operator local executor.
 */
export const ACTIONS=Object.freeze({
  'project.read':['owner','admin','editor','viewer'],
  'project.write':['owner','admin','editor'],
  'analysis.start':['owner','admin','editor'],
  'analysis.cancel':['owner','admin','editor'],
  'artifact.download':['owner','admin','editor','viewer'],
  'artifact.delete':['owner','admin'],
  'project.delete':['owner','admin'],
  'team.invite':['owner','admin'],
  'team.remove':['owner','admin'],
  'team.promote':['owner'],
  'billing.manage':['owner'],
  'org.delete':['owner']
});
export class PolicyDenied extends Error{constructor(reason){super(reason);this.name='PolicyDenied';this.code=reason;}}
export function authorizeMember({actor,organization,membership,action}){
 if(!actor||typeof actor.id!=='string'||!actor.id)throw new PolicyDenied('identity_required');
 if(!organization||organization.status!=='active')throw new PolicyDenied('organization_unavailable');
 if(!membership||membership.organizationId!==organization.id||membership.userId!==actor.id)throw new PolicyDenied('not_a_member');
 const roles=ACTIONS[action];
 if(!roles)throw new PolicyDenied('unknown_action');
 if(!roles.includes(membership.role))throw new PolicyDenied('insufficient_role');
 return {organizationId:organization.id,actorId:actor.id,role:membership.role,action};
}
export function quotaRemaining({maxJobs,usedJobs,pendingJobs,maxBytes,usedBytes,newArtifactBytes=0}){
 if(![maxJobs,usedJobs,pendingJobs,maxBytes,usedBytes,newArtifactBytes].every(x=>Number.isSafeInteger(x)&&x>=0))throw new PolicyDenied('invalid_quota');
 const slots=Math.max(0,maxJobs-usedJobs-pendingJobs);
 const availableBytes=Math.max(0,maxBytes-usedBytes);
 return {slots,availableBytes,canCreateJob:slots>0&&availableBytes>=newArtifactBytes};
}
