/** Pointer dragging supplements the native toy/target buttons, never replaces them.
 * Only the stable root captures a pointer: normal app renders replace its children.
 * onPlace owns serialization, persistence and application error feedback.
 */
export function installWorkshopInput(root,{onPlace,onError=()=>{}}={}){
 const doc=root.ownerDocument,win=doc.defaultView;
 let gesture=null,suppressClick=false,clickTimer=null;
 const targetAt=(x,y)=>{
  const target=doc.elementFromPoint(x,y)?.closest?.('[data-action="workshop-place"]');
  return target&&root.contains(target)&&!target.disabled?target:null;
 };
 const clear=()=>{
  const old=gesture;gesture=null;
  if(!old)return;
  old.ghost?.remove();old.scene?.classList.remove('is-dragging');
  old.source.classList.remove('is-picked-up');old.target?.classList.remove('is-drop-target');
  try{if(root.hasPointerCapture?.(old.id))root.releasePointerCapture(old.id);}catch{/* Pointer already ended. */}
 };
 const suppress=()=>{
  suppressClick=true;win.clearTimeout(clickTimer);
  clickTimer=win.setTimeout(()=>{suppressClick=false;},500);
 };
 const down=e=>{
  if(e.isPrimary===false||e.button!==0||gesture)return;
  suppressClick=false;win.clearTimeout(clickTimer);
  const source=e.target.closest?.('[data-action="workshop-select"]');
  if(!source||!root.contains(source)||source.disabled)return;
  const scene=source.closest('.workshop');
  if(!scene)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,source,scene,prop:source.dataset.value,active:false,target:null,ghost:null};
 };
 const move=e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  // Navigation or a sync-driven render invalidates this gesture, not the new scene.
  if(!g.source.isConnected){if(g.active)suppress();clear();return;}
  if(!g.active&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<8)return;
  if(!g.active){
   g.active=true;g.scene.classList.add('is-dragging');g.source.classList.add('is-picked-up');
   try{root.setPointerCapture(e.pointerId);}catch{/* Window listeners still handle uncaptured pointers. */}
   g.ghost=doc.createElement('div');g.ghost.className='workshop-drag-ghost';g.ghost.setAttribute('aria-hidden','true');
   const art=g.source.querySelector('svg');if(art)g.ghost.append(art.cloneNode(true));
   doc.body.append(g.ghost);
  }
  if(e.cancelable)e.preventDefault();
  const x=Math.max(4,Math.min(e.clientX-36,win.innerWidth-76));
  const y=Math.max(4,Math.min(e.clientY-62,win.innerHeight-76));
  g.ghost.style.transform=`translate(${x}px,${y}px)`;
  const next=targetAt(e.clientX,e.clientY);
  // All four destinations remain possible; this affordance never reveals answers.
  if(next!==g.target){g.target?.classList.remove('is-drop-target');g.target=next;next?.classList.add('is-drop-target');}
 };
 const up=e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  const target=g.active&&g.source.isConnected?targetAt(e.clientX,e.clientY):null;
  const slot=target?.dataset.value,active=g.active;
  if(active){if(e.cancelable)e.preventDefault();suppress();}
  clear();
  if(slot){
   // Focus the destination before onPlace re-renders; main restores its action focus.
   target.focus({preventScroll:true});
   try{Promise.resolve(onPlace?.(g.prop,slot)).catch(onError);}catch(error){onError(error);}
  }else if(active&&g.source.isConnected){g.source.focus({preventScroll:true});}
 };
 const cancel=e=>{if(gesture&&(e?.pointerId===undefined||e.pointerId===gesture.id)){if(gesture.active)suppress();clear();}};
 const lostCapture=e=>{if(e.target===root)cancel(e);};
 const click=e=>{if(suppressClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;win.clearTimeout(clickTimer);}};
 const key=e=>{if(e.key==='Escape'&&gesture){e.preventDefault();cancel();}};
 // Capture listeners intercept the synthetic click before application delegation.
 root.addEventListener('pointerdown',down);
 root.addEventListener('click',click,true);
 win.addEventListener('pointermove',move,{passive:false});
 win.addEventListener('pointerup',up);
 win.addEventListener('pointercancel',cancel);
 win.addEventListener('blur',cancel);
 win.addEventListener('keydown',key);
 root.addEventListener('lostpointercapture',lostCapture);
 return ()=>{
  clear();win.clearTimeout(clickTimer);
  root.removeEventListener('pointerdown',down);root.removeEventListener('click',click,true);
  win.removeEventListener('pointermove',move);win.removeEventListener('pointerup',up);
  win.removeEventListener('pointercancel',cancel);win.removeEventListener('blur',cancel);win.removeEventListener('keydown',key);
  root.removeEventListener('lostpointercapture',lostCapture);
 };
}
