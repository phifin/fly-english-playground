import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {applyPracticeEdition} from '../src/practice-edition.js';
import {practiceEditionFile} from '../src/practice-release.js';
export async function verifyFirstSteps({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const context=await newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();observe(page);
 const button=(name,value)=>page.locator(`[data-action="${name}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const play=async(name,value)=>{await button(name,value).click();await ready(page);await noError(page);};
 const snapshot=async()=>(await page.evaluate(readImportState)).snapshot;
 try{
  await page.goto(base.href);await ready(page);await play('guidance-language','vi');await play('start-traveler');
  await page.locator('#traveler-name').fill('Người mới');await page.locator('[data-form="create-profile"] button[value="play"]').click();await ready(page);
  await page.locator('[data-level-setup]').waitFor();assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt').length,0);
  await page.reload();await ready(page);await page.locator('[data-level-setup]').waitFor();
  assert.equal(await page.locator('[data-action="quick-start"]').count(),0,'No assessed shortcut before a starting choice');
  await play('entry-beginner');await page.locator('[data-home-recommended]').waitFor();
  let saved=await snapshot();assert.equal(saved.events.filter(e=>e.payload?.experience==='learning-entry-v1').at(-1).payload.level,'A1');
  const homeGuide=page.locator('[data-guide-topic="home"]');await homeGuide.waitFor();
  await play('guide-skip','home');await page.reload();await ready(page);
  assert.equal(await page.locator('[data-guide-topic="home"]').count(),0,'Skipped home guidance remains skipped after reload');
  await page.locator('[data-home-recommended]').click();await ready(page);await noError(page);
  await page.locator('.activity-panel').waitFor();
  const activityId=await page.locator('[data-quick-activity]').getAttribute('data-quick-activity');
  let support=null;
  if(practiceEditionFile){
  assert.equal(await page.locator('.practice-help').count(),1,'Beginner practice includes contextual support');
  const beforeMenu=(await snapshot()).events.filter(e=>e.kind==='support').length;
  await play('practice-help');
  const menuReceipts=(await snapshot()).events.filter(e=>e.kind==='support');
  assert.equal(menuReceipts.length,beforeMenu+1,'A curated vocabulary menu is assistance even before a definition is selected');
  assert.equal(menuReceipts.at(-1).payload.reason,'vocabulary-menu');
  assert.equal(await page.locator('.word-meaning').count(),0,'Opening vocabulary choices does not reveal answers');
  const before=(await snapshot()).events.filter(e=>e.kind==='support').length;
  await button('practice-word','0').focus();await page.keyboard.press('Enter');await ready(page);await noError(page);await page.locator('.word-meaning').waitFor();
  assert.equal(await button('practice-word','0').getAttribute('aria-pressed'),'true');
  saved=await snapshot();assert.equal(saved.events.filter(e=>e.kind==='support').length,before+1,'Visible meaning has a persisted support receipt');
  support=saved.events.filter(e=>e.kind==='support').at(-1);assert.match(support.payload.reason,/vocabulary/);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Contextual support fits the viewport');
   const targets=await page.locator('.word-buttons button').evaluateAll(buttons=>buttons.map(b=>b.getBoundingClientRect().height));
   assert.ok(targets.length>0&&targets.every(height=>height>=44),'Word and hint buttons keep usable touch targets');
   await page.screenshot({path:fileURLToPath(new URL(`release-contextual-vocabulary-vi-${width}.png`,directory)),fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});await axe('Vietnamese assisted beginner practice',page);
  await page.reload();await ready(page);await page.locator('[data-home-recommended]').click();await ready(page);
  saved=await snapshot();assert.ok(saved.events.some(e=>e.id===support.id),'Assistance survives reload and resume');
  }else assert.equal(await page.locator('.practice-help').count(),0,'Unaccepted assistance must not appear in the preview');
  assert.equal(await page.locator('[data-level-setup]').count(),0,'Established learner does not repeat setup');
  const original=JSON.parse(await readFile(new URL('../data/published/atlas.json',import.meta.url),'utf8'));
  const pack=practiceEditionFile?applyPracticeEdition(original,JSON.parse(await readFile(new URL('../data/published/'+practiceEditionFile,import.meta.url),'utf8'))):original;
  const activity=pack.missions.flatMap(m=>m.activities).find(a=>a.id===activityId);
  assert.equal(activity.type,'choice','The first short-session task starts with one visible choice');
  await play('choose',activity.answer);await play('submit');
  saved=await snapshot();const attempt=saved.events.filter(e=>e.kind==='attempt'&&e.payload.activityId===activityId).at(-1);
  assert.ok(attempt);if(support)assert.equal(attempt.payload.supported,true,'Reload cannot turn a looked-up answer into independent mastery');
  await page.locator('.feedback').waitFor();await page.screenshot({path:fileURLToPath(new URL('release-first-response-vi.png',directory)),fullPage:true});
  if(practiceEditionFile){
   // A lookup before answering is assisted evidence; a lookup afterwards must
   // preserve both the saved answer and the feedback about that answer.
   await play('next');
   const nextId=await page.locator('[data-quick-activity]').getAttribute('data-quick-activity');
   const next=pack.missions.flatMap(m=>m.activities).find(a=>a.id===nextId);
   assert.equal(next.type,'gap','The opening session introduces a different response mechanic');
   await page.locator('[data-answer="gap"]').fill(next.accepted[0]);await play('submit');
   const independent=(await snapshot()).events.filter(e=>e.kind==='attempt'&&e.payload.activityId===nextId).at(-1);
   assert.equal(independent.payload.supported,false);
   await play('practice-help');await play('practice-word','0');await page.locator('.word-meaning').waitFor();
   assert.deepEqual((await snapshot()).events.find(e=>e.id===independent.id),independent,'Reviewing vocabulary must not rewrite a submitted attempt');
   assert.doesNotMatch(await page.locator('.feedback').innerText(),/You used help for this answer|Bạn đã dùng gợi ý cho câu này/,'Post-response help must not relabel independent feedback');
   assert.match(await page.locator('.practice-help small').innerText(),/Câu trả lời đã nộp vẫn được giữ nguyên/);
  }
  await play('home');await play('start-placement');await play('placement-begin');
  await page.locator('[data-placement-item]').waitFor();
  assert.equal(await page.locator('.practice-help,.word-meaning,[data-action="practice-hint"]').count(),0,'Placement never exposes practice assistance');
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);}
  report.firstSteps={blockingStart:true,guideSkipRemembered:true,supportReceiptBeforeReveal:support?true:null,supportStatus:practiceEditionFile?'verified':'pending-content-review',placementHelpAbsent:true,activityId};
  check('Focused starting-level setup survives reload; explicit beginner choice unlocks guided practice; placement never exposes help. Vocabulary verification status is recorded separately.');
 }catch(error){
  report.firstStepsFailure={message:error.message,screen:await page.locator('#app').innerText().catch(()=>'')};
  await page.screenshot({path:fileURLToPath(new URL('release-first-steps-failure.png',directory)),fullPage:true}).catch(()=>{});throw error;
 }finally{await context.close();}
}
