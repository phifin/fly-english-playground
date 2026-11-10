import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {placementItems} from '../src/placement-content.js';
import {applyPracticeEdition} from '../src/practice-edition.js';
import {assess,indexContent,deriveProgress} from '../src/learning.js';
import {initialLearningState} from '../src/entry-policy.js';
import {placementPool,NEW_PLACEMENT_METHOD,nextPlacementItem,startingPointResult,acceptedPlacementResult,savedPlacement,validPlacementResponses} from '../src/placement.js';

const original=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const originalIndex=indexContent(original);
const edition={schemaVersion:1,editionId:'practice-support-1',support:[],revisions:placementItems.map(item=>{
 const {level,missionId,...activity}=originalIndex.activities.get(item.activityId);
 return {replaces:item.activityId,missionId,activity:{...activity,id:activity.id+'-v2'},terms:[{text:'fixture',meaning:{en:'Test help',vi:'Gợi ý kiểm thử'},example:{en:'Fixture only.',vi:'Chỉ dùng để kiểm thử.'}}],hint:{en:'The answer is deliberately present in this test-only hint.',vi:'Gợi ý chỉ dùng để kiểm thử.'},prerequisites:[]};
})};
const pack=applyPracticeEdition(original,edition),{activities}=indexContent(pack);
const profile={id:'learner',journey:{region:'A1',onboarded:true},settings:{mode:'kids'}};
const dependencies={pack,activities,placementItems,assess};
const savedOptions={pack,activities,grade:assess};
const event=(payload,n=0)=>({id:'event-'+n,at:new Date(Date.UTC(2026,10,5,0,0,n)).toISOString(),kind:'placement',payload});
function session(method,correct=true){
 const pool=placementPool(pack,method),responses=[];
 for(let i=0;i<10;i++){
  const item=nextPlacementItem(responses,pool,activities,assess);if(!item)break;
  const a=activities.get(item.activityId);
  responses.push({activityId:a.id,answer:correct?(a.type==='choice'?a.answer:a.accepted[0]):null,skipped:!correct,seenBefore:false});
 }
 return {...startingPointResult(responses,pool,activities,assess,method),sessionId:'session-'+method,stage:'accepted'};
}

test('versioned pool keeps original IDs for v2 and only accepted replacements for v3',()=>{
 assert.deepEqual(placementPool(pack,'starting-point-v2'),placementItems);
 assert.equal(placementPool(pack,NEW_PLACEMENT_METHOD).length,18);
 assert.deepEqual(placementPool(pack,NEW_PLACEMENT_METHOD).map(i=>i.activityId),placementItems.map(i=>i.activityId+'-v2'));
 assert.deepEqual(placementPool(original,NEW_PLACEMENT_METHOD),placementItems,'Unrevised accepted items remain valid in the new version');
 assert.deepEqual(placementPool(pack,'starting-point-v999'),[]);
 for(const item of placementPool(pack,NEW_PLACEMENT_METHOD))assert.deepEqual(Object.keys(item).sort(),['activityId','level','skill']);
 assert.doesNotMatch(JSON.stringify(placementPool(pack,NEW_PLACEMENT_METHOD)),/hint|prerequisites|Test help|The answer/);
});

test('old and new completed sessions both retain their matching definitions and independent entry choice',()=>{
 for(const method of ['starting-point-v2',NEW_PLACEMENT_METHOD]){
  const payload=session(method),result=deriveProgress([event(payload)],pack);
  assert.equal(result.recommendation.method,method);assert.equal(result.recommendation.level,'C2');
  assert.equal(result.attempts,0);assert.equal(result.independent,0);assert.equal(result.rewards.size,0);
  assert.equal(initialLearningState(profile,[event(payload)],dependencies).level,'C2');
  assert.equal(profile.settings.mode,'kids');assert.equal(profile.journey.region,'A1');
 }
 const old=session('starting-point-v2'),fresh=session(NEW_PLACEMENT_METHOD,false);
 assert.equal(deriveProgress([event(old),event(fresh,1)],pack).recommendation.level,'A1');
 assert.equal(initialLearningState(profile,[],dependencies).readerReady,false);
});

test('old unfinished sessions resume v2 and new unfinished sessions resume v3',()=>{
 for(const method of ['starting-point-v2',NEW_PLACEMENT_METHOD]){
  const completed=session(method),partial={method,sessionId:completed.sessionId,stage:'progress',responses:completed.responses.slice(0,2)};
  assert.deepEqual(savedPlacement([event(partial)],savedOptions),partial);
  assert.equal(initialLearningState(profile,[event(partial)],dependencies).readerReady,false);
  assert.ok(nextPlacementItem(partial.responses,placementPool(pack,partial.method),activities,assess));
 }
 const old=session('starting-point-v2'),fresh=session(NEW_PLACEMENT_METHOD);
 assert.equal(savedPlacement([event(old),event(fresh,1)],savedOptions).method,NEW_PLACEMENT_METHOD);
});

test('method changes, forged labels/counts, assisted data and invalid routes cannot establish placement',()=>{
 const valid=session(NEW_PLACEMENT_METHOD);
 for(const mutate of [
  p=>p.method='starting-point-v2',p=>p.method='starting-point-v999',p=>p.level='A1',p=>p.count=4,
  p=>p.responses[0].supported=true,p=>p.responses[0].seenBefore='false',p=>p.responses[1]=p.responses[0],
  p=>p.responses[0].activityId=p.responses.at(-1).activityId,p=>p.responses.push({...p.responses[0]})
 ]){
  const payload=structuredClone(valid);mutate(payload);
  assert.equal(deriveProgress([event(payload)],pack).recommendation,null);
  assert.equal(initialLearningState(profile,[event(payload)],dependencies).readerReady,false);
  assert.equal(savedPlacement([event(payload)],savedOptions),null);
 }
 const skipped=session(NEW_PLACEMENT_METHOD,false);skipped.responses[0].answer='inconsistent skipped answer';
 assert.equal(acceptedPlacementResult(skipped,placementPool(pack,NEW_PLACEMENT_METHOD),activities,assess),null);
});

test('malformed latest snapshot cannot replace an intact resumable session',()=>{
 const full=session('starting-point-v2'),valid={method:full.method,sessionId:full.sessionId,stage:'progress',responses:full.responses.slice(0,1)};
 const invalid={...valid,responses:[{...valid.responses[0],activityId:'unknown'}]};
 assert.deepEqual(savedPlacement([event(valid),event(invalid,1)],savedOptions),valid);
 assert.equal(validPlacementResponses([{activityId:valid.responses[0].activityId,answer:null,skipped:false}],placementPool(pack,valid.method),activities,assess),false);
});

test('existing practice evidence and achievements survive accepted v3 reassessment',()=>{
 const a=originalIndex.activities.get(placementItems[0].activityId),old={id:'practice',at:'2026-10-20T00:00:00.000Z',kind:'attempt',payload:{activityId:a.id,answer:a.type==='choice'?a.answer:a.accepted[0]}};
 const before=deriveProgress([old],pack),after=deriveProgress([old,event(session(NEW_PLACEMENT_METHOD))],pack);
 assert.deepEqual(after.records,before.records);assert.deepEqual(after.rewards,before.rewards);assert.equal(after.independent,before.independent);
 assert.equal(after.recommendation.method,NEW_PLACEMENT_METHOD);
});
