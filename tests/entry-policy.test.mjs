import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLearningState,guideStatus,validLearningEntryPayload,validGuidePayload,GUIDE_TOPICS} from '../src/entry-policy.js';
import {nextPlacementItem,startingPointResult} from '../src/placement.js';
import {assess as realAssess} from '../src/learning.js';

const profile={id:'learner-1',journey:{onboarded:true,region:'A1'},settings:{mode:'kids'}};
const event=(kind,payload,n=0,extras={})=>({id:'event-'+n,kind,payload,at:new Date(Date.UTC(2026,10,4,0,0,n)).toISOString(),...extras});
const receipt=(path='reader',level='A1')=>({experience:'learning-entry-v1',version:1,path,level});
const guide=(topic='home',state='completed')=>({experience:'guide-v1',version:1,topic,state});
const levels=['A1','A2','B1','B2','C1','C2'];
const placementItems=levels.flatMap(level=>[0,1,2].map(n=>({activityId:level+n,level,skill:n?'language-use':'reading'})));
const activities=new Map(placementItems.map(item=>[item.activityId,{id:item.activityId,level:item.level}]));
const assess=(_,answer)=>({complete:typeof answer==='boolean',correct:answer,automatic:true});
const dependencies={activities,placementItems,assess};
function accepted(answer){
 const responses=[];
 for(let i=0;i<11;i++){
  const item=nextPlacementItem(responses,placementItems,activities,assess);if(!item)break;
  responses.push({activityId:item.activityId,answer:answer(item),skipped:false,seenBefore:false});
 }
 return {...startingPointResult(responses,placementItems,activities,assess),sessionId:'placement-1',stage:'accepted'};
}

