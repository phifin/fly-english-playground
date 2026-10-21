import {deriveProgress} from './learning.js';
import {deriveExpeditions} from './expedition.js';
/** Education and world accomplishments are separate, composable state. */
export function journeyProgress(events,pack,boards,now=Date.now()){
 const learning=deriveProgress(events,pack,now),worlds=deriveExpeditions(events,boards);
 const completedMissions=new Set(learning.rewards);
 const rewards=new Set(boards.filter(b=>completedMissions.has(b.missionId)&&worlds.solved.has(b.id)).map(b=>b.missionId));
 return {...learning,completedMissions,rewards,worlds};
}
