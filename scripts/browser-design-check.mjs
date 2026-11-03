import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
export async function verifyDesign({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const context=await newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();observe(page);
 const button=(name,value)=>page.locator(`[data-action="${name}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const play=async(name,value)=>{await button(name,value).click();await ready(page);await noError(page);};
 const snapshot=async()=>(await page.evaluate(readImportState)).snapshot;
 try{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/src/main.js',async route=>{await gate;await route.continue();});
  await page.goto(base.href,{waitUntil:'commit'});
  try{await page.locator('.atlas-boot').waitFor();await page.screenshot({path:fileURLToPath(new URL('release-design-loading.png',directory))});}finally{release();}
  await ready(page);await page.unroute('**/src/main.js');await play('guidance-language','vi');
  const loaded=await page.evaluate(async()=>{const faces=await document.fonts.load('800 32px Nunito','Tiếng Việt: ă â ê ô ơ ư đ Ắ Ễ Ộ Ự');return faces.length>0&&faces.every(f=>f.status==='loaded');});assert.equal(loaded,true,'Self-hosted display font and Vietnamese subsets load');
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
  assert.equal(await page.locator('.main-nav button').count(),3);
  assert.doesNotMatch(await page.locator('.account-pill').innerText(),/Khách|thiết bị này/);
  assert.match(await page.locator('.alert.notice').innerText(),/Bé An/);
  await page.screenshot({path:fileURLToPath(new URL('release-design-created-320.png',directory)),fullPage:true});
  await play('dismiss-notice');await play('account');await page.locator('.account-tools [data-action="settings"]').waitFor();
  assert.equal(await page.locator('[data-form="family-invite"]').count(),0);
  await play('home');await play('little-open');await play('memory-open');
  const before=(await snapshot()).events.filter(e=>e.kind==='attempt').length;
  await play('memory-flip','0');await page.reload();await ready(page);await play('little-open');await play('memory-open');
  assert.equal(await page.locator('.memory-card.is-open').count(),1,'Reopening restores the selected card');
  let s=(await snapshot()).events.filter(e=>e.payload?.experience==='memory-pairs-v1').at(-1).payload.session;
  const pairs=[...new Set(s.cards)].map(id=>s.cards.flatMap((word,i)=>word===id?[i]:[]));
  await page.screenshot({path:fileURLToPath(new URL('release-design-memory-320.png',directory)),fullPage:true});await axe('Memory pairs at 320px',page);
  for(let n=0;n<pairs.length;n++)for(const i of pairs[n]){
   if(s.open.includes(i)||s.found.includes(s.cards[i]))continue;
   await button('memory-flip',String(i)).focus();await page.keyboard.press('Enter');
   if(n===pairs.length-1&&i===pairs[n].at(-1)){
    await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),true);
    await axe('Memory completion dialog',page);await page.screenshot({path:fileURLToPath(new URL('release-design-reward-320.png',directory))});
    await page.keyboard.press('Escape');
   }
   await ready(page);await noError(page);s=(await snapshot()).events.filter(e=>e.payload?.experience==='memory-pairs-v1').at(-1).payload.session;
  }
  assert.equal(s.found.length,3);assert.equal((await snapshot()).events.filter(e=>e.kind==='attempt').length,before,'Memory games never fabricate assessed evidence');
  await play('guidance-language','en');assert.equal(await page.locator('[data-memory-complete="true"]').count(),1);
  await page.screenshot({path:fileURLToPath(new URL('release-design-memory-complete-en.png',directory)),fullPage:true});
  await play('memory-again');assert.equal(await page.locator('.memory-card.is-open').count(),0);
  await play('home');await play('account');await play('settings');await axe('Account preferences after navigation redesign',page);
  report.designReview={fontLoaded:true,entryWidths:[1440,390,320],navigationDestinations:3,memoryPairs:3,modalKeyboardDismissal:true,noAssessedMemoryEvidence:true};
  check('Task-first bilingual entry, self-hosted Vietnamese display fonts, three-destination navigation, private account tools, resumed memory pairs and keyboard-accessible completion dialog work without new proficiency evidence.');
 }finally{await context.close();}
}