test('default A1, completed profile onboarding and experience mode do not establish a reading start',()=>{
 for(const mode of ['kids','balanced','serious']){
  const result=initialLearningState({...profile,settings:{mode}},[],dependencies);
  assert.deepEqual(result,{established:false,readerReady:false,path:null,level:null,reason:'unset',eventId:null});
 }
 assert.equal(initialLearningState(null,[event('mission',receipt())]).established,false);
});
test('explicit reader and supported-picture decisions remain separate and immutable',()=>{
 const history=[event('mission',receipt('reader','B2')),event('mission',receipt('supported-pictures',null),1)];
 const before=structuredClone(history),result=initialLearningState(profile,history,dependencies);
 assert.equal(result.established,true);assert.equal(result.readerReady,false);assert.equal(result.level,null);assert.equal(result.path,'supported-pictures');
 assert.deepEqual(history,before);
 const changed=initialLearningState(profile,[...history,event('mission',receipt('reader','A2'),2)],dependencies);
 assert.equal(changed.level,'A2');assert.equal(changed.readerReady,true);
 assert.equal(profile.journey.region,'A1','Policy never changes saved profile state');
});
test('malformed receipts, unknown versions, cross-profile events and invalid dates cannot unlock reading',()=>{
 const malformed=[{...receipt(),version:2},{...receipt(),level:'pre-A1'},{...receipt(),path:'supported-pictures'},{...receipt(),extra:true},Object.assign([],receipt())];
 for(const payload of malformed)assert.equal(initialLearningState(profile,[event('mission',payload)],dependencies).readerReady,false);
 assert.equal(initialLearningState(profile,[event('mission',receipt(),0,{profileId:'someone-else'})],dependencies).readerReady,false);
 assert.equal(initialLearningState(profile,[event('mission',receipt(),0,{at:'not-a-date'})],dependencies).readerReady,false);
 assert.equal(initialLearningState(profile,[event('placement',receipt())],dependencies).readerReady,false);
});
test('accepted placement is recomputed and must be complete, uncorrupted and at its claimed range',()=>{
 const valid=accepted(item=>['A1','A2','B1'].includes(item.level));
 const result=initialLearningState(profile,[event('placement',valid)],dependencies);
 assert.equal(result.reason,'accepted-placement');assert.equal(result.level,'B1');
 for(const changed of [{...valid,level:'C2'},{...valid,count:99},{...valid,stage:'progress'},{...valid,sessionId:''},
  {...valid,responses:[...valid.responses,{activityId:'unknown',answer:true,skipped:false}]},
  {...valid,responses:valid.responses.slice(0,4),count:4,level:'B1'}])
  assert.equal(initialLearningState(profile,[event('placement',changed)],dependencies).readerReady,false);
 const beginner=accepted(()=>false);assert.equal(initialLearningState(profile,[event('placement',beginner)],dependencies).level,'A1');
 assert.equal(initialLearningState(profile,[event('placement',valid)]).readerReady,false,'No scoring dependencies means no trusted assessed result');
});
test('legacy manual-start is a choice but unsupported legacy claimed results are not certification',()=>{
 const manual=event('placement',{method:'manual-start',level:'C1',count:0,provisional:true});
 assert.equal(initialLearningState(profile,[manual]).reason,'legacy-manual');
 for(const payload of [{method:'manual-start',level:'C1',count:5},{method:'content-orientation',level:'C2',count:10},{level:'B2',count:0}])
  assert.equal(initialLearningState(profile,[event('placement',payload)],dependencies).readerReady,false);
});
test('genuine prior practice preserves continuity, including wrong answers, without creating mastery',()=>{
 const activity={id:'a1-choice',level:'A1',missionId:'a1-mission',type:'choice',options:[{id:'yes'},{id:'no'}],answer:'yes'};
 const catalog=new Map([[activity.id,activity],['writing',{id:'writing',level:'B2',type:'writing',rubric:['check']}]]);
 const deps={activities:catalog,assess:realAssess};
 const wrong=event('attempt',{activityId:activity.id,missionId:activity.missionId,answer:'no',supported:true});
 assert.equal(initialLearningState(profile,[wrong],deps).reason,'legacy-practice');
 const invalid=[{activityId:activity.id,answer:'made-up',correct:true},{activityId:'unknown',answer:'yes'},
  {activityId:activity.id,missionId:'other-mission',answer:'yes'},
  {activityId:'writing',answer:{text:'A valid self-reviewed sentence.',checks:[0]}}];
 for(const payload of invalid)assert.equal(initialLearningState(profile,[event('attempt',payload)],deps).readerReady,false);
 const pictures=event('mission',receipt('supported-pictures',null),1);
 assert.equal(initialLearningState(profile,[pictures,{...wrong,id:'later-attempt',at:'2026-11-04T00:00:02.000Z'}],deps).readerReady,false);
});
test('receipt ordering follows timestamps and deterministic IDs rather than imported array order',()=>{
 const history=[event('mission',receipt('reader','B1'),2),event('mission',receipt('reader','A1'),1)];
 assert.equal(initialLearningState(profile,history).level,'B1');
 const sameTime=[event('mission',receipt('reader','A1'),1,{id:'a'}),event('mission',receipt('reader','A2'),1,{id:'z'})];
 assert.equal(initialLearningState(profile,sameTime.reverse()).level,'A2');
});
test('guidance skip/completion persist independently by topic without exposing other profiles',()=>{
 assert.equal(new Set(GUIDE_TOPICS).size,16);for(const topic of ['home','learning','progress','adventure'])assert.ok(GUIDE_TOPICS.includes(topic));
 const history=[event('mission',guide('home','skipped')),event('mission',guide('memory','completed'),1),event('mission',guide('home','completed'),2)];
 assert.equal(guideStatus(history,'home'),'completed');assert.equal(guideStatus(history,'memory'),'completed');assert.equal(guideStatus(history,'order'),'new');
 assert.equal(guideStatus([event('mission',guide('home','skipped'))],'home'),'skipped');
 assert.equal(guideStatus([event('mission',guide(),0,{profileId:'other'})],'home',{profileId:profile.id}),'new');
 assert.equal(guideStatus([event('mission',guide(),0,{profileId:profile.id})],'home',{profileId:profile.id}),'completed');
 for(const payload of [{...guide(),version:2},{...guide(),state:'approved'},{...guide(),topic:'admin'},{...guide(),level:'C2'}]){
  assert.equal(validGuidePayload(payload),false);assert.equal(guideStatus([event('mission',payload)],'home'),'new');
 }
 assert.equal(validLearningEntryPayload(receipt()),true);assert.equal(validGuidePayload(guide()),true);
});
