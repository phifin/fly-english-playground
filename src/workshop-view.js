import {pictureArt} from './picture-play.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const props={lantern:['lantern','đèn lồng'],bell:['bell','chuông'],boat:['boat','thuyền'],shell:['shell','vỏ sò'],kite:['kite','diều'],leaf:['leaf','lá']};
const spots={water:['Water','Mặt nước'],sand:['Sand','Bãi cát'],tree:['Tree','Cây'],sky:['Sky','Bầu trời']};
const localized=(value,language)=>value?.[language]??value?.en??'';
const button=(label,action,attributes='',className='')=>`<button type="button" class="${className}" data-action="${action}" ${attributes}>${label}</button>`;

export function creationPreview(placement){return `<div class="workshop-scene workshop-mini" aria-hidden="true">${harborArt()}${Object.entries(spots).map(([slot])=>props[placement[slot]]?`<span class="workshop-spot workshop-spot-${slot}"><span class="workshop-placed">${pictureArt(placement[slot])}</span></span>`:'').join('')}</div>`;}

/** Original lightweight scene art, with no remote images, fonts or SVG IDs. */
export function harborArt(){return `<svg class="workshop-landscape" viewBox="0 0 900 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
 <path d="M0 0h900v460H0Z" fill="#d7eef0"/>
 <circle cx="160" cy="88" r="42" fill="#f8d991"/><circle cx="160" cy="88" r="58" fill="#f8d991" opacity=".18"/>
 <g fill="#fffdf4" opacity=".9"><path d="M340 77c-5-25 35-36 44-10 20-11 37-1 37 15H340Z"/><path d="M30 151c1-18 29-25 37-9 17-15 42-3 39 15H30Z"/><path d="M660 53c1-24 36-28 46-8 17-13 42 0 39 19h-85Z"/></g>
 <path d="M0 240c120-40 214-13 324-39 84-20 199-2 277 36v223H0Z" fill="#97c5bb"/>
 <path d="M0 267c103-33 194-8 305-22 122-15 202-9 287 32l-33 183H0Z" fill="#81bcc8"/>
 <path d="M900 205c-119-44-229-27-317 22-47 26-83 58-96 93-17 43-3 79-68 140h481Z" fill="#f5e0ae"/>
 <path d="M900 205c-119-44-229-27-317 22-47 26-83 58-96 93-17 43-3 79-68 140" stroke="#fff7df" stroke-width="15" fill="none"/>
 <g fill="none" stroke="#e8f7f5" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M35 292h72m75-25h87m38 69h67M80 391h88m93 35h72M353 274h42M22 440h60"/></g>
 <path d="m375 249 199 36-7 35-201-41Z" fill="#b88e5d" stroke="#755c40" stroke-width="3"/>
 <path d="m402 255-7 30m35-24-7 30m35-25-7 31m35-24-7 30m35-24-7 30m35-25-7 31" stroke="#e7bf85" stroke-width="4"/>
 <path d="M394 269v39m161-9v40" stroke="#755c40" stroke-width="9"/>
 <path d="M735 262c-3-51-8-105 1-151m-3 77 34-37m-32 15-30-30" stroke="#795c40" stroke-width="19" fill="none" stroke-linecap="round"/>
 <path d="M657 137c-32-54 17-112 66-88 22-37 85-17 82 22 60-3 78 65 26 84-51 27-122 14-174-18Z" fill="#739b64"/>
 <path d="M650 112c-7-41 30-67 65-49 25-26 65-8 63 22 37 5 46 39 29 54-37 22-114 8-157-27Z" fill="#8bb477"/>
 <g fill="#6d975d"><path d="m610 407 4-25 9 23 6-33 9 34Z"/><path d="m832 305 4-25 9 23 6-33 9 34Z"/></g>
 <g fill="#c9ad79"><ellipse cx="802" cy="405" rx="18" ry="7"/><ellipse cx="650" cy="339" rx="12" ry="5"/><ellipse cx="872" cy="353" rx="8" ry="4"/></g>
 <g transform="translate(590 371)"><ellipse cy="35" rx="29" ry="9" fill="#947e58" opacity=".16"/><path d="M-23 5c0-40 46-40 46 0v28h-46Z" fill="#f3c96e" stroke="#4e6d51" stroke-width="3"/><path d="M-11-20c-3-11 18-15 23-6" fill="none" stroke="#4e6d51" stroke-width="3"/><circle cx="-8" cy="4" r="3" fill="#304f41"/><circle cx="9" cy="4" r="3" fill="#304f41"/><path d="M-5 15q6 7 13-1" fill="none" stroke="#304f41" stroke-width="3" stroke-linecap="round"/><path d="m-23 14-11-7m57 6 11-10" stroke="#4e6d51" stroke-width="4" stroke-linecap="round"/></g>
 </svg>`;}

