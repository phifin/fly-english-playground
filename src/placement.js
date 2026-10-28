/** A bounded, transparent routing heuristic; no calibrated proficiency score. */
const levels=['A1','A2','B1','B2','C1','C2'];
export const PLACEMENT_LIMIT=10;
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
export function startingPointResult(responses,items,activities,grade){
 const evidence=placementEvidence(responses,items,activities,grade),{bands}=route(evidence);
 const passed=levels.filter(l=>bands[l].correct>=2),level=passed.at(-1)??'A1';
 const index=levels.indexOf(level),exposed=evidence.filter(e=>e.seenBefore).length;
 const skipped=evidence.filter(e=>e.skipped).length;
 return {method:'starting-point-v2',level,count:evidence.length,provisional:true,
  range:[level,levels[Math.min(5,index+1)]],
  confidence:!passed.length||exposed||evidence.length<4||skipped>evidence.length/2?'limited':'tentative',
  exposed,skipped,bands,skills:[...new Set(evidence.map(e=>e.skill))],
  scope:'reading-and-language-use',responses:structuredClone(responses)};
}
export function savedPlacement(events){
 const list=events.filter(e=>e.kind==='placement'&&e.payload?.method==='starting-point-v2'&&typeof e.payload.sessionId==='string'&&Array.isArray(e.payload.responses));
 list.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 return list.at(-1)?.payload??null;
}
