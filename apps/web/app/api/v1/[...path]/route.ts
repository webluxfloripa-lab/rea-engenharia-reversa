import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../../chatgpt-auth';
import { handle } from '../../../../lib/api.mjs';
export const dynamic='force-dynamic';
async function route(request:Request){return handle(request,{db:env.DB,user:await getChatGPTUser()});}
export const GET=route;
export const POST=route;
export const DELETE=route;
