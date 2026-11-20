import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {courseUnits} from '../src/course-bank.js';
import {expressionUnits} from '../src/course-expressions.js';
import {listeningUnits} from '../src/course-listening.js';
import {academicSets} from '../src/academic-content.js';

export function editionHashes(){
 const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const editions=[...courseUnits,...expressionUnits,...listeningUnits,...academicSets];
 const result={};
 for(const edition of editions){
  if(Object.hasOwn(result,edition.id))throw Error('Duplicate edition '+edition.id);
  const stimulus=edition.docs??edition.script??null;
  result[edition.id]=digest([edition.level??edition.track,stimulus,edition.items.map(q=>[
   q.skill??null,q.prompt,q.options??null,q.keys,q.clip?[q.clip.record,q.clip.script]:null
  ])]);
 }
 return result;
}
export async function verifyPreservedEditions(){
 const locked=JSON.parse(await readFile(new URL('../data/reviews/curriculum-editions.json',import.meta.url),'utf8'));
 const actual=editionHashes();
 for(const [id,expected] of Object.entries(locked))if(actual[id]!==expected)throw Error('Retain the original content and ID for historical attempts: '+id);
 for(const id of Object.keys(actual))if(!Object.hasOwn(locked,id))throw Error('Record the reviewed edition fingerprint for '+id);
}
