import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
/** Observable layout contracts plus screenshots for human visual review. */
export async function verifyLayout({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const context=await newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();observe(page);
 const control=(name,value)=>page.locator(`[data-action="${name}"]${value?`[data-value="${value}"]`:''}:visible`).first();
 const play=async(name,value)=>{await control(name,value).click();await ready(page);await noError(page);};
 const snapshot=async()=>(await page.evaluate(readImportState)).snapshot;
 const shots=[],bounds=[];
 const shot=async(name)=>{await page.screenshot({path:fileURLToPath(new URL(`release-layout-${name}.png`,directory))});shots.push(name);};
 const fits=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal document overflow');
 const visibleAction=async(selector,label)=>{const b=await page.locator(selector).first().boundingBox(),v=page.viewportSize();assert.ok(b&&b.y>=0&&b.y+b.height<=v.height,`${label} must fit the initial viewport: ${JSON.stringify(b)}`);bounds.push({label,viewport:v,bounds:b});};
 const dismissGuide=async()=>{const b=page.locator('.coach-popover [data-action="guide-skip"]');if(await b.count()){await b.click();await ready(page);}};
 try{
  await page.goto(base.href);await ready(page);await play('guidance-language','vi');await shot('landing-vi-mobile');
  await play('start-traveler');await visibleAction('[data-form="create-profile"] button[value="play"]','Guest entry');
  await page.locator('#traveler-name').fill('Minh');await page.locator('[data-form="create-profile"] button[value="play"]').click();await ready(page);
  await page.locator('[data-level-setup]').waitFor();await play('entry-beginner');await page.locator('.coach-popover').waitFor();
  async function coachContract(){
   // Read the paired rectangles in one browser task. Account restoration can
   // redraw the whole app between two separate locator.boundingBox calls.
   const handle=await page.waitForFunction(()=>{
    const target=document.querySelector('[data-guide-target]'),bubble=document.querySelector('.coach-popover');
    if(!target||!bubble||bubble.hidden||!target.getClientRects().length)return false;
    const t=target.getBoundingClientRect().toJSON(),b=bubble.getBoundingClientRect().toJSON();
    if(b.bottom>innerHeight+1||b.right>innerWidth+1)return false;
    return {t,b};
   });
   const {t,b}=await handle.jsonValue();await handle.dispose();const v=page.viewportSize();
   assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,'Coach fits the screen');
   assert.ok(b.y+b.height<=t.y+1||b.y>=t.y+t.height-1||b.x+b.width<=t.x||b.x>=t.x+t.width,'Guide does not cover its action');
   assert.equal(await page.locator('.coach-shade').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  }
  await coachContract();await shot('home-coach-vi-mobile');
  await page.setViewportSize({width:768,height:1024});await coachContract();await shot('home-coach-vi-tablet');
  await control('guide-skip','home').focus();await page.keyboard.press('Escape');await ready(page);
  assert.equal(await page.locator('.coach-popover').count(),0,'Escape dismisses guidance');
  await page.reload();await ready(page);assert.equal(await page.locator('.coach-popover').count(),0,'Dismissal persists');
  await play('guide-replay','home');await coachContract();await dismissGuide();
  // Each destination is reached from the real header; never inject screen state.
  for(const language of ['en','vi'])for(const viewport of [{width:320,height:740},{width:390,height:844},{width:768,height:1024},{width:1280,height:800},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);await play('guidance-language',language);
   await play('home');await dismissGuide();await visibleAction('[data-home-recommended]',`Home ${language} ${viewport.width}`);await fits();await shot(`home-${language}-${viewport.width}`);
   await play('library');await dismissGuide();await page.locator('[data-learning-home]').waitFor();
   assert.equal(await page.locator('.story-expedition,.adventure-library').count(),0);
   await visibleAction('.learning-actions .primary',`Learning ${language} ${viewport.width}`);await fits();await shot(`learning-${language}-${viewport.width}`);
   await play('journal');await dismissGuide();await visibleAction('.stats-grid',`Progress ${language} ${viewport.width}`);await fits();
   assert.equal(await page.locator('.creative-history').evaluate(el=>el.open),false,'Creations never lead the learning report');await shot(`progress-${language}-${viewport.width}`);
   await play('home');await play('adventures');await dismissGuide();await visibleAction('.adventure-primary',`Stories ${language} ${viewport.width}`);await fits();await shot(`stories-${language}-${viewport.width}`);
  }
  await page.setViewportSize({width:390,height:844});await play('library');
  const before=await snapshot(),mode=before.profiles[0].settings.mode;
  await play('study-begin');await page.locator('.study-session .activity-prompt').waitFor();
  assert.equal(await page.locator('.story-expedition').count(),0,'Lesson does not route into adventure');
  assert.equal((await snapshot()).profiles[0].settings.mode,mode,'Focused lesson preserves experience preference');
  await coachContract();await shot('direct-lesson-coach-vi-mobile');await dismissGuide();await shot('direct-lesson-vi-mobile');await axe('Direct lesson mobile',page);
  await play('home');await play('adventures');await play('begin');await visibleAction('.story-next .primary','Adventure immediate action');
  await shot('story-first-action-vi-mobile');await play('activity');await page.locator('.activity-panel').waitFor();await dismissGuide();await fits();await shot('story-response-vi-mobile');
  await play('journal');await axe('Compact learning progress mobile',page);
  await page.setViewportSize({width:1280,height:800});await play('library');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');await fits();await shot('learning-vi-text-200');
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  // Native family controls remain available when adding another learner.
  await play('account');await play('profiles');await play('start-traveler');
  const form=page.locator('[data-form="create-profile"]');await form.locator('.family-options > summary').click();await ready(page);
  const kind=form.locator('[name="kind"]');await kind.focus();
  const appearance=await kind.evaluate(el=>{const s=getComputedStyle(el);return {height:el.getBoundingClientRect().height,padding:parseFloat(s.paddingRight),focus:s.outlineStyle!=='none'||s.boxShadow!=='none'};});
  assert.ok(appearance.height>=44&&appearance.padding>=24&&appearance.focus,'Native selector retains breathing room, touch size and focus');
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));await ready(page);assert.equal(await kind.evaluate(el=>el===document.activeElement),true);
  await shot('family-selector-focus');await axe('Family selector focus',page);
  report.layout={shots,bounds,viewportCount:5,languages:['en','vi'],coachEscapeAndReplay:true,directLessonsPreserveMode:true,textScale:200};
  check('Five viewport sizes in both languages: task-first Learning, Activities and Progress; real-target coaching, remembered Escape/replay, direct lessons and native family controls.');
 }catch(error){report.layoutFailure={message:error.message,screen:await page.locator('#app').innerText().catch(()=>'')};await shot('failure').catch(()=>{});throw error;}
 finally{await context.close();}
}
