import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

/**
 * Defense-in-depth URL preflight ONLY. DNS results can change during fetch,
 * Chromium may open additional connections, and redirects can change origin.
 * No website fetch or navigation is authorized by this function alone.
 */
function blockedIPv4(ip){
 const a=ip.split('.').map(Number);
 if(a.length!==4||a.some(x=>!Number.isInteger(x)||x<0||x>255))return true;
 const [x,y]=a;
 return x===0||x===10||x===127||x>=224||x===169&&y===254||
   x===172&&y>=16&&y<=31||x===192&&(y===168||y===0||y===88||y===18||y===19)||
   x===100&&y>=64&&y<=127||x===198&&(y===18||y===19||y===51)||x===203&&y===0||
   x===192&&y===0||x===198&&y===51||x===203&&y===0;
}
export function publicAddress(ip){
 const version=isIP(ip);
 if(version===4)return !blockedIPv4(ip);
 if(version!==6)return false;
 const value=ip.toLowerCase().split('%')[0];
 if(value==='::'||value==='::1'||value.startsWith('fe80:')||
    value.startsWith('fc')||value.startsWith('fd')||value.startsWith('ff'))return false;
 // IPv4-mapped addresses and IPv4-embedded forms: fail closed.
 if(value.includes('.')||value.startsWith('::ffff:'))return false;
 // Documentation range and unspecified/reserved/unicast-local prefixes.
 if(value.startsWith('2001:db8:')||value.startsWith('2001:0db8:')||value.startsWith('2001:0000:'))return false;
 return /^2[0-9a-f]{3}:/.test(value);
}
export async function preflightWebsite(input,{resolver=lookup,allowedHosts=[]}={}){
 let u;try{u=new URL(input);}catch{throw new Error('Invalid URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||u.hash||u.href.length>2048)throw new Error('Only plain HTTPS on port 443 without credentials or fragments is supported');
 const host=u.hostname.toLowerCase();
 if(!host.includes('.')||host.endsWith('.')||isIP(host)||host==='localhost'||/\.(local|localhost|internal|test|invalid|example|onion|home|lan)$/.test(host))throw new Error('Internal or non-public hostname');
 if(!allowedHosts.includes(host))throw new Error('Domain is not explicitly approved for this lab');
 const addresses=await resolver(host,{all:true,verbatim:true});
 if(!Array.isArray(addresses)||addresses.length===0||addresses.some(a=>!publicAddress(a.address)))throw new Error('DNS is unresolved or includes private/reserved addresses');
 return {url:u.href,host,addresses:addresses.map(x=>x.address),status:'preflight_only',note:'Not a fetch authorization: network namespace, redirect control, re-resolution and Chromium subresource egress must still be enforced'};
}
