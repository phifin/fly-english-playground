/** Deterministic learning evidence. World rewards never imply CEFR certification. */
export const LEVELS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const REGIONS = [
  {level:'A1',name:{en:'Lantern Harbor',vi:'Bến đèn lồng'},color:'#e6a04b',icon:'lantern',description:{en:'Bring light to a harbor of small beginnings.',vi:'Thắp sáng bến cảng của những khởi đầu nhỏ.'}},
  {level:'A2',name:{en:'Wildseed Gardens',vi:'Vườn hạt mầm'},color:'#80a67b',icon:'leaf',description:{en:'Grow curious things. Follow the unexpected.',vi:'Nuôi những điều kỳ diệu. Theo dấu bất ngờ.'}},
  {level:'B1',name:{en:'Tideglass Isles',vi:'Quần đảo thủy tinh'},color:'#73a9b3',icon:'wave',description:{en:'Read the tides and uncover forgotten journeys.',vi:'Đọc con nước và khám phá những hành trình bị lãng quên.'}},
  {level:'B2',name:{en:'Clockwork Canopy',vi:'Tán rừng bánh răng'},color:'#ad8cba',icon:'gear',description:{en:'Make connections in a forest of possibilities.',vi:'Kết nối những khả năng trong khu rừng kỳ diệu.'}},
  {level:'C1',name:{en:'Prism Observatory',vi:'Đài quan sát lăng kính'},color:'#738dbb',icon:'star',description:{en:'Look closer. A different angle changes everything.',vi:'Quan sát kỹ. Một góc nhìn khác thay đổi mọi điều.'}},
  {level:'C2',name:{en:'The Unwritten Sky',vi:'Bầu trời chưa viết'},color:'#b58b69',icon:'feather',description:{en:'Explore nuance and leave something worth discovering.',vi:'Khám phá sắc thái và để lại điều đáng tìm hiểu.'}},
];

export function normalizeAnswer(value) {
  return String(value ?? '').normalize('NFKC').replace(/[’‘]/g,"'").trim().toLocaleLowerCase('en').replace(/\s+/g,' ').replace(/[.!?]+$/,'').trim();
}

/** Unsupported and open production is never marked correct. */
export function assess(activity, answer) {
  if (!activity) throw new Error('Unknown activity');
  if (activity.type === 'writing') return {correct:null,complete:typeof answer?.text === 'string' && answer.text.trim().length >= 12 && Array.isArray(answer.checks) && activity.rubric.every((_,i)=>answer.checks.includes(i)),automatic:false};
  let correct = false, complete = false;
  if (activity.type === 'choice') {
    complete = activity.options.some(o=>o.id===answer);
    correct = complete && answer===activity.answer;
  } else if (activity.type === 'gap') {
    complete = typeof answer === 'string' && answer.trim().length > 0 && answer.length <= 500;
    correct = complete && activity.accepted.some(a=>normalizeAnswer(a)===normalizeAnswer(answer));
  } else if (activity.type === 'order') {
    complete = Array.isArray(answer) && answer.length===activity.tokens.length && new Set(answer).size===answer.length && answer.every(id=>activity.tokens.some(t=>t.id===id));
    correct = complete && [activity.answer,...(activity.alternatives??[])].some(a=>a.every((id,i)=>id===answer[i]));
  } else if (activity.type === 'match') {
    complete = answer && typeof answer==='object' && !Array.isArray(answer) && activity.pairs.every(p=>activity.pairs.some(q=>q.id===answer[p.id])) && new Set(Object.values(answer)).size===activity.pairs.length;
    correct = Boolean(complete && activity.pairs.every(p=>answer[p.id]===p.id));
  } else throw new Error('Unsupported activity type');
  return {correct:Boolean(correct),complete:Boolean(complete),automatic:true};
}

export function solution(activity) {
  if (activity.type==='choice') return activity.options.find(o=>o.id===activity.answer).text;
  if (activity.type==='gap') return activity.accepted.join(' / ');
  if (activity.type==='order') return activity.answer.map(id=>activity.tokens.find(t=>t.id===id).text).join(' ');
  if (activity.type==='match') return activity.pairs.map(p=>`${p.left} → ${p.right}`).join('; ');
  return activity.example;
}

/** Imported drafts are data, never trusted component state. Partial responses are allowed. */
export function validDraftAnswer(a,value) {
 if(value===null)return true;
 if(a.type==='choice')return typeof value==='string'&&a.options.some(o=>o.id===value);
 if(a.type==='gap')return typeof value==='string'&&value.length<=500;
 if(a.type==='order')return Array.isArray(value)&&value.length===a.tokens.length&&new Set(value).size===value.length&&value.every(id=>a.tokens.some(t=>t.id===id));
 if(a.type==='match')return value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,v])=>a.pairs.some(p=>p.id===k)&&(v===''||a.pairs.some(p=>p.id===v)));
 if(a.type==='writing')return value&&typeof value==='object'&&typeof value.text==='string'&&value.text.length<=5000&&Array.isArray(value.checks)&&value.checks.every(i=>Number.isInteger(i)&&i>=0&&i<a.rubric.length)&&new Set(value.checks).size===value.checks.length;
 return false;
}

const DAY=86400000, INTERVALS=[1,3,7,14,30];
export function indexContent(pack) {
  const missions=new Map(),activities=new Map();
  for(const m of pack.missions) { missions.set(m.id,m); for(const a of m.activities) activities.set(a.id,{...a,missionId:m.id,level:m.level}); }
  return {missions,activities};
}

