import {courseUnits as coreUnits} from './course-bank.js';
import {expressionUnits} from './course-expressions.js';
const courseUnits=[...coreUnits,...expressionUnits];
import {listeningUnits} from './course-listening.js';
import {guideArt} from './guide-art.js';

const units=new Map([...courseUnits,...listeningUnits].map(u=>[u.id,u]));
const day=86400000;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>s.normalize('NFC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!?]$/,'');
const known=(item,a)=>item.keys.some(k=>clean(k)===clean(a));
export function courseResult(p){
 const u=units.get(p?.unit);if(!u||p.experience!=='course-session-v1'||!Array.isArray(p.indices)||!p.indices.length||p.indices.length>u.items.length||new Set(p.indices).size!==p.indices.length||!Array.isArray(p.answers)||p.answers.length!==p.indices.length||typeof p.supported!=='boolean')return null;
 if(!p.indices.every(i=>Number.isInteger(i)&&i>=0&&i<u.items.length)||!p.answers.every(a=>typeof a==='string'&&a.trim()&&a.length<=240))return null;
 return {unit:u,indices:p.indices,answers:p.answers,supported:p.supported,correct:p.indices.map((i,n)=>known(u.items[i],p.answers[n]))};
}
export function courseProgress(events,now=Date.now()){
 const records=new Map(),last=new Map();
 for(const e of events.filter(e=>e.kind==='mission'&&e.payload?.experience==='course-session-v1').sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))){
  const r=courseResult(e.payload),time=Date.parse(e.at);if(!r||!Number.isFinite(time))continue;last.set(r.unit.id,{...r,at:e.at});
  r.indices.forEach((i,n)=>{const key=r.unit.id+':'+i,prior=records.get(key),ok=r.correct[n],differentDay=!prior||Math.floor(time/day)!==Math.floor(prior.time/day);
   const streak=!ok||r.supported?0:(prior?.streak??0)+(differentDay||!prior?.streak?1:0);
   records.set(key,{time,streak,due:!ok?time:time+(r.supported?1:[1,1,3,7,14,30][Math.min(streak,5)])*day,ok,supported:r.supported});});
 }
 const due=u=>u.items.map((_,i)=>i).filter(i=>(records.get(u.id+':'+i)?.due??Infinity)<=now);
 return {records,last,due};
}
const shards=new Map();
export async function referenceRows(query){
 const first=query.trim().toLowerCase()[0]||'a';
 if(!/^[a-z]$/.test(first))return {rows:[],license:''};
 if(!shards.has(first)){const response=await fetch(new URL('../data/published/reference/'+first+'.json',import.meta.url));if(!response.ok)throw Error('Word list unavailable. / Chưa tải được danh sách từ.');
  const data=await response.json();if(data.edition!=='atlas-wn30-1'||!Array.isArray(data.entries))throw Error('Invalid word list.');shards.set(first,data);}
 const data=shards.get(first);return {rows:data.entries.filter(r=>r.term.startsWith(query.trim().toLowerCase()||'a')),license:data.license};
}
export const newCourseState=(owner,level)=>({owner,level,page:'home',query:'a',limit:20});
export function openUnit(state,id){
 const u=units.get(id);if(!u)return;Object.assign(state,{unit:id,level:u.level,page:'lesson',indices:null,answers:[],supported:false,help:false,transcript:false,heard:new Set()});
}
export function startCoursePractice(state,events,review=false){
 const u=units.get(state.unit);if(!u)return;
 const indices=review?courseProgress(events).due(u):u.items.map((_,i)=>i);
 if(!indices.length)return;
 Object.assign(state,{page:'practice',indices,answers:indices.map(()=>''),supported:false,help:false,transcript:false,heard:new Set()});
}
export function courseSubmission(state,data){
 const u=units.get(state.unit);if(!u||state.page!=='practice')return null;
 const p={experience:'course-session-v1',unit:u.id,indices:state.indices,supported:state.supported||(u.kind==='listening'&&(u.script?!state.heard?.has('script'):state.indices.some(i=>!state.heard?.has(String(i))))),answers:state.indices.map((_,i)=>String(data.get('course-'+i)??'').trim())};
 return courseResult(p)?p:null;
}
export function courseView({state,language,events}){
 const vi=language==='vi',loc=v=>v[vi?1:0],t=(a,b)=>vi?b:a;
 const b=(label,action,value='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
 const back=b('← '+t('Everyday English','Tiếng Anh hằng ngày'),'course-home','','back-link');
 const p=courseProgress(events),u=units.get(state.unit);
 const lex=rows=>`<dl class="course-words">${rows.map(x=>`<div><dt lang="en">${esc(x.term)} ${b(t('Hear word','Nghe từ'),'course-speak',x.term,'text-button')}</dt><dd>${esc(vi?x.vi:x.en)}<small lang="en">${esc(x.example)}</small></dd></div>`).join('')}</dl>`;
 const credits=c=>`<small><a href="https://tatoeba.org/en/sentences/show/${esc(c.id)}">Tatoeba #${esc(c.id)}</a> · ${t('Recording','Ghi âm')} ${esc(c.voice)} (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>) · ${t('Text','Lời')} ${esc(c.user)} (<a href="https://creativecommons.org/licenses/by/2.0/fr/">CC BY 2.0 FR</a>)</small>`;
 const transcript=b(t('Show or hide transcript','Xem hoặc ẩn lời thoại'),'course-transcript');
 if(state.page==='listening')return `<section class="academic-room">${back}<header class="academic-heading">${guideArt('listening')}<div><h1>${t('Listening practice','Luyện nghe')}</h1><p>${t('Choose recorded sentences or a longer message read by your device.','Chọn câu có giọng thu âm hoặc lời nhắn dài hơn do thiết bị đọc.')}</p></div></header><ol class="lesson-list">${[...listeningUnits].sort((a,b)=>a.level.localeCompare(b.level)).map(x=>`<li><div><h2>${esc(loc(x.title))}</h2><p>${x.level} · ${x.script?t('Device voice','Giọng đọc của thiết bị'):t('Recorded voices','Giọng thu âm')}</p></div>${b(t('Open lesson','Mở bài'),'course-unit',x.id)}</li>`).join('')}</ol></section>`;
 if(state.page==='words'){
  const matches=courseUnits.flatMap(u=>u.lexicon).filter(x=>x.term.toLowerCase().startsWith(state.query.toLowerCase()));
  return `<section class="academic-room">${back}<h1>${t('Word finder','Tra từ')}</h1><p>${t('Look up an English word or the beginning of a phrase.','Nhập một từ tiếng Anh hoặc phần đầu của một cụm từ.')}</p><form data-form="word-search"><label>${t('English word','Từ tiếng Anh')}<input name="query" maxlength="60" required value="${esc(state.query)}" lang="en" autocapitalize="none"></label><button class="primary">${t('Find words','Tra từ')}</button></form>${matches.length?`<h2>${t('From your lessons','Từ trong bài học')}</h2>${lex([...new Map(matches.map(x=>[x.term,x])).values()].slice(0,15))}`:''}<h2>${t('English reading reference','Tra nghĩa bằng tiếng Anh')}</h2><p>${state.reference?.rows.length??0} ${t('entries','mục từ')}</p><dl class="course-words">${(state.reference?.rows??[]).slice(0,state.limit).map(x=>`<div><dt lang="en">${esc(x.term)} <small>${esc(x.pos)}</small> ${b(t('Listen','Nghe'),'course-speak',x.term,'text-button')}</dt><dd lang="en">${esc(x.meaning)}${x.example?`<small>${esc(x.example)}</small>`:''}</dd></div>`).join('')}</dl>${state.reference?.rows.length>state.limit?b(t('Show more words','Xem thêm từ'),'course-more'):''}<details><summary>WordNet 3.0 · Princeton University</summary><pre class="reference-license">${esc(state.reference?.license)}</pre></details></section>`;
 }
 if(u?.kind==='listening'&&state.page==='lesson')return `<section class="academic-room">${b('← '+t('Listening practice','Luyện nghe'),'course-listening','','back-link')}<header class="academic-heading">${guideArt('listening')}<div><p>${u.level}</p><h1>${esc(loc(u.title))}</h1><p>${esc(loc(u.objective))}</p></div></header>${b(t('Start listening','Bắt đầu nghe'),'course-practise','','primary')}</section>`;
 if(u&&state.page==='lesson'){
  return `<section class="academic-room">${back}<header class="academic-heading">${guideArt('manual')}<div><p>${u.level}</p><h1>${esc(loc(u.title))}</h1><p>${esc(loc(u.objective))}</p></div></header><h2>${t('See it in use','Xem cách dùng')}</h2><ul class="course-examples" lang="en">${u.examples.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${b(t('Try the questions','Làm bài luyện tập'),'course-practise','','primary')}<h2>${t('Words in this lesson','Từ và cụm từ trong bài')}</h2>${lex(u.lexicon)}</section>`;
 }
 if(u&&state.page==='practice'){
  return `<section class="academic-room">${back}<h1>${esc(loc(u.title))}</h1>${u.kind==='listening'?`<div class="course-voice">${u.script?b(t('Play message','Nghe lời nhắn'),'course-message',u.script):''} ${transcript}${state.transcript&&u.script?`<p lang="en">${esc(u.script)}</p>`:''}</div>`:''}<form data-form="course-paper" class="course-paper">${state.indices.map((i,n)=>{const q=u.items[i],value=state.answers[n]??'';return `<fieldset><legend lang="en">${n+1}. ${esc(q.prompt)}</legend>${q.clip?`<div class="course-voice"><audio controls preload="none" data-course-clip="${i}" aria-label="${t('Recording','Đoạn ghi âm')} ${n+1}" src="./assets/listening/${esc(q.clip.id)}.mp3"></audio>${state.transcript?`<p lang="en">${esc(q.clip.script)}</p>`:''}${credits(q.clip)}</div>`:''}${q.options?q.options.map(o=>`<label><input name="course-${n}" data-course-index="${n}" type="radio" value="${esc(o)}" ${o===value?'checked':''} required><span lang="en">${esc(o)}</span></label>`).join(''):`<label>${t('Your answer','Câu trả lời')}<input name="course-${n}" data-course-index="${n}" value="${esc(value)}" maxlength="240" lang="en" required autocomplete="off"></label>`}</fieldset>`;}).join('')}<div class="button-row"><button class="primary">${t('Check my work','Xem kết quả')}</button>${u.lexicon.length?b(t('Word help','Gợi ý từ vựng'),'course-help'):''}</div></form>${state.help?lex(u.lexicon):''}</section>`;
 }
 if(u&&state.page==='results'&&p.last.has(u.id)){
  const last=p.last.get(u.id),due=p.due(u);
  return `<section class="academic-room">${back}<header class="academic-heading">${guideArt('celebrate')}<div><h1>${esc(loc(u.title))}</h1><p>${last.correct.filter(Boolean).length} / ${last.correct.length} · ${last.supported?t('supported practice','luyện tập có hỗ trợ'):t('independent practice','tự làm bài')}</p></div></header><ol class="academic-review">${last.indices.map((i,n)=>{const q=u.items[i];return `<li><strong>${last.correct[n]?t('Correct','Đúng'):t('Try again','Cần ôn')}</strong><p lang="en">${esc(q.prompt)}</p><p>${t('Your answer','Bạn trả lời')} <b lang="en">${esc(last.answers[n])}</b></p>${last.correct[n]?'':`<p>${t('One answer','Đáp án')} <b lang="en">${esc(q.keys[0])}</b></p>`}<p>${esc(loc(q.why))}</p></li>`}).join('')}</ol>${due.length?b(t('Practise the due questions','Ôn các câu đến hạn'),'course-retry',u.id,'primary'):back}</section>`;
 }
 const level=state.level,visible=courseUnits.filter(u=>u.level===level);
 const due=[...units.values()].filter(u=>p.due(u).length),next=visible.find(u=>!p.last.has(u.id)&&(!u.prerequisite||p.last.has(u.prerequisite)))??visible.find(u=>!p.last.has(u.id))??visible[0];
 return `<section class="academic-room">${b('← '+t('Study','Học tiếng Anh'),'library','','back-link')}<header class="academic-heading">${guideArt('practice')}<div><h1>${t('Everyday English','Tiếng Anh hằng ngày')}</h1><p>${t('Learn the pattern, meet the words, then practise in a new situation.','Học cách dùng, làm quen từ mới rồi luyện trong tình huống khác.')}</p></div></header><div class="button-row">${b(t('Word finder','Tra từ'),'course-words')}${b(t('Listening practice','Luyện nghe'),'course-listening')}</div>${due.length?`<h2>${t('Ready to review','Đến lúc ôn lại')}</h2><div class="button-row">${due.map(u=>b(loc(u.title)+' · '+p.due(u).length,'course-retry',u.id)).join('')}</div>`:''}<nav class="region-strip" aria-label="${t('Practice range','Mức luyện tập')}">${['A1','A2','B1','B2','C1','C2'].map(l=>`<button data-action="course-band" data-value="${l}" aria-pressed="${level===l}">${l}</button>`).join('')}</nav>${next?`<div class="button-row">${b(t('Suggested lesson · ','Bài gợi ý · ')+loc(next.title),'course-unit',next.id,'primary')}</div>`:''}<ol class="lesson-list">${visible.map(u=>`<li><div><h2>${esc(loc(u.title))}</h2><p>${esc(loc(u.objective))}</p></div>${b(t('Open lesson','Mở bài'),'course-unit',u.id)}${p.last.has(u.id)?b(t('Last answers','Bài làm gần nhất'),'course-last',u.id,'text-button'):''}</li>`).join('')}</ol></section>`;
}

