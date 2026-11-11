import test from 'node:test';
import assert from 'node:assert/strict';
import {positionCoach} from '../src/spotlight.js';
import {learningHome} from '../src/learning-home.js';
import {adventureLibrary} from '../src/adventure-library.js';
test('coach stays on screen beside a small target at narrow and wide sizes',()=>{
 for(const width of [320,390,768,1280,1920])for(const top of [20,300,670]){
  const target={left:width-120,top,bottom:top+44},p=positionCoach(target,{height:150},{width,height:740});
  assert.ok(p.left>=12&&p.left+p.width<=width-12);assert.ok(p.top>=12&&p.top+150<=728);
  assert.ok(p.top>=target.bottom||p.top+150<=target.top,'Coach must not cover the highlighted action');
 }
});
test('learning destination exposes direct lessons, review and listening without a story prerequisite',()=>{
 const missions=[{mission:{id:'lesson-1',title:{en:'A simple lesson',vi:'Bài học đầu tiên'},objective:{en:'Read a short note',vi:'Đọc lời nhắn ngắn'}},unlocked:true,complete:false}];
 for(const language of ['en','vi']){
  const html=learningHome({language,level:'A1',missions,due:3});
  for(const action of ['quick-start','review','studio','study-begin','start-placement'])assert.match(html,new RegExp(`data-action="${action}"`));
  assert.doesNotMatch(html,/story-expedition|data-action="begin"|island-art/);assert.match(html,/data-id="lesson-1"/);
 }
});
test('locked lessons stay locked and names cannot inject markup',()=>{
 const html=learningHome({missions:[{mission:{id:'valid',title:{en:'<script>'},objective:{en:'<b>unsafe</b>'}},unlocked:false}]});
 assert.match(html,/data-id="valid" disabled/);assert.doesNotMatch(html,/<script>|<b>unsafe/);assert.match(html,/&lt;script&gt;/);
});
