import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateBoard,findRoute,replayExpedition} from '../src/expedition.js';
import {contentHash} from './content.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export function validateBoardsPack(pack,missions){
 const errors=[],ids=new Set(),byMission=new Set(),sourceIds=new Set(),known=new Map(missions.map(m=>[m.id,m]));
 if(!pack||pack.schemaVersion!==1||pack.batchId!=='launch-boards'||!Array.isArray(pack.boards)||!Array.isArray(pack.provenance))return ['Invalid board pack'];
 if(Object.keys(pack).some(k=>!['schemaVersion','batchId','boards','provenance'].includes(k)))errors.push('Unexpected top-level field');
 if(!pack.provenance.length||pack.provenance.length>30)errors.push('Missing/bounded provenance');
 for(const s of pack.provenance){
  if(!s||typeof s!=='object'||Object.keys(s).some(k=>!['id','title','url','accessed','usage'].includes(k))||!['id','title','url','accessed','usage'].every(k=>typeof s[k]==='string'&&s[k].trim())){errors.push('Invalid provenance');continue;}
  if(!/^[a-z0-9-]+$/.test(s.id)||sourceIds.has(s.id))errors.push('Duplicate/unsafe source id');sourceIds.add(s.id);
  try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password||/\s/.test(s.url))throw 0;}catch{errors.push('Invalid source URL');}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s.accessed)||!Number.isFinite(Date.parse(s.accessed))||new Date(s.accessed).toISOString().slice(0,10)!==s.accessed||s.accessed>new Date().toISOString().slice(0,10))errors.push('Invalid source date');
 }
 if(pack.boards.length!==missions.length)errors.push('Exactly one board per mission required');
 for(const b of pack.boards){
  const issues=validateBoard(b);if(issues.length){errors.push(`${b?.id??'board'}: ${issues.join('; ')}`);continue;}
  if(ids.has(b.id)||byMission.has(b.missionId))errors.push('Duplicate board/mission identity');ids.add(b.id);byMission.add(b.missionId);
  if(!known.has(b.missionId)||known.get(b.missionId).level!==b.level)errors.push('Board/mission level relationship mismatch');
  const route=findRoute(b);if(!route||route.length>40||!replayExpedition(b,route).solved)errors.push('Route must solve within a single 40-command plan');
 }
 for(const m of missions)if(!byMission.has(m.id))errors.push('Missing board for '+m.id);
 return errors;
}
export async function acceptedBoards(missions){
 const review=JSON.parse(await readFile(resolve(root,'data/boards-acceptance.json'),'utf8'));
 if(review.schemaVersion!==1||review.reviewer!=='Sol'||review.path!=='data/staging/launch-boards/boards.json')throw new Error('Independent board acceptance required');
 const pack=JSON.parse(await readFile(resolve(root,review.path),'utf8')),errors=validateBoardsPack(pack,missions);
 if(errors.length)throw new Error(errors.join('\n'));if(contentHash(pack)!==review.packHash)throw new Error('Unreviewed board changes');
 const hashes=new Map(review.boardHashes.map(b=>[b.id,b.sha256]));if(hashes.size!==pack.boards.length)throw new Error('Incomplete board review');
 for(const b of pack.boards)if(hashes.get(b.id)!==contentHash(b))throw new Error('Board not accepted '+b.id);
 return pack;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const missions=JSON.parse(await readFile(resolve(root,'data/published/atlas.json'),'utf8')).missions;
 const next=await acceptedBoards(missions),path=resolve(root,'data/published/boards.json');
 let old;try{old=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(process.argv.includes('--check')){if(contentHash(next)!==contentHash(old))throw new Error('Published boards differ from accepted data');}
 else{const previous=new Map((old?.boards??[]).map(b=>[b.id,contentHash(b)]));for(const b of next.boards)if(previous.has(b.id)&&previous.get(b.id)!==contentHash(b))throw new Error('Published board IDs are immutable; version changes explicitly.');await mkdir(resolve(root,'data/published'),{recursive:true});await writeFile(path,JSON.stringify(next,null,2)+'\n');}
 console.log(JSON.stringify({accepted:true,boards:next.boards.length,longestRoute:Math.max(...next.boards.map(b=>findRoute(b).length))},null,2));
}
