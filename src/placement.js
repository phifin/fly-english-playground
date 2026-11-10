/** A bounded, transparent routing heuristic; no calibrated proficiency score. */
import {placementItems as acceptedItems} from './placement-content.js';
const levels=['A1','A2','B1','B2','C1','C2'];
export const PLACEMENT_LIMIT=10;
export const NEW_PLACEMENT_METHOD='starting-point-v3';
export const PLACEMENT_METHODS=Object.freeze(['starting-point-v2',NEW_PLACEMENT_METHOD]);
/** Versions pin which definition is used. Original sessions never adopt new keys. */
export function placementPool(pack,method='starting-point-v2',baseItems=acceptedItems){
 if(!PLACEMENT_METHODS.includes(method))return [];
 const replacements=method===NEW_PLACEMENT_METHOD?pack?.practiceEdition?.replacements:null;
 // This is deliberately metadata only: practice hints never enter assessment UI.
 return baseItems.map(({activityId,level,skill})=>({activityId:replacements?.[activityId]??activityId,level,skill}));
}
const validResponse=r=>r&&typeof r==='object'&&!Array.isArray(r)&&
 Object.keys(r).every(k=>['activityId','answer','skipped','seenBefore'].includes(k))&&
 typeof r.activityId==='string'&&Object.hasOwn(r,'answer')&&typeof r.skipped==='boolean'&&
 (!r.skipped||r.answer===null)&&(!Object.hasOwn(r,'seenBefore')||typeof r.seenBefore==='boolean');
export function validPlacementResponses(responses,items,activities,grade){
 return Array.isArray(responses)&&responses.length<=PLACEMENT_LIMIT&&responses.every(validResponse)&&
  placementEvidence(responses,items,activities,grade).length===responses.length;
}
/** Imported labels are claims; only complete, unassisted, correctly routed data count. */
export function acceptedPlacementResult(payload,items,activities,grade){
 if(!PLACEMENT_METHODS.includes(payload?.method)||payload.stage!=='accepted'||typeof payload.sessionId!=='string'||!payload.sessionId.trim()||payload.sessionId.length>128||
  !validPlacementResponses(payload.responses,items,activities,grade)||payload.responses.length<4)return null;
 const result=startingPointResult(payload.responses,items,activities,grade,payload.method);
 if(nextPlacementItem(payload.responses,items,activities,grade)!==null||payload.count!==result.count||payload.level!==result.level)return null;
 return result;
}
export function placementEvidence(responses,items,activities,grade){
 if(!Array.isArray(responses)||responses.length>PLACEMENT_LIMIT)return [];
 const allowed=new Map(items.map(i=>[i.activityId,i])),seen=new Set(),valid=[];
 for(const r of responses){
  const meta=allowed.get(r?.activityId),a=activities.get(r?.activityId);
  if(!meta||!a||seen.has(a.id)||meta.level!==a.level||typeof r.skipped!=='boolean')continue;
  const expected=route(valid);if(expected.finished||meta.level!==levels[expected.index])continue;
  let result;try{result=r.skipped?{complete:true,correct:false}:grade(a,r.answer);}catch{continue;}
  if(!result.complete||typeof result.correct!=='boolean')continue;
  seen.add(a.id);valid.push({activityId:a.id,level:a.level,skill:meta.skill,correct:result.correct,skipped:r.skipped,seenBefore:r.seenBefore===true});
 }
 return valid;
}
function route(evidence){
 const bands=Object.fromEntries(levels.map(l=>[l,{correct:0,total:0,skipped:0}]));
 for(const r of evidence){bands[r.level].total++;bands[r.level].correct+=Number(r.correct);bands[r.level].skipped+=Number(r.skipped);}
 let index=1,finished=false;
 for(let step=0;step<12;step++){
  const b=bands[levels[index]],pass=b.correct>=2,fail=b.total-b.correct>=2;
  if(!pass&&!fail)break;
  if(pass){if(index===5||bands[levels[index+1]].total-bands[levels[index+1]].correct>=2){finished=true;break;}index++;}
  else{if(index===0||bands[levels[index-1]].correct>=2){finished=true;break;}index--;}
 }
 return {bands,index,finished};
}
export function nextPlacementItem(responses,items,activities,grade,exposed=[]){
 const evidence=placementEvidence(responses,items,activities,grade),state=route(evidence);
 if(state.finished||evidence.length>=PLACEMENT_LIMIT)return null;
 const used=new Set(evidence.map(e=>e.activityId)),seen=new Set(exposed);
 const band=items.filter(i=>i.level===levels[state.index]&&!used.has(i.activityId)&&activities.has(i.activityId));
 // Prefer unseen items; still report exposure honestly when the finite pool runs out.
 const sampled=new Set(evidence.filter(e=>e.level===levels[state.index]).map(e=>e.skill));
 band.sort((a,b)=>Number(seen.has(a.activityId))-Number(seen.has(b.activityId))||Number(sampled.has(a.skill))-Number(sampled.has(b.skill))||a.activityId.localeCompare(b.activityId));
 return band[0]??null;
}
export function startingPointResult(responses,items,activities,grade,method='starting-point-v2'){
 if(!PLACEMENT_METHODS.includes(method))throw new Error('Unknown placement method.');
 const evidence=placementEvidence(responses,items,activities,grade),{bands}=route(evidence);
 const passed=levels.filter(l=>bands[l].correct>=2),level=passed.at(-1)??'A1';
 const index=levels.indexOf(level),exposed=evidence.filter(e=>e.seenBefore).length;
 const skipped=evidence.filter(e=>e.skipped).length;
 return {method,level,count:evidence.length,provisional:true,
  range:[level,levels[Math.min(5,index+1)]],
  confidence:!passed.length||exposed||evidence.length<4||skipped>evidence.length/2?'limited':'tentative',
  exposed,skipped,bands,skills:[...new Set(evidence.map(e=>e.skill))],
  scope:'reading-and-language-use',responses:structuredClone(responses)};
}
export function savedPlacement(events,{pack,activities,grade,items=acceptedItems}={}){
 const list=events.filter(e=>{
  const p=e.payload;
  if(e.kind!=='placement'||!PLACEMENT_METHODS.includes(p?.method)||typeof p.sessionId!=='string'||!p.sessionId.trim()||p.sessionId.length>128||!['progress','accepted'].includes(p.stage)||!Array.isArray(p.responses)||p.responses.length>PLACEMENT_LIMIT)return false;
  if(activities instanceof Map&&typeof grade==='function'){
   const pool=placementPool(pack,p.method,items);
   return p.stage==='accepted'?acceptedPlacementResult(p,pool,activities,grade)!==null:validPlacementResponses(p.responses,pool,activities,grade);
  }
  return p.responses.every(validResponse);
 });
 list.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 return list.at(-1)?.payload??null;
}
