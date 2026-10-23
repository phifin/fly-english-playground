import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sample=JSON.parse(await readFile(new URL('../data/staging/age45-visual-vocabulary-sample.json',import.meta.url),'utf8'));
const pack=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
const activities=new Map(pack.missions.flatMap(m=>m.activities.map(a=>[a.id,a])));
const concepts=['lantern','bell','boat','shell','kite','leaf'];
// Independent acceptance review: the submitted boat item's second reference
// exists but does not contain boat. Keep the original staged submission intact.
sample.items.find(i=>i.id==='age45-boat').sourceActivityIds=['a1-lantern-harbor-03'];
if(sample.items.length!==6||new Set(sample.items.map(i=>i.id)).size!==6||sample.purpose.requiresAdult!==true)throw Error('Unexpected picture sample');
for(const item of sample.items){
 if(!concepts.includes(item.answerId)||item.word.en!==item.answerId||item.visualOptions.length!==3||new Set(item.visualOptions.map(v=>v.id)).size!==3||item.visualOptions.filter(v=>v.role==='target').length!==1||!item.visualOptions.some(v=>v.id===item.answerId&&v.role==='target')||item.visualOptions.some(v=>!concepts.includes(v.id)))throw Error('Invalid picture key '+item.id);
 for(const id of item.sourceActivityIds)if(!activities.has(id)||!new RegExp('\\b'+item.word.en+'s?\\b','i').test(JSON.stringify(activities.get(id))))throw Error('Unsubstantiated source '+id);
 for(const field of ['word','adultCue','parentFacilitation'])for(const lang of ['en','vi'])if(typeof item[field][lang]!=='string'||!item[field][lang].trim()||item[field][lang].normalize('NFC')!==item[field][lang])throw Error('Invalid localized cue');
}
const body='// Original Luna sample; independently reviewed by Sol. See docs/product-redesign.md.\n// Practice only, no CEFR assessment. Original SVG illustrations are code-native.\nexport const pictureItems = '+JSON.stringify(sample.items,null,2)+';\n';
const target=new URL('../src/picture-content.js',import.meta.url);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==body)throw Error('Picture play differs from accepted sample');}
else await writeFile(target,body);
console.log(JSON.stringify({items:6,sha256:createHash('sha256').update(body).digest('hex'),sourceIdsVerified:true,normalization:'NFC',evidence:'adult-assisted-practice-only'}));
