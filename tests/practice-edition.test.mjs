import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyPracticeEdition,practiceSupport} from '../src/practice-edition.js';
import {indexContent,deriveProgress,suggestPractice,assess} from '../src/learning.js';
import {quickActivities,savedQuick} from '../src/quick-practice.js';
import {validatePracticeEdition} from '../scripts/validate-practice-edition.mjs';

const old={id:'a1-small-01',type:'gap',skill:'language',focus:'be',accepted:['is']};
const pack={missions:[{id:'a1-small',level:'A1',activities:[old]},{id:'a1-next',level:'A1',activities:[{...old,id:'a1-next-01'}]}]};
const assistance={terms:[{text:'book',meaning:{en:'Something to read.',vi:'Sách để đọc.'},example:{en:'This is a book.',vi:'Đây là một quyển sách.'}}],hint:{en:'Read the sentence again.',vi:'Đọc lại câu nhé.'},prerequisites:['Recognise a familiar object.']};
const edition={schemaVersion:1,editionId:'practice-support-1',revisions:[{replaces:old.id,missionId:'a1-small',activity:{...old,id:old.id+'-v2',accepted:['are']},...assistance}],support:[]};
const attempt=(activityId,answer,id='e1',at='2026-10-01T12:00:00.000Z')=>({kind:'attempt',id,at,payload:{activityId,answer,supported:false}});

test('edition never mutates original definitions, keys, or the source pack',()=>{
 const before=structuredClone(pack),next=applyPracticeEdition(pack,edition),index=indexContent(next);
 assert.deepEqual(pack,before);assert.equal(index.missions.get('a1-small').activities[0].id,old.id+'-v2');
 assert.equal(index.activities.get(old.id).retired,true);assert.equal(assess(index.activities.get(old.id),'is').correct,true);
 assert.equal(assess(index.activities.get(old.id+'-v2'),'is').correct,false);assert.deepEqual(next.historicalMissions,[pack.missions[0]]);
 assert.deepEqual(practiceSupport(next,old.id+'-v2'),assistance);assert.equal(practiceSupport(next,old.id),null);
 assert.throws(()=>applyPracticeEdition(next,edition),/twice/);
});

test('historical achievements remain earned without manufacturing replacement mastery',()=>{
 const next=applyPracticeEdition(pack,edition),events=[attempt(old.id,'is')],p=deriveProgress(events,next,Date.parse('2026-11-01'));
 assert.equal(p.rewards.has('a1-small'),true);assert.equal(p.records[old.id].independent,1);assert.equal(p.records[old.id].retired,true);
 assert.equal(p.records[old.id+'-v2'],undefined);assert.equal(p.independent,1);assert.equal(p.activeEvidence.independent,0);assert.equal(p.historicalEvidence.independent,1);
 assert.equal(p.due.length,0);assert.equal(p.attempts,1);
 const fresh=deriveProgress([attempt(old.id+'-v2','are')],next);
 assert.equal(fresh.rewards.has('a1-small'),true);assert.equal(fresh.independent,1);assert.equal(fresh.records[old.id],undefined);
});

test('mixed old/new partial completions cannot fabricate a mission accomplishment',()=>{
 const two={missions:[{id:'a1-small',level:'A1',activities:[old,{...old,id:'a1-small-02'}]}]};
 const edits={...edition,revisions:[...edition.revisions,{...edition.revisions[0],replaces:'a1-small-02',activity:{...old,id:'a1-small-02-v2',accepted:['are']}}]};
 const p=deriveProgress([attempt(old.id,'is'),attempt('a1-small-02-v2','are','e2')],applyPracticeEdition(two,edits));
 assert.equal(p.rewards.size,0);
});

test('historical support and drafts retain their identity across editions',()=>{
 const next=applyPracticeEdition(pack,edition),events=[{id:'a',at:'2026-10-01T11:00:00.000Z',kind:'support',payload:{activityId:old.id,reason:'vocabulary'}},attempt(old.id,'is')];
 const p=deriveProgress(events,next);assert.equal(p.records[old.id].independent,0);
 const fresh=deriveProgress([...events,attempt(old.id+'-v2','are','e2')],next);assert.equal(fresh.records[old.id+'-v2'].independent,1);
 const draft={id:'d',at:'2026-10-03T12:00:00.000Z',kind:'draft',payload:{activityId:old.id,answer:'is',supported:true}};
 assert.equal(deriveProgress([draft],next).drafts[old.id].answer,'is');
 assert.deepEqual(deriveProgress([...events,draft],next),deriveProgress([draft,...events].reverse(),next));
});

