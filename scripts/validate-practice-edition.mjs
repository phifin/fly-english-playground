import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {contentHash,validatePack} from './content.mjs';
import {applyPracticeEdition} from '../src/practice-edition.js';
import {practiceEditionFile} from '../src/practice-release.js';
import {placementItems} from '../src/placement-content.js';

const root=new URL('../',import.meta.url);
const plain=v=>Boolean(v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v)));
const id=v=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)&&v.length<=120;
/** Structural safeguards support, but never replace, independent educational review. */
export function validatePracticeEdition(pack,edition,{today=new Date().toISOString().slice(0,10)}={}){
 const errors=[],fail=(p,m)=>errors.push(`${p}: ${m}`);
 const exact=(v,p,keys)=>{if(!plain(v)){fail(p,'expected object');return false;}if(Object.keys(v).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(v,k)))fail(p,'unexpected or missing fields');return true;};
 const text=(v,p,max=1600)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)||v.normalize('NFC')!==v){fail(p,'expected safe nonempty NFC text');return false;}return true;};
 const localized=(v,p)=>{if(exact(v,p,['en','vi'])){text(v.en,p+'.en');text(v.vi,p+'.vi');}};
 const array=(v,p,min,max)=>{if(!Array.isArray(v)||v.length<min||v.length>max){fail(p,`expected ${min}..${max} records`);return false;}return true;};
 const date=(v,p)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v>today)fail(p,'invalid/future date');};
 if(!exact(edition,'edition',['schemaVersion','editionId','reviewedAt','sources','revisions','support','audit']))return errors;
 if(edition.schemaVersion!==1||edition.editionId!=='practice-support-1')fail('edition','unsupported edition');
 date(edition.reviewedAt,'reviewedAt');
 const originals=new Map(pack.missions.flatMap(m=>m.activities.map(a=>[a.id,{activity:a,missionId:m.id}]))),sourceIds=new Set(),replacementIds=new Set(),supportIds=new Set(),auditIds=new Set();
 if(array(edition.sources,'sources',1,30))for(const [i,s] of edition.sources.entries()){
  const p=`sources[${i}]`;if(!exact(s,p,['id','title','url','usage','accessed']))continue;
  if(!id(s.id)||sourceIds.has(s.id))fail(p+'.id','invalid or duplicate');sourceIds.add(s.id);
  text(s.title,p+'.title',400);text(s.usage,p+'.usage',2400);date(s.accessed,p+'.accessed');
  try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password)throw 0;}catch{fail(p+'.url','HTTPS source required');}
 }
 function assistance(r,p,activity){
  if(array(r.prerequisites,p+'.prerequisites',1,8)){r.prerequisites.forEach((v,i)=>text(v,p+`.prerequisites[${i}]`,500));if(new Set(r.prerequisites).size!==r.prerequisites.length)fail(p+'.prerequisites','duplicate');}
  localized(r.hint,p+'.hint');
  if(array(r.terms,p+'.terms',0,8)){
   const seen=new Set(),english=activity?JSON.stringify([activity.context,activity.prompt,activity.options?.map(o=>o.text),activity.tokens?.map(o=>o.text),activity.pairs?.map(o=>[o.left,o.right])]).toLocaleLowerCase('en'):'';
   for(const [i,term] of r.terms.entries()){
    const q=p+`.terms[${i}]`;if(!exact(term,q,['text','meaning','example']))continue;
    if(text(term.text,q+'.text',100)){const key=term.text.toLocaleLowerCase('en');if(seen.has(key))fail(q,'duplicate term');seen.add(key);if(activity&&!english.includes(key))fail(q,'term absent from this activity');}
    localized(term.meaning,q+'.meaning');localized(term.example,q+'.example');
   }
  }
 }
 if(array(edition.revisions,'revisions',0,originals.size))for(const [i,r] of edition.revisions.entries()){
  const p=`revisions[${i}]`;if(!exact(r,p,['replaces','missionId','activity','rationale','prerequisites','terms','hint']))continue;
  const original=originals.get(r.replaces);
  if(!original||original.missionId!==r.missionId||replacementIds.has(r.replaces))fail(p,'unknown, mismatched or duplicate replacement');
  replacementIds.add(r.replaces);
  if(!plain(r.activity)||r.activity.id!==r.replaces+'-v2'||originals.has(r.activity?.id))fail(p+'.activity.id','replacement requires a new versioned ID');
  if(original&&placementItems.some(item=>item.activityId===r.replaces)&&r.activity?.type!==original.activity.type)fail(p+'.activity.type','placement replacements must retain the reviewed task format');
  localized(r.rationale,p+'.rationale');assistance(r,p,r.activity);
 }
 if(array(edition.support,'support',0,originals.size))for(const [i,r] of edition.support.entries()){
  const p=`support[${i}]`;if(!exact(r,p,['activityId','terms','hint','prerequisites']))continue;
  const original=originals.get(r.activityId);
  if(!original||supportIds.has(r.activityId)||replacementIds.has(r.activityId))fail(p,'unknown, duplicate or retired activity');
  supportIds.add(r.activityId);assistance(r,p,original?.activity);
 }
 if(array(edition.audit,'audit',originals.size,originals.size))for(const [i,a] of edition.audit.entries()){
  const p=`audit[${i}]`;if(!exact(a,p,['activityId','decision','reason','levelRationale']))continue;
  if(!originals.has(a.activityId)||auditIds.has(a.activityId))fail(p+'.activityId','unknown or duplicate');auditIds.add(a.activityId);
  if(!['retain','revise','practice-only'].includes(a.decision))fail(p+'.decision','unknown');
  if((a.decision==='revise')!==replacementIds.has(a.activityId))fail(p+'.decision','revision and decision disagree');
  text(a.reason,p+'.reason',2400);text(a.levelRationale,p+'.levelRationale',2400);
 }
 for(const activityId of originals.keys())if(!auditIds.has(activityId))fail('audit','missing '+activityId);
 if(!errors.length){
  const active=applyPracticeEdition(pack,edition);
  // Existing pack contract validates types, keys, distractor uniqueness and real
  // runtime acceptance. It is not a vocabulary or CEFR classification oracle.
  const {historicalMissions,practiceEdition,...publishedShape}=active;
  errors.push(...validatePack(publishedShape).map(e=>'active '+e));
 }
 return errors;
}

