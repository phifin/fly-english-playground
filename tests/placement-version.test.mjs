import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyPracticeEdition} from '../src/practice-edition.js';
import {indexContent,assess,deriveProgress} from '../src/learning.js';
import {placementPool,nextPlacementItem,startingPointResult,acceptedPlacementResult,savedPlacement} from '../src/placement.js';
import {initialLearningState} from '../src/entry-policy.js';
import {placementItems} from '../src/placement-content.js';
const original=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const base=indexContent(original),changed=placementItems.filter(i=>i.level==='A2');
const edition={schemaVersion:1,editionId:'test-only',support:[],revisions:changed.map(i=>{const a=base.activities.get(i.activityId);return {replaces:a.id,missionId:a.missionId,activity:{...a,id:a.id+'-v2'},terms:[],hint:{en:'Test only',vi:'Chỉ kiểm thử'},prerequisites:[]};})};
const pack=applyPracticeEdition(original,edition),activities=indexContent(pack).activities;
function result(method){const items=placementPool(pack,method),responses=[];let next;
 while(next=nextPlacementItem(responses,items,activities,assess)){const a=activities.get(next.activityId);responses.push({activityId:a.id,answer:a.type==='choice'?a.answer:a.accepted[0],skipped:false});}
 return {...startingPointResult(responses,items,activities,assess,method),stage:'accepted',sessionId:'version-test'};
}
const event=(payload,id='p1')=>({id,kind:'placement',at:'2026-11-05T01:00:00.000Z',payload});
test('new placement uses revised IDs; old accepted evidence keeps its original keys and recommendation',()=>{
 const old=result('starting-point-v2'),fresh=result('starting-point-v3');
 assert.ok(old.responses.every(r=>!r.activityId.endsWith('-v2')));
 assert.ok(fresh.responses.some(r=>r.activityId.endsWith('-v2')));
 for(const payload of [old,fresh]){
  assert.equal(acceptedPlacementResult(payload,placementPool(pack,payload.method),activities,assess).level,'C2');
  assert.equal(deriveProgress([event(payload)],pack).recommendation.level,'C2');
  assert.equal(initialLearningState({id:'learner'},[event(payload)],{pack,activities,placementItems,assess}).readerReady,true);
 }
 assert.equal(acceptedPlacementResult(fresh,placementPool(pack,'starting-point-v2'),activities,assess),null);
 assert.equal(acceptedPlacementResult(old,placementPool(pack,'starting-point-v3'),activities,assess),null);
 assert.equal(deriveProgress([event(old)],pack).attempts,0,'Placement does not create learning attempts');
});
test('unfinished versioned sessions resume their own pool; invalid imports do not supersede valid sessions',()=>{
 const old=result('starting-point-v2'),draft={...old,stage:'progress',responses:old.responses.slice(0,1)};
 const deps={pack,activities,grade:assess};
 assert.equal(savedPlacement([event(draft)],deps).method,'starting-point-v2');
 const bad={...draft,method:'starting-point-v3'};
 assert.equal(savedPlacement([event(draft),event(bad,'p2')],deps).method,'starting-point-v2');
 assert.equal(savedPlacement([event({...old,count:0})],deps),null);
 assert.equal(savedPlacement([event({...draft,responses:[{...draft.responses[0],answer:null,skipped:true,extra:'forged'}]})],deps),null);
});
