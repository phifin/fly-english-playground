import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function checkPlacement({write=false}={}){
 const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
 const batch=await read('data/staging/placement-review.json'),review=await read('data/reviews/placement-acceptance.json'),pack=await read('data/published/atlas.json');
 if(batch.schemaVersion!==1||batch.batchId!=='placement-review-v1'||digest(batch)!==review.submissionSha256)throw Error('Placement review changed after acceptance');
 const activities=new Map(pack.missions.flatMap(m=>m.activities.map(a=>[a.id,{...a,level:m.level}])));
 const ids=new Set(),counts={};
 for(const item of review.items){
  const a=activities.get(item.activityId);
  if(!a||ids.has(a.id)||a.level!==item.level||!['choice','gap'].includes(a.type)||!['reading','language-use'].includes(item.skill)||digest(a)!==item.contentSha256)throw Error('Invalid or changed placement item '+item.activityId);
  if(item.skill!==(a.type==='choice'?'reading':'language-use'))throw Error('Incorrect placement domain');
  ids.add(a.id);counts[a.level]=(counts[a.level]??0)+1;
 }
 if(review.items.length!==18||['A1','A2','B1','B2','C1','C2'].some(l=>counts[l]!==3||review.items.filter(i=>i.level===l&&i.skill==='language-use').length!==1))throw Error('Incomplete placement coverage');
 const items=review.items.map(({activityId,level,skill})=>({activityId,level,skill}));
 const body='// Independently accepted existing practice items. Uncalibrated starting guidance only.\n// See data/reviews/placement-acceptance.json for limitations and pinned content.\nexport const placementItems = '+JSON.stringify(items,null,2)+';\n';
 const target=new URL('src/placement-content.js',root);
 if(write)await writeFile(target,body);else if(await readFile(target,'utf8')!==body)throw Error('Published placement pool differs from acceptance');
 return {items:items.length,counts,scope:'reading and language use; not CEFR certification'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkPlacement({write:!process.argv.includes('--check')})));
