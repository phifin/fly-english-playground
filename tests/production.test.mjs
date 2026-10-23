import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {acceptedContent,assemble} from '../scripts/publish-content.mjs';
import {acceptedBoards,validateBoardsPack} from '../scripts/boards.mjs';
import {contentHash,coverage} from '../scripts/content.mjs';
import {journeyProgress} from '../src/journey.js';
import {findRoute,deriveExpeditions,validateBoard} from '../src/expedition.js';
import {parseWorldPlan,explorationView} from '../src/exploration-view.js';
import {studioView} from '../src/studio-view.js';
import {assess,suggestPractice} from '../src/learning.js';
import {authorAnswer} from '../scripts/measure.mjs';
import {openMemoryStore,createMemoryDatabase} from '../src/storage.js';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(JSON.parse);
const pack=await read('data/published/atlas.json'),worlds=await read('data/published/boards.json'),review=await read('data/acceptance.json');
const now=Date.parse('2026-10-20T12:00:00.000Z');
test('published content is exactly parent-accepted material, with meaningful launch coverage in every band',async()=>{
 assert.equal(contentHash(pack),contentHash(await acceptedContent()));assert.equal(contentHash(worlds),contentHash(await acceptedBoards(pack.missions)));
 const c=coverage(pack);assert.equal(c.missions,24);assert.equal(c.activities,120);for(const level of ['A1','A2','B1','B2','C1','C2'])assert.deepEqual(c.levels[level],{missions:4,activities:20});
 assert.equal(c.skills.writing,24);for(const type of ['choice','gap','match','order','writing'])assert.equal(c.types[type],24);
});
test('submitted flags or changed staged answers cannot bypass parent acceptance',async()=>{
 const packs=await Promise.all(review.batches.map(b=>read(b.path)));const changed=structuredClone(packs);changed[0].missions[0].activities[0].answer='invented';assert.throws(()=>assemble(review,changed));
 const forged=structuredClone(packs);forged[0].approved=true;assert.throws(()=>assemble(review,forged));
});
test('all24 actual maps solve with a bounded accessible plan and are uniquely linked',()=>{
 assert.deepEqual(validateBoardsPack(worlds,pack.missions),[]);assert.equal(new Set(worlds.boards.map(b=>b.missionId)).size,24);
 for(const b of worlds.boards){assert.deepEqual(validateBoard(b),[]);const commands=findRoute(b);assert.ok(commands.includes('X'));assert.ok(commands.length<=40);assert.deepEqual(parseWorldPlan(commands.join(', ')),commands);}
 assert.throws(()=>parseWorldPlan('N, teleport'));assert.throws(()=>parseWorldPlan(Array(41).fill('N').join(' ')));
});
test('legacy exploration rewards still require completed learning and a verified route',async()=>{
 const store=await openMemoryStore({database:createMemoryDatabase()}),profile=await store.createProfile({name:'World verifier'}),mission=pack.missions[0],board=worlds.boards.find(b=>b.missionId===mission.id);
 for(const [i,a] of mission.activities.entries()){const answer=authorAnswer(a);assert.equal(assess(a,answer).complete,true);await store.appendEvent(profile.id,{id:'activity-'+i,kind:'attempt',at:new Date(now+i*1000).toISOString(),payload:{activityId:a.id,answer,supported:false}});}
 let p=journeyProgress(await store.getEvents(profile.id),pack,worlds.boards,now);assert.ok(p.completedMissions.has(mission.id));assert.equal(p.rewards.size,0);
 await store.appendEvent(profile.id,{id:'route',kind:'expedition',at:new Date(now+10000).toISOString(),payload:{boardId:board.id,commands:findRoute(board)}});
 await store.appendEvent(profile.id,{id:'reset',kind:'expedition',at:new Date(now+20000).toISOString(),payload:{boardId:board.id,commands:[]}});
 p=journeyProgress(await store.getEvents(profile.id),pack,worlds.boards,now);assert.equal(p.rewards.size,1);assert.deepEqual(p.worlds.states[board.id].commands,[]);assert.equal(p.independent,4);
 const clone=await openMemoryStore({database:createMemoryDatabase()});await clone.importAll(await store.exportAll());assert.deepEqual(journeyProgress(await clone.getEvents(profile.id),pack,worlds.boards,now),p);store.close();clone.close();
});
test('optional legacy routes retain direct movement, queued routes and text planning',()=>{
 const board=worlds.boards[0],mission=pack.missions.find(m=>m.id===board.missionId),progress=journeyProgress([],pack,worlds.boards,now),state={position:board.start,bridgeOpen:false,moves:0,visited:[],message:'ready'};
 const view=mode=>explorationView({board,state,mode,language:'en',mission,progress});
 assert.match(view('kids'),/direction-pad/);assert.doesNotMatch(view('kids'),/command-tray|data-world-plan/);
 assert.match(view('balanced'),/command-tray/);assert.match(view('serious'),/data-world-plan/);assert.doesNotMatch(view('serious'),/direction-pad/);
 assert.doesNotMatch(view('kids'),/Hỗ trợ tiếng Việt/);assert.match(explorationView({board,state,mode:'kids',language:'vi',mission,progress}),/Hỗ trợ tiếng Việt/);
});
test('studio provides a separate ungraded rehearsal without microphone collection',()=>{const html=studioView({missions:pack.missions,level:'C2',language:'en'});assert.match(html,/ungraded/);assert.match(html,/No microphone/);assert.match(html,/data-action="studio-listen"/);assert.doesNotMatch(html,/data-action="submit"/);});
test('recommendations respond to difficulties and strength without assigning certified proficiency',()=>{
 const records=Object.fromEntries(Array.from({length:8},(_,i)=>['a'+i,{id:'a'+i,level:'A1',independent:1,last:{at:new Date(now+i).toISOString(),result:{automatic:true,correct:true}}}]));
 assert.deepEqual(suggestPractice({records},'A1'),{action:'region',level:'A2',reason:'stretch'});records.a0.last.result.correct=false;records.a1.last.result.correct=false;assert.equal(suggestPractice({records},'A1').action,'review');assert.equal(suggestPractice({records:{}},'C2').action,'continue');
});
