import {academicSets,academicTracks,academicSkills} from './academic-content.js';
import {guideArt} from './guide-art.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const lookupSet=id=>academicSets.find(s=>s.id===id);
const normalize=value=>value.normalize('NFC').trim().toLowerCase().replace(/\s+/gu,' ');

export function academicResult(payload){
  const set=lookupSet(payload?.setId);
  if(!set || payload.experience!=='academic-practice-v1' || !Array.isArray(payload.answers) || payload.answers.length!==set.items.length)return null;
  for(const answer of payload.answers)if(typeof answer!=='string'||answer.length>160||!answer.trim())return null;
  const correct=set.items.map((item,i)=>item.keys.some(key=>normalize(key)===normalize(payload.answers[i])));
  return {set,answers:payload.answers,correct,score:correct.filter(Boolean).length};
}

export function academicHistory(events){
  return events.filter(e=>e.kind==='mission'&&e.payload?.experience==='academic-practice-v1')
    .map(e=>({id:e.id,at:e.at,result:academicResult(e.payload)})).filter(e=>e.result)
    .sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));
}

export function academicView({language,state,events}){
  const vi=language==='vi',t=(en,v)=>vi?v:en,loc=arr=>arr[vi?1:0];
  const button=(label,action,value='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" data-value="${escape(value)}">${escape(label)}</button>`;
  const history=academicHistory(events);
  const record=history.find(e=>e.id===state.record);
  const set=lookupSet(state.set);
  const title=t('Exam practice','Luyện thi');
  const back=button('← '+(state.track?title:t('Study','Học tiếng Anh')),state.track?'academic-home':'library','','back-link');
  const docs=s=>`<div class="academic-reading" lang="en" translate="no">${s.docs.map(p=>`<p>${escape(p)}</p>`).join('')}</div>`;
  if(record){
    const {set:s,answers,correct,score}=record.result;
    return `<section class="academic-room">${button('← '+title,'academic-track',s.track,'back-link')}<header class="academic-heading">${guideArt('celebrate')}<div><p>${t('Answer review','Xem lại đáp án')}</p><h1>${escape(loc(s.title))}</h1><strong>${score} / ${correct.length} · ${t('correct in this set','câu đúng trong bộ này')}</strong></div></header>${docs(s)}<ol class="academic-review">${s.items.map((item,i)=>`<li><strong>${correct[i]?t('✓ Correct','✓ Đúng'):t('Review','Cần ôn')} · ${loc(academicSkills[item.skill])}</strong><p lang="en">${escape(item.prompt)}</p><p>${t('Your answer','Bạn trả lời')} <b lang="en">${escape(answers[i])}</b></p>${correct[i]?'':`<p>${t('Answer','Đáp án')} <b lang="en">${escape(item.keys[0])}</b></p>`}<p>${escape(loc(item.why))}</p></li>`).join('')}</ol>${button(t('Back to practice sets','Về danh sách bài luyện'),'academic-track',s.track,'primary')}</section>`;
  }
  if(set){
    return `<section class="academic-room">${button('← '+title,'academic-track',set.track,'back-link')}<header class="task-heading"><div><p>${loc(academicTracks[set.track])}</p><h1>${escape(loc(set.title))}</h1></div></header><div class="academic-paper">${docs(set)}<form data-form="academic-paper"><p>${t('Answer every question, then check your work.','Trả lời từng câu rồi xem kết quả.')}</p>${set.items.map((item,i)=>{
      const name='q'+i,answer=state.answers?.[i]??'';
      const input=item.options?item.options.map((o,j)=>`<label><input type="radio" name="${name}" data-academic-index="${i}" value="${escape(o)}" required ${answer===o?'checked':''}><span lang="en">${escape(o)}</span></label>`).join(''):`<label class="written-answer">${t('Your answer','Câu trả lời')}<input name="${name}" data-academic-index="${i}" lang="en" autocomplete="off" spellcheck="false" maxlength="160" pattern=".*\\S.*" required value="${escape(answer)}"></label>`;
      return `<fieldset><legend lang="en">${i+1}. ${escape(item.prompt)}</legend>${input}</fieldset>`;
    }).join('')}<button type="submit" class="primary">${t('Check my answers','Xem kết quả')}</button></form></div></section>`;
  }
  if(state.track&&Object.hasOwn(academicTracks,state.track)){
    const track=academicTracks[state.track],sets=academicSets.filter(s=>s.track===state.track),records=history.filter(e=>e.result.set.track===state.track);
    const mistakes=new Map();
    for(const s of sets){
      const latest=records.find(e=>e.result.set===s);
      latest?.result.correct.forEach((ok,i)=>{if(!ok){const skill=s.items[i].skill;mistakes.set(skill,(mistakes.get(skill)??0)+1);}});
    }
    const weak=[...mistakes].sort((a,b)=>b[1]-a[1])[0]?.[0];
    return `<section class="academic-room">${back}<header class="task-heading"><div><h1>${loc(track)}</h1><p>${track[vi?3:2]}</p></div></header>${weak?`<p class="academic-note">${t('Focus next on','Nên luyện tiếp')} <strong>${loc(academicSkills[weak])}</strong> · ${t('based on your latest answers','dựa trên bài làm gần nhất')}.</p>`:''}<div class="academic-sets">${sets.map(s=>{
      const previous=records.filter(e=>e.result.set===s);
      return `<article><h2>${loc(s.title)}</h2><p>${s.items.length} ${t('questions','câu')} · ${s.track==='school'?t('Advanced language use','Dùng từ và cấu trúc nâng cao'):t('Close reading','Đọc hiểu chi tiết')}</p>${previous.length?`<p>${t('Latest','Lần gần nhất')} <b>${previous[0].result.score}/${s.items.length}</b>${previous[1]?` · ${t('Previously','Lần trước')} ${previous[1].result.score}/${s.items.length}`:''}</p>`:''}${button(previous.length?t('Practise again','Luyện lại'):t('Start this set','Bắt đầu luyện'),'academic-start',s.id,'primary')}</article>`;
    }).join('')}</div><h2>${t('Your practice history','Lịch sử luyện tập')}</h2>${records.length?`<ol class="academic-history">${records.map(e=>`<li><span>${new Date(e.at).toLocaleDateString(vi?'vi-VN':'en-GB')} · ${loc(e.result.set.title)} · ${e.result.score}/${e.result.correct.length}</span>${button(t('Review answers','Xem bài làm'),'academic-record',e.id,'text-button')}</li>`).join('')}</ol>`:`<p>${t('Your first completed set will appear here.','Bài luyện đầu tiên sẽ xuất hiện ở đây sau khi bạn hoàn thành.')}</p>`}</section>`;
  }
  return `<section class="academic-room">${back}<header class="academic-heading">${guideArt('manual')}<div><h1>${title}</h1><p>${t('Choose a goal. Read closely, try a set, then learn from each answer.','Chọn mục tiêu, làm một bộ câu hỏi rồi xem lời giải cho từng câu.')}</p></div></header><div class="academic-tracks">${Object.entries(academicTracks).map(([id,track])=>`<button data-action="academic-track" data-value="${id}"><strong>${loc(track)}</strong><span>${track[vi?3:2]}</span><b aria-hidden="true">→</b></button>`).join('')}</div><p class="fineprint">${t('Original, untimed practice sets. Scores count correct answers in each set. School exam formats vary by school and year.','Các bộ câu hỏi tự biên soạn, không giới hạn thời gian. Kết quả là số câu đúng trong từng bộ. Đề thi chuyên có thể khác nhau theo trường và năm.')}</p></section>`;
}

