// The same compact explanation is available by pointer, keyboard and touch.
export function installContextHelp(root) {
  let trigger, popup, timer, frame, pinned = false;
  function close() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    if (trigger) {
      trigger.setAttribute('aria-expanded','false');
      trigger.removeAttribute('aria-describedby');
    }
    popup?.remove();
    trigger = popup = null;
    pinned = false;
  }
  function position() {
    if (!trigger?.isConnected) return close();
    const r = trigger.getBoundingClientRect();
    const width = document.documentElement.clientWidth, height = window.innerHeight;
    if (r.bottom <= 0 || r.top >= height) return close();
    const b = popup.getBoundingClientRect();
    const above = r.top - 6 - b.height;
    const top = r.bottom + 6 + b.height <= height - 8 || above < 8 ? r.bottom + 6 : above;
    popup.style.left = Math.max(8, Math.min(width-b.width-8, r.left + r.width/2 - b.width/2))+'px';
    popup.style.top = Math.max(8, Math.min(height-b.height-8,top))+'px';
  }
  function schedule() {if (popup) {cancelAnimationFrame(frame); frame=requestAnimationFrame(position);}}
  function open(button) {
    clearTimeout(timer);
    if (button===trigger) return;
    close();
    trigger=button;
    popup=document.createElement('div');
    popup.id='atlas-context-tip';
    popup.className='context-tip';
    popup.setAttribute('role','tooltip');
    popup.textContent=button.dataset.explanation;
    document.body.append(popup);
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-describedby',popup.id);
    position();
    popup.addEventListener('pointerenter',()=>clearTimeout(timer));
    popup.addEventListener('pointerleave',defer);
  }
  function defer() {if(!pinned) {clearTimeout(timer); timer=setTimeout(close,200);}}
  const buttonFrom=e=>e.target.closest?.('button[data-explanation]');
  root.addEventListener('pointerover',e=>{const b=buttonFrom(e); if(b&&e.pointerType==='mouse'&&(!pinned||trigger===b))open(b);});
  root.addEventListener('pointerout',e=>{if(trigger&&buttonFrom(e)===trigger&&!trigger.contains(e.relatedTarget))defer();});
  root.addEventListener('focusin',e=>{const b=buttonFrom(e);if(b)open(b);else if(trigger)close();});
  root.addEventListener('focusout',e=>{if(trigger&&e.target===trigger)close();});
  document.addEventListener('click',e=>{
    const b=buttonFrom(e);
    if(b){if(trigger===b&&pinned)close();else {open(b);pinned=true;}}
    else if(popup&&!popup.contains(e.target))close();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popup){e.preventDefault();e.stopPropagation();close();}},true);
  window.visualViewport?.addEventListener('resize',schedule);
  window.addEventListener('resize',schedule);
  window.addEventListener('scroll',schedule,{capture:true,passive:true});
  return function mount() {
    close();
    for(const note of root.querySelectorAll('template[data-context-help]')){
      const heading=note.closest('main')?.querySelector('h1')??root.querySelector('main h2, h1');
      if(!heading)continue;
      const button=document.createElement('button');
      button.type='button';
      button.className='context-help';
      button.setAttribute('aria-label',note.dataset.contextHelp);
      button.setAttribute('aria-expanded','false');
      const paragraphs=[...note.content.querySelectorAll('p')];
      button.dataset.explanation=paragraphs.length?paragraphs.map(p=>p.textContent.trim()).join('\n\n'):note.content.textContent.trim();
      button.innerHTML='<span aria-hidden="true">?</span>';
      // Keep buttons outside headings and away from forms and nested controls.
      let line=heading.parentElement;
      if(!line.matches('.heading-line,.context-heading')){
        line=document.createElement('div');line.className='heading-line context-heading';
        heading.before(line);line.append(heading);
      }
      line.append(button);
      note.remove();
    }
  };
}

