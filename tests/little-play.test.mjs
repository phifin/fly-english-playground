import test from 'node:test';
import assert from 'node:assert/strict';
import {createLittleSession,restoreLittleSession,littleAction,littleCurrent,littleOptions,littlePlayView,littleArt,LITTLE_WORD_IDS} from '../src/little-play.js';
const words=LITTLE_WORD_IDS.map(id=>({id,word:{en:id,vi:'tranh '+id},cue:{en:'Find the '+id,vi:'Tìm tranh '+id},parentTip:{en:'Say the word together.',vi:'Cùng gọi tên.'}}));
test('little rounds use four known distinct pictures and cycle through the full collection',()=>{
 const rounds=[0,4,8].map(offset=>createLittleSession(words,{offset}));
 assert.equal(new Set(rounds.flatMap(s=>s.deck)).size,12);
 for(const state of rounds){assert.equal(state.deck.length,4);assert.deepEqual(restoreLittleSession(state,words),state);}
 assert.deepEqual(createLittleSession(words,{offset:12}),rounds[0]);
 assert.throws(()=>createLittleSession(words,{mode:'exam'}));assert.throws(()=>createLittleSession(words.slice(0,2)));
});
test('recognition gives forgiving retry and cannot advance before a matching choice',()=>{
 const initial=createLittleSession(words,{mode:'find'}),target=littleCurrent(initial,words);
 const options=littleOptions(initial,words);assert.equal(options.length,3);assert.equal(new Set(options.map(w=>w.id)).size,3);
 const wrong=options.find(w=>w.id!==target.id).id;
 const retried=littleAction(initial,{type:'pick',value:wrong},words);
 assert.equal(retried.feedback,'again');assert.deepEqual(retried.found,[]);assert.equal(retried.index,0);assert.equal(initial.feedback,null);
 assert.deepEqual(littleAction(retried,{type:'next'},words),retried);
 const matched=littleAction(retried,{type:'pick',value:target.id},words);assert.equal(matched.feedback,'found');assert.deepEqual(matched.found,[target.id]);
 assert.deepEqual(littleAction(matched,{type:'pick',value:wrong},words),matched);
 const next=littleAction(matched,{type:'next'},words);assert.equal(next.index,1);assert.equal(next.feedback,null);
});
test('picture matching and cards finish without a score, timer, CEFR label or duplicate collections',()=>{
 for(const mode of ['match','find','explore']){
  let s=createLittleSession(words,{mode});
  while(littleCurrent(s,words)){
   const action=mode==='explore'?{type:'listen'}:{type:'pick',value:littleCurrent(s,words).id};
   s=littleAction(s,action,words);s=littleAction(s,action,words);s=littleAction(s,{type:'next'},words);
  }
  assert.equal(s.index,4);assert.equal(s.found.length,4);assert.deepEqual(restoreLittleSession(JSON.parse(JSON.stringify(s)),words),s);
  assert.deepEqual(littleAction(s,{type:'next'},words),s);assert.equal(littleOptions(s,words).length,0);
  assert.doesNotMatch(JSON.stringify(s),/score|level|mastery|time/i);
 }
});
test('corrupt imported state is rejected rather than used as unchecked rendering state',()=>{
 const s=createLittleSession(words,{mode:'match'});
 for(const bad of [{...s,index:9},{...s,index:1},{...s,deck:['cat','cat','dog']},{...s,deck:['cat','dog','unknown']},{...s,found:['star']},{...s,found:['cat','cat']},{...s,feedback:'found'},{...s,lastPick:'<img>'},{...s,offset:-1},{...s,heard:'yes'},null])assert.equal(restoreLittleSession(bad,words),null);
 assert.deepEqual(littleAction(s,{type:'pick',value:'<img>'},words),s);
 assert.throws(()=>littleAction({...s,index:99},{type:'next'},words));
 for(const bad of [{...s,deck:['dog','cat','bird','fish']},{...s,deck:['cat','dog','bird']},{...s,feedback:'heard'},{...s,found:['cat']},{...s,feedback:'again',lastPick:'cat'},{...s,feedback:'again',lastPick:'star'},{...s,feedback:'found',found:['cat'],lastPick:'dog'}])assert.equal(restoreLittleSession(bad,words),null);
 const cards=createLittleSession(words);assert.equal(restoreLittleSession({...cards,heard:true},words),null);
 const viewed=littleAction(cards,{type:'next'},words);assert.deepEqual(viewed.found,['cat']);assert.deepEqual(restoreLittleSession(viewed,words),viewed);
});
test('bilingual views provide labelled buttons, audio fallback, concise help and stable route hooks',()=>{
 for(const language of ['en','vi']){
  const menu=littlePlayView({words,language});assert.match(menu,/data-little-mode="menu"/);assert.equal((menu.match(/data-action="little-start"/g)||[]).length,3);assert.match(menu,/data-action="home"/);
  for(const mode of ['explore','find','match']){
   const session=createLittleSession(words,{mode}),html=littlePlayView({words,session,language,audioAvailable:false});
   assert.match(html,/class="little-play"/);assert.match(html,/data-little-complete="false"/);assert.match(html,/role="status"/);assert.match(html,/<details class="little-grownup">/);assert.match(html,/aria-label=/);assert.equal(html,html.normalize('NFC'));
   if(mode==='find')assert.match(html,/little-audio-help/);
   if(mode==='match')assert.match(html,/little-model/);
   if(mode!=='explore')assert.equal((html.match(/data-action="little-pick"/g)||[]).length,3);
  }
 }
 for(const id of LITTLE_WORD_IDS)assert.match(littleArt(id),/<svg[^>]+aria-hidden="true"/);
});
test('authored labels remain escaped and play snapshots do not mutate caller data',()=>{
 const custom=structuredClone(words);custom[0].word.en='<script>alert(1)</script>';
 const s=createLittleSession(custom),html=littlePlayView({words:custom,session:s});
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
 const backup=structuredClone(s);littleAction(s,{type:'listen'},custom);assert.deepEqual(s,backup);
});
