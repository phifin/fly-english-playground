import {PLACEMENT_METHODS,placementPool,acceptedPlacementResult} from './placement.js';

const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
export const GUIDE_TOPICS=Object.freeze(['home','choice','gap','match','order','writing','memory','pictures','picture-explore','picture-find','picture-match','workshop','review']);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
const plain=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value)));
function exact(value,keys){return plain(value)&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>own(value,key));}
function validTime(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;}
const order=(a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id);

/** Payloads are stored in existing immutable mission events; no profile migration. */
export function validLearningEntryPayload(value){
 return exact(value,['experience','version','path','level'])&&value.experience==='learning-entry-v1'&&value.version===1&&
  (value.path==='reader'&&LEVELS.includes(value.level)||value.path==='supported-pictures'&&value.level===null);
}
export function validGuidePayload(value){
 return exact(value,['experience','version','topic','state'])&&value.experience==='guide-v1'&&value.version===1&&
  GUIDE_TOPICS.includes(value.topic)&&['completed','skipped'].includes(value.state);
}
function eligibleEvents(events,profileId){
 if(!Array.isArray(events))return [];
 return events.filter(event=>plain(event)&&identifier(event.id)&&validTime(event.at)&&plain(event.payload)&&
  (!own(event,'profileId')||event.profileId===profileId)).sort(order);
}
const state=(path,level,reason,eventId)=>({established:true,readerReady:path==='reader',path,level,reason,eventId});
const unset=()=>({established:false,readerReady:false,path:null,level:null,reason:'unset',eventId:null});

/**
 * Decide whether a starting point was actually chosen, not whether A1 happened
 * to be the profile default. Input events must already be scoped by the store;
 * explicit profileId fields are additionally checked for backup callers.
 * This is an entry/navigation policy, never a proficiency or mastery estimator.
 */
export function initialLearningState(profile,events,{pack,activities,placementItems=[],assess}={}){
 if(!identifier(profile?.id))return unset();
 const history=eligibleEvents(events,profile.id),catalog=activities instanceof Map?activities:null;
 let selected=null,legacy=null;
 for(const event of history){
  const p=event.payload;
  if(event.kind==='mission'&&validLearningEntryPayload(p)){
   selected=state(p.path,p.level,p.path==='reader'?'explicit-start':'supported-pictures',event.id);
  }else if(event.kind==='placement'&&p.method==='manual-start'&&LEVELS.includes(p.level)&&p.count===0){
   // This exact method was emitted by the pre-gate manual level chooser.
   selected=state('reader',p.level,'legacy-manual',event.id);
  }else if(event.kind==='placement'&&PLACEMENT_METHODS.includes(p.method)&&p.stage==='accepted'&&
    identifier(p.sessionId)&&Array.isArray(p.responses)&&catalog&&typeof assess==='function'){
   try{
    const result=acceptedPlacementResult(p,placementPool(pack,p.method,placementItems),catalog,assess);
    if(result)
     selected=state('reader',result.level,'accepted-placement',event.id);
   }catch{/* Invalid imported claims do not establish a starting point. */}
  }
  if(event.kind==='attempt'&&catalog&&typeof assess==='function'){
   const activity=catalog.get(p.activityId);
   if(!activity||!LEVELS.includes(activity.level)||activity.type==='writing')continue;
   if(p.missionId!==undefined&&p.missionId!==activity.missionId)continue;
   try{
    const result=assess(activity,p.answer);
    // Even a wrong or assisted complete response proves prior participation,
    // not mastery. It avoids interrupting legitimate returning readers.
    if(result.complete===true&&result.automatic===true&&typeof result.correct==='boolean')
     legacy=state('reader',activity.level,'legacy-practice',event.id);
   }catch{/* Unknown/malformed responses are not participation evidence. */}
  }
 }
 // Explicit choices outrank later practice; practicing a harder item must not
 // silently change a learner's choice or undo an assisted-picture pathway.
 return selected??legacy??unset();
}

/** Replaying help is an ephemeral UI choice; skipping it is remembered too. */
export function guideStatus(events,topic,{profileId}={}){
 if(!GUIDE_TOPICS.includes(topic))return 'new';
 const record=eligibleEvents(events,profileId).filter(event=>event.kind==='mission'&&validGuidePayload(event.payload)&&event.payload.topic===topic).at(-1);
 return record?.payload.state??'new';
}
