import test from 'node:test';
import assert from 'node:assert/strict';
import {placeToy,validPlacement,fulfillsBrief,deriveWorkshop,placementFeedback,startingBrief} from '../src/workshop.js';
import {openMemoryStore,createMemoryDatabase} from '../src/storage.js';
import {newEvent,deriveProgress} from '../src/learning.js';
import {workshopBriefs} from '../src/workshop-content.js';
import {validateWorkshop,acceptedWorkshop} from '../scripts/accept-workshop.mjs';
import {workshopView} from '../src/workshop-view.js';
const brief={id:'workshop-a1-01',level:'A1',placements:[{prop:'boat',slot:'water'},{prop:'shell',slot:'sand'}]};
const event=(id,placement,extra={})=>({id,at:new Date(Number(id)*1000).toISOString(),kind:'mission',payload:{experience:'workshop-layout-v1',space:brief.id,operation:'place',prop:'boat',slot:'water',placement,...extra}});
test('two taps move a single toy and return displaced toys to the tray',()=>{
 assert.deepEqual(placeToy({water:'boat',sand:'shell'},'boat','sand'),{sand:'boat'});
 assert.throws(()=>placeToy({},'dragon','water'));assert.throws(()=>placeToy({},'boat','__proto__'));
 assert.equal(validPlacement({water:'boat',sand:'boat'}),false);
});
test('completion uses actual placements and allows creative extras',()=>{
 assert.equal(fulfillsBrief({water:'boat'},brief),false);
 assert.equal(fulfillsBrief({water:'boat',sand:'shell',sky:'bell'},brief),true);
 assert.equal(placementFeedback(brief,{sand:'boat'},'boat','sand'),'try-again');
 assert.equal(placementFeedback(brief,{sky:'bell'},'bell','sky'),'moved');
});
test('entry has no evidence; forged completion and corrupt layouts are ignored',()=>{
 assert.equal(deriveWorkshop([], [brief]).completed.size,0);
 const bad=event('1',{water:'boat',sky:'boat'},{solved:true});
 const result=deriveWorkshop([bad,{...event('2',{}),payload:{experience:'workshop-brief-v1',briefId:brief.id,approved:true}}],[brief]);
 assert.equal(result.completed.size,0);assert.deepEqual(result.layouts,{});
});
test('free and requested scenes survive independent saves, resets and duplicate imports',()=>{
 const solved=event('1',{water:'boat',sand:'shell'}),free=event('2',{sky:'boat'},{space:'free',slot:'sky'}),reset=event('3',{}, {operation:'reset'});
 const result=deriveWorkshop([reset,solved,free,solved],[brief]);
 assert.equal(result.completed.size,1);assert.deepEqual(result.layouts.free,{sky:'boat'});assert.deepEqual(result.layouts[brief.id],{});
 assert.deepEqual(result.completed.get(brief.id).placement,{water:'boat',sand:'shell'});
});
test('help and actual wrong target placements are distinguished from decoration',()=>{
 const done=event('3',{water:'boat',sand:'shell'}),help={id:'4',at:new Date(4000).toISOString(),kind:'mission',payload:{experience:'workshop-help-v1',briefId:brief.id}};
 assert.equal(deriveWorkshop([done],[brief]).completed.get(brief.id).independent,true);
 assert.equal(deriveWorkshop([done,help],[brief]).completed.get(brief.id).independent,false);
 const wrong=event('1',{sand:'boat'},{slot:'sand'});
 assert.equal(deriveWorkshop([wrong,done],[brief]).completed.get(brief.id).independent,false);
 assert.equal(startingBrief([brief],'C2').id,brief.id);
});
test('actual workshop events round-trip through backup with preferences and legacy learning untouched',async()=>{
 const a=await openMemoryStore({database:createMemoryDatabase()}),b=await openMemoryStore({database:createMemoryDatabase()});
 const p=await a.createProfile({name:'Construction',settings:{mode:'kids',language:'vi'}});
 await a.appendEvent(p.id,newEvent('mission',{experience:'workshop-layout-v1',space:brief.id,placement:{water:'boat',sand:'shell'},operation:'place',prop:'shell',slot:'sand'}));
 await a.updateProfile(p.id,{settings:{mode:'serious',language:'en'}});
 const saved=await a.exportAll();await b.importAll(saved);await b.importAll(saved);
 assert.deepEqual(await a.getEvents(p.id),await b.getEvents(p.id));assert.deepEqual(await a.getProfile(p.id),await b.getProfile(p.id));
 assert.equal(deriveWorkshop(await b.getEvents(p.id),[brief]).completed.size,1);
 assert.equal(deriveProgress(await b.getEvents(p.id),{missions:[]}).independent,0);
 a.close();b.close();
});
test('accepted requests are possible, original, finite and pinned against subsequent changes',async()=>{
 const batch=await acceptedWorkshop();assert.equal(workshopBriefs.length,9);
 for(const b of batch.briefs)assert.equal(fulfillsBrief(Object.fromEntries(b.placements.map(p=>[p.slot,p.prop])),b),true);
 const bad=structuredClone(batch);bad.briefs[0].placements=[{prop:'boat',slot:'water'},{prop:'boat',slot:'sky'}];assert.throws(()=>validateWorkshop(bad));
 const polluted=structuredClone(batch);polluted.briefs[0].approved=true;assert.throws(()=>validateWorkshop(polluted));
});
test('play scenes use labeled buttons and escape authored text in both languages',()=>{
 for(const language of ['en','vi'])for(const mode of ['kids','balanced']){
  const html=workshopView({language,mode,brief:workshopBriefs[0]});
  assert.equal((html.match(/data-action="workshop-select"/g)||[]).length,6);
  assert.doesNotMatch(html,/data-action="submit"|role="grid"/);assert.match(html,/role="status"/);
 }
 const html=workshopView({brief:{...workshopBriefs[0],request:'<script>bad</script>'}});assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
