import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {WORKSHOP_PROPS,WORKSHOP_SLOTS} from '../src/workshop.js';
const root=new URL('../',import.meta.url);
const exact=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).sort().join()===keys.slice().sort().join();
const text=(v,max=500)=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=max&&v===v.normalize('NFC')&&!/[<>\u0000-\u001f\ufffd]/u.test(v);
const localized=v=>exact(v,['en','vi'])&&text(v.en)&&text(v.vi);
export function validateWorkshop(batch){
 if(!exact(batch,['schemaVersion','batchId','provenance','briefs'])||batch.schemaVersion!==1||batch.batchId!=='workshop-briefs-v1'||!Array.isArray(batch.provenance)||!Array.isArray(batch.briefs)||batch.briefs.length<6||batch.briefs.length>24)throw Error('Invalid workshop batch');
 const ids=new Set(),prompts=new Set(),sources=new Set();
 for(const s of batch.provenance){if(!exact(s,['id','title','url','usage'])||sources.has(s.id)||![s.id,s.title,s.url,s.usage].every(v=>text(v,1500))||new URL(s.url).protocol!=='https:')throw Error('Invalid provenance');sources.add(s.id);}
 for(const b of batch.briefs){
  if(!exact(b,['id','level','title','request','help','after','placements','focus','sourceIds'])||!/^workshop-(a1|a2|b1)-\d{2}$/.test(b.id)||!b.id.startsWith('workshop-'+b.level.toLowerCase()+'-')||ids.has(b.id)||prompts.has(b.request.toLowerCase())||!text(b.request,360)||!text(b.focus)||![b.title,b.help,b.after].every(localized))throw Error('Invalid or duplicate brief '+b.id);
  if(!Array.isArray(b.placements)||b.placements.length<1||b.placements.length>3||new Set(b.placements.map(p=>p.prop)).size!==b.placements.length||new Set(b.placements.map(p=>p.slot)).size!==b.placements.length||b.placements.some(p=>!exact(p,['prop','slot'])||!WORKSHOP_PROPS.includes(p.prop)||!WORKSHOP_SLOTS.includes(p.slot)))throw Error('Impossible placement '+b.id);
  if(!Array.isArray(b.sourceIds)||!b.sourceIds.length||b.sourceIds.some(id=>!sources.has(id)))throw Error('Missing reference '+b.id);
  ids.add(b.id);prompts.add(b.request.toLowerCase());
 }
 return batch;
}
export async function acceptedWorkshop(){
 const batch=validateWorkshop(JSON.parse(await readFile(new URL('data/staging/workshop-briefs-v1.json',root),'utf8')));
 // The digest pins the actual Sol-reviewed submission, not Luna's own approval flag.
 const review=JSON.parse(await readFile(new URL('data/reviews/workshop-acceptance.json',root),'utf8'));
 const digest=createHash('sha256').update(JSON.stringify(batch)).digest('hex');
 if(review.sha256!==digest||review.acceptedIds.join()!==batch.briefs.map(b=>b.id).join())throw Error('Workshop changed after independent acceptance');
 return batch;
}
export async function checkWorkshop({write=false}={}){
 const batch=await acceptedWorkshop(),body='// Original Luna briefs, independently reviewed by Sol; data/reviews/workshop-acceptance.json.\n// A1–B1 reading practice estimates only; not a calibrated test.\nexport const workshopBriefs = '+JSON.stringify(batch.briefs,null,2)+';\n';
 const path=new URL('src/workshop-content.js',root);
 if(write)await writeFile(path,body);else if(await readFile(path,'utf8')!==body)throw Error('Published workshop differs from reviewed data');
 return {briefs:batch.briefs.length,levels:[...new Set(batch.briefs.map(b=>b.level))],sha256:createHash('sha256').update(body).digest('hex')};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkWorkshop({write:!process.argv.includes('--check')})));
