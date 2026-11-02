import test from 'node:test';
import assert from 'node:assert/strict';
import {indexCurriculum,deriveCurriculum,recommendations,selectCurriculumSession,normalizeCurriculumSession,normalizeLearningPreferences,curriculumSummary,curriculumDay} from '../src/curriculum.js';

// Synthetic engine fixtures, deliberately not publishable educational content.
const activity=(id,purpose='practice')=>({id,type:'gap',purpose,accepted:['fixture'],prompt:'Synthetic fixture'});
const objective=(id,level,prerequisites=[])=>({id,level,domain:'grammar',prerequisites,lexicon:[{id:`${id}-word`,term:'fixture'}],activities:[activity(`${id}-p1`),activity(`${id}-p2`),activity(`${id}-c1`,'check')]});
const batch={objectives:[objective('one','A1'),objective('two','A2',['one']),objective('three','A2')],examSets:[{id:'exam',minutes:5,activities:[activity('exam-one','exam'),activity('exam-two','exam')]}],listening:[{id:'listen',level:'A1',activities:[activity('listen-one','listening')]}]};
const now=Date.parse('2026-10-30T12:00:00.000Z');
const event=(id,activityId='one-p1',answer='fixture',at='2026-10-01T12:00:00.000Z',extra={})=>({id,kind:'attempt',at,payload:{activityId,answer,...extra}});
const derive=(events,options={})=>deriveCurriculum(events,batch,{now,...options});
const mission=(id,payload,at='2026-10-01T11:00:00.000Z')=>({id,kind:'mission',at,payload});