/** Rebuildable from immutable events; sorting is deterministic across devices. */
export function deriveProgress(events, pack, now=Date.now()) {
  const {missions,activities}=indexContent(pack), records={}, rewards=new Set();
  const sorted=[...events].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
  let recommendation=null, observatory=null;
  const drafts={},supportDays={};
  for(const event of sorted) {
    const p=event.payload??{};
    if(event.kind==='support'&&activities.has(p.activityId))supportDays[p.activityId]=event.at.slice(0,10);
    if(event.kind==='placement' && LEVELS.includes(p.level)) recommendation={level:p.level,at:event.at,method:p.method??'orientation',count:p.count??0};
    if(event.kind==='observatory') observatory=p;
    if(event.kind==='draft' && activities.has(p.activityId)&&validDraftAnswer(activities.get(p.activityId),p.answer)) drafts[p.activityId]={...p,savedAt:event.at};
    if(event.kind!=='attempt' || !activities.has(p.activityId)) continue;
    const a=activities.get(p.activityId);
    let result;
    try { result=assess(a,p.answer); } catch { continue; }
    if(!result.complete) continue;
    const r=records[a.id]??={id:a.id,missionId:a.missionId,focus:a.focus,level:a.level,attempts:0,correct:0,independent:0,completed:false,streak:0,due:null,lastDay:null,last:null};
    r.attempts++; r.last={...p,at:event.at,result}; r.completed ||= result.correct===true||result.correct===null;
    if(result.correct===true) r.correct++;
    if(result.automatic) {
      const stamp=Date.parse(event.at), day=event.at.slice(0,10);
      const recentSolution=r.solutionDay===day;
      const revealedDraft=(drafts[a.id]?.supported && drafts[a.id]?.savedAt?.slice(0,10)===day)||supportDays[a.id]===day;
      if(!result.correct||p.supported||revealedDraft)r.solutionDay=day;
      if(result.correct && !p.supported && !recentSolution && !revealedDraft) {
        r.independent++;
        // Repeating the same item in a sitting cannot create spaced mastery.
        if(r.due===null||stamp>=r.due){
          if(r.lastDay!==day)r.streak=Math.min(r.streak+1,INTERVALS.length);
          r.due=stamp+INTERVALS[Math.max(0,r.streak-1)]*DAY;
        }
        r.lastDay=day;
      } else if(!result.correct) {r.streak=0;r.due=stamp+10*60000;}
      else r.due=stamp+DAY;
    }
    // A submitted answer must never reappear as a prefilled retrieval response.
    delete drafts[a.id];
  }
  // Accomplishments derive from actual complete activities, never submitted reward flags.
  for(const m of missions.values()) if(m.activities.every(a=>records[a.id]?.completed)) rewards.add(m.id);
  const due=Object.values(records).filter(r=>r.due!==null&&r.due<=now).sort((a,b)=>a.due-b.due);
  const practiced=Object.values(records), graded=practiced.filter(r=>activities.get(r.id).type!=='writing');
  return {records,rewards,due,drafts,recommendation,observatory,attempts:practiced.reduce((s,r)=>s+r.attempts,0),independent:graded.filter(r=>r.independent>0).length,retained:graded.filter(r=>r.streak>=3).length};
}

export function availableMissions(pack,level,progress) {
  return pack.missions.filter(m=>m.level===level).map((mission,i,all)=>({mission,unlocked:i===0||(progress.completedMissions??progress.rewards).has(all[i-1].id),complete:progress.rewards.has(mission.id)}));
}
export function nextActivity(mission,progress) {return mission.activities.find(a=>!progress.records[a.id]?.completed)??mission.activities[0];}
export function nextMission(pack,level,progress) {return availableMissions(pack,level,progress).find(m=>m.unlocked&&!m.complete)?.mission??null;}

/** This small content-based orientation is a recommendation, not a calibrated test. */
export function placementRecommendation(results) {
  const byLevel=Object.fromEntries(LEVELS.map(l=>[l,{correct:0,total:0}]));
  for(const r of results) if(LEVELS.includes(r.level)&&typeof r.correct==='boolean'){byLevel[r.level].total++;if(r.correct)byLevel[r.level].correct++;}
  let level='A1';
  // Require adequate evidence at each prior band; a lucky advanced answer cannot skip gaps.
  for(const l of LEVELS) {const r=byLevel[l];if(r.total<2||r.correct/r.total<0.67) break;level=LEVELS[Math.min(LEVELS.indexOf(l)+1,5)];}
  return {level,count:results.length,byLevel,method:'content-orientation',provisional:true};
}

export function newEvent(kind,payload,clock=new Date()) {
  return {id:globalThis.crypto.randomUUID(),kind,at:clock.toISOString(),payload:structuredClone(payload)};
}

/** Small transparent recommendation heuristic, never a proficiency promotion. */
export function suggestPractice(progress,level){
 const recent=Object.values(progress.records).filter(r=>r.level===level&&r.last?.result.automatic).sort((a,b)=>b.last.at.localeCompare(a.last.at)).slice(0,12);
 const difficult=recent.filter(r=>r.last.result.correct===false);
 if(difficult.length>=2)return {action:'review',level,reason:'repair',activityIds:difficult.map(r=>r.id)};
 if(recent.length>=8&&recent.filter(r=>r.independent>0&&r.last.result.correct===true).length/recent.length>=.85&&LEVELS.indexOf(level)<5)return {action:'region',level:LEVELS[LEVELS.indexOf(level)+1],reason:'stretch'};
 return {action:'continue',level,reason:'continue'};
}
