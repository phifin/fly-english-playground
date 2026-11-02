import {assess, validDraftAnswer, LEVELS} from './learning.js';
import {indexCurriculum, deriveCurriculum, selectCurriculumSession} from './curriculum.js';
import {platformView} from './platform-view.js';
import {calendarReminder, localCalendarDate} from './reminders.js';

const latest = events => [...events].sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));
const emptyAnswer = a => a?.type === 'order' ? [] : a?.type === 'gap' ? '' : null;
export function validPlatformDraft(activity, answer) {
  if (activity?.type === 'order') return Array.isArray(answer) && answer.length <= activity.tokens.length
    && new Set(answer).size === answer.length && answer.every(id=>activity.tokens.some(t=>t.id===id));
  return Boolean(activity && validDraftAnswer(activity,answer));
}
/** A controller for the new learning routes. Existing learner/event storage remains authoritative. */
export function createLearningPlatform({getContext, write, render, isActive, fetcher=globalThis.fetch,
  download, speech=globalThis.speechSynthesis, Utterance=globalThis.SpeechSynthesisUtterance}) {
  let batch=null,index=null,owner=null,timer=null,audioGeneration=0,contextGeneration=0,operation=null;
  let state={page:'hub',level:'A1'},draftKey='',progressCache=null;
  const ctx=()=>getContext();
  const t=(en,vi)=>ctx().profile?.settings.language==='vi'?vi:en;
  const reset=()=>{
    const id=ctx().profile?.id;
    if(owner!==id){stopAudio();clearInterval(timer);timer=null;contextGeneration++;owner=id;state={page:'hub',level:ctx().profile?.journey.region??'A1'};draftKey='';}
    return id;
  };
  const progress=()=>{
    const context=ctx(),now=Date.now(),minute=Math.floor(now/60000);
    const expired=progressCache&&Object.values(progressCache.value.sessions).some(s=>s.deadline!==null&&!s.expired&&s.deadline<=now);
    if(!progressCache||progressCache.events!==context.events||progressCache.count!==context.events.length||progressCache.owner!==owner||progressCache.minute!==minute||expired){
      progressCache={events:context.events,count:context.events.length,owner,minute,value:deriveCurriculum(context.events,batch,{now,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,legacyActivities:context.legacyActivities})};
    }
    return progressCache.value;
  };
  const persist=async(kind,payload)=>{const id=owner,generation=contextGeneration;if(!id||ctx().profile?.id!==id)throw Error(t('Choose your learner again.','Hãy chọn lại người học.'));await write(kind,payload,id);if(ctx().profile?.id!==id||generation!==contextGeneration)throw Error(t('Your account changed. Choose your learner again.','Tài khoản đã đổi. Hãy chọn lại người học.'));};
  function stopAudio(){audioGeneration++;speech?.cancel();if(state.audioState==='playing')state.audioState='';}
  async function load(){
    if(batch)return;
    const response=await fetcher(new URL('../data/published/platform.json',import.meta.url));
    if(!response.ok)throw Error(t('Connect once to download the courses, then try again.','Kết nối mạng để tải khóa học rồi thử lại.'));
    const candidate=await response.json();
    if(candidate.schemaVersion!==1||candidate.batchId!=='platform-foundation-v1')throw Error(t('The course library needs an update. Please reload.','Thư viện học cần cập nhật. Hãy tải lại trang.'));
    index=indexCurriculum(candidate);batch=candidate;
  }
  function current(){return index?.activities.get(state.activityId);}
  function wordList(){return index.objectives.get(state.objectiveId)?.lexicon??[...index.lexicon.values()].filter(word=>word.level===state.level);}
  function round(){return progress().sessions[state.sessionId];}
  function prepare(){
    stopAudio();state.feedback=null;state.transcript=false;state.audioHeard=false;state.audioState='';
    const p=progress(),s=p.sessions[state.sessionId];
    if(!s)return;
    state.activityId=s.finished||s.complete?null:s.snapshot.activityIds.find(id=>!s.answers[id]);
    const a=current();state.answer=emptyAnswer(a);state.supported=false;
    if(a){
      const sessionEvents=ctx().events.filter(e=>typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))&&Date.parse(e.at)<=Date.now()&&e.at>=s.snapshot.startedAt);
      const draft=latest(sessionEvents).find(e=>e.kind==='draft'&&e.payload?.sessionId===state.sessionId&&e.payload.activityId===a.id
        &&(!Object.hasOwn(e.payload,'supported')||typeof e.payload.supported==='boolean')&&validPlatformDraft(a,e.payload.answer));
      if(draft){state.answer=structuredClone(draft.payload.answer);state.supported=draft.payload.supported===true;}
      if(s.snapshot.kind==='listening'){
        state.transcript=sessionEvents.some(e=>e.kind==='support'&&e.payload?.sessionId===state.sessionId&&s.snapshot.activityIds.includes(e.payload.activityId)&&e.payload.reason==='transcript');
        state.audioHeard=sessionEvents.some(e=>e.kind==='mission'&&e.payload?.experience==='listening-playback-v1'&&e.payload.sessionId===state.sessionId);
        state.supported=state.transcript;
      }
    }
    draftKey=JSON.stringify(state.answer);
  }
  async function saveDraft(){
    reset();if(!batch||!isActive()||state.page!=='session'||state.feedback||!current()||round()?.finished)return;
    const key=JSON.stringify(state.answer);if(key===draftKey)return;
    await persist('draft',{activityId:state.activityId,sessionId:state.sessionId,answer:structuredClone(state.answer),supported:state.supported===true});draftKey=key;
  }
  function timerTick(){
    if(!isActive()||ctx().profile?.id!==owner||state.page!=='session'){clearInterval(timer);timer=null;return;}
    const s=round();if(!s?.deadline){clearInterval(timer);timer=null;return;}
    if(s.complete){clearInterval(timer);timer=null;return;}
    if(s.expired){clearInterval(timer);timer=null;state.feedback=null;render();return;}
    const seconds=Math.max(0,Math.ceil((s.deadline-Date.now())/1000));
    const clock=globalThis.document?.querySelector('[data-learning-clock]');
    if(clock)clock.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  }
  function view(){
    reset();if(!batch)return '';
    const p=progress();
    if(state.page==='session'&&p.sessions[state.sessionId]?.deadline&&!p.sessions[state.sessionId]?.finished&&!timer)timer=setInterval(timerTick,1000);
    return platformView({batch,index,progress:p,profile:ctx().profile,state,language:ctx().profile.settings.language});
  }
  async function begin(options){
    const session=selectCurriculumSession(batch,progress(),{level:state.level,...options});
    if(!session)throw Error(t('No practice is available for that selection yet.','Chưa có bài luyện cho lựa chọn này.'));
    await persist('mission',{experience:'curriculum-session-v1',session});state.sessionId=session.id;state.page='session';prepare();
  }
  async function play(text,{listening=false}={}){
    stopAudio();const generation=audioGeneration,id=owner,sessionId=state.sessionId;
    if(!speech||!Utterance){state.audioState='unavailable';render();return;}
    const voices=speech.getVoices(),voice=voices.find(v=>/^en[-_]/i.test(v.lang))??voices.find(v=>/^en$/i.test(v.lang));
    if(voices.length&&!voice){state.audioState='unavailable';render();return;}
    const utterance=new Utterance(text);utterance.lang=voice?.lang??'en-GB';if(voice)utterance.voice=voice;utterance.rate=1;
    const relevant=()=>audioGeneration===generation&&owner===id&&ctx().profile?.id===id&&isActive();
    utterance.onstart=()=>{if(relevant()){state.audioState='playing';render();}};
    utterance.onerror=()=>{if(relevant()){state.audioState='failed';render();}};
    utterance.onend=async()=>{
      if(!relevant())return;state.audioState='ended';
      if(listening){try{await persist('mission',{experience:'listening-playback-v1',sessionId});if(relevant())state.audioHeard=true;}catch{if(relevant())state.audioState='failed';}}
      if(relevant())render();
    };
    state.audioState='playing';speech.speak(utterance);
  }
  function input(element){
    reset();
    if(operation?.name==='learn-submit')return false;
    if(!element?.hasAttribute('data-learn-answer')||!isActive()||state.feedback||current()?.type!=='gap')return false;
    state.answer=element.value.slice(0,500);return true;
  }
  async function performAction(name,element={dataset:{}}){
    reset();const id=owner,generation=contextGeneration;await load();
    if(ctx().profile?.id!==id||generation!==contextGeneration)return;
    const value=element.dataset.value;
    if(!owner)return;
    if(!['learn-choose','learn-order','learn-order-clear','learn-submit','learn-play-audio','learn-audio-stop'].includes(name))await saveDraft();
    if(!['learn-play-audio','learn-choose','learn-order','learn-order-clear'].includes(name))stopAudio();
    if(name==='learn-hub'){state.page='hub';state.feedback=null;}
    else if(name==='learn-course'&&LEVELS.includes(value)){state.level=value;state.page='hub';}
    else if(name==='learn-lesson'&&index.objectives.has(value)){state.objectiveId=value;state.page='lesson';}
    else if(name==='learn-start'&&index.objectives.has(value))await begin({objectiveId:value,level:index.objectives.get(value).level,size:2});
    else if(name==='learn-daily')await begin({size:progress().preferences.goal});
    else if(name==='learn-review')await begin({kind:'review',size:5});
    else if(name==='learn-check')await begin({kind:'check',size:4});
    else if(name==='learn-resume'&&progress().sessions[value]){state.sessionId=value;state.page='session';prepare();}
    else if(name==='learn-words'){state.objectiveId=index.objectives.has(value)?value:null;state.page='words';state.wordIndex=0;state.wordRevealed=false;}
    else if(name==='learn-word-flip'){const word=wordList()[state.wordIndex];if(word){await persist('mission',{experience:'word-exposure-v1',wordId:word.id});state.wordRevealed=true;}}
    else if(name==='learn-word-next'){const words=wordList();state.wordIndex=words.length?(state.wordIndex+1)%words.length:0;state.wordRevealed=false;}
    else if(name==='learn-word-speak'){const word=wordList()[state.wordIndex];if(word)await play(word.term);}
    else if(['learn-exams','learn-listening','learn-report','learn-goals'].includes(name)){state.page=name.slice(6);if(name==='learn-goals')state.reminderTime=latest(ctx().events).find(e=>e.kind==='mission'&&e.payload?.experience==='calendar-reminder-v1')?.payload.time??'18:00';}
    else if(name==='learn-exam'||name==='learn-exam-timed')await begin({kind:'exam',setId:value,timed:name==='learn-exam-timed'});
    else if(name==='learn-listen-start')await begin({kind:'listening',setId:value});
    else if(name==='learn-choose'&&current()?.type==='choice'&&!state.feedback){if(current().options.some(o=>o.id===value))state.answer=value;await saveDraft();}
    else if(name==='learn-order'&&current()?.type==='order'&&!state.feedback){if(current().tokens.some(o=>o.id===value)){state.answer=state.answer.includes(value)?state.answer.filter(id=>id!==value):[...state.answer,value];await saveDraft();}}
    else if(name==='learn-order-clear'&&current()?.type==='order'&&!state.feedback){state.answer=[];await saveDraft();}
    else if(name==='learn-transcript'){
      const s=round();if(s?.snapshot.kind==='listening'){
        for(const activityId of s.snapshot.activityIds)await persist('support',{activityId,sessionId:state.sessionId,reason:'transcript'});
        state.transcript=true;state.supported=true;
      }
    }
    else if(name==='learn-play-audio'){const s=round();if(s?.snapshot.kind==='listening')await play(index.listening.get(s.snapshot.setId).transcript,{listening:true});}
    else if(name==='learn-audio-stop')state.audioState='';
    else if(name==='learn-submit'){
      const s=round(),a=current();if(!a||!s||s.finished||s.complete||s.answers[a.id]||state.feedback){render();return;}
      const submittedAnswer=structuredClone(state.answer),result=assess(a,submittedAnswer);
      if(!result.complete)throw Error(t('Choose or finish your answer first.','Hãy chọn hoặc hoàn thành câu trả lời trước.'));
      if(s.snapshot.kind==='listening'&&!state.audioHeard&&!state.transcript)throw Error(t('Listen to the whole clip first, or open the transcript for reading practice.','Nghe hết đoạn trước, hoặc mở lời thoại để luyện đọc.'));
      await persist('attempt',{activityId:a.id,sessionId:state.sessionId,answer:submittedAnswer,supported:state.supported===true,contentVersion:batch.batchId});
      state.answer=submittedAnswer;
      draftKey=JSON.stringify(state.answer);
      if(s.snapshot.kind==='exam'){prepare();}else state.feedback=result;
    }
    else if(name==='learn-next')prepare();
    else if(name==='learn-save-goals'||name==='learn-calendar'){
      const form=element.closest?.('form')??globalThis.document?.querySelector('[data-form="learning-goals"]');if(!form)return;
      const data=new FormData(form),days=data.getAll('days').map(Number),goal=Number(data.get('goal'));
      if(!days.length||![3,5,10].includes(goal))throw Error(t('Choose at least one study day and a daily goal.','Chọn ít nhất một ngày học và mục tiêu mỗi ngày.'));
      if(name==='learn-save-goals'){
        await persist('mission',{experience:'learning-preferences-v1',goal,weekdays:days,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});
        state.notice=t('Your study plan is saved. Missing a day never takes progress away.','Đã lưu kế hoạch học. Nghỉ một ngày không làm mất tiến độ.');
      }else{
        const prior=latest(ctx().events).find(e=>e.kind==='mission'&&e.payload?.experience==='calendar-reminder-v1')?.payload;
        const settings={id:prior?.id??crypto.randomUUID(),days,time:String(data.get('time')??'18:00'),sequence:Math.min(2147483647,(prior?.sequence??-1)+1)};
        const file=calendarReminder({...settings,startDate:localCalendarDate(),language:ctx().profile.settings.language,appUrl:'https://phifin.github.io/fly-english-playground/?learn=today'});
        await persist('mission',{experience:'calendar-reminder-v1',...settings});download(file);state.reminderTime=settings.time;
        state.notice=t('Calendar file downloaded. Import it into your calendar and check its alerts. Edit or remove the reminder there.','Đã tải tệp lịch. Nhập vào ứng dụng lịch và kiểm tra thông báo. Sửa hoặc xóa lời nhắc trong lịch.');
      }
    }
    render(!['learn-choose','learn-order','learn-order-clear','learn-word-flip','learn-play-audio','learn-audio-stop','learn-transcript','learn-save-goals','learn-calendar'].includes(name));
  }
  async function action(name,element){
    reset();
    if(operation?.owner===owner&&operation.generation===contextGeneration)return;
    const active={owner,generation:contextGeneration,name};operation=active;
    try{return await performAction(name,element);}
    finally{if(operation===active)operation=null;}
  }
  return {load,view,action,input,saveDraft,leave:()=>{stopAudio();clearInterval(timer);timer=null;},inspect:()=>({owner,state:structuredClone(state)})};
}
