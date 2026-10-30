/** Small supported vocabulary rounds. Participation is not proficiency evidence. */
const MODES = ['explore','find','match'];
export const LITTLE_WORD_IDS = Object.freeze(['cat','dog','bird','fish','apple','banana','ball','book','cup','shoe','sun','star']);
const esc=value=>String(value??'').normalize('NFC').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=words=>Array.isArray(words)?words.filter(w=>LITTLE_WORD_IDS.includes(w?.id)&&w.word?.en&&w.word?.vi):[];
const localized=(value,language)=>value?.[language]??value?.en??'';
const button=(label,action,extra='',classes='')=>`<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;
const sound='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 12h6l8-7v22l-8-7H5Z" fill="currentColor"/><path d="M23 10q7 6 0 12m4-16q11 10 0 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
const arrow='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 16h21M18 7l9 9-9 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const drawings={
 cat:'<path d="M40 65 35 20l34 22m22 0 34-22-5 47" fill="#e6aa62"/><ellipse cx="80" cy="90" rx="52" ry="48" fill="#efbb76"/><path d="m46 38 4 22 13-12m34 0 15 12 3-22" fill="#e7a3a4"/><path d="M68 49h7m10 0h7" stroke="#a9723d"/><ellipse cx="62" cy="83" rx="5" ry="7"/><ellipse cx="99" cy="83" rx="5" ry="7"/><path d="m74 98 6 5 7-5Z" fill="#a9676a"/><path d="M80 104v7m0 0q-10 11-18 0m18 0q10 11 18 0M51 100l-30-4m30 13-29 5m89-14 29-4m-29 13 29 5" fill="none"/>',
 dog:'<path d="M44 48C15 33 9 95 35 108l18-27m54-33c29-15 35 47 9 60L98 81" fill="#9c7257"/><path d="M38 66q0-36 42-36t42 36v42q-6 35-42 35t-42-35Z" fill="#e4bc8e"/><ellipse cx="60" cy="80" rx="5" ry="7"/><ellipse cx="101" cy="80" rx="5" ry="7"/><ellipse cx="81" cy="110" rx="25" ry="20" fill="#fbefdb"/><path d="M70 100q11-8 22 0l-11 12Z"/><path d="M81 111v8m-12 0q12 16 24 0" fill="none"/><path d="M75 127v9q6 12 12 0v-9" fill="#e8a0a3"/>',
 bird:'<path d="m35 84-22-15 8 35" fill="#73abb5"/><ellipse cx="81" cy="90" rx="50" ry="42" fill="#87bec7"/><circle cx="105" cy="57" r="27" fill="#87bec7"/><path d="m129 55 21 10-22 9" fill="#e4ae4e"/><circle cx="112" cy="53" r="4"/><path d="M45 89q34-27 54 8-21 24-43 10" fill="#c4e1dc"/><path d="M65 129v14m-7 0h18m20-14v14m-7 0h18" fill="none"/>',
 fish:'<path d="m112 75 34-29v68l-34-24" fill="#e8ac65"/><ellipse cx="70" cy="81" rx="50" ry="37" fill="#f0c273"/><path d="m61 45 21-23 17 31m-37 63 22 20 13-26" fill="#dfa064"/><path d="M70 64q23 16 0 35" fill="#f8dd9b"/><circle cx="44" cy="72" r="5"/><path d="M23 88q10 8 15-1" fill="none"/><circle cx="18" cy="32" r="6" fill="#d9f0ec"/><circle cx="38" cy="17" r="4" fill="#d9f0ec"/>',
 apple:'<path d="M81 42q-4-21 10-31" fill="none" stroke-width="7"/><path d="M87 32q5-26 34-20-4 25-34 20" fill="#90b96c"/><path d="M80 47C29 15 7 68 29 112c15 34 35 33 51 25 17 8 38 9 51-25 22-44 0-97-51-65Z" fill="#d77e70"/><path d="M47 58Q31 72 37 91" fill="none" stroke="#f6d4b9" stroke-width="8"/>',
 banana:'<path d="M30 26q-8 98 102 77-19 45-67 29C17 116 13 65 30 26Z" fill="#efca68"/><path d="M31 31q9 73 101 72-18 24-49 20C43 118 22 80 31 31Z" fill="#f8df8d"/><path d="m25 26 3-12 10 3-3 15m97 70 7-5 6 10-12 5" fill="#9e8555"/>',
 ball:'<circle cx="80" cy="80" r="58" fill="#f5d580"/><path d="M26 61q28-15 51 20-6 34-35 41A58 58 0 0 1 26 61" fill="#83b8b5"/><path d="M80 22q-24 29-3 59 35 6 58-18A58 58 0 0 0 80 22" fill="#db9180"/><path d="M77 81q30 20 27 52" fill="none"/><path d="M47 45q13-12 24-12" stroke="#fff4d2" stroke-width="7" fill="none"/>',
 book:'<path d="M21 26q34-7 59 9 25-16 59-9v105q-33-8-59 7-26-15-59-7Z" fill="#8bb8b6"/><path d="M28 22q28-6 52 10 24-16 52-10v102q-26-6-52 9-26-15-52-9Z" fill="#fff7df"/><path d="M80 34v97M39 48q15-1 27 5m-27 14q15-1 27 5m-27 14q15-1 27 5m27-43q-9-1-15 2m15 17q-9-1-15 2m15 17q-9-1-15 2" fill="none" stroke="#7d9990"/><path d="M112 23v36l-8-7-8 8V26" fill="#d99b78"/>',
 cup:'<path d="M117 53h14q25 0 20 24-3 21-32 23" fill="none" stroke-width="10"/><path d="M28 45h94l-8 70q-7 24-38 24t-40-24Z" fill="#8ebdbe"/><ellipse cx="75" cy="45" rx="47" ry="12" fill="#dcebe0"/><ellipse cx="75" cy="45" rx="35" ry="5" fill="#f9f1d9"/><path d="M46 70v35" fill="none" stroke="#d7e8df" stroke-width="8"/>',
 shoe:'<path d="M26 50q14 10 28 0l18-13 26 41q5 8 31 14 16 4 16 24H19l1-43Z" fill="#92b7ba"/><path d="M19 113h126v16H17Z" fill="#f6e5bf"/><path d="m63 55 23-7m-15 19 23-7m-15 19 23-7" fill="none" stroke="#fff5df" stroke-width="6"/><path d="M25 61q13 12 26 1" fill="none"/><path d="M111 91v22" fill="none" stroke="#d0e0d8" stroke-width="5"/>',
 sun:'<g fill="none" stroke="#d9a347" stroke-width="7"><path d="M80 9v15m0 112v15M9 80h15m112 0h15M30 30l11 11m78 78 11 11M30 130l11-11m78-78 11-11"/></g><circle cx="80" cy="80" r="43" fill="#f5d477"/><path d="M61 74v1m38-1v1" stroke-width="7"/><path d="M66 93q14 14 28 0" fill="none"/>',
 star:'<path d="m80 13 21 43 47 7-34 34 8 47-42-22-42 22 8-47L12 63l47-7Z" fill="#f1cd76"/><path d="M64 78v1m32-1v1" stroke-width="7"/><path d="M69 96q11 10 22 0" fill="none"/>'
};
export function littleArt(id){return `<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false"><g fill="#35594a" stroke="#35594a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[id]??''}</g></svg>`;}

