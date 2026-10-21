import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validatePack,contentHash,coverage} from './content.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));

/** Parent-reviewed hashes bind actual staged output. No submitted approval is consulted. */
export function assemble(review,packs,previous=null){
 if(review?.schemaVersion!==1||review.reviewer!=='Sol'||!Array.isArray(review.batches)||!review.batches.length)throw new Error('Missing independent acceptance record');
 const result={schemaVersion:1,batchId:'atlas-family-1',provenance:[],missions:[]},sources=new Map();
 if(packs.length!==review.batches.length)throw new Error('Acceptance batch count mismatch');
 packs.forEach((pack,i)=>{
  const entry=review.batches[i],errors=validatePack(pack);if(errors.length)throw new Error(errors.join('\n'));
  if(entry.packHash!==contentHash(pack))throw new Error(`Unreviewed changes in ${entry.path}`);
  if(entry.activityHashes?.length!==pack.missions.flatMap(m=>m.activities).length)throw new Error('Incomplete activity review');
  const accepted=new Map(entry.activityHashes.map(a=>[a.id,a.sha256]));
  for(const mission of pack.missions)for(const a of mission.activities)if(accepted.get(a.id)!==contentHash(a))throw new Error(`Activity not accepted: ${a.id}`);
  // Namespacing preserves each batch's reference notes even when authors reused a source ID.
  const sourceMap=new Map(pack.provenance.map(s=>[s.id,`${pack.batchId}-${s.id}`]));
  for(const s of pack.provenance){const id=sourceMap.get(s.id);if(sources.has(id))throw new Error(`Conflicting source id ${id}`);sources.set(id,{...s,id});}
  result.missions.push(...pack.missions.map(m=>({...m,sources:m.sources.map(id=>sourceMap.get(id))})));
 });
 result.provenance=[...sources.values()];
 result.missions.sort((a,b)=>['A1','A2','B1','B2','C1','C2'].indexOf(a.level)-['A1','A2','B1','B2','C1','C2'].indexOf(b.level));
 const errors=validatePack(result);if(errors.length)throw new Error(errors.join('\n'));
 if(previous){const old=new Map(previous.missions.flatMap(m=>m.activities).map(a=>[a.id,contentHash(a)])),nextIds=new Set(result.missions.flatMap(m=>m.activities).map(a=>a.id));for(const id of old.keys())if(!nextIds.has(id))throw new Error(`Do not remove historical activity ${id} without a migration.`);for(const m of result.missions)for(const a of m.activities)if(old.has(a.id)&&old.get(a.id)!==contentHash(a))throw new Error(`Published activity identities are immutable: ${a.id}. Create a new versioned ID; preserve historical content.`);}
 return result;
}

export async function acceptedContent(){
 const review=JSON.parse(await readFile(resolve(root,'data/acceptance.json'),'utf8')),packs=[];
 for(const entry of review.batches){
  if(!/^data\/staging\/[a-z0-9-]+\/pack\.json$/.test(entry.path))throw new Error('Unsafe staging path');
  const path=resolve(root,entry.path);if(!path.startsWith(resolve(root,'data/staging')+sep))throw new Error('Staging path escaped');
  packs.push(JSON.parse(await readFile(path,'utf8')));
 }
 return assemble(review,packs);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const next=await acceptedContent(),path=resolve(root,'data/published/atlas.json');
 let previous;try{previous=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(process.argv.includes('--check')){if(contentHash(next)!==contentHash(previous))throw new Error('Published library differs from accepted staging. Run publish after review.');}
 else{assemble(JSON.parse(await readFile(resolve(root,'data/acceptance.json'),'utf8')),await Promise.all(JSON.parse(await readFile(resolve(root,'data/acceptance.json'),'utf8')).batches.map(e=>readFile(resolve(root,e.path),'utf8').then(JSON.parse))),previous);await mkdir(resolve(root,'data/published'),{recursive:true});await writeFile(path,JSON.stringify(next,null,2)+'\n');}
 console.log(JSON.stringify({accepted:true,coverage:coverage(next)},null,2));
}