test('new quick sessions and repair recommendations exclude retired exercises',()=>{
 const next=applyPracticeEdition(pack,edition),p=deriveProgress([attempt(old.id,'was')],next,Date.parse('2026-11-01'));
 const ids=quickActivities(next,p,'A1');assert.ok(ids.includes(old.id+'-v2'));assert.ok(!ids.includes(old.id));
 p.records.fake={...p.records[old.id],id:'fake'};assert.equal(suggestPractice(p,'A1').action,'continue');
});

test('a previously saved quick session can still resume its immutable old activities',()=>{
 const many={missions:[{id:'a1-small',level:'A1',activities:Array.from({length:5},(_,i)=>({...old,id:i?`a1-small-0${i+1}`:old.id}))}]};
 const next=applyPracticeEdition(many,edition),ids=many.missions[0].activities.map(a=>a.id);
 const saved=savedQuick([{id:'quick',kind:'mission',at:'2026-10-01T12:00:00.000Z',payload:{experience:'quick-practice-v1',sessionId:'session1',ids,index:2}}],indexContent(next).activities);
 assert.deepEqual(saved,{sessionId:'session1',ids,index:2});
});

test('runtime rejects reused IDs, cross-mission replacements, duplicated support and layering',()=>{
 for(const change of [r=>r.activity.id=old.id,r=>r.missionId='a1-next',r=>r.replaces='unknown']){
  const bad=structuredClone(edition);change(bad.revisions[0]);assert.throws(()=>applyPracticeEdition(pack,bad));
 }
 const duplicated=structuredClone(edition);duplicated.revisions.push(duplicated.revisions[0]);assert.throws(()=>applyPracticeEdition(pack,duplicated));
 assert.throws(()=>applyPracticeEdition(pack,{...edition,support:[{activityId:old.id,...assistance}]}));
});

const corpus=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const auditOnly={schemaVersion:1,editionId:'practice-support-1',reviewedAt:'2026-11-05',sources:[{id:'test-source',title:'Test reference',url:'https://example.org/reference',usage:'Test fixture only; original material. Not educational approval.',accessed:'2026-11-05'}],revisions:[],support:[],audit:corpus.missions.flatMap(m=>m.activities.map(a=>({activityId:a.id,decision:'retain',reason:'Structural validation test, not educational acceptance.',levelRationale:'Fixture only; no claim about level calibration.'})))};

test('all 120 existing definitions pass the structural audit contract without changing their hashes',()=>{
 assert.equal(auditOnly.audit.length,120);const before=JSON.stringify(corpus);
 assert.deepEqual(validatePracticeEdition(corpus,auditOnly),[]);assert.equal(JSON.stringify(corpus),before);
 assert.deepEqual(indexContent(applyPracticeEdition(corpus,auditOnly)).activities,indexContent(corpus).activities);
});

test('audit must cover every original exactly once and cannot self-approve',()=>{
 for(const mutate of [e=>e.audit.pop(),e=>e.audit[1].activityId=e.audit[0].activityId,e=>e.audit[0].decision='revise',e=>e.approved=true,e=>e.sources[0].url='javascript:alert(1)',e=>e.sources[0].usage='']){
  const bad=structuredClone(auditOnly);mutate(bad);assert.ok(validatePracticeEdition(corpus,bad).length);
 }
});

test('revision keys run through the existing real activity validator',()=>{
 const m=corpus.missions[0],a=m.activities.find(a=>a.type==='choice'),candidate=structuredClone(auditOnly);
 const help={terms:[],hint:{en:'Read the sentence carefully.',vi:'Đọc kỹ câu nhé.'},prerequisites:['Recognise the subject.']};
 candidate.revisions=[{replaces:a.id,missionId:m.id,activity:{...a,id:a.id+'-v2'},rationale:{en:'Test only.',vi:'Chỉ dùng để kiểm thử.'},...help}];candidate.audit.find(i=>i.activityId===a.id).decision='revise';
 assert.deepEqual(validatePracticeEdition(corpus,candidate),[]);
 candidate.revisions[0].activity.answer='missing';assert.ok(validatePracticeEdition(corpus,candidate).some(e=>e.includes('unknown choice')));
});

test('support rejects unrelated vocabulary, duplicates and malformed localized data',()=>{
 const a=corpus.missions[0].activities[0];
 const support={activityId:a.id,...assistance,terms:[{...assistance.terms[0],text:'xylophone-impossible-term'}]};
 const candidate={...auditOnly,support:[support]};assert.ok(validatePracticeEdition(corpus,candidate).some(e=>e.includes('absent')));
 const duplicate={...auditOnly,support:[{...support,terms:[]},{...support,terms:[]}]};assert.ok(validatePracticeEdition(corpus,duplicate).some(e=>e.includes('duplicate')));
 const malformed=structuredClone(candidate);malformed.support[0].hint.vi='<script>';assert.ok(validatePracticeEdition(corpus,malformed).some(e=>e.includes('safe nonempty')));
});
