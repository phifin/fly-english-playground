import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {indexCurriculum,deriveCurriculum} from '../src/curriculum.js';
const legacy=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const raw=await readFile(new URL('../data/staging/platform-foundation-v1.json',import.meta.url)),candidate=JSON.parse(raw);
const count=(items,field)=>items.reduce((r,i)=>(r[i[field]]=(r[i[field]]??0)+1,r),{});
const activities=legacy.missions.flatMap(m=>m.activities.map(a=>({...a,level:m.level})));
const index=indexCurriculum(candidate),items=[...index.activities.values()],now=Date.now();
const timings=[];
for(const size of [1000,10000]){
 const events=Array.from({length:size},(_,i)=>{const a=items[i%items.length];return{id:'measure-'+i,kind:'attempt',at:new Date(now-(size-i)*60000).toISOString(),payload:{activityId:a.id,answer:a.type==='gap'?a.accepted[0]:a.answer,supported:i%7===0}};});
 const samples=[];let result;
 for(let n=0;n<4;n++){const start=performance.now();result=deriveCurriculum(events,candidate,{now});if(n)samples.push(performance.now()-start);}
 timings.push({events:size,medianMilliseconds:Math.round(samples.sort((a,b)=>a-b)[1]*100)/100,replayedAttempts:Object.values(result.records).reduce((n,r)=>n+r.attempts,0)});
}
const report={at:new Date().toISOString(),legacy:{missions:legacy.missions.length,activities:activities.length,levels:count(activities,'level'),types:count(activities,'type'),writingIsSelfReviewed:true,notAnObjectiveCoverageMeasure:true},
 candidate:{accepted:false,objectives:candidate.objectives.length,lexicalTargets:index.lexicon.size,activityPurposes:count(items,'purpose'),domains:count(candidate.objectives,'domain'),levels:count(candidate.objectives,'level'),bytes:raw.length,gzipBytes:gzipSync(raw).length},
 performance:{environment:'Current development Node process; not a phone benchmark',timings},
 gaps:['No comprehensive lexical or grammar syllabus is established by these finite counts.','Advanced candidate objectives require substantive revision and independent review.','No static recorded listening bank or validated exam listening is available.','TOEFL and full-length mocks are not implemented.','No formal CEFR/exam-score or real-child developmental validation.','No speaking or essay scoring.','No background push sender; optional calendar export only.']};
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await writeFile(new URL('../artifacts/curriculum-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
