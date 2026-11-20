import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {littleWords} from '../src/little-content.js';
import {pictureItems} from '../src/picture-content.js';
import {pictureTopics,pictureWords,extendedPictureIds} from '../src/picture-library.js';
import {createLittleSession,restoreLittleSession,littleOptions,littlePlayView,littleArt,littleAction} from '../src/little-play.js';
import {createMemory,restoreMemory,flipMemory} from '../src/memory-play.js';

test('Each picture word has one unique, original drawing and bilingual adult support',async()=>{
 const sprite=await readFile(new URL('../assets/picture-garden.svg',import.meta.url),'utf8');
 const symbols=[...sprite.matchAll(/<symbol id="([a-z-]+)" viewBox="0 0 160 160">(.+?)<\/symbol>/g)];
 assert.equal(symbols.length,extendedPictureIds.size);
 assert.equal(new Set(symbols.map(([,id])=>id)).size,symbols.length);
 assert.equal(new Set(symbols.map(([, ,body])=>body)).size,symbols.length);
 assert.deepEqual(new Set(symbols.map(([,id])=>id)),extendedPictureIds);
 assert.doesNotMatch(sprite,/<(?:script|image|text|style|foreignObject)\b|\bhref\s*=/i);
 const labels=[...pictureWords,...pictureItems].map(w=>w.word.en.trim().toLowerCase());
 assert.equal(new Set(labels).size,labels.length);
 const examples=new Set();
 for(const word of pictureWords.filter(w=>extendedPictureIds.has(w.id))){
  for(const field of ['word','cue','example','parentTip']){
   for(const lang of ['vi','en']){
    const value=word[field][lang];
    assert.ok(value?.trim().length,word.id+' '+field+'.'+lang);
    assert.equal(value.normalize('NFC'),value);
   }
   assert.notEqual(word[field].en,word[field].vi);
  }
  assert.ok(word.example.en.toLowerCase().includes(word.word.en),word.example.en);
  assert.ok(!examples.has(word.example.en));
  examples.add(word.example.en);
  assert.match(littleArt(word.id),new RegExp('picture-garden.svg#'+word.id+'"'));
 }
});

test('Each themed deck is reachable and playable in both recognition games and in memory',()=>{
 const seen=new Set();
 const menu=littlePlayView({words:pictureWords,language:'vi'});
 let offset=0;
 for(const topic of pictureTopics){
  assert.ok(menu.includes('<option value="'+offset+'"'+(offset===0?' selected':'')+'>'+topic.name.vi+'</option>'));
  const redraw=littlePlayView({words:pictureWords,language:'en',topicOffset:offset});
  assert.ok(redraw.includes('<option value="'+offset+'" selected>'+topic.name.en+'</option>'));
  assert.equal(redraw.match(/ selected>/g).length,1);
  for(let start=offset;start<offset+topic.words.length;start+=4){
   for(const mode of ['explore','find','match']){
    let session=createLittleSession(pictureWords,{mode,offset:start});
    for(const id of session.deck){
     seen.add(id);
     if(mode!=='explore'){
      assert.ok(littleOptions(session,pictureWords).some(w=>w.id===id));
      session=littleAction(session,{type:'pick',value:id},pictureWords);
     }
     session=littleAction(session,{type:'next'},pictureWords);
     assert.deepEqual(restoreLittleSession(session,pictureWords),session);
    }
    assert.equal(session.index,session.deck.length);
   }
  }
  const memory=createMemory(pictureWords,offset);
  assert.ok(memory.cards.includes(topic.words[0].id));
  let turned=memory;
  for(const id of new Set(memory.cards)){
   for(const index of memory.cards.keys())if(memory.cards[index]===id)turned=flipMemory(turned,index,pictureWords);
  }
  assert.equal(turned.found.length,3);
  offset+=topic.words.length;
 }
 assert.deepEqual(seen,new Set(pictureWords.map(w=>w.id)));
});

test('All previous saved rounds, including wrapped decks, survive adding topics',()=>{
 for(let offset=0;offset<littleWords.length;offset++){
  for(const mode of ['explore','find','match']){
   const old=createLittleSession(littleWords,{offset,mode});
   let played=littleAction(old,mode==='explore'?{type:'listen'}:{type:'pick',value:old.deck[0]},littleWords);
   played=littleAction(played,{type:'next'},littleWords);
   assert.deepEqual(restoreLittleSession(played,pictureWords),played);
  }
  const memory=flipMemory(createMemory(littleWords,offset),0,littleWords);
  assert.deepEqual(restoreMemory(memory,pictureWords),memory);
 }
});

test('Spoken examples are available in exploration without displaying an answer in a listening round',()=>{
 const offset=pictureWords.findIndex(w=>w.id==='rabbit');
 const explore=createLittleSession(pictureWords,{mode:'explore',offset});
 const html=littlePlayView({words:pictureWords,session:explore,language:'vi'});
 assert.match(html,/data-action="little-sentence"/);
 assert.ok(html.includes(pictureWords[offset].example.vi));
 const find=createLittleSession(pictureWords,{mode:'find',offset});
 const choosing=littlePlayView({words:pictureWords,session:find});
 assert.doesNotMatch(choosing,/data-action="little-sentence"|little-example/);
 const silent=littlePlayView({words:pictureWords,session:find,audioAvailable:false});
 assert.match(silent,/little-audio-help/);
});
