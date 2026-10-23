import {deriveProgress} from './learning.js';
import {deriveExpeditions} from './expedition.js';
import {pictureItems} from './picture-content.js';
/** Education and world accomplishments are separate, composable state. */
export function journeyProgress(events,pack,boards,now=Date.now()){
 const learning=deriveProgress(events,pack,now),worlds=deriveExpeditions(events,boards);
 const completedMissions=new Set(learning.rewards);
 const rewards=new Set(boards.filter(b=>completedMissions.has(b.missionId)&&worlds.solved.has(b.id)).map(b=>b.missionId));
 // The redesigned story trail can be explicitly collected after all five
 // activities. Keep legacy route rewards without fabricating route solutions
 // or language evidence. The existing mission envelope needs no data migration.
 for(const event of events)if(event.kind==='mission'&&event.payload?.experience==='story-v1'
   &&completedMissions.has(event.payload.missionId))rewards.add(event.payload.missionId);
 const pictureIds=new Set(pictureItems.map(i=>i.id));
 const pictureFinds=new Set(events.filter(e=>e.kind==='mission'&&e.payload?.experience==='picture-play-v1'&&pictureIds.has(e.payload.itemId)).map(e=>e.payload.itemId));
 return {...learning,completedMissions,rewards,worlds,pictureFinds};
}
