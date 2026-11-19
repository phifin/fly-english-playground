// Regenerate the reading reference from an extracted, unmodified Princeton WordNet 3.0 corpus.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const input=process.argv[2];
if(!input)throw Error('Supply the directory containing WordNet 3.0 index.sense, data.* and LICENSE.');
const out=fileURLToPath(new URL('../data/published/reference/',import.meta.url));
const read=name=>readFile(join(resolve(input),name),'utf8');
const license=(await read('LICENSE')).trim();
if(!license.startsWith('WordNet Release 3.0')||!license.includes('Princeton University'))throw Error('Unexpected WordNet edition');
const senses=new Map(),tags=['noun','verb','adj','adv'];
// Restrict ordinary lookup to current English meanings suitable for a general reading reference.
const unsuitable=/\b(obscene|vulgar|offensive|derogatory|disparaging|slur|archaic|obsolete|sexual|sexuality|genital|intercourse|pornographic|excrement|urine|prostitute|slang term for|murder|suicide|nazi|negro|negroid|caucasoid|mongoloid|traditional racial division|retarded|slut|whore|porn|fuck|rape)\b/i;
for(const tag of tags){
 for(const line of (await read('data.'+tag)).split(/\r?\n/)){
  if(!/^\d{8} /.test(line))continue;
  const [data,gloss]=line.split(' | ');if(!gloss||unsuitable.test(gloss))continue;
  const [offset,domain]=data.split(' ');
  if(['08','18','19','28','33'].includes(domain))continue;
  const [definition,...examples]=gloss.trim().split(/;\s*"/);
  if(definition.length>240||definition.length<5)continue;
  senses.set(tag+offset,{definition:definition.trim(),examples:examples.map(x=>x.replace(/".*$/,'').trim()).filter(x=>x.length&&x.length<120&&!/\b(kill|killed|abuse|shoot|dead body)\b/i.test(x))});
 }
}
const ranked=[];
for(const line of (await read('index.sense')).split(/\r?\n/)){
 const match=/^([a-z][a-z_-]+)%([12345]):\S+ (\d+) (\d+) (\d+)$/.exec(line.trim());
 if(!match)continue;
 const [,lemma,pos,offset,rank,tagged]=match;
 if(+rank!==1||+tagged<2)continue;
 const tag=({1:'noun',2:'verb',3:'adj',4:'adv',5:'adj'})[pos],sense=senses.get(tag+offset);
 if(!sense||unsuitable.test(lemma.replaceAll('_',' ')))continue;
 const term=lemma.replaceAll('_',' '),sample=sense.examples.find(x=>(' '+x.toLowerCase().replace(/[^a-z -]/g,' ')+' ').includes(' '+term+' '));
 ranked.push({term,pos:tag,meaning:sense.definition,...(sample?{example:sample}:{}),sense:offset+'-'+tag,tagged:+tagged});
}
ranked.sort((a,b)=>b.tagged-a.tagged||a.term.localeCompare(b.term,'en')||a.pos.localeCompare(b.pos,'en'));
const selected=new Map();
for(const row of ranked){if(!selected.has(row.term)){const {tagged,...entry}=row;selected.set(row.term,entry);}if(selected.size===3000)break;}
const rows=[...selected.values()].sort((a,b)=>a.term.localeCompare(b.term,'en'));
if(rows.length!==3000)throw Error('Reference selection incomplete');
await mkdir(out,{recursive:true});
for(const initial of 'abcdefghijklmnopqrstuvwxyz'){
 const entries=rows.filter(r=>r.term[0]===initial);
 await writeFile(join(out,initial+'.json'),JSON.stringify({edition:'atlas-wn30-1',license,entries})+'\n');
}
console.log(JSON.stringify({entries:rows.length,sourceExamples:rows.filter(r=>r.example).length,expressions:rows.filter(r=>r.term.includes(' ')).length,manifestHash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')}));

