import {requireChatGPTUser} from '../chatgpt-auth';
import Workspace from '../../components/Workspace';
export const dynamic='force-dynamic';
export default async function Page(){const user=await requireChatGPTUser('/workspace');return <Workspace demo={false} userName={user.displayName}/>;}
