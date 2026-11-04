/** Native modal semantics, text-only messages, and reliable keyboard dismissal. */
export function showDialog({title,message,confirmLabel,cancelLabel,celebrate=false}={}) {
 return new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog');
  dialog.className='atlas-dialog';dialog.setAttribute('aria-labelledby','atlas-dialog-title');dialog.setAttribute('aria-describedby','atlas-dialog-message');
  const mark=document.createElement('span');mark.className='dialog-mark';mark.setAttribute('aria-hidden','true');mark.textContent=celebrate?'✦':'◇';
  const heading=document.createElement('h2');heading.id='atlas-dialog-title';heading.textContent=title;heading.tabIndex=-1;
  const copy=document.createElement('p');copy.id='atlas-dialog-message';copy.textContent=message;
  const actions=document.createElement('div');actions.className='button-row';
  let settled=false;
  const finish=value=>{if(settled)return;settled=true;dialog.close();dialog.remove();
   const fallback=document.querySelector('[data-action="memory-again"]')||document.querySelector('main button:not(:disabled)')||document.querySelector('main h1');
   const target=previous?.isConnected&&previous!==document.body&&!previous.disabled?previous:fallback;
   target?.focus({preventScroll:true});resolve(value);
  };
  if(cancelLabel){const cancel=document.createElement('button');cancel.type='button';cancel.textContent=cancelLabel;cancel.addEventListener('click',()=>finish(false));actions.append(cancel);}
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent=confirmLabel;confirm.addEventListener('click',()=>finish(true));actions.append(confirm);
  dialog.append(mark,heading,copy,actions);document.body.append(dialog);
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});dialog.showModal();heading.focus();
 });
}
