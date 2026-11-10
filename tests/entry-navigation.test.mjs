import test from 'node:test';
import assert from 'node:assert/strict';
import {learningDestination,readingActionBlocked,establishLearningStart} from '../src/entry-navigation.js';
import {firstStepsView,guideView} from '../src/first-steps-view.js';

test('new and picture-only learners cannot bypass starting setup through assessed routes or actions',()=>{
 const unset={established:false,readerReady:false},pictures={established:true,readerReady:false},reader={established:true,readerReady:true};
 for(const screen of ['home','library','review','mission','quick','studio','workshop','little'])assert.equal(learningDestination(screen,unset),'entry');
 for(const screen of ['library','review','mission','quick','studio'])assert.equal(learningDestination(screen,pictures),'entry');
 for(const screen of ['home','workshop','little','pictures','memory'])assert.equal(learningDestination(screen,pictures),screen);
 for(const screen of ['account','settings','family','profiles','placement'])assert.equal(learningDestination(screen,unset),screen);
 for(const action of ['quick-start','begin','submit','review-item','reveal','ready']){assert.equal(readingActionBlocked(action,pictures),true);assert.equal(readingActionBlocked(action,reader),false);}
 assert.equal(readingActionBlocked('little-start',pictures),false);
});

test('explicit setup writes profile before receipt; failures never claim a saved start',async()=>{
 const calls=[];
 await establishLearningStart({path:'reader',level:'B2',updateProfile:async p=>calls.push(['profile',p]),append:async(k,p)=>calls.push([k,p])});
 assert.deepEqual(calls,[['profile',{journey:{onboarded:true,region:'B2'}}],['mission',{experience:'learning-entry-v1',version:1,path:'reader',level:'B2'}]]);
 let appended=false;
 await assert.rejects(establishLearningStart({path:'reader',level:'A1',updateProfile:async()=>{throw Error('disk full');},append:async()=>{appended=true;}}),/disk full/);
 assert.equal(appended,false);
 calls.length=0;
 await establishLearningStart({path:'supported-pictures',updateProfile:async p=>calls.push(p),append:async(_,p)=>calls.push(p)});
 assert.equal(calls[0].journey.region,undefined,'Picture pathway does not assert a reading range');
 assert.equal(calls[1].level,null);
 await assert.rejects(establishLearningStart({path:'reader',level:'wrong',updateProfile:async()=>assert.fail(),append:async()=>assert.fail()}),/Invalid/);
});

test('focused bilingual setup has explicit choices, plain range descriptions and no silent skip',()=>{
 for(const language of ['en','vi']){
  const html=firstStepsView({language});
  for(const action of ['entry-beginner','placement-begin','entry-manual','entry-pictures'])assert.ok(html.includes(`data-action="${action}"`));
  assert.ok(!html.includes('data-action="home"'));
  const manual=firstStepsView({language,manual:true});
  assert.equal((manual.match(/data-action="placement-manual"/g)||[]).length,6);
  assert.ok(guideView({topic:'order',language}).includes(language==='en'?'arrows':'mũi tên'));
 }
 assert.ok(firstStepsView({revisit:true}).includes('data-action="home"'));
 const kids=firstStepsView({mode:'kids'});
 assert.ok(kids.indexOf('data-action="entry-pictures"')<kids.indexOf('data-action="entry-beginner"'),'Picture entry is prominent for Kids, not automatically selected');
 assert.ok(kids.includes('data-action="placement-begin"'),'Kids readers can still choose placement');
});
