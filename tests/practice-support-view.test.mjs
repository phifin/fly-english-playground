import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceSupportView} from '../src/practice-support-view.js';
import {homeView} from '../src/home-view.js';
import {firstStepsView} from '../src/first-steps-view.js';
const support={terms:[{text:'next to',meaning:{en:'Beside something.',vi:'Ở bên cạnh.'},example:{en:'My bag is next to the chair.',vi:'Túi của tôi ở cạnh ghế.'}}],hint:{en:'Look for one place.',vi:'Tìm một vị trí.'}};
test('closed assistance never leaks definitions or hints into the DOM',()=>{
 for(const open of [false,true]){const html=practiceSupportView({support,open});assert.ok(!html.includes('Beside something.'));assert.ok(!html.includes('Look for one place.'));}
 assert.equal(practiceSupportView({}), '');
});
test('only the explicitly selected assistance is revealed and explains supported evidence',()=>{
 const html=practiceSupportView({support,open:true,index:0,language:'vi'});
 assert.match(html,/Ở bên cạnh/);assert.match(html,/có hỗ trợ/);assert.ok(!html.includes('Tìm một vị trí.'));
 assert.match(practiceSupportView({support,open:true,hint:true}),/Look for one place/);
 const dangerous=structuredClone(support);dangerous.terms[0].meaning.en='<img onerror="bad">';
 assert.ok(!practiceSupportView({support:dangerous,open:true,index:0}).includes('<img'));
});
test('first action matches reading readiness independently of mode',()=>{
 for(const mode of ['kids','balanced','serious'])for(const ready of [false,true]){
  const html=homeView({mode,readerReady:ready,name:'<unsafe>'});
  assert.match(html,new RegExp(`data-home-recommended data-action="${ready?'quick-start':'little-open'}"`));
  assert.ok(!html.includes('<unsafe>'));assert.equal((html.match(/class="primary"/g)||[]).length,1);
 }
});
test('focused initial setup offers an explicit choice without an arbitrary continue',()=>{
 for(const language of ['en','vi']){
  const html=firstStepsView({language});for(const action of ['entry-beginner','entry-manual','entry-pictures','placement-begin'])assert.ok(html.includes(`data-action="${action}"`));
  assert.ok(!html.includes('data-action="home"'));assert.ok(!html.includes('data-action="atlas"'));
 }
});
