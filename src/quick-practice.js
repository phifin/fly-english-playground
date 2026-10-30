/** A finite study session reuses validated activities and the existing attempt engine. */
export function quickActivities(pack,progress,level){
 const all=pack.missions.flatMap(m=>m.activities.map(a=>({...a,missionId:m.id,level:m.level})));
 const due=new Set(progress.due.map(r=>r.id));
 const candidates=all.filter(a=>a.level===level&&a.type!=='writing');
 candidates.sort((a,b)=>Number(due.has(b.id))-Number(due.has(a.id))||(progress.records[a.id]?.attempts??0)-(progress.records[b.id]?.attempts??0)||a.id.localeCompare(b.id));
 const picked=[],types=new Set();
 while(picked.length<5&&candidates.length){const i=candidates.findIndex(a=>!types.has(a.type));const [a]=candidates.splice(i<0?0:i,1);picked.push(a.id);types.add(a.type);}
 return picked;
}
export function savedQuick(events,activities){
 for(const e of [...events].sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id))){
  const p=e.payload;if(e.kind!=='mission'||p?.experience!=='quick-practice-v1')continue;
  if(typeof p.sessionId!=='string'||!Array.isArray(p.ids)||p.ids.length!==5||new Set(p.ids).size!==5||p.ids.some(id=>!activities.has(id))||!Number.isInteger(p.index)||p.index<0||p.index>5)continue;
  return {sessionId:p.sessionId,ids:[...p.ids],index:p.index};
 }return null;
}
