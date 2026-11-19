import test from 'node:test';
import assert from 'node:assert/strict';
import {academicSets,academicSkills,academicTracks} from '../src/academic-content.js';
import {academicResult} from '../src/academic.js';

// Separate response sheet, keyed by edition. A–D stand for displayed choices only.
const sheet = {
  'tide-clock-v1': ['B','A','C','B','C','pole','notebook','plank','C'],
  'repair-index-v1': 'ABCABCACD',
  'shade-route-v1': ['A','B','C','D','D','wheel','bus','stretch','date'],
  'archive-silence-v1': ['A','B','C','B','A','C','A','B','D'],
  'office-sentences-v1': 'ABDCBCDB',
  'project-sentences-v1': 'CDCABCAD',
  'return-boxes-v1': 'BACD',
  'gallery-shifts-v1': 'CABD',
  'depot-visit-v1': 'ABCDB',
  'translation-order-v1': 'CABDC',
  'campus-notices-v1': 'BCADBC',
  'student-exchanges-v1': 'DBACBD',
  'field-sketch-v1': 'CADBAC',
  'street-names-v1': 'DBCADB',
  'map-letters-v1': ['ect','rity','bols','ains','ance','uced','rlap','ted'],
  'school-precision-v1': 'BCADBCAD',
  'school-derivation-v1': ['impartiality','inconclusive','reversibility','anonymity','consultation','deliberately','unprecedented','exclusively'],
  'school-recast-v1': ['not been','such was','little did we','were made to','no point','having copied','were the glass','no reference'],
  'school-connectors-v1': ['whereas','that','which','of','though','or','the','that'],
  'school-editor-v1': 'BCABDBCA',
  'school-argument-v1': 'BDCADBCA'
};
const originalIds = ['roof-v1','labels-v1','courier-v1','training-v1','forms-v1','rewrites-v1'];
const newSets = academicSets.filter(set=>!originalIds.includes(set.id));


test('the ordinary academic catalogue exposes the reviewed editions and task labels',()=>{
  assert.deepEqual(newSets.map(s=>s.id).sort(),Object.keys(sheet).sort());
  assert.equal(new Set(academicSets.map(s=>s.id)).size,academicSets.length);
  for(const [id,questions,sets] of [['ielts',46,6],['toeic',43,8],['toefl',32,5],['school',58,8]]){
    const track=academicSets.filter(s=>s.track===id);
    assert.ok(academicTracks[id]);
    assert.equal(track.length,sets);
    assert.equal(track.reduce((sum,s)=>sum+s.items.length,0),questions);
  }
  for(const set of newSets){
    assert.equal(set.format.length,2,set.id);
    assert.ok(set.docs.every(p=>p.trim()===p&&p.length>25),set.id);
  }
});

for(const set of newSets){
  test(set.id+' accepts the stimulus-based response sheet and valid alternatives',()=>{
    const answers=[...sheet[set.id]].map((response,i)=>{
      const item=set.items[i];
      return item.options ? item.options[response.charCodeAt(0)-65] : response;
    });
    assert.equal(answers.length,set.items.length);
    const payload={experience:'academic-practice-v1',setId:set.id,answers};
    const correct=academicResult(payload).correct;
    for(const [i,item] of set.items.entries()){
      const name=set.id+' #'+(i+1);
      assert.equal(correct[i],true,name+': '+answers[i]);
      assert.ok(academicSkills[item.skill],name);
      assert.equal(item.why.length,2,name);
      for(const explanation of item.why){
        assert.ok(explanation.length>=28&&explanation.normalize('NFC')===explanation,name);
      }
      if(item.options){
        assert.equal(new Set(item.options.map(o=>o.toLowerCase())).size,item.options.length,name);
        assert.ok(item.options.includes(item.keys[0]),name);
      }
      if(item.prompt.includes('ONE WORD from the passage')){
        assert.match(set.docs.join(' ').toLowerCase(),new RegExp('\\b'+item.keys[0]+'\\b'),name);
        assert.match(item.keys[0],/^\w+$/,name);
      }
      if(set.id==='school-recast-v1'){
        const [,word,count]=item.prompt.match(/^(\w+) · (\d+) words/);
        for(const key of item.keys){
          assert.equal(key.split(' ').length,Number(count),name);
          assert.ok(key.split(' ').includes(word.toLowerCase()),name);
        }
      }
      for(const key of item.keys){
        const submitted=answers.with(i,'  '+key.toUpperCase()+'  ');
        assert.equal(academicResult({...payload,answers:submitted}).correct[i],true,name);
      }
    }
    assert.equal(academicResult({...payload,answers:answers.with(0,'wrong answer')}).score,answers.length-1);
    assert.equal(academicResult({...payload,answers:answers.slice(1)}),null);
  });
}

test('letter-completion gaps match the connected passage, actual words and number of letters',()=>{
  const set=newSets.find(s=>s.id==='map-letters-v1');
  const words=['select','priority','symbols','explains','distance','reduced','overlap','omitted'];
  const matches=[...set.docs.join(' ').matchAll(/\[(\d+)\] ([a-z]+)(_+)/g)];
  assert.equal(matches.length,words.length);
  for(const [i,[,number,prefix,blanks]] of matches.entries()){
    const suffix=sheet[set.id][i];
    assert.equal(Number(number),i+1);
    assert.equal(prefix+suffix,words[i]);
    assert.equal(blanks.length,suffix.length);
  }
});

