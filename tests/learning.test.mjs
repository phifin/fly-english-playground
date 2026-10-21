import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,normalizeAnswer,deriveProgress,placementRecommendation,availableMissions,validDraftAnswer} from '../src/learning.js';
const activity={id:'a1-test-01',type:'gap',skill:'language',focus:'be',accepted:['is']};
const pack={missions:[{id:'a1-test',level:'A1',activities:[activity]},{id:'a1-next',level:'A1',activities:[{...activity,id:'a1-next-01'}]}]};
const event=(id,at,answer,supported=false)=>({id,at,kind:'attempt',payload:{activityId:activity.id,answer,supported}});
test('normalization handles typography, not semantic guesses',()=>{assert.equal(normalizeAnswer('  IS. '),'is');assert.equal(assess(activity,'are').correct,false);assert.equal(assess(activity,'IS.').correct,true);assert.equal(assess(activity,'').complete,false);});
test('all objective activity formats and legitimate alternative orders',()=>{
 assert.equal(assess({type:'choice',options:[{id:'a'}],answer:'a'},'b').complete,false);
 const a={type:'order',tokens:[{id:'a'},{id:'b'}],answer:['a','b'],alternatives:[['b','a']]};
 assert.equal(assess(a,['b','a']).correct,true);assert.equal(assess(a,['a','a']).complete,false);
 const m={type:'match',pairs:[{id:'a'},{id:'b'}]};assert.equal(assess(m,{a:'b',b:'a'}).correct,false);assert.equal(assess(m,{a:'a',b:'b'}).correct,true);assert.equal(assess(m,{a:'a',b:'a'}).complete,false);
});
test('open writing requires self review and never returns automatic correctness',()=>{const a={type:'writing',rubric:[{},{}]};assert.deepEqual(assess(a,{text:'A thoughtful little response.',checks:[0,1]}),{correct:null,complete:true,automatic:false});assert.equal(assess(a,{text:'hello',checks:[0,1]}).complete,false);});
test('world completion, evidence and retention remain separate',()=>{
 const events=[event('1','2026-10-01T12:00:00.000Z','is',true)];
 const p=deriveProgress(events,pack,Date.parse('2026-10-03'));assert.equal(p.rewards.size,1);assert.equal(p.independent,0);assert.equal(p.retained,0);assert.equal(p.due.length,1);assert.equal(availableMissions(pack,'A1',p)[1].unlocked,true);
});
test('same-sitting repeats cannot manufacture retained evidence; failure schedules repair',()=>{
 const events=[event('1','2026-10-01T12:00:00.000Z','is'),event('2','2026-10-01T12:01:00.000Z','is'),event('3','2026-10-02T12:00:00.000Z','is'),event('4','2026-10-05T12:00:00.000Z','is')];
 assert.equal(deriveProgress(events.slice(0,2),pack).retained,0);assert.equal(deriveProgress(events,pack).retained,1);
 const p=deriveProgress([...events,event('5','2026-10-06T12:00:00.000Z','are')],pack,Date.parse('2026-10-06T12:11:00.000Z'));assert.equal(p.retained,0);assert.equal(p.due.length,1);assert.equal(p.rewards.size,1);
});
test('early repeats cannot accelerate retention or postpone the scheduled recall',()=>{
 const first=event('1','2026-10-01T23:59:00.000Z','is'),early=event('2','2026-10-02T00:01:00.000Z','is');
 const a=deriveProgress([first],pack),b=deriveProgress([first,early],pack);assert.equal(b.records[activity.id].streak,1);assert.equal(b.records[activity.id].due,a.records[activity.id].due);
});
test('submitted correctness and fabricated rewards cannot create mastery',()=>{const p=deriveProgress([{...event('x','2026-10-01T00:00:00.000Z','are'),payload:{activityId:activity.id,answer:'are',correct:true}},{id:'y',kind:'mission',at:'2026-10-02T00:00:00.000Z',payload:{id:'a1-test'}}],pack);assert.equal(p.rewards.size,0);assert.equal(p.independent,0);});
test('leaving after a revealed solution cannot turn same-day retries into independent evidence',()=>{
 const at='2026-10-01T12:00:00.000Z';const e=[event('1',at,'are'),event('2','2026-10-01T12:01:00.000Z','is'),event('3','2026-10-01T12:02:00.000Z','is')];
 assert.equal(deriveProgress(e,pack).independent,0);e.push(event('4','2026-10-02T12:00:00.000Z','is'));assert.equal(deriveProgress(e,pack).independent,1);
 const draft={id:'0',at,kind:'draft',payload:{activityId:activity.id,supported:true,answer:null}};
 assert.equal(deriveProgress([draft,event('1','2026-10-01T12:01:00.000Z','is')],pack).independent,0);
 const receipt={...draft,kind:'support',payload:{activityId:activity.id,reason:'answer-revealed'}};
 assert.equal(deriveProgress([receipt,event('1','2026-10-01T12:01:00.000Z','is')],pack).independent,0);
});
test('reordered cloud histories produce identical evidence',()=>{const e=[event('b','2026-10-02T00:00:00.000Z','is'),event('a','2026-10-01T00:00:00.000Z','are')];assert.deepEqual(deriveProgress(e,pack,123),deriveProgress([...e].reverse(),pack,123));});
test('submitted answers never prefill later retrieval, newer drafts survive and malformed drafts are ignored',()=>{
 const draft={id:'d',kind:'draft',at:'2026-10-01T00:00:00.000Z',payload:{activityId:activity.id,answer:'is'}};
 const attempt=event('a','2026-10-02T00:00:00.000Z','is');assert.deepEqual(deriveProgress([attempt,draft],pack).drafts,{});
 assert.equal(deriveProgress([attempt,{...draft,at:'2026-10-03T00:00:00.000Z'}],pack).drafts[activity.id].answer,'is');
 assert.deepEqual(deriveProgress([{...draft,payload:{...draft.payload,answer:{bad:true}}}],pack).drafts,{});
 assert.equal(validDraftAnswer({type:'order',tokens:[{id:'a'}]},'a'),false);assert.equal(validDraftAnswer({type:'writing',rubric:[{}]},{text:'hello',checks:null}),false);
});
test('placement is provisional and cannot jump gaps on one advanced lucky response',()=>{assert.equal(placementRecommendation([{level:'C2',correct:true}]).level,'A1');assert.equal(placementRecommendation([{level:'A1',correct:true},{level:'A1',correct:true},{level:'A2',correct:false},{level:'A2',correct:true}]).level,'A2');assert.equal(placementRecommendation([]).provisional,true);});
