import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
const ids=['cat','dog','bird','fish','apple','banana','ball','book','cup','shoe','sun','star'];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.slice().sort().join();
const text=(v,max=1200)=>typeof v==='string'&&v.length>0&&v.length<=max&&v.trim()===v&&v===v.normalize('NFC')&&!/[<>\u0000-\u001f\ufffd]/u.test(v);
const localized=v=>exact(v,['en','vi'])&&text(v.en,180)&&text(v.vi,180);
export function validateLittle(batch){
 if(!exact(batch,['schemaVersion','batchId','sources','words','limitations'])||batch.schemaVersion!==1||batch.batchId!=='little-words-v1'||!Array.isArray(batch.sources)||!batch.sources.length||!Array.isArray(batch.words)||batch.words.map(w=>w.id).join()!==ids.join()||!Array.isArray(batch.limitations)||!batch.limitations.length||!batch.limitations.every(v=>text(v)))throw Error('Invalid little words batch');
 const sources=new Set();
 for(const s of batch.sources){if(!exact(s,['id','title','url','usage'])||![s.id,s.title,s.url,s.usage].every(v=>text(v))||sources.has(s.id)||new URL(s.url).protocol!=='https:')throw Error('Invalid source');sources.add(s.id);}
 for(const w of batch.words){if(!exact(w,['id','word','cue','parentTip','sourceIds'])||![w.word,w.cue,w.parentTip].every(localized)||w.word.en!==w.id||w.cue.en!==`Find the ${w.id}.`||!Array.isArray(w.sourceIds)||!w.sourceIds.length||new Set(w.sourceIds).size!==w.sourceIds.length||w.sourceIds.some(id=>!sources.has(id)))throw Error('Invalid little word '+w.id);}
 return batch;
}
export async function checkLittle({write=false}={}){
 const batch=validateLittle(JSON.parse(await readFile(new URL('data/staging/little-words-v1.json',root),'utf8')));
 const review=JSON.parse(await readFile(new URL('data/reviews/little-acceptance.json',root),'utf8'));
 const digest=createHash('sha256').update(JSON.stringify(batch)).digest('hex');
 if(review.sha256!==digest||review.acceptedIds.join()!==ids.join())throw Error('Little words changed after independent acceptance');
 const body='// Original Luna material independently accepted by Sol; data/reviews/little-acceptance.json.\n// Shared picture/word practice; no CEFR, listening-score or developmental validity claim.\nexport const littleWords = '+JSON.stringify(batch.words,null,2)+';\n';
 const path=new URL('src/little-content.js',root);
 if(write)await writeFile(path,body);else if(await readFile(path,'utf8')!==body)throw Error('Published little words differ from accepted material');
 return {words:ids.length,sha256:digest};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkLittle({write:!process.argv.includes('--check')})));
