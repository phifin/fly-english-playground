import test from 'node:test';import assert from 'node:assert/strict';import {guideStep} from '../src/guide-step.js';
test('choice and typing guidance responds to completion without inspecting correctness',()=>{
 assert.equal(guideStep({topic:'choice',answer:null}).id,'choose');
 assert.equal(guideStep({topic:'choice',answer:'any-option'}).id,'check');
 assert.equal(guideStep({topic:'gap',answer:'  '}).id,'type');
 assert.equal(guideStep({topic:'gap',answer:'even a wrong answer'}).id,'check');
 assert.equal(guideStep({topic:'choice',feedback:{correct:false}}).id,'retry');
 assert.equal(guideStep({topic:'writing',feedback:{correct:null}}).id,'continue');
});
test('matching and writing guidance follow the next incomplete interaction',()=>{
 const activity={pairs:[{id:'a'},{id:'b'}],rubric:['one','two']};
 assert.equal(guideStep({topic:'match',activity,answer:{a:'b'}}).id,'pair-1');
 assert.equal(guideStep({topic:'match',activity,answer:{a:'b',b:'a'}}).id,'check');
 assert.equal(guideStep({topic:'writing',activity,answer:{text:'My words',checks:[0]}}).id,'review');
 assert.equal(guideStep({topic:'writing',activity,answer:{text:'My words',checks:[0,1]}}).id,'check');
});
test('games follow selection, listening and first flips without suggesting an answer',()=>{
 assert.equal(guideStep({topic:'workshop'}).id,'pick');
 assert.equal(guideStep({topic:'workshop',workshopSelected:'boat'}).selector,'.workshop-scene');
 assert.equal(guideStep({topic:'picture-find',little:{heard:true}}).selector,'.little-choices');
 assert.equal(guideStep({topic:'memory',memory:{open:[2]}}).selector,'.memory-board');
 assert.equal(guideStep({topic:'order',moved:true}).id,'check');
});
