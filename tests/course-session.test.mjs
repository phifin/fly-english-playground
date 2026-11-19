import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {courseUnits} from '../src/course-bank.js';
import {listeningUnits} from '../src/course-listening.js';
import {academicSets} from '../src/academic-content.js';
import {newCourseState,openUnit,startCoursePractice,courseSubmission,courseResult,courseProgress,courseView} from '../src/course.js';

const first=courseUnits[0];
function submit(unit,assisted=false,heard=[]){
 const state=newCourseState('learner',unit.level);openUnit(state,unit.id);startCoursePractice(state,[]);
 state.supported=assisted;state.heard=new Set(heard);
 const data=new Map(unit.items.map((item,i)=>['course-'+i,item.keys[0]]));
 return courseSubmission(state,data);
}
test('versioned course attempts reconstruct scores, narrow reviews and schedule later retrieval',()=>{
 const p=submit(first),t=Date.UTC(2026,0,1),day=86400000;
 assert.ok(courseResult(p).correct.every(Boolean));assert.equal(courseResult({...p,indices:[0,0]}),null);
 const event=(payload,ms,id)=>({id,at:new Date(t+ms).toISOString(),kind:'mission',payload});
 const events=[event(p,0,'one'),event({...p,indices:[0],answers:[p.answers[0]]},day,'two')];
 assert.deepEqual(courseProgress(events.slice(0,1),t).due(first),[]);
 assert.equal(courseProgress(events,t+day).records.get(first.id+':0').streak,2);
 const incorrect=event({...p,indices:[1],answers:['incorrect answer']},day,'three');
 assert.ok(courseProgress([...events,incorrect],t+day).due(first).includes(1));
 const support=courseProgress([event(submit(first,true),0,'hint')],t);
 assert.equal(support.records.get(first.id+':0').streak,0);
});
test('audio, transcript and assisted reading evidence are distinct',()=>{
 const recorded=listeningUnits.find(x=>x.items[0].clip),script=listeningUnits.find(x=>x.script);
 assert.equal(submit(recorded).supported,true);
 assert.equal(submit(recorded,false,recorded.items.map((_,i)=>String(i))).supported,false);
 assert.equal(submit(script,false,['script']).supported,false);
 assert.equal(submit(script,true,['script']).supported,true);
 assert.equal(submit(script).supported,true);
});
test('all course and listening editions produce bilingual accessible practice and can be scored',()=>{
 for(const u of [...courseUnits,...listeningUnits]){
  assert.equal(courseResult(submit(u)).correct.filter(Boolean).length,u.items.length);
  const s=newCourseState('a',u.level);openUnit(s,u.id);startCoursePractice(s,[]);
  for(const language of ['en','vi']){const html=courseView({state:s,language,events:[]});assert.match(html,/data-form="course-paper"/);assert.ok(!html.includes('undefined'));assert.equal(html.split('<fieldset>').length-1,u.items.length);}
 }
});
test('the reference is redistributable and alphabetically sharded, each selected primary sense counted once',async()=>{
 const dir=new URL('../data/published/reference/',import.meta.url),paths=(await readdir(dir)).sort(),all=[];
 assert.equal(paths.length,26);
 for(const path of paths){const shard=JSON.parse(await readFile(new URL(path,dir),'utf8'));assert.match(shard.license,/Princeton University/);for(const row of shard.entries){assert.equal(row.term[0],path[0]);assert.ok(row.meaning&&row.sense&&row.pos);all.push(row);}}
 assert.equal(new Set(all.map(x=>x.term)).size,3000);assert.equal(all.length,3000);
 assert.equal(createHash('sha256').update(JSON.stringify(all)).digest('hex'),'6a5ef7ae17f95716ea67bcada8c8d37be534b7512d30a0d7ab7c3c78839a157d');
});
test('recordings match the attributed source manifest and every local media file belongs to a question',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../data/reviews/listening-recordings.json',import.meta.url),'utf8'));
 const dir=new URL('../assets/listening/',import.meta.url),clips=listeningUnits.flatMap(u=>u.items.map(i=>i.clip).filter(Boolean));
 assert.equal((await readdir(dir)).length,clips.length);
 for(const clip of clips){const credit=manifest.find(r=>r.id===clip.id);assert.equal(credit.record,clip.record);assert.equal(credit.transcript,clip.script);assert.equal(credit.voice,clip.voice);assert.equal(credit.audioLicense,'CC BY 4.0');assert.equal(createHash('sha256').update(await readFile(new URL(clip.id+'.mp3',dir))).digest('hex'),credit.sha256);}
});
test('longer checkpoints use different stimuli and items from frequent academic practice',()=>{
 const seen=new Set(academicSets.filter(s=>!s.checkpoint).flatMap(s=>s.items.map(q=>q.prompt)));
 for(const s of academicSets.filter(s=>s.checkpoint)){assert.ok(s.items.length>=12&&s.targetMinutes>0);for(const q of s.items)assert.ok(!seen.has(q.prompt));}
});

