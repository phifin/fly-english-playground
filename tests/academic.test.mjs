import test from 'node:test';
import assert from 'node:assert/strict';
import {academicSets,academicSkills} from '../src/academic-content.js';
import {academicHistory,academicResult,academicView} from '../src/academic.js';
import {journeyProgress} from '../src/journey.js';
import {openMemoryStore} from '../src/storage.js';
import {readFile} from 'node:fs/promises';

// Independent solution sheet transcribed after solving the six sets from their stimuli.
const solutions=[
 ['FALSE','NOT GIVEN','TRUE','gravel','meter'],
 ['FALSE','FALSE','NOT GIVEN','question','feature'],
 ['B','C','D','A'],['C','B','D','A','C'],
 ['reliability','inconsistency','indistinguishable','cautiously','misinterpretation'],
 ['not until','had the meeting','despite being','sooner had the','no account']
];
test('reviewed academic keys, task constraints, bilingual explanations and source words',()=>{
 const ids=['roof-v1','labels-v1','courier-v1','training-v1','forms-v1','rewrites-v1'];
 const original=ids.map(id=>academicSets.find(s=>s.id===id));
 assert.deepEqual(original.map(s=>s.id),ids);
 assert.equal(new Set(original.flatMap(s=>s.items.map(i=>i.prompt))).size,29);
 original.forEach((set,n)=>{
  const answers=solutions[n].map((s,i)=>set.track==='toeic'?set.items[i].options[s.charCodeAt(0)-65]:s);
  const payload={experience:'academic-practice-v1',setId:set.id,answers};
  assert.equal(academicResult(payload).score,set.items.length);
  const passage=set.docs.join(' ').toLowerCase();
  set.items.forEach(item=>{
   assert.ok(academicSkills[item.skill]);assert.ok(item.why.every(p=>p.length>30&&p===p.normalize('NFC')));
   if(item.options){assert.equal(new Set(item.options).size,item.options.length);if(set.track==='toeic')assert.equal(item.options.length,4);}
   if(item.prompt.includes('ONE WORD'))assert.ok(passage.match(new RegExp('\\b'+item.keys[0]+'\\b')));
   if(item.skill==='syntax'){const [,key,count]=item.prompt.match(/^(\w+) · (\d+) words/);for(const a of item.keys){assert.equal(a.split(' ').length,Number(count));assert.ok(a.split(' ').includes(key.toLowerCase()));}}
  });
  assert.equal(academicResult({...payload,answers:answers.map(s=>' '+s.toUpperCase()+' ')}).score,set.items.length);
  assert.equal(academicResult({...payload,answers:['wrong',...answers.slice(1)]}).score,answers.length-1);
  assert.equal(academicResult({...payload,answers:answers.slice(1)}),null);
 });
});
test('practice history uses versioned keys, ignores malformed data and awards no story or mastery credit',async()=>{
 const set=academicSets[0],p={experience:'academic-practice-v1',setId:set.id,answers:solutions[0]};
 const row=(id,at,payload)=>({id,at,kind:'mission',payload});
 const entries=[row('older','2026-10-01',p),row('newer','2026-10-02',{...p,answers:['<bad>',...solutions[0].slice(1)]}),row('broken','2026-10-03',{...p,answers:[null]})];
 assert.deepEqual(academicHistory(entries).map(e=>e.result.score),[4,5]);
 const html=academicView({events:entries,state:{record:'newer'},language:'vi'});
 assert.match(html,/&lt;bad&gt;/);assert.doesNotMatch(html,/<bad>/);
 assert.match(academicView({events:entries,state:{track:'ielts'},language:'en'}),/Previously/);
 const pack=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url))),boards=JSON.parse(await readFile(new URL('../data/published/boards.json',import.meta.url))).boards;
 assert.deepEqual(journeyProgress(entries,pack,boards),journeyProgress([],pack,boards));
});

test('an academic backup round trip keeps legacy attempts and learner boundaries across repeated restores',async()=>{
 const source=await openMemoryStore(),target=await openMemoryStore();
 const profile=await source.createProfile({name:'Linh',kind:'independent',guardianId:null});
 const other=await target.createProfile({name:'Minh',kind:'independent',guardianId:null});
 const at='2026-11-18T09:00:00.000Z';
 await source.appendEvent(profile.id,{id:'old-attempt',kind:'attempt',at,payload:{activityId:'a1-test-01',answer:'the bag',correct:true}});
 await source.appendEvent(profile.id,{id:'academic-drill',kind:'mission',at,payload:{experience:'academic-practice-v1',setId:academicSets[0].id,answers:solutions[0]}});
 const backup=await source.exportAll();
 assert.equal((await target.importAll(JSON.stringify(backup))).eventsAdded,2);
 assert.equal((await target.importAll(backup)).eventsAdded,0);
 assert.deepEqual(await target.getEvents(profile.id),await source.getEvents(profile.id));
 assert.equal(academicHistory(await target.getEvents(profile.id))[0].result.score,5);
 assert.deepEqual(await target.getEvents(other.id),[]);
});

