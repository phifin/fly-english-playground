import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {journeyProgress} from '../src/journey.js';
import {adventureView,canCollect} from '../src/adventure-view.js';
import {pictureItems,picturePlayView,pictureArt} from '../src/picture-play.js';
import {openMemoryStore,createMemoryDatabase} from '../src/storage.js';
import {authorAnswer} from '../scripts/measure.mjs';
const pack=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const {boards}=JSON.parse(await readFile(new URL('../data/published/boards.json',import.meta.url),'utf8'));
const m=pack.missions[0],at='2026-10-23T01:00:00.000Z';
const attempts=m.activities.map((a,i)=>({id:'attempt-'+i,kind:'attempt',at,payload:{activityId:a.id,missionId:m.id,answer:authorAnswer(a),supported:false,mode:'balanced'}}));
const claim={id:'collect',kind:'mission',at,payload:{missionId:m.id,experience:'story-v1'}};
test('story collection requires actual complete language work, never a submitted reward flag',()=>{
 for(const es of [[claim],[...attempts.slice(0,4),claim]])assert.equal(journeyProgress(es,pack,boards).rewards.size,0);
 const before=journeyProgress(attempts,pack,boards),after=journeyProgress([...attempts,claim],pack,boards);
 assert.equal(canCollect(m,before),true);assert.equal(after.rewards.has(m.id),true);
 assert.equal(after.worlds.solved.size,0,'Story completion must not invent a solved legacy route');
 assert.deepEqual(after.records,before.records);assert.equal(after.independent,4);
 assert.deepEqual(journeyProgress([...attempts,claim].reverse(),pack,boards),after);
});
test('new story receipts and picture collections round trip with legacy storage and do not become CEFR evidence',async()=>{
 const store=await openMemoryStore({database:createMemoryDatabase()}),p=await store.createProfile({name:'Test',kind:'independent',guardianId:null});
 for(const e of [...attempts,claim,{id:'picture',kind:'mission',at,payload:{experience:'picture-play-v1',itemId:pictureItems[0].id}}])await store.appendEvent(p.id,e);
 const data=await store.exportAll(),other=await openMemoryStore({database:createMemoryDatabase()});await other.importAll(data);
 const before=journeyProgress(await store.getEvents(p.id),pack,boards),after=journeyProgress(await other.getEvents(p.id),pack,boards);
 assert.deepEqual(after,before);assert.equal(after.pictureFinds.size,1);assert.equal(after.independent,4);assert.equal(after.attempts,5);
 store.close();other.close();
});
test('picture receipts alone cannot award missions, proficiency, reviews or independent answers',()=>{
 const events=pictureItems.map((x,i)=>({id:'p-'+i,kind:'mission',at,payload:{experience:'picture-play-v1',itemId:x.id}}));
 events.push({id:'unknown',kind:'mission',at,payload:{experience:'picture-play-v1',itemId:'invented'}});
 const p=journeyProgress(events,pack,boards);assert.equal(p.pictureFinds.size,6);assert.equal(p.attempts,0);assert.equal(p.independent,0);assert.equal(p.rewards.size,0);assert.equal(p.due.length,0);
});
test('all six levels have a direct scene entry without route commands; untrusted scene text is escaped',()=>{
 const p=journeyProgress([],pack,boards);
 for(const mission of pack.missions)for(const mode of ['kids','balanced'])for(const language of ['en','vi']){
  const view=adventureView({mission,progress:p,mode,language});
  assert.match(view,/class="story-expedition/);assert.doesNotMatch(view,/role="grid"|data-world-plan|data-action="world-move"/);
  assert.equal((view.match(/class="scene-stop /g)||[]).length,5);
 }
 const view=adventureView({mission:{...m,title:{en:'<img onerror=bad>',vi:'test'}},progress:p,mode:'balanced',language:'en'});
 assert.match(view,/&lt;img onerror=bad&gt;/);assert.doesNotMatch(view,/<img onerror/);
});
test('picture practice exposes adult guidance and labelled keyboard buttons without timed/graded claims',()=>{
 for(const language of ['en','vi'])for(let index=0;index<6;index++){
  const view=picturePlayView({language,index});assert.equal((view.match(/class="picture-card"/g)||[]).length,3);
  assert.match(view,/aria-label=/);assert.match(view,/picture-adult-help/);
  assert.doesNotMatch(view,/data-action="submit"|data-action="placement/);
  for(const option of pictureItems[index].visualOptions)assert.match(pictureArt(option.id),/<path/);
 }
});
