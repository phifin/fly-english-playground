/** Nonmodal coaching: the real controls remain usable with every input method. */
import {animateVisual,motionTiming} from './motion.js';
export function positionCoach(target,coach,viewport,{preferAbove=false}={}){
 const margin=12,gap=12,width=Math.min(320,viewport.width-2*margin),height=coach.height;
 const below=target.bottom+gap,above=target.top-gap-height;
 const top=preferAbove&&above>=margin?above:below+height<=viewport.height-margin?below:above>=margin?above:Math.max(margin,viewport.height-height-margin);
 return {left:Math.max(margin,Math.min(target.left,viewport.width-width-margin)),top,width};
}
export function mountSpotlight({root,target,bubble,onEscape,revealTarget=true,previous=null}){
 if(!target||!bubble||!target.getClientRects().length)return ()=>{};
 const win=root.ownerDocument.defaultView;
 const shade=root.ownerDocument.createElement('div');shade.className='coach-shade';shade.setAttribute('aria-hidden','true');
 root.append(shade);bubble.classList.add('coach-popover');bubble.setAttribute('role','region');
 bubble.id='active-coach';const priorDescription=target.getAttribute('aria-describedby');
 target.setAttribute('aria-describedby',[priorDescription,'active-coach'].filter(Boolean).join(' '));
 root.dataset.coaching='true';let frame=0,closed=false,manipulating=false;
 function place(){frame=0;if(closed||!target.isConnected)return;
  const r=target.getBoundingClientRect(),v=win.visualViewport,viewport={width:v?.width??win.innerWidth,height:v?.height??win.innerHeight};
  // Hide an offscreen highlight rather than presenting a misleading detached hole.
  const visible=!manipulating&&r.bottom>0&&r.top<viewport.height&&r.width>0;
  shade.hidden=!visible;bubble.hidden=!visible;
  if(!visible)return;
  const x=Math.max(0,r.left-5),y=Math.max(0,r.top-5),right=Math.min(viewport.width,r.right+5),bottom=Math.min(viewport.height,r.bottom+5);
  Object.assign(shade.style,{left:x+'px',top:y+'px',width:(right-x)+'px',height:(bottom-y)+'px'});
  bubble.style.width=Math.min(320,viewport.width-24)+'px';
  // Navigation choices follow these primary actions. Keep coaching in the
  // heading area above them when possible instead of covering the next row.
  const preferAbove=['home','learning','progress','adventure','workshop','review','memory'].includes(bubble.dataset.guideTopic);
  const p=positionCoach(r,bubble.getBoundingClientRect(),viewport,{preferAbove});
  Object.assign(bubble.style,{left:p.left+'px',top:p.top+'px'});
 }
 function schedule(){if(!frame)frame=win.requestAnimationFrame(place);}
 function key(event){if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();onEscape?.();}}
 // Yield the whole scene to a real pointer gesture. The coach must never
 // intercept hit-testing at a toy's destination while it is being dragged.
 function pointerDown(event){if(event.target.closest?.('[data-action="workshop-select"]')){manipulating=true;place();}}
 function pointerEnd(){if(manipulating){manipulating=false;schedule();}}
 // Only scroll to a target once; resize/scroll observers never fight player input.
 const r=target.getBoundingClientRect();if(revealTarget&&(r.top<12||r.bottom>win.innerHeight-140))target.scrollIntoView({block:'center',behavior:'instant'});
 place();
 // Redraws preserve the existing veil. Only a genuinely new guide fades in.
 // The spotlight itself always follows the actual control without spatial lag.
 if(!previous){animateVisual(shade,[{opacity:0},{opacity:1}],motionTiming.guide);animateVisual(bubble,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],motionTiming.guide);}
 else if(previous.box){const current=bubble.getBoundingClientRect(),dx=Math.max(-8,Math.min(8,previous.box.x-current.x)),dy=Math.max(-8,Math.min(8,previous.box.y-current.y));if(Math.abs(dx)+Math.abs(dy)>1)animateVisual(bubble,[{opacity:.8,transform:`translate(${dx}px,${dy}px)`},{opacity:1,transform:'none'}],motionTiming.guide);}
 const observer=new ResizeObserver(schedule);observer.observe(target);observer.observe(bubble);
 win.addEventListener('resize',schedule);win.addEventListener('scroll',schedule,true);win.visualViewport?.addEventListener('resize',schedule);root.addEventListener('keydown',key);
 root.addEventListener('pointerdown',pointerDown);win.addEventListener('pointerup',pointerEnd);win.addEventListener('pointercancel',pointerEnd);
 return ()=>{closed=true;if(frame)win.cancelAnimationFrame(frame);observer.disconnect();win.removeEventListener('resize',schedule);win.removeEventListener('scroll',schedule,true);win.visualViewport?.removeEventListener('resize',schedule);root.removeEventListener('keydown',key);root.removeEventListener('pointerdown',pointerDown);win.removeEventListener('pointerup',pointerEnd);win.removeEventListener('pointercancel',pointerEnd);shade.remove();delete root.dataset.coaching;delete target.dataset.guideTarget;if(priorDescription===null)target.removeAttribute('aria-describedby');else target.setAttribute('aria-describedby',priorDescription);};
}
