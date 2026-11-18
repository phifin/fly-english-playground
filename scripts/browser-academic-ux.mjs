import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
export async function verifyAcademicUX({newContext,observe,ready,noError,axe,base,directory,check,readImportState}){
 const ctx=await newContext({viewport:{width:1280,height:800},hasTouch:true}),p=await ctx.newPage();observe(p);
 const button=(action,value)=>p.locator(`[data-action="${action}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const click=async(a,v)=>{await button(a,v).click();await ready(p);await noError(p);};
 const shot=async name=>p.screenshot({path:fileURLToPath(new URL('release-academic-'+name+'.png',directory))});
 const skip=async()=>{if(await button('guide-skip').count())await click('guide-skip');};
 const state=async()=>(await p.evaluate(readImportState)).snapshot;
 try{
  await p.goto(base.href);await ready(p);
  assert.equal(await p.locator('main [data-action="import"]').count(),0);
  await click('account');const picker=p.waitForEvent('filechooser');await click('import');assert.equal((await picker).isMultiple(),false);
  await click('start-traveler');await p.locator('#traveler-name').fill('Academic reader');
  await p.locator('[data-form="create-profile"] button[type="submit"]').click();await ready(p);await click('entry-beginner');await skip();
  await click('adventures');await click('adventure-brief','trail');await p.locator('.brief-preview').waitFor();await shot('map-invitation');
  await click('begin');await p.locator('.story-next [data-action="activity"]').click();await ready(p);await skip();
  for(const viewport of [{width:1280,height:800},{width:390,height:700}]){
   await p.setViewportSize(viewport);
   await p.locator('.activity-panel').scrollIntoViewIfNeeded();
   assert.equal(await p.locator('.story-scene').evaluate(el=>getComputedStyle(el).position==='sticky'),false);
   const clear=await p.evaluate(()=>{const h=document.querySelector('.story-scene').getBoundingClientRect(),q=document.querySelector('.activity-panel').getBoundingClientRect();return h.bottom<=q.top+1||h.right<=q.left+1;});
   assert.equal(clear,true,'Story heading and active exercise occupy separate space during scrolling');
  }
  await click('home');await click('adventures');await p.locator('[data-action="adventure-brief"][data-value="invitation"]').waitFor();
  await click('library');await skip();await click('academic');
  await axe('Academic goals on mobile',p);await shot('goals-mobile');
  await click('academic-track','ielts');await click('academic-start','roof-v1');
  const form=p.locator('[data-form="academic-paper"]');
  const answer=async(i,value)=>{const input=form.locator(`[name="q${i}"]`);if(await input.first().getAttribute('type')==='radio'){await form.locator(`[name="q${i}"][value="${value}"]`).check();}else await input.fill(value);};
  await answer(0,'TRUE');await answer(1,'NOT GIVEN');await answer(2,'TRUE');await answer(3,'gravel');await answer(4,'meter');
  await form.locator('button[type="submit"]').click();await ready(p);await p.locator('.academic-review li').first().waitFor();
  assert.equal(await p.locator('.academic-review li').count(),5);assert.match(await p.locator('.academic-heading').innerText(),/4 \/ 5/);
  const records=(await state()).events.filter(e=>e.payload?.experience==='academic-practice-v1');assert.equal(records.length,1);
  await click('academic-track','ielts');await p.locator('.academic-note').waitFor();
  await p.reload();await ready(p);await click('library');await click('academic');await click('academic-track','ielts');await click('academic-record',records[0].id);
  assert.match(await p.locator('.academic-review').innerText(),/old routine/);
  await p.setViewportSize({width:1280,height:800});await shot('answers-desktop');await axe('Saved academic answer review',p);
  await click('academic-track','ielts');await click('academic-home');
  await click('academic-track','toeic');await click('academic-start','training-v1');await p.locator('.academic-reading').waitFor();
  assert.equal(await p.locator('.academic-paper input[type=radio]').count(),20);
  assert.equal(await p.locator('.academic-paper label:has(input[type=radio])').first().evaluate(el=>{const r=el.querySelector('input').getBoundingClientRect(),s=el.querySelector('span').getBoundingClientRect();return r.right<s.left&&Math.abs((r.top+r.bottom)/2-(s.top+s.bottom)/2)<2;}),true,'Each radio sits beside its answer text');await shot('paired-documents');
  await click('academic-track','toeic');await click('academic-home');await click('academic-track','school');await click('academic-start','rewrites-v1');
  for(const [i,word] of ['not until','had the meeting','despite being','sooner had the','no account'].entries())await answer(i,word);
  await form.locator('button[type="submit"]').click();await ready(p);await p.locator('.academic-review').waitFor();assert.ok((await p.locator('.academic-heading').innerText()).includes('5 / 5'));
  await click('library');await click('review');await skip();const tip=p.getByRole('tooltip'),help=p.locator('button.context-help');
  await help.hover();await tip.waitFor();await help.click();await p.mouse.move(0,0);assert.equal(await help.getAttribute('aria-expanded'),'true');
  await p.keyboard.press('Escape');await tip.waitFor({state:'detached'});await help.blur();await help.focus();await tip.waitFor();
  await p.keyboard.press('Escape');await click('guidance-language','vi');
  await p.setViewportSize({width:320,height:640});await help.tap();await tip.waitFor();assert.match(await tip.innerText(),/Câu bạn/);
  const box=await tip.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=321&&box.y+box.height<=641);
  await shot('review-help-vi');await p.locator('h1').tap();await tip.waitFor({state:'detached'});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await click('account');await click('start-traveler');await p.locator('#traveler-name').fill('Another reader');await p.locator('[data-form="create-profile"] [type="submit"]').click();await ready(p);await click('entry-beginner');await skip();
  await click('library');await skip();await click('academic');await click('academic-track','ielts');assert.equal(await p.locator('[data-action="academic-record"]').count(),0,'Another learner cannot see the first learner’s academic results');
  check('Public recovery, first Adventure invitation, scroll boundaries, saved exam results and keyboard, pointer and touch explanations work through normal navigation.');
 }finally{await ctx.close();}
}

