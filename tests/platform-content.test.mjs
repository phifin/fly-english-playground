import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePlatform,checkPlatform} from '../scripts/accept-platform.mjs';
import {platformView} from '../src/platform-view.js';
import {indexCurriculum,deriveCurriculum} from '../src/curriculum.js';
const bi=s=>({en:s,vi:'Nội dung thử nghiệm'});
// Deliberately synthetic structural fixtures, never published as educational material.
function fixture(){
 const sourceIds=['reference'];
 const item=(id,purpose,type='choice')=>({id,type,purpose,prompt:'Synthetic task '+id,context:purpose==='listening'?'':'Synthetic context '+id,explanation:bi('Synthetic explanation'),sourceIds,...(type==='gap'?{accepted:['fixture']}:{options:[{id:'a',text:'Fixture'},{id:'b',text:'Alternative'},{id:'c',text:'Third'}],answer:'a'})});
 const domains=['vocabulary','grammar','reading','communication'],levels=['A1','A2','B1','B2','C1','C2'];
 const objectives=levels.flatMap(level=>domains.map((domain,i)=>{const id=`cur-${level.toLowerCase()}-0${i+1}`;return{id,level,domain,title:bi(id),canDo:bi(id),prerequisites:[],teaching:[bi('First'),bi('Second')],sourceIds,lexicon:[1,2,3].map(n=>({id:id+'-word-'+n,term:id+'-'+n,meaning:bi('Fixture meaning'),example:'Synthetic example.',family:''})),activities:[item(id+'-p1','practice'),item(id+'-p2','practice','gap'),item(id+'-c1','check')]};}));
 const examSets=['ielts-academic','toeic-lr','vn-competitive'].map(exam=>({id:exam,exam,title:bi(exam),scope:bi('Synthetic set'),minutes:5,sourceIds,activities:Array.from({length:8},(_,i)=>item(exam+'-'+i,'exam'))}));
 const listening=levels.map(level=>({id:'listen-'+level.toLowerCase(),level,title:bi(level),sourceIds,transcript:Array(65).fill('fixture').join(' '),activities:[1,2].map(i=>item('listen-'+level.toLowerCase()+'-'+i,'listening'))}));
 return{schemaVersion:1,batchId:'platform-foundation-v1',sources:[{id:'reference',title:'Fixture source',url:'https://example.com/reference',usage:'Synthetic schema test, not content.'}],objectives,examSets,listening,gaps:['Synthetic test only']};
}
test('platform contract rejects structural omissions, cycles, repeated IDs and answer leakage',()=>{
 assert.equal(validatePlatform(fixture()).objectives.length,24);
 const cases=[b=>b.objectives.pop(),b=>b.objectives[0].prerequisites.push(b.objectives[0].id),b=>b.objectives[0].activities[0].answer='missing',b=>b.objectives[1].lexicon[0].term=b.objectives[0].lexicon[0].term,b=>b.objectives[0].activities[1].prompt='Use FIXTURE unchanged: ___'];
 for(const change of cases){const b=fixture();change(b);assert.throws(()=>validatePlatform(b));}
});
test('lossy Vietnamese, decomposed text and unsafe markup cannot pass the content gate',()=>{
 for(const vi of ['N?i dung th? nghi?m','Nội dung thử nghiệm'.normalize('NFD'),'<script>text</script>']){const b=fixture();b.objectives[0].title.vi=vi;assert.throws(()=>validatePlatform(b));}
});
test('all platform screens localize controls and escape authored content',()=>{
 const batch=fixture();batch.objectives[0].title.en='<img onerror=bad>';const index=indexCurriculum(batch),progress=deriveCurriculum([],batch),profile={journey:{region:'A1'},settings:{mode:'kids'}};
 for(const language of ['en','vi'])for(const page of ['hub','lesson','words','exams','listening','report','goals']){
  const html=platformView({batch,index,progress,profile,language,state:{page,objectiveId:batch.objectives[0].id}});
  assert.ok(html.includes('data-learning-page'));assert.ok(!html.includes('<img onerror'));assert.equal(html.normalize('NFC'),html);
 }
 const hub=platformView({batch,index,progress,profile,state:{page:'hub'}});assert.match(hub,/data-action="learn-review"[^>]*disabled/);assert.match(hub,/data-action="little-open"/);
});
test('production publishing requires a matching independent acceptance receipt',async()=>{
 // No auto-generated approved field or candidate preview can create the receipt.
 const script=await readFile(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');assert.match(script,/node scripts\/accept-platform\.mjs --check/);
 const preview=await readFile(new URL('../.github/workflows/platform-preview.yml',import.meta.url),'utf8');assert.doesNotMatch(preview,/deploy-pages|upload-pages-artifact|pages: write/);
 let accepted=false;try{await readFile(new URL('../data/reviews/platform-acceptance.json',import.meta.url));accepted=true;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(accepted)await checkPlatform();else await assert.rejects(checkPlatform());
});