/** The submitter cannot approve itself: Sol's separate review pins both inputs. */
export function practiceSupportCoverage(pack,edition){
 const active=applyPracticeEdition(pack,edition),byLevel={},missing=[];
 for(const mission of active.missions){
  byLevel[mission.level]??={activities:0,supported:0,terms:0};
  for(const activity of mission.activities){
   const terms=active.practiceEdition.support[activity.id]?.terms??[];
   byLevel[mission.level].activities++;byLevel[mission.level].terms+=terms.length;
   if(terms.length)byLevel[mission.level].supported++;
   else if(['A1','A2'].includes(mission.level))missing.push(activity.id);
  }
 }
 return {byLevel,missing};
}

export async function checkPracticeEdition(){
 const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
 const pack=await read('data/published/atlas.json'),submission=await read('data/staging/practice-support-1.json'),review=await read('data/reviews/practice-support-acceptance.json'),published=await read('data/published/practice-edition.json');
 const errors=validatePracticeEdition(pack,submission);
 if(errors.length)throw new Error('Invalid practice edition: '+errors.join('\n'));
 const coverage=practiceSupportCoverage(pack,submission);
 if(coverage.missing.length)throw new Error('Beginner contextual support missing: '+coverage.missing.join(', '));
 if(review.decision!=='accept'||review.reviewedBy!=='Sol'||review.editionId!==submission.editionId||review.baseSha256!==contentHash(pack)||review.submissionSha256!==contentHash(submission)||contentHash(published)!==contentHash(submission))throw new Error('Practice edition differs from independent acceptance.');
 return {audited:submission.audit.length,revised:submission.revisions.length,supported:submission.support.length+submission.revisions.length,coverage:coverage.byLevel,scope:'Practice calibration review; no psychometric validation or CEFR certification.'};
}

export async function checkPracticeRelease(){
 if(practiceEditionFile===null){
  try{await readFile(new URL('data/published/practice-edition.json',root));}
  catch(error){if(error.code==='ENOENT')return {enabled:false,reason:'Content review pending; no revised exercises are published.'};throw error;}
  throw new Error('A practice edition is published without release activation.');
 }
 if(practiceEditionFile!=='practice-edition.json')throw new Error('Unknown practice release file.');
 return {enabled:true,...await checkPracticeEdition()};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const file=process.argv[2];
 if(!file||file==='--check')console.log(JSON.stringify(await checkPracticeEdition()));
 else{
  const pack=JSON.parse(await readFile(new URL('data/published/atlas.json',root),'utf8')),edition=JSON.parse(await readFile(file,'utf8')),errors=validatePracticeEdition(pack,edition);
  console.log(JSON.stringify({valid:errors.length===0,errors},null,2));if(errors.length)process.exitCode=1;
 }
}
