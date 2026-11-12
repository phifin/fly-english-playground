/** Nonmodal coaching: the real controls remain usable with every input method. */
export function positionCoach(target,coach,viewport,{preferAbove=false}={}){
 const margin=12,gap=12,width=Math.min(320,viewport.width-2*margin),height=coach.height;
 const below=target.bottom+gap,above=target.top-gap-height;
 const top=preferAbove&&above>=margin?above:below+height<=viewport.height-margin?below:above>=margin?above:Math.max(margin,viewport.height-height-margin);
 return {left:Math.max(margin,Math.min(target.left,viewport.width-width-margin)),top,width};
}
export function mountSpotlight({root,target,bubble,onEscape}){
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
  const preferAbove=['home','learning','progress','adventure','workshop','review'].includes(bubble.dataset.guideTopic);
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
 const r=target.getBoundingClientRect();if(r.top<12||r.bottom>win.innerHeight-140)target.scrollIntoView({block:'center',behavior:'instant'});
 place();const observer=new ResizeObserver(schedule);observer.observe(target);observer.observe(bubble);
 win.addEventListener('resize',schedule);win.addEventListener('scroll',schedule,true);win.visualViewport?.addEventListener('resize',schedule);root.addEventListener('keydown',key);
 root.addEventListener('pointerdown',pointerDown);win.addEventListener('pointerup',pointerEnd);win.addEventListener('pointercancel',pointerEnd);
 return ()=>{closed=true;if(frame)win.cancelAnimationFrame(frame);observer.disconnect();win.removeEventListener('resize',schedule);win.removeEventListener('scroll',schedule,true);win.visualViewport?.removeEventListener('resize',schedule);root.removeEventListener('keydown',key);root.removeEventListener('pointerdown',pointerDown);win.removeEventListener('pointerup',pointerEnd);win.removeEventListener('pointercancel',pointerEnd);shade.remove();delete root.dataset.coaching;if(priorDescription===null)target.removeAttribute('aria-describedby');else target.setAttribute('aria-describedby',priorDescription);};
}
