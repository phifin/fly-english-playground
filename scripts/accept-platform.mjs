import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assess} from '../src/learning.js';
const root=new URL('../',import.meta.url),levels=['A1','A2','B1','B2','C1','C2'];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.slice().sort().join();
const txt=(v,max=3000,empty=false)=>typeof v==='string'&&(empty||v.trim().length>0)&&v.length<=max&&v.trim()===v&&v===v.normalize('NFC')&&!/[<>\u0000-\u001f\ufffd]/u.test(v);
const localized=v=>exact(v,['en','vi'])&&txt(v.en)&&txt(v.vi);
export function validatePlatform(batch){
 const fail=reason=>{throw Error('Platform content: '+reason);},ids=new Set(),questions=new Set(),terms=new Set();
 const id=value=>{if(typeof value!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)||ids.has(value))fail('duplicate/invalid ID '+value);ids.add(value);};
 if(!exact(batch,['schemaVersion','batchId','sources','objectives','examSets','listening','gaps'])||batch.schemaVersion!==1||batch.batchId!=='platform-foundation-v1'||!Array.isArray(batch.objectives)||batch.objectives.length!==24||!Array.isArray(batch.examSets)||batch.examSets.length!==3||!Array.isArray(batch.listening)||batch.listening.length!==6||!Array.isArray(batch.sources)||!batch.sources.length||!Array.isArray(batch.gaps)||!batch.gaps.length||!batch.gaps.every(s=>txt(s)))fail('invalid batch');
 const sources=new Set();for(const s of batch.sources){if(!exact(s,['id','title','url','usage'])||![s.id,s.title,s.url,s.usage].every(v=>txt(v))||sources.has(s.id)||new URL(s.url).protocol!=='https:')fail('source');sources.add(s.id);}
 const refs=value=>{if(!Array.isArray(value)||!value.length||new Set(value).size!==value.length||value.some(s=>!sources.has(s)))fail('references');};
 function activity(a,purpose){
  const keys={choice:['options','answer'],gap:['accepted'],order:['tokens','answer','alternatives']}[a.type];
  if(!keys||!exact(a,['id','type','purpose','prompt','context','explanation','sourceIds',...keys])||a.purpose!==purpose||!txt(a.prompt)||!txt(a.context,6000,purpose==='listening')||!localized(a.explanation))fail('activity shape '+a.id);
  id(a.id);refs(a.sourceIds);const question=(a.context+'|'+a.prompt).toLowerCase();if(questions.has(question))fail('duplicate question '+a.id);questions.add(question);
  if(a.type==='choice'){
   if(!Array.isArray(a.options)||![3,4].includes(a.options.length)||new Set(a.options.map(o=>o.id)).size!==a.options.length||new Set(a.options.map(o=>o.text.toLowerCase())).size!==a.options.length||a.options.some(o=>!exact(o,['id','text'])||!txt(o.id,80)||!txt(o.text))||!a.options.some(o=>o.id===a.answer))fail('choice '+a.id);
  }else if(a.type==='gap'){
   if(!Array.isArray(a.accepted)||!a.accepted.length||a.accepted.some(v=>!txt(v,500))||new Set(a.accepted.map(v=>v.toLowerCase())).size!==a.accepted.length)fail('gap '+a.id);
  }else{
   if(!Array.isArray(a.tokens)||a.tokens.length<3||a.tokens.length>18||a.tokens.some(o=>!exact(o,['id','text'])||!txt(o.id,80)||!txt(o.text))||new Set(a.tokens.map(o=>o.id)).size!==a.tokens.length||!Array.isArray(a.alternatives))fail('order '+a.id);
   for(const answer of [a.answer,...a.alternatives])if(!Array.isArray(answer)||answer.length!==a.tokens.length||new Set(answer).size!==answer.length||answer.some(x=>!a.tokens.some(t=>t.id===x)))fail('order answer '+a.id);
  }
  if(assess(a,a.type==='gap'?a.accepted[0]:a.answer).correct!==true)fail('self answer '+a.id);
 }
 const objectives=new Map();
 for(const o of batch.objectives){
  if(!exact(o,['id','level','domain','title','canDo','prerequisites','teaching','lexicon','activities','sourceIds'])||!levels.includes(o.level)||!['vocabulary','grammar','reading','communication'].includes(o.domain)||![o.title,o.canDo].every(localized)||!Array.isArray(o.prerequisites)||o.prerequisites.length>2||!Array.isArray(o.teaching)||o.teaching.length!==2||!o.teaching.every(localized)||!Array.isArray(o.lexicon)||o.lexicon.length!==3||!Array.isArray(o.activities)||o.activities.length!==3)fail('objective '+o.id);
  id(o.id);refs(o.sourceIds);objectives.set(o.id,o);
  for(const word of o.lexicon){if(!exact(word,['id','term','meaning','example','family'])||!txt(word.term,120)||!localized(word.meaning)||!txt(word.example)||!txt(word.family,600,true)||terms.has(word.term.toLowerCase()))fail('lexicon '+word.id);id(word.id);terms.add(word.term.toLowerCase());}
  o.activities.forEach((a,i)=>activity(a,i===2?'check':'practice'));
 }
 for(const level of levels){const os=batch.objectives.filter(o=>o.level===level);if(os.length!==4||new Set(os.map(o=>o.domain)).size!==4||new Set(os.flatMap(o=>o.activities.map(a=>a.type))).size<2)fail('level/domain/format coverage '+level);}
 for(const o of batch.objectives){if(!new RegExp(`^cur-${o.level.toLowerCase()}-0[1-4]$`).test(o.id)||o.activities.some((a,i)=>a.id!==`${o.id}-${i===2?'c1':'p'+(i+1)}`)||new Set(o.prerequisites).size!==o.prerequisites.length)fail('objective relationships '+o.id);}
 const visiting=new Set(),visited=new Set();function visit(o){if(visiting.has(o.id))fail('prerequisite cycle');if(visited.has(o.id))return;visiting.add(o.id);for(const key of o.prerequisites){if(!objectives.has(key))fail('unknown prerequisite');visit(objectives.get(key));}visiting.delete(o.id);visited.add(o.id);}batch.objectives.forEach(visit);
 for(const set of batch.examSets){if(!exact(set,['id','exam','title','scope','minutes','sourceIds','activities'])||!['ielts-academic','toeic-lr','vn-competitive'].includes(set.exam)||![set.title,set.scope].every(localized)||!Number.isInteger(set.minutes)||set.minutes<5||set.minutes>40||!Array.isArray(set.activities)||set.activities.length!==8)fail('exam set');id(set.id);refs(set.sourceIds);set.activities.forEach(a=>activity(a,'exam'));}
 if(new Set(batch.examSets.map(s=>s.exam)).size!==3)fail('exam coverage');
 for(const set of batch.listening){if(!exact(set,['id','level','title','transcript','activities','sourceIds'])||!levels.includes(set.level)||!localized(set.title)||!txt(set.transcript)||!Array.isArray(set.activities)||set.activities.length!==2||set.activities.some(a=>a.type!=='choice'||a.context!==''))fail('listening');const words=set.transcript.split(/\s+/).length;if(words<60||words>120)fail('listening script length '+set.id);id(set.id);refs(set.sourceIds);set.activities.forEach(a=>activity(a,'listening'));}
 if(new Set(batch.listening.map(s=>s.level)).size!==6)fail('listening range');
 return batch;
}
export async function checkPlatform({write=false}={}){
 const batch=validatePlatform(JSON.parse(await readFile(new URL('data/staging/platform-foundation-v1.json',root),'utf8'))),review=JSON.parse(await readFile(new URL('data/reviews/platform-acceptance.json',root),'utf8'));
 const digest=createHash('sha256').update(JSON.stringify(batch)).digest('hex');
 if(review.sha256!==digest||review.acceptedObjectiveIds.join()!==batch.objectives.map(o=>o.id).join())throw Error('Platform changed after independent acceptance');
 const body=JSON.stringify(batch,null,2)+'\n',path=new URL('data/published/platform.json',root);if(write)await writeFile(path,body);else if(await readFile(path,'utf8')!==body)throw Error('Published platform differs from reviewed data');
 return{objectives:batch.objectives.length,lexicalTargets:72,practice:48,checks:24,examItems:24,listeningItems:12,sha256:digest};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkPlatform({write:!process.argv.includes('--check')})));