test('index spans distinct sources without mutating original activities',()=>{
 const index=indexCurriculum(batch);
 assert.equal(index.objectives.size,3);assert.equal(index.lexicon.size,3);assert.equal(index.activities.size,12);
 assert.equal(index.activities.get('one-p1').sourceKind,'objective');assert.equal(index.activities.get('exam-one').sourceKind,'exam');
 assert.equal(index.activities.get('listen-one').sourceKind,'listening');assert.equal(batch.objectives[0].activities[0].sourceKind,undefined);
 assert.throws(()=>indexCurriculum({...batch,listening:[{id:'one',activities:[]}]}),/duplicate/);
});
test('stored correctness, unsupported answers and unknown IDs cannot manufacture evidence',()=>{
 const p=derive([event('wrong','one-p1','wrong',undefined,{correct:true,score:100}),event('empty','one-p2',''),event('fake','unknown')]);
 assert.equal(p.objectives.one.stage,'practising');assert.equal(p.records['one-p1'].correct,0);assert.equal(p.habits.lifetimeActiveDays,1);
 assert.equal(Object.keys(p.records).length,1);assert.equal(p.objectives.two.stage,'new');
});
test('malformed support flags cannot be treated as independent retrieval',()=>{
 for (const extra of [{supported:'false'},{supported:0},{answerExposed:null}]) {
  const p=derive([event('a','one-p1','fixture',undefined,extra)]);
  assert.equal(p.objectives.one.stage,'new');assert.equal(p.habits.lifetimeActiveDays,0);
 }
});
test('same-day retries after feedback cannot become independent, different-day retrieval can',()=>{
 const events=[event('a','one-p1','wrong'),event('b','one-p1','fixture','2026-10-01T12:05:00.000Z')];
 assert.equal(derive(events).objectives.one.stage,'practising');
 events.push(event('c','one-p1','fixture','2026-10-02T12:05:00.000Z'));
 assert.equal(derive(events).objectives.one.stage,'independent');
 events.push(event('d','one-p2','fixture','2026-10-03T12:05:00.000Z'));
 assert.equal(derive(events).objectives.one.stage,'recalled');
});
test('recalled needs two distinct items and two distinct local days',()=>{
 assert.equal(derive([event('a'),event('b','one-p1','fixture','2026-10-05T12:00:00.000Z')]).objectives.one.stage,'independent');
 assert.equal(derive([event('a'),event('b','one-p2')]).objectives.one.stage,'independent');
 const p=derive([event('a'),event('b','one-p2','fixture','2026-10-02T12:00:00.000Z'),event('c','one-p2','wrong','2026-10-03T12:00:00.000Z')]);
 assert.equal(p.objectives.one.stage,'recalled');assert.equal(p.due[0].id,'one-p1');assert.equal(p.records['one-p2'].streak,0);
});
test('support receipts, supported drafts and answer-exposed attempts remain supported',()=>{
 for(const kind of ['support','draft']) {
  const support={id:'z',kind,at:'2026-10-01T12:00:00.000Z',payload:{activityId:'one-p1',answer:null,supported:true}};
  assert.equal(derive([event('a'),support]).records['one-p1'].independent,0);
 }
 assert.equal(derive([event('a','one-p1','fixture',undefined,{answerExposed:true})]).records['one-p1'].independent,0);
 assert.equal(derive([{id:'d',kind:'draft',at:'2026-10-01T12:00:00.000Z',payload:{activityId:'one-p1',answer:'fixture'}}]).habits.lifetimeActiveDays,0);
});
test('spaced review interval is bounded, same sitting and early answers do not postpone recall',()=>{
 const a=event('a'),b=event('b','one-p1','fixture','2026-10-01T12:02:00.000Z');
 assert.equal(derive([a]).records['one-p1'].due,derive([a,b]).records['one-p1'].due);
 const events=['2026-01-01','2026-01-02','2026-01-05','2026-01-12','2026-01-26','2026-02-26'].map((date,i)=>event(`e${i}`,'one-p1','fixture',`${date}T12:00:00.000Z`));
 const r=derive(events).records['one-p1'];assert.equal(r.streak,5);assert.equal(r.due,Date.parse('2026-03-28T12:00:00.000Z'));
 const mistake=derive([a,event('w','one-p1','wrong','2026-10-01T12:01:00.000Z')]);assert.equal(mistake.records['one-p1'].due,Date.parse('2026-10-01T12:11:00.000Z'));
});
test('exam/listening practices never advance objective evidence, checks are separate',()=>{
 const p=derive([event('a','exam-one'),event('b','listen-one'),event('c','one-c1')]);
 assert.equal(p.exams.exam.correct,1);assert.equal(p.listening.listen.correct,1);assert.equal(p.objectives.one.check.correct,1);
 assert.equal(p.objectives.one.practice.attempts,0);assert.equal(p.objectives.two.attempts,0);assert.equal(p.records['exam-one'].independent,0);
 assert.equal(p.records['listen-one'].due,null);assert.equal(p.checks['one-c1'].repeated,false);
});
test('recommendations prioritize due, foundations then new material without hard locks',()=>{
 const p=derive([]);const rec=recommendations(batch,p,{level:'A2'});
 assert.deepEqual(rec.map(r=>r.objectiveId),['one','two','three']);assert.equal(rec[0].reason,'foundation');
 const chosen=selectCurriculumSession(batch,p,{objectiveId:'two',level:'A2',sessionId:'s',now});assert.equal(chosen.activityIds[0],'two-p1');
 const due=derive([event('a','three-p1')]);assert.equal(recommendations(batch,due,{level:'A2'})[0].reason,'due');
});
test('session snapshots are immutable, scoped and contain no trusted imported score',()=>{
 const p=derive([]),s=selectCurriculumSession(batch,p,{kind:'exam',setId:'exam',sessionId:'s',now});
 assert.ok(Object.isFrozen(s));assert.ok(Object.isFrozen(s.activityIds));assert.equal(s.activityIds.length,2);
 assert.equal(normalizeCurriculumSession({...s,activityIds:['exam-one']},batch),null);
 assert.equal(normalizeCurriculumSession({...s,activityIds:['one-p1','exam-two']},batch),null);
 assert.equal(normalizeCurriculumSession({...s,score:100,complete:true},batch).score,undefined);
 assert.equal(normalizeCurriculumSession({...s,activityIds:['exam-one','exam-one']},batch),null);
 assert.equal(normalizeCurriculumSession({...s,startedAt:'2026-02-31T00:00:00.000Z'},batch),null);
});
test('round results use first complete answers only and ignore fabricated completion or score',()=>{
 const s=selectCurriculumSession(batch,derive([]),{kind:'exam',setId:'exam',sessionId:'s',now:Date.parse('2026-10-01T11:00:00.000Z')});
 const start=mission('start',{experience:'curriculum-session-v1',session:{...s,score:100,complete:true}});
 const p=derive([start,event('a','exam-one','wrong',undefined,{sessionId:'s'}),event('b','exam-one','fixture','2026-10-01T12:02:00.000Z',{sessionId:'s'}),event('c','exam-two','fixture',undefined,{sessionId:'s',supported:true})]);
 assert.equal(p.sessions.s.correct,1);assert.equal(p.sessions.s.total,2);assert.equal(p.sessions.s.complete,true);assert.equal(p.sessions.s.supported,1);
 assert.equal(p.sessions.s.score,undefined);assert.equal(p.sessions.s.officialScore,undefined);
});
test('checkpoints prefer unseen items and disclose reused bank items',()=>{
 const p=derive([event('old','one-c1')]);
 const s=selectCurriculumSession(batch,p,{kind:'check',level:'A1',sessionId:'s',now});
 const q=derive([event('old','one-c1'),mission('start',{experience:'curriculum-session-v1',session:s},new Date(now).toISOString())]);
 assert.deepEqual(q.sessions.s.seenBefore,['one-c1']);assert.deepEqual(q.sessions.s.recentlySeen,[]);
 const selected=selectCurriculumSession(batch,derive([event('seen','two-c1')]),{kind:'check',level:'A2',sessionId:'c',now});
 assert.ok(selected.activityIds.indexOf('three-c1')<selected.activityIds.indexOf('two-c1'));
});
test('duplicate, conflicting, future and malformed events do not invent activity',()=>{
 const a=event('a'),bad={...a,payload:{...a.payload,answer:'wrong'}};
 assert.equal(derive([a,a]).records['one-p1'].attempts,1);
 assert.deepEqual(derive([a,bad]),derive([bad,a]));assert.equal(derive([a,bad]).habits.activeDays,0);
 const badEvents=[null,{},event('future','one-p1','fixture','2027-01-01T00:00:00.000Z'),event('bad','one-p1','fixture','2026-02-31T00:00:00.000Z'),{...a,payload:[]}];
 assert.equal(derive(badEvents).habits.lifetimeActiveDays,0);
});
test('local days and DST produce seven calendar dates and safe timezone fallback',()=>{
 assert.equal(curriculumDay('2026-10-01T23:00:00.000Z','Asia/Bangkok'),'2026-10-02');
 assert.equal(curriculumDay('2026-10-01T23:00:00.000Z','invalid zone'),'2026-10-01');
 const p=derive([event('a','one-p1','fixture','2026-11-01T05:30:00.000Z'),event('b','one-p2','fixture','2026-11-01T06:30:00.000Z')],{now:Date.parse('2026-11-02T12:00:00.000Z'),timeZone:'America/New_York'});
 assert.equal(p.objectives.one.stage,'independent');assert.equal(p.habits.activeDays,1);assert.equal(new Set(p.habits.days.map(d=>d.day)).size,7);
});
test('preferences are validated immutable events and healthy habits survive skipped days',()=>{
 const preferences=mission('prefs',{experience:'learning-preferences-v1',goal:3,weekdays:[6,0],timeZone:'Asia/Bangkok'});
 const p=derive([preferences,event('a','one-p1','fixture','2026-10-25T12:00:00.000Z')]);
 assert.deepEqual(p.preferences.weekdays,[0,6]);assert.equal(p.habits.activeDays,1);assert.equal(p.habits.goalMet,false);
 assert.equal(normalizeLearningPreferences({goal:100,weekdays:[1],timeZone:'UTC'}),null);
 assert.equal(normalizeLearningPreferences({goal:3,weekdays:[1,1],timeZone:'UTC'}),null);
 assert.equal(normalizeLearningPreferences({goal:3,weekdays:[1],timeZone:'not/a-zone'}),null);
});
test('legacy assessed attempts count practice days only when known; passive exposures never count',()=>{
 const legacyActivities=new Map([['legacy',activity('legacy')]]);
 const events=[event('old','legacy'),mission('passive',{experience:'picture-play-v1',itemId:'one'}),event('unknown','invented')];
 assert.equal(derive(events).habits.lifetimeActiveDays,0);
 const p=derive(events,{legacyActivities});assert.equal(p.habits.lifetimeActiveDays,1);assert.equal(p.objectives.one.stage,'new');assert.equal(curriculumSummary(p).attempts,0);
});
test('replay leaves inputs unchanged and produces identical result for reversed event order',()=>{
 const events=[event('a'),event('b','one-p2','fixture','2026-10-03T12:00:00.000Z')],before=JSON.stringify({batch,events});
 assert.deepEqual(derive(events),derive([...events].reverse()));assert.equal(JSON.stringify({batch,events}),before);
 assert.equal(curriculumSummary(derive(events)).stages.recalled,1);
});
test('crossing midnight is not in itself spaced recall',()=>{
 const p=derive([event('a','one-p1','fixture','2026-10-01T23:59:00.000Z'),event('b','one-p2','fixture','2026-10-02T00:01:00.000Z')]);
 assert.equal(p.objectives.one.stage,'independent');
});
test('conflicting immutable session snapshots are quarantined in either event order',()=>{
 const s=selectCurriculumSession(batch,derive([]),{sessionId:'same',objectiveId:'one',now:Date.parse('2026-10-01T11:00:00.000Z')});
 const t=selectCurriculumSession(batch,derive([]),{sessionId:'same',objectiveId:'two',now:Date.parse('2026-10-01T11:00:00.000Z')});
 const events=[mission('start-a',{experience:'curriculum-session-v1',session:s}),mission('start-b',{experience:'curriculum-session-v1',session:t}),event('a','one-p1','fixture',undefined,{sessionId:'same'})];
 const p=derive(events);assert.deepEqual(p.sessionConflicts,['same']);assert.equal(p.sessions.same,undefined);assert.deepEqual(p,derive(events.reverse()));
 const duplicate=derive([mission('start-a',{experience:'curriculum-session-v1',session:s}),mission('start-b',{experience:'curriculum-session-v1',session:s})]);
 assert.ok(duplicate.sessions.same);assert.deepEqual(duplicate.sessionConflicts,[]);
});
test('review and daily queues can retrieve due checkpoint items',()=>{
 const p=derive([event('old','one-c1')]);
 for(const kind of ['daily','review']) {
  const s=selectCurriculumSession(batch,p,{kind,level:'A1',sessionId:kind,now});
  assert.equal(s.activityIds[0],'one-c1');
 }
 assert.equal(selectCurriculumSession(batch,derive([]),{kind:'review',sessionId:'empty',now}),null);
});
test('correct independent retrieval can retire an old mistake recommendation',()=>{
 const events=[event('wrong','one-p1','wrong'),event('assisted','one-p1','fixture','2026-10-01T12:01:00.000Z')];
 assert.deepEqual(curriculumSummary(derive(events)).needsPractice,['one']);
 events.push(event('retrieved','one-p1','fixture','2026-10-02T12:00:00.000Z'));
 assert.deepEqual(curriculumSummary(derive(events)).needsPractice,[]);
});
test('choice and ordering answer types use the existing assessor and snapshot real responses',()=>{
 const typed={objectives:[{...objective('typed','A1'),activities:[{id:'choose',purpose:'practice',type:'choice',options:[{id:'yes'},{id:'no'}],answer:'yes'},
  {id:'order',purpose:'check',type:'order',tokens:[{id:'a'},{id:'b'}],answer:['a','b'],alternatives:[['b','a']]}]}],examSets:[],listening:[]};
 const p=deriveCurriculum([event('a','choose','yes'),event('b','order',['b','a'],'2026-10-02T12:00:00.000Z'),event('c','order',['a','a'],'2026-10-03T12:00:00.000Z')],typed,{now});
 assert.equal(p.objectives.typed.stage,'recalled');assert.equal(p.records.order.attempts,1);assert.equal(p.objectives.typed.check.correct,1);
});
test('daily selection preserves recursive prerequisite priority even after supported practice',()=>{
 const extended={...batch,objectives:[...batch.objectives,objective('four','B1',['two'])]};
 const p=deriveCurriculum([event('a','one-p1','fixture',undefined,{supported:true})],extended,{now});
 assert.deepEqual(recommendations(extended,p,{level:'B1'}).map(r=>r.objectiveId),['one','two','four']);
 const s=selectCurriculumSession(extended,p,{level:'B1',sessionId:'s',size:3,now});
 assert.equal(s.activityIds[0],'one-p1'); // Due support review takes priority.
 assert.ok(s.activityIds.indexOf('one-p2')<s.activityIds.indexOf('two-p1'));
});
test('timed exam uses exact content duration, closes at deadline and keeps raw denominator',()=>{
 const start=Date.parse('2026-10-01T11:00:00.000Z');
 const s=selectCurriculumSession(batch,derive([]),{kind:'exam',setId:'exam',sessionId:'timed',now:start,timed:true});
 assert.equal(s.timeLimitMinutes,5);
 for(const minutes of [0,-1,6,181,Infinity,'5']) assert.equal(normalizeCurriculumSession({...s,timeLimitMinutes:minutes},batch),null);
 const events=[mission('start',{experience:'curriculum-session-v1',session:s}),event('a','exam-one','fixture','2026-10-01T11:04:59.999Z',{sessionId:'timed'}),event('b','exam-two','fixture','2026-10-01T11:05:00.000Z',{sessionId:'timed'})];
 const p=derive(events);assert.equal(p.sessions.timed.deadline,start+5*60000);assert.equal(p.sessions.timed.correct,1);
 assert.equal(p.sessions.timed.answered,1);assert.equal(p.sessions.timed.total,2);assert.equal(p.sessions.timed.expired,true);
 assert.equal(p.sessions.timed.finished,true);assert.equal(p.sessions.timed.complete,false);assert.equal(p.sessions.timed.answers['exam-one'].answer,'fixture');
 const running=derive(events,{now:start+4*60000});assert.equal(running.sessions.timed.expired,false);assert.equal(running.sessions.timed.finished,false);
 const untimed=selectCurriculumSession(batch,derive([]),{kind:'exam',setId:'exam',sessionId:'untimed',now:start});
 assert.equal(Object.hasOwn(untimed,'timeLimitMinutes'),false);
 assert.equal(selectCurriculumSession(batch,derive([]),{kind:'daily',sessionId:'bad',now:start,timed:true}),null);
});
test('partial drafts resume only valid items and are cleared only by complete persisted answers',()=>{
 const s=selectCurriculumSession(batch,derive([]),{sessionId:'s',objectiveId:'one',now:Date.parse('2026-10-01T11:00:00.000Z')});
 const start=mission('start',{experience:'curriculum-session-v1',session:s});
 const draft={id:'d',kind:'draft',at:'2026-10-01T11:01:00.000Z',payload:{sessionId:'s',activityId:'one-p1',answer:'fix'}};
 assert.equal(derive([start,draft]).drafts['one-p1'].answer,'fix');
 assert.equal(derive([start,draft,event('empty','one-p1','')]).drafts['one-p1'].answer,'fix');
 assert.equal(derive([start,draft,event('saved','one-p1')]).drafts['one-p1'],undefined);
 assert.equal(derive([start,{...draft,payload:{...draft.payload,sessionId:'unknown'}}]).drafts['one-p1'],undefined);
 assert.equal(derive([start,{...draft,payload:{...draft.payload,answer:999}}]).drafts['one-p1'],undefined);
});