/** Presentation only: the engine decides completion and persists placements. */
export function workshopView({language='en',mode='balanced',brief=null,placement={},selected=null,feedback=null,finished=false,free=false,completedCount=0,availableBriefs=0,index=0,help=false,settled=false}={}){
 const t=(en,vi)=>language==='vi'?vi:en,langIndex=language==='vi'?1:0;
 const building=free||!brief,chosen=Object.hasOwn(props,selected??'')?selected:null;
 const count=Number.isSafeInteger(completedCount)&&completedCount>0?completedCount:0;
 const slotButtons=Object.entries(spots).map(([slot,names])=>{
  const prop=Object.hasOwn(props,placement?.[slot]??'')?placement[slot]:null;
  const name=names[langIndex],label=chosen?t(`Put the ${props[chosen][0]} here: ${names[0]}`,`Đặt ${props[chosen][1]} ở đây: ${name}`):prop?t(`${names[0]}: ${props[prop][0]}. Choose a toy to change this place.`,`${name}: ${props[prop][1]}. Chọn đồ vật để thay đổi nơi này.`):t(`${names[0]}. Choose a toy first.`,`${name}. Chọn đồ vật trước nhé.`);
  return `<div class="workshop-spot workshop-spot-${slot} ${prop?'has-prop':''}" data-slot="${slot}">${button(`${prop?`<span class="workshop-placed" data-prop="${prop}">${pictureArt(prop)}</span>`:`<span class="workshop-empty-spot" aria-hidden="true">${chosen?'＋':'·'}</span>`}<span class="workshop-spot-label"><span lang="en">${names[0]}</span>${language==='vi'?`<small>${name}</small>`:''}</span>`,'workshop-place',`data-value="${slot}" aria-label="${escape(label)}"`,'workshop-place')}${prop?button('×','workshop-remove',`data-value="${slot}" aria-label="${escape(t(`Remove the ${props[prop][0]} from ${names[0]}`,`Cất ${props[prop][1]} khỏi ${name}`))}"`,'workshop-remove'):''}</div>`;
 }).join('');
 const instruction=chosen?t(`Now tap a place for your ${props[chosen][0]}.`,`Giờ chạm vào nơi đặt ${props[chosen][1]} nhé.`):t('Pick a toy below. Then tap a place.','Chọn đồ vật bên dưới. Rồi chạm vào một nơi.');
 const message=finished?(settled?t('You made it! Your creation is saved.','Làm được rồi! Tác phẩm đã được lưu.'):t('That’s the scene! Saving your creation…','Đúng cảnh rồi! Đang lưu tác phẩm…')):feedback==='try-again'?t('Try another place. You can move any toy.','Thử nơi khác nhé. Bạn có thể di chuyển mọi đồ vật.'):feedback==='matched'?t('That fits! What else does our visitor need?','Hợp rồi! Vị khách còn cần gì nữa?'):feedback==='moved'||feedback==='saved'?t('Look what changed! Keep making it yours.','Xem cảnh thay đổi này! Cùng sáng tạo tiếp nhé.'):instruction;
 const primaryNext=building?button(t('A request for Nim','Thử lời nhờ của Nim'),'workshop-request','','workshop-next'):finished&&settled?button(t('Meet the next visitor →','Gặp vị khách tiếp →'),'workshop-next','','workshop-next'):'';
 return `<section class="workshop workshop-${mode==='kids'?'kids':'balanced'} ${chosen?'has-selection':''} ${finished?'is-finished':''}" data-brief-id="${building?'':escape(brief.id)}" data-workshop-mode="${building?'free':'request'}">
 <header class="workshop-heading"><div><p class="workshop-kicker">${building?t('Make it your own','Sáng tạo theo ý bạn'):t('A little place. A new possibility.','Một nơi nhỏ. Một điều mới.')}</p><h1>${t('Nim’s little harbor','Bến cảng nhỏ của Nim')}</h1></div>${count?`<span class="workshop-keepsake" aria-label="${escape(t(`${count} requests completed`,`${count} lời nhờ đã hoàn thành`))}"><span aria-hidden="true">✦</span> ${count}</span>`:''}</header>
 <div class="workshop-request ${building?'is-free':''}"><span class="workshop-nim" aria-hidden="true"><svg viewBox="0 0 64 68" focusable="false"><path d="M10 31c0-31 44-31 44 0v27H10Z" fill="#f3c96e" stroke="#4e6d51" stroke-width="2.5"/><path d="M25 8c0-9 14-9 16-3" fill="none" stroke="#4e6d51" stroke-width="2.5"/><circle cx="23" cy="32" r="2.5" fill="#304f41"/><circle cx="41" cy="32" r="2.5" fill="#304f41"/><path d="M25 43q8 7 15-1" fill="none" stroke="#304f41" stroke-width="2.5" stroke-linecap="round"/></svg></span><div>${building?`<p>${t('Let’s make a place we love. Put a toy anywhere!','Cùng tạo nơi mình thích nhé. Đặt đồ vật ở nơi bạn muốn!')}</p>`:`<p class="workshop-brief" lang="en" translate="no">${escape(brief.request)}</p>`}${!building?`<div class="workshop-request-tools">${button(`<span aria-hidden="true">◖))</span> ${t('Hear Nim','Nghe Nim')}`,'workshop-listen','','workshop-listen')}${button(t('A little help','Một chút gợi ý'),'workshop-help',`aria-expanded="${Boolean(help)}" aria-controls="workshop-help"`,'workshop-help-button')}</div>`:''}</div></div>
 ${help&&!building?`<aside class="workshop-help" id="workshop-help"><p>${escape(localized(brief.help,language))}</p></aside>`:''}
 <div class="workshop-scene" aria-label="${escape(t('Your harbor. Choose a toy, then choose water, sand, tree or sky.','Bến cảng của bạn. Chọn đồ vật rồi chọn mặt nước, bãi cát, cây hoặc bầu trời.'))}">${harborArt()}${slotButtons}<span class="workshop-scene-spark" aria-hidden="true">${finished?'✦':''}</span></div>
 <div class="workshop-hand" aria-hidden="true">${chosen?`<span class="workshop-hand-prop">${pictureArt(chosen)}</span><span>${instruction}</span>`:`<span class="workshop-pointer">↓</span><span>${instruction}</span>`}</div>
 <div class="workshop-tray" role="group" aria-label="${escape(t('Choose a toy','Chọn đồ vật'))}">${Object.entries(props).map(([id,names])=>button(`${pictureArt(id)}<span lang="en">${names[0]}</span>`,'workshop-select',`data-value="${id}" aria-pressed="${chosen===id}" aria-label="${escape(t(`Choose the ${names[0]}`,`Chọn ${names[1]} — ${names[0]}`))}"`,'workshop-toy')).join('')}</div>
 <div class="workshop-result"><p class="workshop-status" role="status" aria-live="polite">${escape(message)}</p>${primaryNext}</div>
 ${finished&&settled&&!building?`<div class="workshop-after"><p>${escape(localized(brief.after,language))}</p>${button(t('Make this place my own','Sáng tạo nơi này theo ý mình'),'workshop-free','','workshop-free-link')}</div>`:''}
 <div class="workshop-footer-actions">${building?button(t('Start fresh','Làm lại từ đầu'),'workshop-reset','','workshop-quiet'):button(t('Just build for a while','Tự do sáng tạo một chút'),'workshop-free','','workshop-quiet')}${button(t('English practice','Luyện tiếng Anh'),'library','','workshop-quiet')}</div>
 <details class="workshop-grownup"><summary>${t('Playing together & useful details','Cùng chơi và thông tin hữu ích')}</summary><p>${t('A child who is not reading can build freely with a grown-up. Say the English words together or point to the toys. Visitor requests use written English; help with reading when needed.','Bé chưa biết đọc có thể cùng người lớn tự do sáng tạo. Cùng nói từ tiếng Anh hoặc chỉ vào đồ vật. Lời nhờ của khách dùng tiếng Anh viết; hãy hỗ trợ đọc khi cần.')}</p><p>${t('Tap a toy, then a place to move it. Tap × to put a toy away. No dragging, timer or lost lives. Browser read-aloud is optional and may need a connection.','Chạm đồ vật rồi chạm nơi để di chuyển. Chạm × để cất đồ vật. Không cần kéo thả, không tính giờ hay mất lượt. Giọng đọc trình duyệt là tùy chọn và có thể cần mạng.')}</p>${!building?`<p>${escape(t(`Request ${Math.max(0,Number(index)||0)+1} of ${Math.max(0,Number(availableBriefs)||0)} · ${brief.level} reading practice. Completed creations are not a CEFR certificate.`,`Lời nhờ ${Math.max(0,Number(index)||0)+1}/${Math.max(0,Number(availableBriefs)||0)} · luyện đọc ${brief.level}. Tác phẩm hoàn thành không phải chứng nhận CEFR.`))}</p>`:''}</details>
 </section>`;
}
