/** Construction state and reading evidence. Never turns a creation into a CEFR award. */
export const WORKSHOP_PROPS=Object.freeze(['lantern','bell','boat','shell','kite','leaf']);
export const WORKSHOP_SLOTS=Object.freeze(['water','sand','tree','sky']);
export function validPlacement(value){
 return value!==null&&typeof value==='object'&&!Array.isArray(value)
  &&Object.keys(value).every(k=>WORKSHOP_SLOTS.includes(k))
  &&Object.values(value).every(v=>WORKSHOP_PROPS.includes(v))
  &&new Set(Object.values(value)).size===Object.values(value).length;
}
export function placeToy(placement,prop,slot){
 if(!validPlacement(placement)||!WORKSHOP_PROPS.includes(prop)||!WORKSHOP_SLOTS.includes(slot))throw Error('Invalid construction');
 return {...Object.fromEntries(Object.entries(placement).filter(([k,v])=>k!==slot&&v!==prop)),[slot]:prop};
}
export function fulfillsBrief(placement,brief){
 return validPlacement(placement)&&Array.isArray(brief?.placements)&&brief.placements.length>0
  &&brief.placements.every(({prop,slot})=>placement[slot]===prop);
}
export function placementFeedback(brief,placement,prop,slot){
 if(fulfillsBrief(placement,brief))return 'matched';
 return brief?.placements.some(p=>p.prop===prop&&p.slot!==slot)?'try-again':'moved';
}
/** Immutable saved snapshots survive offline merges. Stable order breaks same-time ties.
 * Keepsakes use any genuinely matching snapshot; latest valid layout wins per space.
 * Help/errors are conservative lifetime flags, not scores or diagnostic proficiency.
 */
export function deriveWorkshop(events,briefs){
 const catalog=new Map(briefs.map(b=>[b.id,b])),layouts={},completed=new Map(),helped=new Set(),retried=new Set();
 const ordered=[...events].filter(e=>e.kind==='mission'&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))).sort((a,b)=>a.at.localeCompare(b.at)||String(a.id).localeCompare(String(b.id)));
 let lastSpace=null;
 for(const event of ordered){
  const p=event.payload??{},brief=catalog.get(p.space);
  if(p.experience==='workshop-help-v1'&&catalog.has(p.briefId)){helped.add(p.briefId);continue;}
  if(p.experience!=='workshop-layout-v1'||(p.space!=='free'&&!brief)||!validPlacement(p.placement)
    ||!['place','remove','reset'].includes(p.operation))continue;
  if(p.operation==='place'&&(!WORKSHOP_PROPS.includes(p.prop)||!WORKSHOP_SLOTS.includes(p.slot)||p.placement[p.slot]!==p.prop))continue;
  if(p.operation==='remove'&&(!WORKSHOP_SLOTS.includes(p.slot)||Object.hasOwn(p.placement,p.slot)))continue;
  if(p.operation==='reset'&&Object.keys(p.placement).length)continue;
  layouts[p.space]={...p.placement};lastSpace=p.space;
  if(brief&&p.operation==='place'&&placementFeedback(brief,p.placement,p.prop,p.slot)==='try-again')retried.add(brief.id);
  if(brief&&fulfillsBrief(p.placement,brief)&&!completed.has(brief.id))completed.set(brief.id,{at:event.at,placement:{...p.placement},independent:!helped.has(brief.id)&&!retried.has(brief.id)});
 }
 // A concurrent help event must not be hidden by a different device's clock/order.
 for(const [id,receipt] of completed)if(helped.has(id)||retried.has(id))receipt.independent=false;
 return {layouts,completed,helped,retried,lastSpace};
}
export function startingBrief(briefs,level,completed=new Map()){
 const band=briefs.filter(b=>b.level===level),pool=band.length?band:briefs;
 return pool.find(b=>!completed.has(b.id))??pool[0];
}
