import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {courseUnits} from '../src/course-bank.js';
import {expressionUnits} from '../src/course-expressions.js';
import {listeningUnits} from '../src/course-listening.js';
import {academicSets} from '../src/academic-content.js';

export async function verifyCurriculum({newContext,observe,ready,noError,axe,base,directory,check,readImportState}){
 async function traveler(name,entry,viewport){
  const ctx=await newContext({viewport,hasTouch:true}),p=await ctx.newPage();observe(p);
  const button=(action,value)=>p.locator('[data-action="'+action+'"]'+(value===undefined?'':'[data-value="'+value+'"]')+':visible').first();
  const go=async(action,value)=>{await button(action,value).click();await ready(p);await noError(p);};
  const skip=async()=>{if(await button('guide-skip').isVisible())await go('guide-skip');};
  const shot=name=>p.screenshot({path:fileURLToPath(new URL('release-curriculum-'+name+'.png',directory))});
  const snapshot=async()=>(await p.evaluate(readImportState)).snapshot;
  await p.goto(base.href);await ready(p);await go('start-traveler');
  await p.locator('#traveler-name').fill(name);
  await p.locator('[data-form="create-profile"] button[value="play"]').click();await ready(p);await go(entry);await skip();
  return {ctx,p,go,button,skip,shot,snapshot};
 }
 const kid=await traveler('Picture explorer','entry-pictures',{width:390,height:844});
 try{
  const {p,go,skip,shot,snapshot,button}=kid;
  const topic=p.locator('[data-little-topic]');
  await topic.selectOption('60');await go('guidance-language','vi');
  assert.equal(await topic.inputValue(),'60','The chosen picture topic survives a localized redraw');
  await go('guidance-language','en');assert.equal(await topic.inputValue(),'60');
  await go('little-start','explore');await skip();
  assert.equal(await p.locator('[data-little-word]').getAttribute('data-little-word'),'drum');
  await p.waitForFunction(()=>document.querySelector('.little-big-picture use')?.getBBox().width>40);
  assert.match(await p.locator('.little-example').innerText(),/I tap the drum/);
  await shot('new-toys');await go('little-next');
  assert.equal(await p.locator('[data-little-word]').getAttribute('data-little-word'),'doll');
  await go('little-menu');await topic.selectOption('12');await go('little-start','match');await skip();
  for(const id of ['rabbit','frog','turtle','duck']){
   await p.locator('[data-little-word="'+id+'"]').waitFor();const pick=button('little-pick',id);
   const box=await pick.boundingBox();assert.ok(box.width>=44&&box.height>=44);
   await pick.tap();await ready(p);await p.locator('.little-feedback.is-success').waitFor();await go('little-next');
  }
  await p.locator('[data-little-complete="true"]').waitFor();
  assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt'||e.kind==='placement').length,0);
  await go('little-menu');await topic.selectOption('52');await go('memory-open');
  assert.equal(await p.locator('[data-action="memory-flip"]').count(),6);
  check('A new picture learner reached three new topics, saw the loaded sprite and completed a four-picture matching round on touch.');
 }finally{await kid.ctx.close();}

 const adult=await traveler('Curriculum reader','entry-beginner',{width:1280,height:800});
 try{
  const {p,go,skip,shot,snapshot,button}=adult;
  async function fill(form,items,prefix,wrong=false){
   for(const [i,item] of items.entries()){
    const controls=form.locator('[name="'+prefix+i+'"]');
    const value=wrong&&i===0?(item.options?.find(v=>!item.keys.includes(v))??'another answer'):item.keys[0];
    if(item.options){const index=item.options.indexOf(value);assert.ok(index>=0);await controls.nth(index).check();}
    else await controls.fill(value);
   }
  }
  async function submit(form,count){
   await form.locator('button[type="submit"],button.primary:not([type="button"])').first().click();
   await ready(p);await noError(p);await p.locator('.academic-review li').first().waitFor();
   assert.equal(await p.locator('.academic-review li').count(),count);
  }
  await go('library');await skip();await go('course');
  const courseForm=p.locator('[data-form="course-paper"]');
  for(const id of ['course-a1-introductions-v1','course-b1-lost-property-v1','course-c2-endorsement-v1','expressions-limits-v1']){
   const u=[...courseUnits,...expressionUnits].find(x=>x.id===id);assert.ok(u);
   if(u.kind==='expressions'){
    assert.ok(u.items.some(q=>q.options)&&u.items.some(q=>!q.options),'Expression review includes both selecting and producing language');
   }
   await go('course-band',u.level);await go('course-unit',id);assert.match(await p.locator('.course-examples').innerText(),/\S/);
   await go('course-practise');const retry=u.level==='A1';if(retry)await go('course-help');
   await fill(courseForm,u.items,'course-',retry);await submit(courseForm,u.items.length);
   if(retry){
    assert.equal((await snapshot()).events.filter(e=>e.payload?.unit===id).at(-1).payload.supported,true);
    await go('course-retry',id);assert.equal(await courseForm.locator('fieldset').count(),1);
    await fill(courseForm,[u.items[0]],'course-');await submit(courseForm,1);
   }
   await go('course-home');
  }
  await go('course-words');const search=p.locator('[data-form="word-search"]');
  await search.locator('[name="query"]').fill('rabbit');await search.locator('button').click();
  await p.waitForFunction(()=>Array.from(document.querySelectorAll('.course-words dt')).some(x=>x.textContent.toLowerCase().startsWith('rabbit')));
  await go('course-home');await go('course-listening');
  const listening=listeningUnits.find(u=>u.id==='listen-voices-a1-v1');
  await go('course-unit',listening.id);await go('course-practise');
  const audio=p.locator('[data-course-clip]').first();assert.equal(await audio.getAttribute('preload'),'none');
  await audio.evaluate(a=>a.play());await p.waitForFunction(()=>{const a=document.querySelector('[data-course-clip]');return a?.currentTime>0&&a.duration>0;});
  await audio.evaluate(a=>a.pause());await go('course-transcript');
  const firstClip=p.locator('.course-voice:has(audio[data-course-clip="0"])');
  assert.equal(await firstClip.locator('p[lang="en"]').innerText(),listening.items[0].clip.script);
  await fill(courseForm,listening.items,'course-');await submit(courseForm,listening.items.length);
  assert.equal((await snapshot()).events.filter(e=>e.payload?.unit===listening.id).at(-1).payload.supported,true);
  check('A1, B1 and C2 learners completed course practice, used support, reviewed a mistake, searched the reading reference and played a published recording.');

  await go('library');await skip();await go('academic');
  for(const [track,id,timed] of [['ielts','canal-tiles-check-v1',true],['toeic','office-sentences-v1'],['toefl','campus-notices-v1'],['school','school-precision-v1']]){
   const set=academicSets.find(s=>s.id===id);assert.equal(set?.track,track);
   await go('academic-track',track);await go(timed?'academic-timed':'academic-start',id);
   const form=p.locator('[data-form="academic-paper"]');
   assert.equal(await form.locator('fieldset').count(),set.items.length);
   assert.equal(await form.locator('[data-action="practice-help"],[data-action="course-help"]').count(),0);
   if(timed)await shot('timed-reading');
   await fill(form,set.items,'q',true);await submit(form,set.items.length);
   const record=(await snapshot()).events.filter(e=>e.payload?.setId===id).at(-1);assert.ok(record);
   if(timed)assert.ok(Number.isSafeInteger(record.payload.elapsedMs)&&record.payload.elapsedMs>=0,'The timed checkpoint records elapsed time');
   await go('academic-track',track);await go('academic-record',record.id);
   assert.ok((await p.locator('.academic-heading').innerText()).includes((set.items.length-1)+' / '+set.items.length));
   await go('academic-track',track);await go('academic-home');
  }
  await p.setViewportSize({width:390,height:844});await shot('exam-tracks-mobile');await axe('Four production exam tracks on mobile',p);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await p.reload();await ready(p);await go('library');await skip();await go('academic');await go('academic-track','toefl');
  assert.equal(await button('academic-record').count(),1);
  check('Four new exam papers were completed and reviewed, including a longer timed checkpoint and a saved TOEFL attempt after reload.');
 }finally{await adult.ctx.close();}
}
