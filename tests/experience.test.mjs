import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {quickActivities,savedQuick} from '../src/quick-practice.js';
import {homeView} from '../src/home-view.js';
import {indexContent} from '../src/learning.js';
import {journeyProgress} from '../src/journey.js';
import {checkLittle,validateLittle} from '../scripts/accept-little.mjs';
import {cloudView} from '../src/cloud-view.js';
const pack=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const {activities}=indexContent(pack);
test('each learning range has five varied objective tasks without an adventure prerequisite',()=>{
 for(const level of ['A1','A2','B1','B2','C1','C2']){const ids=quickActivities(pack,{due:[],records:{}},level);assert.equal(ids.length,5);assert.equal(new Set(ids).size,5);assert.ok(ids.every(id=>activities.get(id).level===level&&activities.get(id).type!=='writing'));assert.equal(new Set(ids.map(id=>activities.get(id).type)).size,4);}
});
test('short practice prioritizes due recall and less-practiced items, then restores a validated snapshot',()=>{
 const candidates=[...activities.values()].filter(a=>a.level==='A2'&&a.type!=='writing'),last=candidates.at(-1);
 const ids=quickActivities(pack,{due:[{id:last.id}],records:{}},'A2');assert.equal(ids[0],last.id);
 const event={kind:'mission',id:'saved',at:'2026-10-29T00:00:00Z',payload:{experience:'quick-practice-v1',sessionId:'round',ids,index:3}};
 assert.deepEqual(savedQuick([event],activities),{sessionId:'round',ids,index:3});
 for(const patch of [{index:6},{ids:Array(5).fill(ids[0])},{ids:[...ids.slice(0,4),'missing']},{sessionId:null}])assert.equal(savedQuick([{...event,payload:{...event.payload,...patch}}],activities),null);
});
test('casual sessions and round completion never create language mastery or placement evidence',()=>{
 const history=['little-play-v1','quick-practice-v1'].map((experience,i)=>({kind:'mission',id:String(i),at:'2026-10-29T00:00:00Z',payload:{experience,completed:true,index:5,ids:[]}}));
 const p=journeyProgress(history,pack,[]);assert.equal(p.attempts,0);assert.equal(p.recommendation,null);assert.equal(p.rewards.size,0);assert.deepEqual(p.records,{});
});
test('home offers independent activity choices in every presentation and escapes the learner name',()=>{
 for(const mode of ['kids','balanced','serious'])for(const language of ['en','vi']){const html=homeView({language,name:'<script>',mode,level:'A1',due:0,resume:true});for(const action of ['little-open','quick-start','atlas','start-placement'])assert.ok(html.includes(`data-action="${action}"`));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));}
});
test('family management is separate and requires both approved status and server owner role',()=>{
 const owner={configured:true,uid:'owner',approved:true,familyOwner:true};
 assert.doesNotMatch(cloudView({status:owner}),/family-admin|family-invitations|data-form="family-invite"/);
 assert.match(cloudView({status:owner,section:'family'}),/family-admin/);
 for(const status of [{...owner,approved:false},{...owner,familyOwner:false},{...owner,uid:null}])assert.equal(cloudView({status,section:'family'}),'');
});
test('twelve words require independent pinned acceptance, complete bilingual NFC text and provenance',async()=>{
 assert.equal((await checkLittle()).words,12);
 const batch=JSON.parse(await readFile(new URL('../data/staging/little-words-v1.json',import.meta.url),'utf8'));
 for(const mutate of [b=>b.words[0].word.vi='me\u0300o',b=>b.words[0].sourceIds=['missing'],b=>b.words[1].id='cat',b=>b.words[0].cue.en='The answer is dog',b=>b.approved=true]){const copy=structuredClone(batch);mutate(copy);assert.throws(()=>validateLittle(copy));}
});