export function createLittleSession(words,{mode='explore',offset=0}={}){
 const available=list(words),ids=[...new Set(available.map(w=>w.id))];
 if(ids.length<3)throw new TypeError('Little play needs at least three accepted words');
 if(!MODES.includes(mode))throw new TypeError('Unknown little-play activity');
 const start=Number.isSafeInteger(offset)&&offset>=0?offset%ids.length:0;
 return {version:1,mode,offset:start,deck:Array.from({length:Math.min(4,ids.length)},(_,i)=>ids[(start+i)%ids.length]),index:0,found:[],feedback:null,lastPick:null,heard:false};
}
export function restoreLittleSession(value,words){
 const ids=new Set(list(words).map(w=>w.id));
 if(!value||value.version!==1||!MODES.includes(value.mode)||!Number.isSafeInteger(value.offset)||value.offset<0||value.offset>=ids.size||!Array.isArray(value.deck)||value.deck.length<3||value.deck.length>4||new Set(value.deck).size!==value.deck.length||value.deck.some(id=>!ids.has(id))||!Number.isInteger(value.index)||value.index<0||value.index>value.deck.length||!Array.isArray(value.found)||new Set(value.found).size!==value.found.length||value.found.some(id=>!value.deck.slice(0,Math.min(value.index+1,value.deck.length)).includes(id))||![null,'found','again','heard'].includes(value.feedback)||!(value.lastPick===null||ids.has(value.lastPick))||typeof value.heard!=='boolean')return null;
 if(value.index===value.deck.length&&(value.feedback!==null||value.lastPick!==null||value.heard))return null;
 const expected=createLittleSession(words,{mode:value.mode,offset:value.offset}).deck;
 if(value.deck.length!==expected.length||value.deck.some((id,index)=>id!==expected[index]))return null;
 if(value.deck.slice(0,value.index).some(id=>!value.found.includes(id)))return null;
 const current=value.deck[value.index],hasCurrent=value.found.includes(current);
 if(value.mode==='explore'){
  if(value.lastPick!==null||!['heard',null].includes(value.feedback))return null;
  if(value.feedback==='heard'&&(!value.heard||!hasCurrent))return null;
  if(value.feedback===null&&(value.heard||hasCurrent))return null;
 }else{
  if(value.feedback==='heard')return null;
  if(value.feedback==='found'&&(!hasCurrent||value.lastPick!==current))return null;
  if(value.feedback!=='found'&&hasCurrent)return null;
  if(value.feedback===null&&value.lastPick!==null)return null;
  if(value.feedback==='again'&&(value.lastPick===current||!littleOptions(value,words).some(w=>w.id===value.lastPick)))return null;
 }
 return {version:1,mode:value.mode,offset:value.offset,deck:[...value.deck],index:value.index,found:[...value.found],feedback:value.feedback,lastPick:value.lastPick,heard:value.heard};
}
export function littleCurrent(session,words){return list(words).find(w=>w.id===session?.deck?.[session.index])??null;}
export function littleOptions(session,words){
 const item=littleCurrent(session,words);if(!item)return [];
 const others=session.deck.filter(id=>id!==item.id),choices=[item.id,...others.slice(0,2)];
 const rotate=[...item.id].reduce((sum,c)=>sum+c.charCodeAt(0),session.offset)%3;
 return [...choices.slice(rotate),...choices.slice(0,rotate)].map(id=>list(words).find(w=>w.id===id));
}
export function littleAction(session,action,words){
 const next=restoreLittleSession(session,words);if(!next)throw new TypeError('Invalid little-play session');
 const current=littleCurrent(next,words);if(!current)return next;
 if(action?.type==='listen'){
  next.heard=true;
  if(next.mode==='explore'){next.feedback='heard';if(!next.found.includes(current.id))next.found.push(current.id);}
 }else if(action?.type==='pick'&&next.mode!=='explore'&&next.feedback!=='found'){
  if(!littleOptions(next,words).some(w=>w.id===action.value))return next;
  next.lastPick=action.value;
  if(action.value===current.id){next.feedback='found';if(!next.found.includes(current.id))next.found.push(current.id);}
  else next.feedback='again';
 }else if(action?.type==='next'&&(next.mode==='explore'||next.feedback==='found')){
  if(next.mode==='explore'&&!next.found.includes(current.id))next.found.push(current.id);
  next.index++;next.feedback=null;next.lastPick=null;next.heard=false;
 }
 return next;
}

