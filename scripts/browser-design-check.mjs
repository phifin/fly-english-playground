import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
export async function verifyDesign({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const context=await newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();observe(page);
 const button=(name,value)=>page.locator(`[data-action="${name}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const play=async(name,value)=>{await button(name,value).click();await ready(page);await noError(page);};
 const snapshot=async()=>(await page.evaluate(readImportState)).snapshot;
 // IndexedDB getAll follows primary-key order, not the chronological event order used by the app.
 const savedMemory=async()=>(await snapshot()).events.filter(e=>e.kind==='mission'&&e.payload?.experience==='memory-pairs-v1')
  .sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id)).at(-1).payload.session;
 try{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/src/main.js',async route=>{await gate;await route.continue();});
  await page.goto(base.href,{waitUntil:'commit'});
  try{await page.locator('.atlas-boot').waitFor();await page.screenshot({path:fileURLToPath(new URL('release-design-loading.png',directory))});}finally{release();}
  await ready(page);await page.unroute('**/src/main.js');await play('guidance-language','vi');
  const loaded=await page.evaluate(async()=>{const faces=await document.fonts.load('800 32px Nunito','Tiếng Việt: ă â ê ô ơ ư đ Ắ Ễ Ộ Ự');return faces.length>0&&faces.every(f=>f.status==='loaded');});assert.equal(loaded,true,'Self-hosted display font and Vietnamese subsets load');
  assert.match(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),/Nunito/,'Vietnamese display headings use the loaded font, not a stale language override');
  await page.screenshot({path:fileURLToPath(new URL('release-design-welcome-vi.png',directory)),fullPage:true});
  await play('start-traveler');
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:844});
   const field=await page.locator('#traveler-name').boundingBox();assert.ok(field.y>=0&&field.y+field.height<600,'Nickname field stays visible before scrolling');
   const start=await page.locator('[data-form="create-profile"] button[value="play"]').boundingBox();assert.ok(start.y<800,'Primary form action stays close to the first screen');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await axe('Design guest entry '+width,page);await page.screenshot({path:fileURLToPath(new URL(`release-design-entry-${width}.png`,directory)),fullPage:true});
  }
  await page.locator('#traveler-name').fill('Bé An');await page.locator('[name="mode"][value="kids"]').check();
  await page.locator('[data-form="create-profile"] button[value="play"]').click();await ready(page);
  await page.locator('[data-level-setup]').waitFor();
  assert.equal(await page.locator('.main-nav button').count(),0,'First-time level setup is focused, not an optional hidden setting');
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Level choices fit narrow screens');
   await axe('Focused level setup '+width,page);
   await page.screenshot({path:fileURLToPath(new URL(`release-first-steps-${width}.png`,directory)),fullPage:true});
  }
  await play('entry-pictures');await play('home');
  assert.equal(await page.locator('.main-nav button').count(),3);
  assert.doesNotMatch(await page.locator('.account-pill').innerText(),/Khách|thiết bị này/);
  // Test the actual hover/focus states that previously inherited white-on-white.
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));await ready(page);
  await button('dismiss-notice').waitFor();
  {
   await button('dismiss-notice').hover();
   const contrast=await button('dismiss-notice').evaluate(el=>{const s=getComputedStyle(el),l=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(n=>{const x=Number(n)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};const a=l(s.color),b=l(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
   assert.ok(contrast>=4.5,'Toast dismiss hover retains readable text contrast');
   await page.keyboard.press('Tab');
   await button('dismiss-notice').focus();
   assert.equal(await button('dismiss-notice').evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth)>=2),true,'Keyboard dismiss focus stays visible');
   await axe('Notification hover and keyboard focus',page);
   await page.screenshot({path:fileURLToPath(new URL('release-notice-focus-320.png',directory))});
  }
  await page.screenshot({path:fileURLToPath(new URL('release-design-created-320.png',directory)),fullPage:true});
  if(await button('dismiss-notice').count())await play('dismiss-notice');await play('account');await page.locator('.account-tools [data-action="settings"]').waitFor();
  assert.equal(await page.locator('[data-form="family-invite"]').count(),0);
  await play('home');await play('little-open');await play('memory-open');
  const before=(await snapshot()).events.filter(e=>e.kind==='attempt').length;
  await play('memory-flip','0');await page.reload();await ready(page);await play('little-open');await play('memory-open');
  assert.equal(await page.locator('.memory-card.is-open').count(),1,'Reopening restores the selected card');
  let s=await savedMemory();
  const pairs=[...new Set(s.cards)].map(id=>s.cards.flatMap((word,i)=>word===id?[i]:[]));
  await page.screenshot({path:fileURLToPath(new URL('release-design-memory-320.png',directory)),fullPage:true});await axe('Memory pairs at 320px',page);
  for(let n=0;n<pairs.length;n++)for(const i of pairs[n]){
   if(s.open.includes(i)||s.found.includes(s.cards[i]))continue;
   await button('memory-flip',String(i)).focus();await page.keyboard.press('Enter');
   if(n===pairs.length-1&&i===pairs[n].at(-1)){
    await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),true);
    assert.equal(await page.locator('.busy-indicator').isVisible(),false,'Waiting for a dialog choice must not look like unfinished background work');
    await axe('Memory completion dialog',page);await page.screenshot({path:fileURLToPath(new URL('release-design-reward-320.png',directory))});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-action="memory-again"]').evaluate(el=>el===document.activeElement),true,'Completion dismissal restores focus to the next playable action');
   }
   await ready(page);await noError(page);s=await savedMemory();
   assert.equal(await page.locator('.memory-card.is-found').count(),s.found.length*2,'Visible matched pairs agree with the latest persisted event');
  }
  assert.equal(s.found.length,3);assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt').length,before,'Memory games never fabricate assessed evidence');
  await play('guidance-language','en');assert.equal(await page.locator('[data-memory-complete="true"]').count(),1);
  await page.reload();await ready(page);await play('little-open');await play('memory-open');
  assert.equal(await page.locator('.memory-card.is-found').count(),6,'All completed pairs survive a full reload');
  await page.screenshot({path:fileURLToPath(new URL('release-design-memory-complete-en.png',directory)),fullPage:true});
  await play('memory-again');assert.equal(await page.locator('.memory-card.is-open').count(),0);
  await play('home');await play('account');await play('settings');await axe('Account preferences after navigation redesign',page);
  report.designReview={fontLoaded:true,entryWidths:[1440,390,320],navigationDestinations:3,memoryPairs:3,modalKeyboardDismissal:true,noAssessedMemoryEvidence:true};
  check('Task-first bilingual entry, self-hosted Vietnamese display fonts, three-destination navigation, private account tools, resumed memory pairs and keyboard-accessible completion dialog work without new proficiency evidence.');
 }catch(error){
  report.designFailure={message:error.message,screen:await page.locator('#app').innerText().catch(()=>''),url:page.url()};
  await page.screenshot({path:fileURLToPath(new URL('release-design-failure.png',directory)),fullPage:true}).catch(()=>{});
  throw error;
 }finally{await context.close();}
}
