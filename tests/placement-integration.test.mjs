import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkPlacement} from '../scripts/accept-placement.mjs';
import {placementItems} from '../src/placement-content.js';
import {nextPlacementItem,startingPointResult} from '../src/placement.js';
import {assess,indexContent,deriveProgress} from '../src/learning.js';
import {startingView,placementResultView} from '../src/starting-view.js';
const pack=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const {activities}=indexContent(pack);
function responses(correct=true){const rs=[];for(let n=0;n<10;n++){const item=nextPlacementItem(rs,placementItems,activities,assess);if(!item)break;const a=activities.get(item.activityId);rs.push({activityId:a.id,skipped:!correct,answer:correct?(a.type==='choice'?a.answer:a.accepted[0]):null});}return rs;}
const event=(payload,at='2026-10-28T01:00:00.000Z')=>({id:at,at,kind:'placement',payload});
test('actual accepted pool is pinned and covers all six practice ranges',async()=>{assert.equal((await checkPlacement()).items,18);});
test('actual upper route includes reading and language use without awarding mastery',()=>{
 const rs=responses(),result=startingPointResult(rs,placementItems,activities,assess);
 assert.equal(result.level,'C2');assert.equal(result.count,10);assert.deepEqual(result.skills.sort(),['language-use','reading']);
 const p=deriveProgress([event({...result,stage:'accepted',sessionId:'test',level:'A1'})],pack);
 assert.equal(p.recommendation.level,'C2');assert.equal(p.attempts,0);assert.equal(p.rewards.size,0);assert.equal(p.retained,0);assert.equal(p.due.length,0);
});
test('unfinished, forged and failed placement summaries never establish advanced evidence',()=>{
 const rs=responses(false),payload={method:'starting-point-v2',responses:rs,sessionId:'test',level:'C2',count:10};
 assert.equal(deriveProgress([event({...payload,stage:'progress'})],pack).recommendation,null);
 assert.equal(deriveProgress([event({...payload,stage:'accepted'})],pack).recommendation.level,'A1');
 assert.equal(deriveProgress([event({...payload,responses:[],stage:'accepted'})],pack).recommendation,null);
});
test('retaking or manually changing the starting range preserves actual past learning',()=>{
 const a=activities.values().next().value;
 const attempt={id:'old',at:'2026-10-27T01:00:00.000Z',kind:'attempt',payload:{activityId:a.id,answer:a.answer}};
 const prior=deriveProgress([attempt],pack);
 const placed=event({...startingPointResult(responses(),placementItems,activities,assess),sessionId:'test',stage:'accepted'});
 const later=event({method:'manual-start',level:'A2',count:0},'2026-10-28T02:00:00.000Z');
 const p=deriveProgress([attempt,placed,later],pack);
 assert.deepEqual(p.records,prior.records);assert.equal(p.recommendation.level,'A2');assert.equal(p.attempts,prior.attempts);
});
test('both guidance languages present optional independent reading and assisted play without changing mode',()=>{
 for(const language of ['en','vi']){const html=startingView({language});assert.match(html,/placement-assisted/);assert.match(html,/placement-begin/);assert.match(html,/placement-manual/);assert.doesNotMatch(html,/data-action="mode"/);assert.equal(html,html.normalize('NFC'));const result=placementResultView({language,result:startingPointResult(responses(),placementItems,activities,assess)});assert.match(result,/accept-placement/);assert.equal(result,result.normalize('NFC'));}
});