export function littlePlayView({words,session=null,language='en',audioAvailable=true,speaking=false}={}){
 const t=(en,vi)=>language==='vi'?vi:en,available=list(words),state=restoreLittleSession(session,words),item=littleCurrent(state,words);
 const help=`<details class="little-grownup"><summary>${t('For grown-ups','Dành cho người lớn')}</summary><p>${t('Stay nearby. Name each picture in English, then let your child point or tap. Stop whenever they want.','Hãy ở cạnh bé. Gọi tên từng tranh bằng tiếng Anh rồi để bé chỉ hoặc chạm. Nghỉ khi bé muốn.')}</p>${item?.parentTip?`<p>${esc(localized(item.parentTip,language))}</p>`:''}<p>${t('The voice depends on this browser and may need internet. If it is silent, say the word yourself or choose Picture pairs. This is supported vocabulary play, not a reading or level test.','Giọng đọc tùy trình duyệt và có thể cần mạng. Nếu không nghe thấy, hãy đọc từ cho bé hoặc chọn Ghép tranh. Đây là chơi làm quen từ có trợ giúp, không phải bài kiểm tra đọc hay trình độ.')}</p></details>`;
 const header=`<div class="little-top">${button('← '+t('Home','Trang chủ'),'home','','back-link')}${state?button(t('Change game','Đổi trò chơi'),'little-menu','','text-button'):''}</div>`;
 if(!state)return `<section class="little-play" data-little-mode="menu" data-little-complete="false">${header}<h1>${t('Little words, together.','Cùng bé làm quen từ.')}</h1><p class="little-intro">${t('A picture, a word, a little discovery.','Một bức tranh, một từ, một khám phá nhỏ.')}</p><div class="little-games">${[
  ['explore','cat',t('Meet the pictures','Làm quen tranh'),t('Tap a picture. Hear its name.','Chạm vào tranh. Nghe tên gọi.')],
  ['find','bird',t('Hear & find','Nghe và tìm'),t('Hear a word. Find its picture.','Nghe một từ. Tìm bức tranh.')],
  ['match','ball',t('Picture pairs','Ghép tranh'),t('Find the picture that looks the same.','Tìm bức tranh giống nhau.')]
 ].map(([mode,id,title,copy])=>button(`${littleArt(id)}<strong>${title}</strong><span>${copy}</span>`,'little-start',`data-value="${mode}"`,'little-game')).join('')}</div>${help}</section>`;
 const found=state.found.map(id=>available.find(w=>w.id===id)).filter(Boolean);
 const trail=`<div class="little-trail" role="img" aria-label="${state.found.length} / ${state.deck.length} ${t('pictures found','tranh đã tìm được')}">${state.deck.map((id,index)=>`<span class="${state.found.includes(id)?'is-found':''}" aria-hidden="true">${state.found.includes(id)?littleArt(id):'<span class="little-seed">✦</span>'}</span>`).join('')}</div>`;
 if(!item)return `<section class="little-play little-finished" data-little-mode="${state.mode}" data-little-complete="true">${header}<h1>${t('A lovely little collection!','Bộ sưu tập nhỏ xinh!')}</h1><div class="little-collection">${found.map(w=>`<div>${littleArt(w.id)}<strong lang="en" translate="no">${esc(w.word.en)}</strong></div>`).join('')}</div><p>${t('Say a name together. Can you find one around you?','Cùng gọi tên nhé. Có vật nào ở quanh mình không?')}</p><div class="button-row">${button(t('More pictures →','Thêm tranh nào →'),'little-restart','','primary')}${button(t('All done','Chơi xong rồi'),'home')}</div>${help}</section>`;
 const prompt=state.mode==='explore'?t('Tap to hear','Chạm để nghe'):state.mode==='find'?t('Hear, then find','Nghe rồi tìm'):t('Find its twin','Tìm tranh giống nhau');
 const hearLabel=speaking?t('Speaking…','Đang đọc…'):t('Hear it','Nghe từ');
 const audio=button(`${sound}<span>${hearLabel}</span>`,'little-listen',`aria-label="${esc(hearLabel)}"`,'little-hear');
 const cue=!audioAvailable&&state.mode==='find'?`<p class="little-audio-help">${t('Grown-up: say','Người lớn đọc')} <strong lang="en" translate="no">${esc(item.word.en)}</strong>. ${t('Then let your child choose.','Rồi để bé chọn tranh.')}</p>`:'';
 const feedback=state.feedback==='found'?`${t('There it is!','Đúng rồi!')} <span lang="en" translate="no">${esc(item.word.en)}</span>`:state.feedback==='again'?t('Try another picture.','Thử tranh khác nhé.'):state.feedback==='heard'?`<span lang="en" translate="no">${esc(item.word.en)}</span>`:state.mode==='explore'?t('Say it together.','Cùng nói nào.'):state.mode==='match'?t('Tap the same picture.','Chạm vào tranh giống nhau.'):t('Tap the picture you hear.','Chạm vào tranh vừa nghe.');
 return `<section class="little-play" data-little-mode="${state.mode}" data-little-complete="false" data-little-word="${item.id}">${header}<h1>${prompt}</h1>${trail}
 ${state.mode==='explore'?`<div class="little-flashcard">${button(`${littleArt(item.id)}<strong lang="en" translate="no">${esc(item.word.en)}</strong>${language==='vi'?`<span lang="vi">${esc(item.word.vi)}</span>`:''}<span class="little-card-speaker" aria-hidden="true">${sound}</span>`,'little-listen',`aria-label="${esc(t('Hear','Nghe')+' '+item.word.en)}"`,'little-big-picture')}</div>`:`<div class="little-target">${state.mode==='match'?`<div class="little-model" role="img" aria-label="${esc(localized(item.word,language))}">${littleArt(item.id)}</div>`:'<span class="little-listening-face" aria-hidden="true">♪</span>'}${audio}</div>${cue}<div class="little-choices">${littleOptions(state,words).map(w=>button(`${littleArt(w.id)}${state.feedback==='found'&&w.id===item.id?'<span class="little-correct" aria-hidden="true">✓</span>':''}`,'little-pick',`data-value="${w.id}" aria-label="${esc(localized(w.word,language))}" ${state.feedback==='found'?'disabled':''}`,'little-choice'+(state.feedback==='found'&&w.id===item.id?' is-found':'')+(state.feedback==='again'&&state.lastPick===w.id?' try-another':''))).join('')}</div>`}
 <div class="little-feedback ${state.feedback==='found'?'is-success':''}" role="status" aria-live="polite" aria-atomic="true">${feedback}</div>
 <div class="little-bottom">${state.mode==='explore'||state.feedback==='found'?button(`${arrow}<span>${t('Next picture','Tranh tiếp theo')}</span>`,'little-next','','primary little-next'):state.mode==='find'?button(t('Show me a picture instead','Cho tôi xem tranh mẫu'),'little-start','data-value="match"','text-button'):''}</div>${help}</section>`;
}
