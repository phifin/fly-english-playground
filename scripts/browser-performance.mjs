import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Comparative laboratory profile, not field INP or physical-phone certification.
// Both builds run in one Chrome process, at the same viewport and CPU setting.
const {chromium}=await import(pathToFileURL(resolve(process.env.ATLAS_PLAYWRIGHT_MODULE)).href);
const browser=await chromium.launch({channel:process.env.ATLAS_BROWSER_CHANNEL||'chrome',headless:true,chromiumSandbox:true});
const directory=new URL('../artifacts/',import.meta.url);await mkdir(directory,{recursive:true});
const report={date:new Date().toISOString(),browser:await browser.version(),cpuSlowdown:4,viewport:{width:390,height:844},runs:[],limitations:['Synthetic CI desktop CPU slowdown, not a physical phone.','Three samples describe these interactions; they do not establish field INP or universal frame rates.']};
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
async function sample(url,label,index){
 const context=await browser.newContext({viewport:report.viewport,hasTouch:true,reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
 const run={label,index,url,segments:[],errors:[]};report.runs.push(run);page.on('pageerror',e=>run.errors.push(e.message));
 await page.addInitScript(()=>{
  window.__probe={frames:[],longTasks:[],focus:[],rootReplacements:0,removedEditors:0};let prior=0;
  function frame(t){if(prior)window.__probe.frames.push(t-prior);prior=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  new PerformanceObserver(list=>window.__probe.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  document.addEventListener('focusin',e=>window.__probe.focus.push({tag:e.target.tagName,answer:e.target.dataset.answer??null,time:performance.now()}));
  new MutationObserver(records=>{for(const r of records){if(r.target.id==='app'&&r.removedNodes.length)window.__probe.rootReplacements++;for(const n of r.removedNodes)if(n.nodeType===1&&(n.matches('[data-answer]')||n.querySelector('[data-answer]')))window.__probe.removedEditors++;}}).observe(document,{subtree:true,childList:true});
 });
 const ready=()=>page.waitForFunction(()=>document.querySelector('#app')?.getAttribute('aria-busy')==='false');
 const button=(name,value)=>page.locator(`[data-action="${name}"]${value===undefined?'':`[data-value="${value}"]`}:visible`).first();
 const act=async(name,value)=>{await button(name,value).click();await ready();};
 const skip=async()=>{if(await page.locator('.coach-popover [data-action="guide-skip"]').count())await act('guide-skip');};
 const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 const measure=async(name,fn)=>{const before=await metrics(),p=await page.evaluate(()=>({frames:__probe.frames.length,long:__probe.longTasks.length,roots:__probe.rootReplacements,editors:__probe.removedEditors}));await fn();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const after=await metrics(),q=await page.evaluate(p=>({frameGaps:__probe.frames.slice(p.frames),longTasks:__probe.longTasks.slice(p.long),rootReplacements:__probe.rootReplacements-p.roots,removedEditors:__probe.removedEditors-p.editors}),p);run.segments.push({name,...Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,k.endsWith('Duration')?Math.round((after[k]-before[k])*1000*10)/10:after[k]-before[k]])),...q});};
 try{
  const start=Date.now();await page.goto(url);await ready();run.bootReadyMs=Date.now()-start;run.release=await page.locator('meta[name="atlas-release"]').getAttribute('content');
  await act('start-traveler');await page.locator('#traveler-name').fill('Performance sample');await page.locator('button[value="play"]').click();await ready();await act('entry-beginner');await skip();
  await act('account');await act('settings');await page.locator('[data-setting="quality"]').selectOption('balanced');await ready();await page.locator('[data-setting="motion"]').selectOption('full');await ready();await act('home');await skip();
  // Warm the routes once so cache/font startup is separated from interaction work.
  for(const route of ['library','journal','home']){await act(route);await skip();}
  if(index===0){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
  await measure('navigation',async()=>{for(let n=0;n<3;n++)for(const route of ['library','journal','home'])await act(route);});
  await act('library');await act('study-begin');await skip();
  await measure('answer-selection',async()=>{const values=await page.locator('[data-action="choose"]').evaluateAll(es=>es.map(e=>e.dataset.value));for(let n=0;n<6;n++)await act('choose',values[n%values.length]);});
  const steps=await page.locator('.study-steps [data-id]').evaluateAll(es=>es.map(e=>e.dataset.id));
  for(const [step,type,text] of [[steps[1],'gap','table'],[steps[4],'writing','There is a book on the table.']]){
   await page.locator(`.study-steps [data-id="${step}"]`).click();await ready();await act('guide-replay');
   const editor=page.locator(`[data-answer="${type}"]`);await editor.click();const handle=await editor.elementHandle();
   await measure(type+'-typing',async()=>{await page.keyboard.type(text,{delay:35});await page.keyboard.press('Backspace');await page.keyboard.type(text.at(-1),{delay:35});});
   run[type]={expected:text,actual:await editor.inputValue(),focused:await editor.evaluate(e=>e===document.activeElement),sameNode:await handle.evaluate(e=>e.isConnected),focusEvents:await page.evaluate(()=>__probe.focus.slice(-8))};
   if(label==='candidate'&&(run[type].actual!==text||!run[type].focused||!run[type].sameNode))throw new Error(`Continuous ${type} typing lost focus, text or DOM identity`);
   await page.screenshot({path:new URL(`performance-${label}-${index}-${type}.png`,directory).pathname});
   await skip();
  }
  await measure('language-switch',async()=>{for(const language of ['vi','en','vi','en'])await act('guidance-language',language);});
  if(index===0){const {profile}=await cdp.send('Profiler.stop');await writeFile(new URL(`performance-${label}.cpuprofile`,directory),JSON.stringify(profile));const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const times=new Map();profile.samples?.forEach((id,i)=>times.set(id,(times.get(id)||0)+(profile.timeDeltas?.[i]||0)));run.hotFunctions=[...times].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([id,microseconds])=>({name:nodes.get(id)?.callFrame.functionName,url:nodes.get(id)?.callFrame.url,line:nodes.get(id)?.callFrame.lineNumber,milliseconds:Math.round(microseconds/100)/10}));}
 }catch(e){run.failure=e.message;await page.screenshot({path:new URL(`performance-${label}-${index}-failure.png`,directory).pathname}).catch(()=>{});}
 finally{await context.close();}
}
try{
 const baseline=process.env.ATLAS_BASELINE_URL,candidate=process.env.ATLAS_URL;
 for(let index=0;index<3;index++)for(const [label,url] of index%2?[['candidate',candidate],['baseline',baseline]]:[['baseline',baseline],['candidate',candidate]])await sample(url,label,index);
 report.summary={};for(const label of ['baseline','candidate']){const runs=report.runs.filter(r=>r.label===label);report.summary[label]={bootReadyMedianMs:median(runs.map(r=>r.bootReadyMs)),segments:Object.fromEntries(['navigation','answer-selection','gap-typing','writing-typing','language-switch'].map(name=>{const samples=runs.flatMap(r=>r.segments.filter(s=>s.name===name));return [name,Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','rootReplacements','removedEditors'].map(k=>[k,median(samples.map(s=>s[k]))]))];})),typing:runs.map(r=>({gap:r.gap,writing:r.writing})),failures:runs.filter(r=>r.failure).map(r=>r.failure)};}
 await writeFile(new URL('performance-report.json',directory),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));
 if(report.runs.some(r=>r.failure))process.exitCode=1;
}finally{await browser.close();}
