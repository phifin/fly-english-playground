export function initialQuality(settings, device={}) {
 if(settings.quality!=='auto')return settings.quality;
 const {cores=4,memory=4,reducedData=false,reducedMotion=false}=device;
 if(reducedData||reducedMotion||cores<=4||memory<=4)return 'eco';
 return cores>=8&&memory>=8?'ultra':'balanced';
}
/** A short passive frame sample can lower Auto; it never blocks interaction. */
export function applyQuality(settings) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const device={cores:navigator.hardwareConcurrency,memory:navigator.deviceMemory,reducedData:navigator.connection?.saveData,reducedMotion:reduced};
 let quality=initialQuality(settings,device),cancelled=false;
 document.documentElement.dataset.quality=quality;
 document.documentElement.dataset.motion=settings.motion==='reduced'||(settings.motion==='system'&&reduced)?'reduced':'full';
 if(settings.quality==='auto'&&quality!=='eco'){
  let last=0,frames=[];
  const frame=t=>{if(cancelled||document.hidden)return;if(last)frames.push(t-last);last=t;if(frames.length<35)requestAnimationFrame(frame);else if(frames.filter(x=>x>32).length>8){quality='eco';document.documentElement.dataset.quality=quality;}};
  requestAnimationFrame(frame);
 }
 return ()=>{cancelled=true;};
}
