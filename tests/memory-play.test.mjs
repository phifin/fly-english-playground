import test from 'node:test';import assert from 'node:assert/strict';
import {createMemory,restoreMemory,flipMemory,memoryView} from '../src/memory-play.js';
import {littleWords} from '../src/little-content.js';
test('pairs require two different cards and remain stable across saved turns',()=>{
 let s=createMemory(littleWords);const initial=structuredClone(s);s=flipMemory(s,0,littleWords);s=flipMemory(s,0,littleWords);assert.equal(s.turns,0);s=flipMemory(s,1,littleWords);assert.equal(s.turns,1);assert.equal(s.found.length,0);assert.deepEqual(restoreMemory(s,littleWords),s);s=flipMemory(s,0,littleWords); // same open card is ignored
 s=flipMemory(s,4,littleWords);assert.deepEqual(s.open,[4]);s=flipMemory(s,0,littleWords);assert.equal(s.found.length,1);assert.deepEqual(initial,createMemory(littleWords));
 for(const pair of [[1,3],[2,5]])for(const i of pair)s=flipMemory(s,i,littleWords);
 assert.equal(s.found.length,3);assert.deepEqual(flipMemory(s,1,littleWords),s);
});
test('malformed memory snapshots cannot fabricate invalid cards or matched open states',()=>{
 const s=createMemory(littleWords);for(const bad of [{...s,cards:['fake']},{...s,found:[s.cards[0]],turns:0},{...s,open:[0,4]},{...s,open:[6]},{...s,offset:-1}])assert.equal(restoreMemory(bad,littleWords),null);
});
test('concealed cards do not expose words in accessible names; bilingual layouts retain semantic buttons',()=>{
 const s=createMemory(littleWords);for(const language of ['en','vi']){const html=memoryView({session:s,words:littleWords,language});assert.equal((html.match(/data-action="memory-flip"/g)||[]).length,6);assert.doesNotMatch(html,/aria-label="cat/);assert.equal(html,html.normalize('NFC'));}
});
