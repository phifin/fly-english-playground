import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assess,LEVELS,normalizeAnswer} from '../src/learning.js';

const id=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const own=(o,k)=>Object.hasOwn(o,k);
const formats=new Map(Object.entries({choice:['options','answer'],gap:['accepted'],order:['tokens','answer','alternatives'],match:['pairs'],writing:['rubric','example']}));
export function contentHash(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
export function validatePack(pack) {
 const errors=[],seen=new Set(),texts=new Set();
 const fail=(p,m)=>errors.push(`${p}: ${m}`);
 const obj=(v,p,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)){fail(p,'expected object');return false;}for(const k of Object.keys(v))if(!keys.includes(k))fail(p,`unexpected field ${k}`);return true;};
 const str=(v,p,max=5000)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[<>\u0000-\u0008]/.test(v)){fail(p,'invalid or unsafe text');return false;}return true;};
 const ident=(v,p)=>{if(typeof v!=='string'||!id.test(v)||v.length>100){fail(p,'invalid identifier');return false;}if(seen.has(v))fail(p,'duplicate identifier');seen.add(v);return true;};
 const localized=(v,p)=>{if(obj(v,p,['en','vi'])){str(v.en,p+'.en');str(v.vi,p+'.vi');}};
 const arr=(v,p,min,max)=>{if(!Array.isArray(v)||v.length<min||v.length>max){fail(p,`expected array length ${min}..${max}`);return false;}return true;};
 if(!obj(pack,'pack',['schemaVersion','batchId','provenance','missions']))return errors;
 if(pack.schemaVersion!==1)fail('pack.schemaVersion','unsupported');str(pack.batchId,'pack.batchId',100);
 const sourceIds=new Set();
 if(arr(pack.provenance,'provenance',1,100))for(const [i,s] of pack.provenance.entries()){
  const p=`provenance[${i}]`;if(!obj(s,p,['id','title','url','accessed','usage']))continue;
  ident(s.id,p+'.id');sourceIds.add(s.id);str(s.title,p+'.title',300);str(s.usage,p+'.usage',2000);
  try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password)throw 0;}catch{fail(p+'.url','HTTPS reference required');}
  if(typeof s.accessed!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.accessed)||!Number.isFinite(Date.parse(s.accessed))||new Date(s.accessed).toISOString().slice(0,10)!==s.accessed||s.accessed>new Date().toISOString().slice(0,10))fail(p+'.accessed','invalid/future date');
 }
 if(arr(pack.missions,'missions',1,100))for(const [i,m] of pack.missions.entries()){
  const p=`missions[${i}]`;if(!obj(m,p,['id','level','title','summary','objective','skill','topic','reward','sources','activities']))continue;
  ident(m.id,p+'.id');if(!LEVELS.includes(m.level))fail(p+'.level','invalid CEFR band');
  for(const k of ['title','summary','objective','reward'])localized(m[k],p+'.'+k);
  if(!['reading','language','writing'].includes(m.skill))fail(p+'.skill','invalid skill');str(m.topic,p+'.topic',200);
  if(arr(m.sources,p+'.sources',1,10))for(const s of m.sources)if(!sourceIds.has(s))fail(p+'.sources','unknown reference');
  if(!arr(m.activities,p+'.activities',5,5))continue;
  if(new Set(m.activities.map(a=>a?.type)).size<3)fail(p+'.activities','need at least three interaction types');
  if(m.activities.filter(a=>a?.type==='writing').length>1)fail(p+'.activities','need four objectively graded activities');
  if(!m.activities.some(a=>a?.skill==='reading'&&typeof a.context==='string'&&a.context.length>=60))fail(p+'.activities','meaningful reading context required');
  for(const [j,a] of m.activities.entries()){
   const q=p+`.activities[${j}]`;const extra=formats.get(a?.type);
   if(!obj(a,q,['id','type','skill','prompt','context','instruction','explanation','focus',...(extra??[])]))continue;
   if(!extra){fail(q+'.type','unsupported activity');continue;}if(ident(a.id,q+'.id')&&!a.id.startsWith(m.id+'-'))fail(q+'.id','must be namespaced by mission id');
   if(!['reading','language','writing'].includes(a.skill))fail(q+'.skill','invalid');
   str(a.prompt,q+'.prompt',3000);str(a.context,q+'.context',6000);str(a.focus,q+'.focus',120);localized(a.instruction,q+'.instruction');localized(a.explanation,q+'.explanation');
   const key=normalizeAnswer(a.prompt+'|'+a.context);if(texts.has(key))fail(q,'duplicate prompt/context');texts.add(key);
   if(a.type==='choice'){
    if(arr(a.options,q+'.options',3,4)){
     const ids=new Set(),options=new Set();for(const o of a.options){if(!obj(o,q+'.option',['id','text']))continue;if(!str(o.id,q+'.option.id',64)||!id.test(o.id))fail(q+'.option.id','unsafe identifier');str(o.text,q+'.option.text',1200);if(ids.has(o.id)||options.has(normalizeAnswer(o.text)))fail(q,'duplicate option');ids.add(o.id);options.add(normalizeAnswer(o.text));}
     if(!ids.has(a.answer))fail(q+'.answer','unknown choice');
    }
   }else if(a.type==='gap'){
    if(typeof a.prompt!=='string'||(a.prompt.match(/(?<!_)___(?!_)/g)??[]).length!==1||a.prompt.replace(/(?<!_)___(?!_)/g,'').includes('_'))fail(q+'.prompt','exactly one ___ blank required');
    if(arr(a.accepted,q+'.accepted',1,5)){for(const v of a.accepted)str(v,q+'.accepted',200);if(new Set(a.accepted.map(normalizeAnswer)).size!==a.accepted.length)fail(q+'.accepted','duplicate normalized answer');}
   }else if(a.type==='order'){
    if(arr(a.tokens,q+'.tokens',3,8)){
     const ids=new Set();for(const t of a.tokens){if(!obj(t,q+'.token',['id','text']))continue;if(!str(t.id,q+'.token.id',64)||!id.test(t.id))fail(q+'.token.id','unsafe identifier');str(t.text,q+'.token.text',250);if(ids.has(t.id))fail(q,'duplicate token id');ids.add(t.id);}
     const answers=[a.answer,...(Array.isArray(a.alternatives)?a.alternatives:[])];if(a.alternatives!==undefined&&!Array.isArray(a.alternatives))fail(q+'.alternatives','expected array');
     for(const answer of answers)if(!Array.isArray(answer)||answer.length!==ids.size||new Set(answer).size!==ids.size||answer.some(t=>!ids.has(t)))fail(q+'.answer','must be complete permutation');
    }
   }else if(a.type==='match'){
    if(arr(a.pairs,q+'.pairs',3,5)){const ids=new Set(),left=new Set(),right=new Set();for(const pair of a.pairs){if(!obj(pair,q+'.pair',['id','left','right']))continue;if(!str(pair.id,q+'.pair.id',64)||!id.test(pair.id))fail(q+'.pair.id','unsafe identifier');str(pair.left,q+'.pair.left',500);str(pair.right,q+'.pair.right',500);if(ids.has(pair.id)||left.has(normalizeAnswer(pair.left))||right.has(normalizeAnswer(pair.right)))fail(q,'duplicate or ambiguous match');ids.add(pair.id);left.add(normalizeAnswer(pair.left));right.add(normalizeAnswer(pair.right));}}
   }else if(a.type==='writing'){
    if(arr(a.rubric,q+'.rubric',2,4))a.rubric.forEach((r,k)=>localized(r,q+`.rubric[${k}]`));str(a.example,q+'.example',5000);
   }
   // Accepted answers must be usable by the real runtime, not just satisfy shape.
   if(!errors.some(e=>e.startsWith(q))) {
    const answer=a.type==='gap'?a.accepted[0]:a.type==='choice'?a.answer:a.type==='order'?a.answer:a.type==='match'?Object.fromEntries(a.pairs.map(p=>[p.id,p.id])):{text:a.example,checks:a.rubric.map((_,i)=>i)};
    try{const r=assess(a,answer);if(!r.complete||(a.type!=='writing'&&!r.correct))fail(q,'runtime rejects author answer');}catch(e){fail(q,'runtime failed: '+e.message);}
   }
  }
 }
 return errors;
}

export function coverage(pack) {
 const report={missions:pack?.missions?.length??0,activities:0,levels:Object.create(null),types:Object.create(null),skills:Object.create(null)};
 for(const m of Array.isArray(pack?.missions)?pack.missions:[]){if(!m||!Array.isArray(m.activities))continue;report.levels[m.level]??={missions:0,activities:0};report.levels[m.level].missions++;for(const a of m.activities){if(!a)continue;report.activities++;report.levels[m.level].activities++;report.types[a.type]=(report.types[a.type]??0)+1;report.skills[a.skill]=(report.skills[a.skill]??0)+1;}}
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const files=process.argv.slice(2);if(!files.length)throw new Error('Usage: node scripts/content.mjs data/staging/<batch>/pack.json [...]');
 for(const path of files){const pack=JSON.parse(await readFile(path,'utf8'));const errors=validatePack(pack);console.log(JSON.stringify({path,valid:!errors.length,coverage:coverage(pack),errors},null,2));if(errors.length)process.exitCode=1;}
}
