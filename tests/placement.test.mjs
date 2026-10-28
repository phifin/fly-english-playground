import test from 'node:test';
import assert from 'node:assert/strict';
import {nextPlacementItem,startingPointResult,placementEvidence,savedPlacement,PLACEMENT_LIMIT} from '../src/placement.js';
const levels=['A1','A2','B1','B2','C1','C2'];
const items=levels.flatMap(level=>[0,1,2].map(n=>({activityId:level+n,level,skill:n?'language-use':'reading'})));
const activities=new Map(items.map(i=>[i.activityId,{id:i.activityId,level:i.level}]));
const grade=(a,answer)=>({complete:typeof answer==='boolean',correct:answer});
function run(answer){const responses=[];for(let i=0;i<30;i++){const item=nextPlacementItem(responses,items,activities,grade);if(!item)return responses;responses.push({activityId:item.activityId,answer:answer(item,responses),skipped:false});}throw Error('Unbounded assessment');}
test('routing reaches a useful upper range without forcing advanced readers through all beginner questions',()=>{
 const responses=run(()=>true),result=startingPointResult(responses,items,activities,grade);
 assert.equal(responses[0].activityId,'A20');assert.equal(result.level,'C2');assert.equal(result.count,10);assert.equal(result.provisional,true);
});
test('a beginner moves down, with skips treated as uncertainty rather than mastered material',()=>{
 const responses=run(()=>false),result=startingPointResult(responses,items,activities,grade);
 assert.equal(result.level,'A1');assert.equal(result.count,4);
 const skipped=responses.map(r=>({...r,skipped:true,answer:null}));assert.equal(startingPointResult(skipped,items,activities,grade).confidence,'limited');
});
test('two confirmations and adjacent difficulty stop at a boundary; one lucky answer is insufficient',()=>{
 const responses=run(i=>['A1','A2','B1'].includes(i.level));
 assert.equal(startingPointResult(responses,items,activities,grade).level,'B1');assert.equal(responses.length,6);
 assert.equal(startingPointResult([{activityId:'C20',answer:true,skipped:false}],items,activities,grade).level,'A1');
});
test('mixed answers stay bounded, prefer fresh items and report repeated exposure',()=>{
 const responses=run((i,rs)=>rs.length%2===0);assert.ok(responses.length<=PLACEMENT_LIMIT);
 assert.equal(nextPlacementItem([],items,activities,grade,['A20']).activityId,'A21');
 const repeated=responses.map(r=>({...r,seenBefore:true}));assert.equal(startingPointResult(repeated,items,activities,grade).confidence,'limited');
});
test('duplicates, malformed answers and submitted correctness flags cannot mint evidence',()=>{
 const response={activityId:'A20',answer:false,skipped:false,correct:true};
 assert.deepEqual(placementEvidence([response,response,{activityId:'unknown',answer:true,skipped:false}],items,activities,grade).map(e=>e.correct),[false]);
 assert.deepEqual(placementEvidence([{activityId:'A20',answer:{correct:true},skipped:false}],items,activities,grade),[]);
 const p={method:'starting-point-v2',sessionId:'x',responses:[]};assert.deepEqual(savedPlacement([{kind:'placement',at:'2026-10-26',id:'a',payload:p}]),p);
});
