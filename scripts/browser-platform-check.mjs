import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {deriveCurriculum,indexCurriculum} from '../src/curriculum.js';

/** Normal browser interactions in a fresh disposable learner; no writes through test adapters. */
export async function verifyPlatform({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const candidate=process.env.ATLAS_PLATFORM_CANDIDATE==='true';
 const batch=JSON.parse(await readFile(new URL(candidate?'../data/staging/platform-foundation-v1.json':'../data/published/platform.json',import.meta.url),'utf8'));
 if(candidate)report.limitations.push('Platform content is an UNACCEPTED staging candidate. Browser checks verify mechanics only; this run must not deploy.');
 const index=indexCurriculum(batch),context=await newContext({viewport:{width:390,height:844}}),page=await context.newPage();observe(page);
 const control=(name,value)=>page.locator(`[data-action="${name}"]${value?`[data-value="${value}"]`:''}:visible`).first();
 const play=async(name,value)=>{await ready(page);await control(name,value).click();await ready(page);await noError(page);};
 const snapshot=async()=>(await page.evaluate(readImportState)).snapshot;
 const p=async()=>deriveCurriculum((await snapshot()).events,batch);
 const choose=async a=>{
  if(a.type==='choice')await play('learn-choose',a.answer);
  else if(a.type==='gap')await page.locator('[data-learn-answer]').fill(a.accepted[0]);
  else if(a.type==='order'){await play('learn-order-clear');for(const id of a.answer)await play('learn-order',id);}
  else throw Error('Unsupported platform check type '+a.type);
 };
 const finish=async({exam=false}={})=>{
  let count=0;
  while(!await page.locator('[data-learning-complete]').count()){
   assert.ok(count++<31,'Finite session must finish');
   const id=await page.locator('[data-learning-activity]').getAttribute('data-learning-activity'),a=index.activities.get(id);assert.ok(a);
   await choose(a);await play('learn-submit');
   if(!exam){await page.locator('.learn-feedback.is-correct').waitFor();await play('learn-next');}
   else assert.equal(await page.locator('.learn-feedback').count(),0,'Exam feedback stays hidden until the set ends');
  }
 };
 try{
  await page.goto(base.href);await ready(page);await play('start-traveler');
  await page.locator('#traveler-name').fill('Learning foundation CI');
  await page.locator('[data-form="create-profile"] button[type="submit"][value="play"]').click();await ready(page);
  await page.locator('.experience-home').waitFor();await play('learn-hub');
  for(const language of ['en','vi']){
   await play('guidance-language',language);await page.setViewportSize({width:320,height:740});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Learning hub fits a narrow phone');
   assert.equal(await page.locator('.learn-course-card').count(),4);
   await axe(`${language} learning hub at 320px`,page);
   await page.screenshot({path:fileURLToPath(new URL(`release-learning-${language}-320.png`,directory)),fullPage:true});
  }
  await play('guidance-language','en');
  const objective=batch.objectives.find(o=>o.level==='A1'&&o.domain==='communication');
  await play('learn-lesson',objective.id);assert.equal(await page.locator('.learn-teaching-point').count(),2);
  await play('learn-start',objective.id);
  await control('learn-submit').click();await ready(page);assert.equal(await page.locator('.alert.error').count(),1,'Incomplete responses provide a recoverable error');
  await play('dismiss-error');
  const firstId=await page.locator('[data-learning-activity]').getAttribute('data-learning-activity');await choose(index.activities.get(firstId));
  await play('home');await page.reload();await ready(page);await play('learn-hub');
  const unfinished=Object.values((await p()).sessions).find(s=>!s.finished);assert.ok(unfinished);
  await play('learn-resume',unfinished.snapshot.id);
  const first=index.activities.get(firstId);
  if(first.type==='choice')assert.equal(await control('learn-choose',first.answer).getAttribute('aria-pressed'),'true');
  await finish();assert.equal((await p()).sessions[unfinished.snapshot.id].correct,2);
  await play('learn-hub');await play('learn-lesson',objective.id);await play('learn-words',objective.id);
  const beforeWords=(await snapshot()).events.filter(e=>e.kind==='attempt').length;
  await play('learn-word-flip');await page.locator('.learn-word-reveal').waitFor();await play('learn-word-next');
  assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt').length,beforeWords,'Flashcards are exposure, not assessed responses');
  check('Taught lesson, choice/order practice, recoverable incomplete response, saved draft/reload, and vocabulary exposure work without changing proficiency.');

  await play('learn-hub');await play('learn-report');await play('learn-check');await finish();
  const checkRound=Object.values((await p()).sessions).find(s=>s.snapshot.kind==='check');assert.ok(checkRound.complete);
  assert.ok(checkRound.snapshot.activityIds.every(id=>index.activities.get(id).purpose==='check'));
  await play('learn-hub');await play('learn-exams');await axe('Short exam practice choices at 320px',page);
  const exam=batch.examSets.find(s=>s.exam==='ielts-academic');await play('learn-exam-timed',exam.id);
  const examRound=Object.values((await p()).sessions).find(s=>s.snapshot.kind==='exam');assert.ok(examRound.deadline);
  const firstExam=index.activities.get(examRound.snapshot.activityIds[0]);await choose(firstExam);await play('learn-submit');
  assert.equal(await page.locator('.learn-feedback,.learn-answer-review').count(),0);
  await play('home');await page.reload();await ready(page);await play('learn-hub');await play('learn-resume',examRound.snapshot.id);
  assert.equal((await p()).sessions[examRound.snapshot.id].deadline,examRound.deadline,'Reload keeps the original time budget');
  await finish({exam:true});assert.equal((await p()).sessions[examRound.snapshot.id].correct,8);
  assert.match(await page.locator('.learn-session-result').innerText(),/not an official exam score/);
  await page.locator('.learn-result-item summary').first().click();assert.match(await page.locator('.learn-result-item').first().innerText(),/Your response:/);
  await axe('Exam results and response review at 320px',page);
  await page.screenshot({path:fileURLToPath(new URL('release-learning-exam-320.png',directory)),fullPage:true});
  check('Progress checks use checkpoint items; timed exam practice resumes its original deadline, withholds keys, and reviews actual saved responses with raw scores only.');

  await play('learn-hub');await play('learn-listening');await play('learn-listen-start',batch.listening[0].id);
  const listeningRound=Object.values((await p()).sessions).find(s=>s.snapshot.kind==='listening');
  const listenItem=index.activities.get(listeningRound.snapshot.activityIds[0]);await choose(listenItem);
  await control('learn-submit').click();await ready(page);assert.equal(await page.locator('.alert.error').count(),1,'Silent listening response requires playback or explicit reading support');
  await play('dismiss-error');await play('learn-transcript');await page.locator('.learn-transcript').waitFor();
  await finish();assert.equal((await p()).sessions[listeningRound.snapshot.id].supported,2);
  check('Listening fallback explicitly records transcript-supported responses; no silent playback is assumed.');

  await play('learn-hub');await play('learn-goals');await page.locator('#learn-goal').selectOption('3');await play('learn-save-goals');
  assert.equal((await p()).preferences.goal,3);await play('guidance-language','vi');await axe('Vietnamese study goals and calendar export at 320px',page);
  const downloading=page.waitForEvent('download');await play('learn-calendar');const downloaded=await downloading;
  const calendar=await readFile(await downloaded.path(),'utf8');assert.match(calendar,/BEGIN:VCALENDAR/);assert.match(calendar,/RRULE:FREQ=WEEKLY/);assert.ok(calendar.includes('?learn=today'));
  await page.screenshot({path:fileURLToPath(new URL('release-learning-goals-vi-320.png',directory)),fullPage:true});
  const retained=(await snapshot()).events.filter(e=>e.kind==='attempt').length;
  await play('home');await play('mode','kids');await play('learn-hub');assert.equal(await page.locator('.learn-young [data-action="little-open"]').count(),1);
  await play('home');await play('mode','serious');await play('learn-hub');
  assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt').length,retained);
  await page.goto(new URL('?learn=today',base).href);await ready(page);await page.locator('[data-learning-page="hub"]').waitFor();
  assert.equal((await p()).preferences.goal,3);
  check('Study goals, Vietnamese calendar download, Today deep link, and experience-mode changes preserve responses and learner preferences.');
  report.learningPlatform={objectives:batch.objectives.length,lexicalTargets:index.lexicon.size,lessonResponses:2,checkpointResponses:checkRound.total,examResponses:8,transcriptSupported:2,calendarExport:true,widths:[320,390]};
 }catch(error){
  await page.screenshot({path:fileURLToPath(new URL('release-platform-failure.png',directory)),fullPage:true}).catch(()=>{});
  throw error;
 }finally{await context.close();}
}
