import test from 'node:test';
import assert from 'node:assert/strict';
import {createLearningPlatform,validPlatformDraft} from '../src/platform.js';
import {deriveCurriculum,selectCurriculumSession} from '../src/curriculum.js';

// Synthetic controller fixtures only; no production educational content.
const bi=text=>({en:text,vi:text});
const gap=(id,purpose='practice')=>({id,type:'gap',purpose,accepted:['fixture'],prompt:'Synthetic fixture',context:'',explanation:bi('Fixture explanation')});
const choice=(id,purpose)=>({id,type:'choice',purpose,options:[{id:'yes',text:'Fixture'},{id:'no',text:'Other'}],answer:'yes',prompt:'Synthetic fixture',context:'',explanation:bi('Fixture explanation')});
const order={id:'order-p1',type:'order',purpose:'practice',tokens:[{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'}],answer:['a','b','c'],alternatives:[],prompt:'Synthetic fixture',context:'',explanation:bi('Fixture explanation')};
const objective=(id,activities)=>({id,level:'A1',domain:'grammar',title:bi(id),canDo:bi(id),teaching:[bi(id)],prerequisites:[],lexicon:[{id:`${id}-word`,term:'fixture',meaning:bi('fixture'),example:'Fixture.'}],activities});
const batch={schemaVersion:1,batchId:'platform-foundation-v1',objectives:[objective('ordering',[order,gap('order-p2'),gap('order-c1','check')]),objective('gaps',[gap('gap-p1'),gap('gap-p2'),gap('gap-c1','check')])],examSets:[{id:'exam',minutes:5,title:bi('Exam'),scope:bi('Synthetic'),activities:[choice('exam-1','exam'),gap('exam-2','exam')]}],listening:[{id:'listen',level:'A1',title:bi('Listen'),transcript:'Synthetic audio.',activities:[choice('listen-1','listening'),choice('listen-2','listening')]}],gaps:[],sources:[]};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function harness(options={}) {
 const profiles=new Map(['a','b'].map(id=>[id,{profile:{id,settings:{language:'en'},journey:{region:'A1'}},events:[],legacyActivities:new Map()}]));
 const h={current:'a',profiles,renders:[],writes:[],failNext:false,writeGate:null,active:true,utterance:null};let sequence=0;
 const speech={cancel(){},getVoices(){return [{lang:'en-GB'}];},speak(u){h.utterance=u;}};
 class Utterance {constructor(text){this.text=text;}}
 const dependencies={getContext:()=>profiles.get(h.current),isActive:()=>h.active,fetcher:options.fetcher??(async()=>({ok:true,json:async()=>structuredClone(batch)})),
  write:async(kind,payload,owner)=>{
   h.writes.push({kind,payload:structuredClone(payload),owner});
   if(h.failNext){h.failNext=false;throw Error('Synthetic write failure');}
   const gate=h.writeGate;h.writeGate=null;if(gate)await gate.promise;
   profiles.get(owner).events.push({id:`event-${String(++sequence).padStart(5,'0')}`,kind,payload:structuredClone(payload),at:new Date().toISOString()});
  },render:value=>h.renders.push(value),speech,Utterance,download(){}};
 h.controller=createLearningPlatform(dependencies);h.recreate=()=>{h.controller.leave();h.controller=createLearningPlatform(dependencies);};
 h.action=(name,value)=>h.controller.action(name,{dataset:{value}});
 h.input=value=>h.controller.input({hasAttribute:name=>name==='data-learn-answer',value});
 h.state=()=>h.controller.inspect().state;
 h.switch=id=>{h.current=id;h.controller.input(null);};
 h.progress=()=>deriveCurriculum(profiles.get(h.current).events,batch);
 return h;
}

test('controller resumes partial ordering drafts without accepting duplicate tokens',async()=>{
 const h=harness();await h.action('learn-start','ordering');await h.action('learn-order','a');
 assert.deepEqual(h.state().answer,['a']);const id=h.state().sessionId;
 assert.equal(validPlatformDraft(order,['a']),true);assert.equal(validPlatformDraft(order,['a','a']),false);
 h.recreate();await h.action('learn-resume',id);assert.deepEqual(h.state().answer,['a']);
 await h.action('learn-order','b');await h.action('learn-order','c');await h.action('learn-submit');assert.equal(h.state().feedback.correct,true);
 await h.action('learn-next');assert.equal(h.state().activityId,'order-p2');
 h.recreate();await h.action('learn-resume',id);assert.equal(h.state().activityId,'order-p2');assert.equal(h.state().answer,'');h.controller.leave();
});
test('failed attempt save keeps response and position; retry persists once and then advances',async()=>{
 const h=harness();await h.action('learn-start','gaps');h.input('fixture');h.failNext=true;
 await assert.rejects(h.action('learn-submit'),/write failure/);assert.equal(h.state().activityId,'gap-p1');assert.equal(h.state().feedback,null);assert.equal(h.state().answer,'fixture');
 assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,0);
 await h.action('learn-submit');assert.equal(h.state().feedback.correct,true);await h.action('learn-next');assert.equal(h.state().activityId,'gap-p2');
 assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,1);h.controller.leave();
});
test('overlapping submit clicks cannot duplicate evidence or replace the submitted answer',async()=>{
 const h=harness();await h.action('learn-start','gaps');h.input('fixture');const gate=deferred();h.writeGate=gate;
 const pending=h.action('learn-submit');await Promise.resolve();await Promise.resolve();
 assert.equal(h.input('changed'),false);await h.action('learn-submit');gate.resolve();await pending;
 assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,1);assert.equal(h.state().answer,'fixture');h.controller.leave();
});
test('exam answers withhold feedback until the finite round is finished',async()=>{
 const h=harness();await h.action('learn-exam','exam');const id=h.state().sessionId;
 await h.action('learn-choose','no');await h.action('learn-submit');assert.equal(h.state().feedback,null);assert.equal(h.state().activityId,'exam-2');
 h.input('fixture');await h.action('learn-submit');assert.equal(h.state().feedback,null);assert.equal(h.state().activityId,null);
 assert.equal(h.progress().sessions[id].finished,true);assert.equal(h.progress().sessions[id].correct,1);h.controller.leave();
});
test('expired timed exam resumes as finished and cannot accept another answer',async()=>{
 const h=harness(),started=Date.now()-6*60000;
 const session=selectCurriculumSession(batch,h.progress(),{kind:'exam',setId:'exam',sessionId:'expired',timed:true,now:started});
 h.profiles.get('a').events.push({id:'old-start',kind:'mission',at:new Date(started).toISOString(),payload:{experience:'curriculum-session-v1',session}});
 await h.action('learn-resume','expired');assert.equal(h.state().activityId,null);await h.action('learn-submit');
 assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,0);assert.equal(h.progress().sessions.expired.expired,true);h.controller.leave();
});
test('profile switch during fetch cancels the old action without starting a session for the new learner',async()=>{
 const gate=deferred(),h=harness({fetcher:()=>gate.promise});
 const pending=h.action('learn-start','gaps');h.switch('b');gate.resolve({ok:true,json:async()=>structuredClone(batch)});await pending;
 assert.equal(h.writes.length,0);assert.equal(h.controller.inspect().owner,'b');assert.equal(h.state().page,'hub');
 await h.action('learn-start','ordering');assert.equal(h.writes[0].owner,'b');assert.equal(h.profiles.get('a').events.length,0);h.controller.leave();
});
test('profile switch during save isolates the write and prevents old response leaking into new state',async()=>{
 const h=harness();await h.action('learn-start','gaps');h.input('fixture');const gate=deferred();h.writeGate=gate;
 const pending=h.action('learn-submit');await Promise.resolve();await Promise.resolve();
 h.switch('b');gate.resolve();await assert.rejects(pending,/account changed/i);
 assert.equal(h.state().page,'hub');assert.equal(h.state().answer,undefined);assert.equal(h.profiles.get('b').events.length,0);
 assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,1);h.controller.leave();
});
test('switch away and back while a save is pending still invalidates its UI continuation',async()=>{
 const h=harness();await h.action('learn-start','gaps');h.input('fixture');const gate=deferred();h.writeGate=gate;
 const pending=h.action('learn-submit');await Promise.resolve();await Promise.resolve();h.switch('b');h.switch('a');gate.resolve();
 await assert.rejects(pending,/account changed/i);assert.equal(h.state().page,'hub');assert.equal(h.state().feedback,undefined);h.controller.leave();
});
test('listening rejects silent answer and transcript practice stays supported',async()=>{
 const h=harness();await h.action('learn-listen-start','listen');await h.action('learn-choose','yes');
 await assert.rejects(h.action('learn-submit'),/whole clip/);assert.equal(h.profiles.get('a').events.filter(e=>e.kind==='attempt').length,0);
 await h.action('learn-transcript');await h.action('learn-submit');
 const attempt=h.profiles.get('a').events.find(e=>e.kind==='attempt');assert.equal(attempt.payload.supported,true);
 assert.equal(h.progress().listening.listen.supported,1);await h.action('learn-next');assert.equal(h.state().transcript,true);
 h.controller.leave();
});
test('only successful ended playback receipt enables listening and survives resume',async()=>{
 const h=harness();await h.action('learn-listen-start','listen');const id=h.state().sessionId;await h.action('learn-play-audio');
 assert.equal(h.state().audioHeard,false);h.utterance.onerror();assert.equal(h.state().audioHeard,false);
 await h.action('learn-play-audio');await h.utterance.onend();assert.equal(h.state().audioHeard,true);
 h.recreate();await h.action('learn-resume',id);assert.equal(h.state().audioHeard,true);await h.action('learn-choose','yes');await h.action('learn-submit');
 assert.equal(h.profiles.get('a').events.find(e=>e.kind==='attempt').payload.supported,false);h.controller.leave();
});
test('cancelled or failed-to-save audio never creates playback evidence',async()=>{
 const h=harness();await h.action('learn-listen-start','listen');await h.action('learn-play-audio');const cancelled=h.utterance;
 await h.action('learn-audio-stop');await cancelled.onend();assert.equal(h.state().audioHeard,false);
 await h.action('learn-play-audio');h.failNext=true;await h.utterance.onend();assert.equal(h.state().audioHeard,false);assert.equal(h.state().audioState,'failed');
 assert.equal(h.profiles.get('a').events.some(e=>e.payload.experience==='listening-playback-v1'),false);h.controller.leave();
});
test('same-day replayed correct items cannot create recalled objective stage',async()=>{
 const h=harness();
 for(let i=0;i<2;i++){
  await h.action('learn-start','gaps');h.input('fixture');await h.action('learn-submit');await h.action('learn-next');h.input('fixture');await h.action('learn-submit');
 }
 assert.equal(h.progress().objectives.gaps.stage,'independent');h.controller.leave();
});
