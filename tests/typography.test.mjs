import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {studioView} from '../src/studio-view.js';

// Encoding and normalization checks catch corrupt source text; browser glyph
// shaping, font fallback, and external translation still need visual inspection.
test('shipped interface and learning text are valid UTF-8 with canonical Unicode composition',async()=>{
 const roots=['src/','data/published/'];
 const files=['index.html','observatory.html'];
 for(const root of roots){
  for(const name of await readdir(new URL('../'+root,import.meta.url),{recursive:true})){
   if(/\.(?:js|json)$/.test(name))files.push(root+name);
  }
 }
 for(const name of files){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(await readFile(new URL('../'+name.replaceAll('\\','/'),import.meta.url)));
  assert.equal(text===text.normalize('NFC'),true,`${name}: unexpected decomposed text`);
  assert.equal(text.includes('\ufffd'),false,`${name}: Unicode replacement character`);
 }
});

const missions=[{level:'A1',title:{en:'A little harbor',vi:'Bến cảng nhỏ'},activities:[{id:'reading-01',skill:'reading',context:'A boat waits by the tree.',prompt:'Where is the boat?'}]}];
test('studio keeps voice privacy visible and assessment limits available without blocking play',()=>{
 for(const language of ['en','vi']){
  const html=studioView({missions,level:'A1',language});
  assert.match(html,language==='en'?/No microphone or recording/:/Không dùng micro hay thu âm/);
  assert.match(html,/<details class="studio-help"><summary>/);
  assert.match(html,language==='en'?/ungraded practice/:/luyện tập không chấm điểm/);
  assert.match(html,/<p lang="en" translate="no">A boat waits by the tree\.<\/p>/);
  assert.doesNotMatch(html,/field recording|standardized listening test/);
  assert.equal(html,html.normalize('NFC'));
 }
});

test('studio recovers from a band without passages instead of rendering broken playback',()=>{
 for(const language of ['en','vi']){
  const html=studioView({missions:[],level:'A1',language});
  assert.doesNotMatch(html,/studio-listen|undefined/);
  assert.match(html,language==='en'?/Choose another level/:/chọn mức khác/);
 }
});
