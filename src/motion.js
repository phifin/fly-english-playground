/** Visual continuity only: never delays actions, saves, focus or navigation. */
export const motionTiming={enter:220,respond:160,guide:180};
export function motionAllowed({motion='system',quality='balanced',reduced=false,saveData=false}={}){
 return motion!=='reduced'&&quality!=='eco'&&!reduced&&!saveData;
}
const active=new Set(),ease='cubic-bezier(.2,.75,.25,1)';
let markerObserver;
export function motionEnabled(){const d=globalThis.document?.documentElement;return Boolean(d)&&motionAllowed({motion:d.dataset.motion,quality:d.dataset.quality,reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,saveData:globalThis.navigator?.connection?.saveData});}
export function animateVisual(element,frames,duration=motionTiming.respond){
 if(!element?.animate||!motionEnabled())return null;
 const animation=element.animate(frames,{duration,easing:ease,fill:'none'});animation.id='atlas-visual';active.add(animation);
 const done=()=>active.delete(animation);animation.finished.then(done,done);return animation;
}
const rect=el=>el?.getClientRects().length?el.getBoundingClientRect().toJSON():null;
const selected='.choice.chosen,.memory-card.is-open,.workshop-toy[aria-pressed="true"]';
const key=el=>[el.dataset.action,el.dataset.value,el.dataset.id].join(':');
export function captureVisual(root){
 const coach=root.querySelector('.coach-popover:not([hidden])');
 const entry=[...active].filter(a=>a.id==='atlas-view'&&a.effect?.target?.isConnected).map(a=>{const el=a.effect.target,s=getComputedStyle(el);return {index:[...el.parentElement.children].indexOf(el),opacity:s.opacity,transform:s.transform,remaining:Math.max(0,a.effect.getTiming().duration-(a.currentTime??0))};});
 const state={entry,key:root.dataset.viewKey,language:rect(root.querySelector('.language-marker')),coach:coach?{box:rect(coach),target:rect(root.querySelector('[data-guide-target]'))}:null,
  selections:new Set([...root.querySelectorAll(selected)].map(key)),props:new Map([...root.querySelectorAll('.workshop-placed[data-prop]')].map(el=>[el.dataset.prop,rect(el)])),
  feedback:root.querySelector('.feedback')?.textContent,notice:root.querySelector('.alert.notice')?.textContent};
 // Old finite effects are interrupted, not queued across a redraw.
 for(const animation of [...active]){animation.cancel();active.delete(animation);}return state;
}
export function finishVisual(root,before,viewKey){
 root.dataset.viewKey=viewKey;
 const current=root.querySelector('.guidance-switch [aria-pressed="true"]'),marker=root.querySelector('.language-marker');
 if(current&&marker){marker.style.left=current.offsetLeft+8+'px';marker.style.width=current.offsetWidth-16+'px';
  const next=rect(marker),old=before.language;
  if(old&&next&&Math.abs(old.x-next.x)>.5)animateVisual(marker,[{transform:`translateX(${old.x-next.x}px) scaleX(${old.width/next.width})`},{transform:'none'}],motionTiming.guide);
 }
 markerObserver?.disconnect();if(current&&marker){markerObserver=new ResizeObserver(()=>{marker.style.left=current.offsetLeft+8+'px';marker.style.width=current.offsetWidth-16+'px';});markerObserver.observe(current.parentElement);}
 if(before.key!==viewKey){
  const coached=Boolean(root.querySelector('.coach-popover'));
  for(const el of [...root.querySelector('#main').children].filter(el=>!el.matches('.coach-popover,.alert')).slice(0,4)){
   const animation=animateVisual(el,coached?[{opacity:.45},{opacity:1}]:[{opacity:.35,transform:'translateY(8px)'},{opacity:1,transform:'none'}],motionTiming.enter);if(animation)animation.id='atlas-view';
  }
 }else{
  for(const frame of before.entry??[]){const el=root.querySelector('#main').children[frame.index];if(el&&!el.matches('.coach-popover,.alert')&&frame.remaining>0){const animation=animateVisual(el,[{opacity:frame.opacity,...(!root.querySelector('.coach-popover')?{transform:frame.transform}:{})},{opacity:1,transform:'none'}],frame.remaining);if(animation)animation.id='atlas-view';}}
  for(const el of root.querySelectorAll(selected))if(!before.selections.has(key(el)))animateVisual(el,[{transform:'scale(.97)'},{transform:'none'}]);
  for(const el of root.querySelectorAll('.workshop-placed[data-prop]')){const old=before.props.get(el.dataset.prop),next=rect(el);
   if(old&&next&&(Math.abs(old.x-next.x)>1||Math.abs(old.y-next.y)>1))animateVisual(el,[{transform:`translate(${old.x-next.x}px,${old.y-next.y}px)`},{transform:'none'}],motionTiming.enter);
   else if(!old)animateVisual(el,[{opacity:.4,transform:'scale(.8)'},{opacity:1,transform:'none'}]);
  }
 }
 for(const [selector,prior] of [['.feedback',before.feedback],['.alert.notice',before.notice]]){const el=root.querySelector(selector);if(el&&el.textContent!==prior)animateVisual(el,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}]);}
}
export function installMotion(root){
 const stop=()=>{if(!motionEnabled())for(const a of [...active]){a.cancel();active.delete(a);}};
 const preference=matchMedia('(prefers-reduced-motion: reduce)');preference.addEventListener('change',stop);
 const observer=new MutationObserver(stop);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion','data-quality']});
 root.addEventListener('toggle',event=>{const el=event.target;if(el.tagName==='DETAILS'&&el.open)for(const child of [...el.children].filter(c=>c.tagName!=='SUMMARY'))animateVisual(child,[{opacity:.3},{opacity:1}]);},true);
}
