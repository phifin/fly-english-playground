import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
export async function verifyMotion({newContext,observe,ready,noError,axe,base,directory,check,readImportState,report}){
 const context=await newContext({viewport:{width:1280,height:800},hasTouch:true}),page=await context.newPage();observe(page);
 const shots=[];const shot=async(name)=>{await page.screenshot({path:fileURLToPath(new URL(`release-motion-${name}.png`,directory))});shots.push(name);};
 const control=(name,value)=>page.locator(`[data-action="${name}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const play=async(name,value)=>{await control(name,value).click();await ready(page);await noError(page);};
 const settle=async()=>page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
 const dismiss=async()=>{if(await page.locator('.coach-popover [data-action="guide-skip"]').count())await play('guide-skip');};
 try{
  // Freeze actual WAAPI timelines when requested, without changing app state.
  // This captures real intermediate frames rather than synthetic CSS mockups.
  await page.addInitScript(()=>{const original=Element.prototype.animate;window.__atlasMotion=[];Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);window.__atlasMotion.push({animation:a,element:this});if(window.__atlasFreeze)a.pause();return a;};});
  await page.goto(base.href);await ready(page);await settle();
  for(const [width,height] of [[1280,800],[768,1024],[390,844],[320,740]]){
   await page.setViewportSize({width,height});await play('guidance-language','vi');await settle();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await shot('welcome-vi-'+width);await axe('Refined welcome '+width,page);
  }
  await play('start-traveler');await page.locator('#traveler-name').fill('Motion CI');await page.locator('button[value="play"]').click();await ready(page);await settle();
  const spacing=await page.evaluate(()=>({header:document.querySelector('.masthead').getBoundingClientRect().bottom,content:document.querySelector('[data-level-setup]').getBoundingClientRect().top}));assert.ok(spacing.content-spacing.header>=16,'Focused setup has deliberate separation from the header');
  await shot('level-setup-320');await play('entry-beginner');await dismiss();
  await play('account');await play('settings');await page.locator('[data-setting="quality"]').selectOption('balanced');await ready(page);await page.locator('[data-setting="motion"]').selectOption('full');await ready(page);
  await play('home');await dismiss();await settle();
  await page.setViewportSize({width:1280,height:800});
  await page.evaluate(()=>{window.__atlasFreeze=true;});await play('library');
  assert.equal(await page.evaluate(()=>document.getAnimations().some(a=>a.id==='atlas-view'&&a.playState==='paused')),true,'Navigation creates an actual finite transition');
  const frames=[];
  for(const portion of [.15,.5,.9]){
   await page.evaluate(portion=>{for(const a of document.getAnimations().filter(a=>a.id.startsWith('atlas-'))){a.pause();a.currentTime=a.effect.getTiming().duration*portion;}},portion);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   frames.push(await page.locator('[data-learning-home]').evaluate(el=>Number(getComputedStyle(el).opacity)));await shot('study-transition-'+Math.round(portion*100));
  }
  assert.ok(frames[0]<frames[1]&&frames[1]<frames[2],'Intermediate frames progress continuously');
  await play('journal');await play('home');assert.equal(await page.locator('.experience-home').count(),1,'A new action interrupts the previous transition immediately');
  await page.evaluate(()=>{window.__atlasFreeze=false;for(const a of document.getAnimations())if(a.playState==='paused')a.play();});await settle();await dismiss();
  await play('guidance-language','en');await settle();await control('guidance-language','vi').hover();await shot('language-hover');await control('guidance-language','vi').focus();await shot('language-focus');
  await page.emulateMedia({reducedMotion:'reduce'});await play('library');
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('atlas-')&&a.playState!=='finished').length),0,'OS reduced motion disables owned transitions');
  await shot('reduced-motion-study');await axe('Refined learning with reduced motion',page);
  await page.emulateMedia({reducedMotion:'no-preference'});await play('account');await play('settings');await page.locator('[data-setting="quality"]').selectOption('eco');await ready(page);await play('journal');
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('atlas-')&&a.playState!=='finished').length),0,'Eco uses immediate transitions');
  const state=(await page.evaluate(readImportState)).snapshot;assert.equal(state.events.filter(e=>e.kind==='attempt').length,0,'Visual interaction never fabricates learning evidence');
  report.motion={shots,intermediateOpacities:frames,interruptible:true,osReducedMotion:true,eco:true,viewports:[320,390,768,1280],animationLibrary:'native WAAPI and CSS'};
  check('Refined welcome, clear header separation, real intermediate motion frames, immediate interruption, language focus and reduced-motion/Eco policies pass without changing learning evidence.');
 }catch(error){report.motionFailure={message:error.message,screen:await page.locator('#app').innerText().catch(()=>''),url:page.url()};await shot('failure').catch(()=>{});throw error;}
 finally{await context.close();}
}
