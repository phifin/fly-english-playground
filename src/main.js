import {openStore,STORE_LIMITS} from './storage.js';
import {LEVELS,REGIONS,assess,solution,indexContent,availableMissions,nextMission,nextActivity,newEvent,placementRecommendation,suggestPractice} from './learning.js';
import {emblem,islandArt} from './world.js';
import {applyQuality} from './quality.js';
import {createCloud,cloudErrorMessage} from './cloud.js';
import {registerOffline} from './offline.js';
import {createExpedition,replayExpedition,findRoute} from './expedition.js';
import {explorationView,parseWorldPlan} from './exploration-view.js';
import {journeyProgress} from './journey.js';
import {studioView} from './studio-view.js';
import {readGuidance,writeGuidance} from './guidance.js';
import {cloudView} from './cloud-view.js';
import {adventureView,adventureStep,canCollect} from './adventure-view.js';
import {picturePlayView,pictureItems} from './picture-play.js';
import {workshopView,harborArt,creationPreview} from './workshop-view.js';
import {workshopBriefs} from './workshop-content.js';
import {deriveWorkshop,placeToy,fulfillsBrief,placementFeedback,startingBrief,WORKSHOP_PROPS,WORKSHOP_SLOTS} from './workshop.js';
import {accountHeader,accountView,accountLabel,entryChoices,googleButton} from './identity-view.js';
import {accessibleProfiles,accountBackup,profileSaveStatus} from './identity-policy.js';
import {startingView,placementResultView,rangeNames} from './starting-view.js';
import {nextPlacementItem,startingPointResult,savedPlacement} from './placement.js';
import {placementItems} from './placement-content.js';
import {homeView} from './home-view.js';
import {quickActivities,savedQuick} from './quick-practice.js';
import {littleWords} from './little-content.js';
import {createLittleSession,littleAction,restoreLittleSession,littlePlayView,littleCurrent} from './little-play.js';
import {installWorkshopInput} from './workshop-input.js';

const app=document.querySelector('#app');
// Keep the native file chooser outside rebuilt views. Replacing/detaching it
// between the browser's input/change events can otherwise drop an import.
const importInput=document.createElement('input');
Object.assign(importInput,{type:'file',id:'import-file',accept:'application/json,.json',hidden:true});
app.after(importInput);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let store,pack,boards=[],profiles=[],profile=null,events=[],progress,cloud,qualityCleanup=()=>{},refreshGeneration=0,draftTimer=null,draftSave=Promise.resolve(),renderedContext=null,guidanceLanguage=readGuidance();
const ui={screen:'atlas',mission:null,activity:null,answer:null,feedback:null,supported:false,stage:'intro',busy:false,error:'',notice:'',showModel:false,review:false,placement:[],placementItems:[],placementIndex:0,cloudStatus:{state:'disabled',configured:false},draftKey:'',lastSaved:null};
const language=()=>profile?.settings.language??guidanceLanguage;
const t=(en,vi)=>language()==='vi'?vi:en;
const loc=v=>v?.[language()]??v?.en??'';
const btn=(label,action,extra='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const selected=(a,b)=>a===b?' selected':'';
const pressed=(a,b)=>`aria-pressed="${a===b}"`;
const content=()=>indexContent(pack);
const identityStatus=()=>profileSaveStatus({...ui.cloudStatus,offline:navigator.onLine===false},profile,events);
function accountScreen(){return (ui.cloudStatus.approved&&ui.cloudStatus.familyOwner?`<div class="account-family-link">${btn(t('Manage my family','Quản lý gia đình'),'family','','text-button')}</div>`:'')+accountView({status:identityStatus(),profile,profiles,language:language(),cloudHtml:cloudView({status:ui.cloudStatus,profile,language:language(),presentation:'inline'})})+(ui.linkConfirm&&profile?`<section class="panel link-confirm"><h2>${t('Save this learner to your account?','Lưu người học này vào tài khoản?')}</h2><p><strong>${esc(profile.name)}</strong> → <strong translate="no">${esc(ui.cloudStatus.email??ui.cloudStatus.displayName??'')}</strong></p><p>${t('Your guest progress is kept. This account will own the cloud copy. Nothing is linked until you confirm.','Tiến độ khách được giữ lại. Tài khoản này sở hữu bản đám mây. Chỉ liên kết khi bạn xác nhận.')}</p><div class="button-row">${btn(t('Save this learner','Lưu người học này'),'cloud-link-confirm','','primary')}${btn(t('Cancel','Hủy'),'cloud-link-cancel')}</div></section>`:'');}
async function cloudStatusChanged(s){
 const previous=ui.cloudStatus.uid;ui.cloudStatus=s;
 if(!store||!pack)return;
 if(profile?.cloudOwnerUid&&profile.cloudOwnerUid!==s.uid){++refreshGeneration;profile=null;events=[];progress=journeyProgress([],pack,boards);ui.screen='account';ui.linkConfirm=false;globalThis.speechSynthesis?.cancel();}
 const next=await store.listProfiles();if(ui.cloudStatus!==s)return;
 profiles=accessibleProfiles(next,s);
 if(previous!==s.uid)ui.linkConfirm=false;
 if(s.uid&&!previous&&!profile&&!ui.entering&&ui.screen==='profiles'){
  let remembered;try{remembered=localStorage.getItem('atlas-active-profile');}catch{}
  if(profiles.some(p=>p.id===remembered&&p.cloudOwnerUid===s.uid)){await selectProfile(remembered);if(ui.cloudStatus!==s)return;}
 }
 if(!ui.busy&&!['mission','placement'].includes(ui.screen))render();
}
function currentActivity(){return content().activities.get(ui.activity);}
function homeScreen(){return homeView({language:language(),name:profile.name,mode:profile.settings.mode,level:profile.journey.region,due:progress.due.length,resume:(savedQuick(events,content().activities)?.index??5)<5});}
function familyScreen(){if(!ui.cloudStatus.approved||!ui.cloudStatus.familyOwner)return `<section class="panel"><h1>${t('Family access','Quyền gia đình')}</h1><p>${t('Sign in with the family owner’s account to manage invitations.','Đăng nhập tài khoản chủ gia đình để quản lý lời mời.')}</p>${btn(t('Back to account','Về tài khoản'),'account')}</section>`;return `<section class="family-page">${btn('← '+t('Account','Tài khoản'),'account','','back-link')}<h1>${t('Your family','Gia đình của bạn')}</h1>${cloudView({status:ui.cloudStatus,language:language(),presentation:'inline',section:'family'})}</section>`;}
function quickScreen(){const q=ui.quick;if(!q)return homeScreen();if(q.index>=q.ids.length)return `<section class="quick-session quick-finish" data-quick-complete><span class="finish-star" aria-hidden="true">✦</span><h1>${t('A little practice, well spent.','Một lượt luyện tập thật có ích.')}</h1><p>${t('Five tasks finished. Your responses are saved.','Đã làm năm câu. Câu trả lời của bạn đã được lưu.')}</p><div class="button-row">${btn(t('Another five','Thêm năm câu'),'quick-start','','primary')}${btn(t('Choose something else','Chọn hoạt động khác'),'home')}${btn(t('Revisit mistakes','Ôn câu cần luyện'),'review')}</div></section>`;const a=currentActivity();return `<section class="quick-session" data-quick-activity="${a.id}"><div class="quick-heading">${btn('← '+t('Home','Trang chính'),'home','','back-link')}<span>${q.index+1} / ${q.ids.length} · ${a.level}</span></div><h1>${t('One small step.','Một bước nhỏ thôi.')}</h1>${responseWorkspace(a,'serious')}</section>`;}
async function openQuick(){await saveDraft();ui.quick=savedQuick(events,content().activities);if(!ui.quick||ui.quick.index>=5){ui.quick={sessionId:crypto.randomUUID(),ids:quickActivities(pack,progress,profile.journey.region),index:0};await append('mission',{experience:'quick-practice-v1',...ui.quick});}prepareQuick();ui.screen='quick';render(true);}
function prepareQuick(){const a=content().activities.get(ui.quick.ids[ui.quick.index]);if(!a)return;ui.mission=a.missionId;ui.review=false;ui.stage='activity';initActivity(a);const prior=[...events].reverse().find(e=>e.kind==='attempt'&&e.payload?.quickSessionId===ui.quick.sessionId&&e.payload.quickIndex===ui.quick.index);if(prior){ui.answer=prior.payload.answer;ui.supported=prior.payload.supported;ui.feedback=assess(a,ui.answer);}}
function littleSaved(){const matches=events.filter(e=>e.kind==='mission'&&e.payload?.experience==='little-play-v1').sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));for(const e of matches){try{const value=restoreLittleSession(e.payload.session,littleWords);if(value)return value;}catch{}}return null;}
function littleScreen(){return littlePlayView({words:littleWords,session:ui.little??null,language:language(),audioAvailable:'speechSynthesis'in window&&!ui.littleVoiceFailed});}
async function handleLittle(name,value){
 const previous=ui.little;
 if(name==='little-open'){await saveDraft();ui.little=littleSaved();ui.screen='little';render(true);return;}
 if(name==='little-menu'){ui.little=null;render(true);return;}
 if(name==='little-start'||name==='little-restart'){ui.little=createLittleSession(littleWords,{mode:name==='little-start'?value:ui.little?.mode??'explore',offset:name==='little-restart'?(ui.little?.offset??0)+4:0});}
 else if(name==='little-listen'){const word=littleCurrent(ui.little,littleWords);if(word){ui.little=littleAction(ui.little,{type:'listen'},littleWords);try{await append('mission',{experience:'little-play-v1',session:ui.little});}catch(error){ui.little=previous;throw error;}render();try{speakText(ui.little.mode==='find'?word.cue.en:word.word.en);}catch{ui.littleVoiceFailed=true;render();}}return;}
 else ui.little=littleAction(ui.little,{type:name==='little-pick'?'pick':'next',value},littleWords);
 try{await append('mission',{experience:'little-play-v1',session:ui.little});}catch(error){ui.little=previous;throw error;}render();
}
function currentMission(){return content().missions.get(ui.mission);}
function setActive(id){try{localStorage.setItem('atlas-active-profile',id??'');}catch{/* IDB is authoritative; this shortcut is optional. */}}
function errorMessage(error){
 if(error?.code?.startsWith('cloud/')||error?.code?.startsWith('auth/')||['permission-denied','unavailable','unauthenticated','deadline-exceeded','resource-exhausted','failed-precondition'].includes(error?.code?.replace(/^firestore\//,'')))return cloudErrorMessage(error,language());
 const messages={STORAGE_QUOTA:['This device is out of storage. Your saved progress is safe. Export a backup and free some space before trying again.','Thiết bị đã hết dung lượng. Tiến độ đã lưu vẫn an toàn. Hãy xuất bản sao và dọn dung lượng trước khi thử lại.'],STORAGE_UNAVAILABLE:['This browser cannot save your journey. Check its storage or private-browsing settings, then try again.','Trình duyệt chưa thể lưu hành trình. Kiểm tra cài đặt lưu trữ hoặc chế độ riêng tư rồi thử lại.'],STORAGE_FAILED:['Your progress could not be saved. Keep this page open and try again; export a backup if possible.','Chưa lưu được tiến độ. Giữ trang này mở và thử lại; xuất bản sao nếu có thể.']};
 if(messages[error?.code])return t(...messages[error.code]);
 if(error instanceof SyntaxError)return t('This backup could not be read. Choose an original Atlas JSON backup; your existing journey has not changed.','Không đọc được bản sao. Hãy chọn tệp JSON gốc của Atlas; hành trình hiện có không thay đổi.');
 return error?.message??String(error);
}

async function refresh(){
 const generation=++refreshGeneration,id=profile?.id??null;
 const nextProfiles=accessibleProfiles(await store.listProfiles(),ui.cloudStatus);
 const candidate=id?await store.getProfile(id):null;
 const nextProfile=candidate&&nextProfiles.some(p=>p.id===id)?candidate:null;
 const nextEvents=nextProfile?await store.getEvents(id):[];
 if(generation!==refreshGeneration||(profile?.id??null)!==id||(nextProfile&&profile&&nextProfile.revision<profile.revision))return;
 const preferencesChanged=JSON.stringify(profile?.settings)!==JSON.stringify(nextProfile?.settings);
 profiles=nextProfiles;profile=nextProfile;events=nextEvents;progress=journeyProgress(events,pack,boards);if(id&&!profile)ui.screen='profiles';if(preferencesChanged)setPreferences();
}
async function selectProfile(id){ui.linkConfirm=false;ui.error='';ui.errorSource=null;ui.notice='';globalThis.speechSynthesis?.cancel();++refreshGeneration;const candidate=await store.getProfile(id);if(!candidate||!accessibleProfiles(await store.listProfiles(),ui.cloudStatus).some(p=>p.id===id))throw new Error(t('Sign in to the account that owns this learner.','Đăng nhập tài khoản sở hữu người học này.'));profile=candidate;setActive(id);ui.workshopProfile=null;ui.screen=profile.journey.onboarded?'home':'onboard';ui.mission=null;ui.activity=null;await refresh();setPreferences();}
function setPreferences(){qualityCleanup();document.documentElement.lang=language();const skip=document.querySelector('.skip-link');if(skip)skip.textContent=t('Skip to content','Đến nội dung chính');if(profile)qualityCleanup=applyQuality(profile.settings);}
async function changeGuidance(value){
 if(!['en','vi'].includes(value))return;
 await saveDraft();
 if(profile)profile=await store.updateProfile(profile.id,{settings:{language:value}});
 guidanceLanguage=writeGuidance(value);setPreferences();if(ui.error&&ui.errorSource)ui.error=errorMessage(ui.errorSource);render();
}

async function append(kind,payload){await store.appendEvent(profile.id,newEvent(kind,payload));ui.lastSaved=new Date();await refresh();}
function workshopState(){return deriveWorkshop(events,workshopBriefs);}
function workshopSpace(){
 const state=workshopState();
 if(ui.workshopProfile!==profile.id){ui.workshopProfile=profile.id;ui.workshopSpace=null;ui.workshopSelected=null;ui.workshopFeedback=null;}
 if(!ui.workshopSpace)ui.workshopSpace=state.lastSpace??(profile.settings.mode==='kids'?'free':startingBrief(workshopBriefs,profile.journey.region,state.completed).id);
 return ui.workshopSpace;
}
function startingBanner(){
 const rec=progress.recommendation;
 if(!rec)return `<aside class="starting-banner"><span>${t('Not sure where to start with English?','Chưa biết nên bắt đầu tiếng Anh từ đâu?')}</span>${btn(t('Find my starting point','Tìm nơi bắt đầu'),'start-placement','','text-button')}</aside>`;
 return `<aside class="starting-banner"><span>${t('Your study starting point','Điểm bắt đầu luyện tập')}: ${esc(rangeNames[profile.journey.region][language()])} · ${profile.journey.region}</span>${btn(t('Open my learning path','Mở lộ trình học'),'library','','text-button')}</aside>`;
}
function workshopScreen(){
 const space=workshopSpace(),state=workshopState(),brief=workshopBriefs.find(b=>b.id===space),placement=state.layouts[space]??{};
 return startingBanner()+workshopView({language:language(),mode:profile.settings.mode,brief,placement,selected:ui.workshopSelected,feedback:ui.workshopFeedback,finished:fulfillsBrief(placement,brief),free:space==='free',completedCount:state.completed.size,availableBriefs:workshopBriefs.length,index:workshopBriefs.indexOf(brief),help:ui.workshopHelp===space,settled:true,firstPlay:!events.some(e=>e.kind==='mission'&&e.payload?.experience==='workshop-layout-v1'&&e.payload.operation==='place')});
}
async function workshopAction(name,value){
 const space=workshopSpace(),state=workshopState(),brief=workshopBriefs.find(b=>b.id===space),placement=state.layouts[space]??{};
 if(name==='workshop-revisit'){
  if(!workshopBriefs.some(b=>b.id===value))return;ui.workshopSpace=value;ui.workshopSelected=null;ui.workshopHelp=null;ui.workshopFeedback=null;
  if(Object.keys(state.layouts[value]??{}).length)await append('mission',{experience:'workshop-layout-v1',space:value,placement:{},operation:'reset'});
  await navigate('workshop');return;
 }
 if(name==='workshop-select'){
  if(!WORKSHOP_PROPS.includes(value))return;ui.workshopSelected=value;ui.workshopFeedback=null;render();
  if(profile.settings.sound)speakText(value);return;
 }
 if(name==='workshop-listen'){if(brief){await append('mission',{experience:'workshop-help-v1',briefId:brief.id});speakText(brief.request);}return;}
 if(name==='workshop-help'){if(brief){await append('mission',{experience:'workshop-help-v1',briefId:brief.id});ui.workshopHelp=ui.workshopHelp===space?null:space;render();}return;}
 if(['workshop-free','workshop-request','workshop-next'].includes(name)){
  if(name==='workshop-free')ui.workshopSpace='free';
  else if(name==='workshop-request')ui.workshopSpace=startingBrief(workshopBriefs,profile.journey.region,state.completed).id;
  else {const index=workshopBriefs.findIndex(b=>b.id===space);ui.workshopSpace=workshopBriefs[(index+1)%workshopBriefs.length].id;
   if(state.completed.has(ui.workshopSpace))await append('mission',{experience:'workshop-layout-v1',space:ui.workshopSpace,placement:{},operation:'reset'});
  }
  ui.workshopSelected=null;ui.workshopFeedback=null;ui.workshopHelp=null;render(true);return;
 }
 let next,operation;
 if(name==='workshop-place'){
  if(!ui.workshopSelected){ui.workshopFeedback=null;render();app.querySelector('[data-action="workshop-select"]')?.focus({preventScroll:true});return;}
  if(!WORKSHOP_SLOTS.includes(value))return;
  next=placeToy(placement,ui.workshopSelected,value);operation='place';
 }else if(name==='workshop-remove'){
  if(!WORKSHOP_SLOTS.includes(value)||!placement[value])return;
  next={...placement};delete next[value];operation='remove';
 }else if(name==='workshop-reset'){if(!Object.keys(placement).length)return;next={};operation='reset';}
 else return;
 if(JSON.stringify(next)===JSON.stringify(placement))return;
 const prop=ui.workshopSelected;
 await append('mission',{experience:'workshop-layout-v1',space,placement:next,operation,...(operation==='place'?{prop,slot:value}:operation==='remove'?{slot:value}:{})});
 ui.workshopFeedback=operation==='place'?placementFeedback(brief,next,prop,value):'saved';ui.workshopSelected=null;render();
 if(operation==='remove')app.querySelector(`[data-action="workshop-place"][data-value="${value}"]`)?.focus({preventScroll:true});
}
async function saveDraft(){
 if(!['mission','quick'].includes(ui.screen)||ui.stage!=='activity'||!ui.activity||ui.feedback||ui.submitting||!profile)return;
 const a=currentActivity();if(!a)return;
 const value=JSON.stringify({answer:ui.answer,supported:ui.supported});if(value===ui.draftKey||(ui.answer===null&&!ui.supported))return;
 const profileId=profile.id,activityId=a.id,event=newEvent('draft',{activityId,missionId:ui.mission,answer:ui.answer,supported:ui.supported});
 const operation=draftSave.catch(()=>{}).then(()=>store.appendEvent(profileId,event));draftSave=operation;await operation;
 if(profile?.id===profileId&&ui.activity===activityId){ui.draftKey=value;ui.lastSaved=new Date();await refresh();}
}
function draftStatus(){const el=app.querySelector('.draft-status');if(!el||!['mission','quick'].includes(ui.screen)||ui.stage!=='activity')return;const saved=ui.feedback||JSON.stringify({answer:ui.answer,supported:ui.supported})===ui.draftKey;const message=saved?t('Saved on this device','Đã lưu trên thiết bị'):t('Draft not yet saved…','Bản nháp chưa lưu…');if(el.textContent!==message)el.textContent=message;}
function queueDraft(){clearTimeout(draftTimer);draftStatus();draftTimer=setTimeout(()=>{if(!ui.busy&&!ui.submitting)saveDraft().then(draftStatus).catch(reportError);},1500);}
async function navigate(screen){await saveDraft();globalThis.speechSynthesis?.cancel();ui.screen=screen==='atlas'?'workshop':screen;ui.error='';ui.notice='';ui.feedback=null;ui.showModel=false;render(true);}
function initActivity(a){
 globalThis.speechSynthesis?.cancel();
 ui.activity=a.id;ui.feedback=null;ui.showModel=false;ui.supported=false;
 const draft=ui.review?null:progress.drafts[a.id];
 ui.answer=draft?.answer??(a.type==='order'?shuffle(a.tokens.map(x=>x.id),a.id):a.type==='match'?{}:a.type==='writing'?{text:'',checks:[]}:null);
 // Resuming a stored response is useful practice, but is not fresh retrieval.
 ui.supported=Boolean(draft);ui.draftKey=JSON.stringify({answer:ui.answer,supported:ui.supported});
}
// Stable non-answer ordering: different across activities, safe across re-renders.
function shuffle(values,seed){
 const out=[...values];let n=[...seed].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,19);
 for(let i=out.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}
 if(out.length>1&&out.every((v,i)=>v===values[i]))out.push(out.shift());return out;
}
async function beginMission(id,reviewActivity=null){
 await saveDraft();const mission=content().missions.get(id);if(!mission)throw new Error('Expedition unavailable');
 const item=availableMissions(pack,mission.level,progress).find(m=>m.mission.id===id);if(!reviewActivity&&!item.unlocked)throw new Error(t('Complete the preceding expedition first.','Hãy hoàn thành chuyến khám phá trước.'));
 ui.notice='';ui.error='';
 ui.screen='mission';ui.mission=id;ui.review=Boolean(reviewActivity);ui.stage=reviewActivity?'activity':profile.settings.mode==='kids'?'intro':profile.settings.mode==='balanced'?'world':progress.completedMissions.has(id)?'world':'activity';ui.worldQueue=[];ui.worldPlan='';ui.worldTranslation=false;ui.worldHint=false;ui.worldRoute=null;ui.worldInspected=null;initActivity(reviewActivity??nextActivity(mission,progress));render(true);
}

function currentBoard(){return boards.find(b=>b.missionId===ui.mission);}
function worldView(){const board=currentBoard();if(!board)return `<section class="panel"><h1>${t('This route is being charted.','Lộ trình đang được hoàn thiện.')}</h1>${btn(t('Read a field clue','Đọc manh mối'),'activity',`data-id="${currentMission().activities[0].id}"`,'primary')}</section>`;const saved=progress.worlds.states[board.id];return explorationView({board,state:saved?.state??createExpedition(board),commands:saved?.commands??[],mode:profile.settings.mode,language:profile.settings.language,mission:currentMission(),progress,queue:ui.worldQueue??[],planText:ui.worldPlan??'',translation:ui.worldTranslation,hint:ui.worldHint,route:ui.worldRoute,inspected:ui.worldInspected});}
async function saveWorld(commands){const board=currentBoard();replayExpedition(board,commands);await append('expedition',{boardId:board.id,commands,supported:Boolean(progress.worlds.states[board.id]?.supported||ui.worldTranslation||ui.worldHint||ui.worldRoute)});render();}
async function runWorld(added){const board=currentBoard(),prior=progress.worlds.states[board.id]?.commands??[],commands=[...prior,...added];if(commands.length>400)throw new Error(t('This route is getting long. Reset the route to explore again; earned discoveries are kept.','Lộ trình đã dài. Làm lại để khám phá tiếp; khám phá đã nhận vẫn được giữ.'));await saveWorld(commands);}

function header(){
 const mode=profile?.settings.mode??'balanced';
 return `<header class="masthead"><a class="wordmark" href="#" data-action="home"><img src="./assets/atlas-mark.svg" alt="" width="34" height="34"><span>The Unfolding <strong>Atlas</strong></span></a><span class="edition">${t('A world worth understanding','Một thế giới đáng khám phá')}</span><div class="guidance-switch" role="group" aria-label="${t('Guidance language','Ngôn ngữ hướng dẫn')}"><button type="button" data-action="guidance-language" data-value="en" lang="en" aria-pressed="${language()==='en'}">English</button><button type="button" data-action="guidance-language" data-value="vi" lang="vi" aria-pressed="${language()==='vi'}">Tiếng Việt</button></div>${accountHeader({status:identityStatus(),profile,language:language()})}</header>
 ${profile&&!['onboard','little'].includes(ui.screen)?`<nav class="main-nav" aria-label="${t('Main navigation','Điều hướng chính')}">${[['home',t('Home','Trang chính')],['atlas',t('Build & explore','Xây dựng & khám phá')],['library',t('Study','Học')],['journal',t('My creations','Sáng tạo của tôi')],['review',t('Practice','Ôn tập')],['settings',t('Settings','Cài đặt')]].map(([route,label])=>`<button type="button" data-action="${route}" ${(ui.screen===route||(route==='atlas'&&ui.screen==='workshop'))?'aria-current="page"':''}>${label}${route==='review'&&progress.due.length?` <span class="badge">${progress.due.length}</span>`:''}</button>`).join('')}<span class="nav-mode">${{kids:t('Play first','Chơi để học'),balanced:t('Learn & play','Học và chơi'),serious:t('Study first','Học tập trung')}[mode]}</span></nav>`:''}`;
}

function footer(){return `<footer class="site-footer"><span>✦ The Unfolding Atlas</span><span class="save-status" role="status">${esc(accountLabel({status:identityStatus(),profile,language:language()}).title)}</span></footer>`;}

function profilesScreen(){
 if(ui.entering)return entryScreen();
 let remembered;try{remembered=localStorage.getItem('atlas-active-profile');}catch{}
 const resume=profiles.find(p=>p.id===(profile?.id??remembered))??profiles[0];
 return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">${t('AN ENGLISH-LEARNING ADVENTURE','PHIÊU LƯU CÙNG TIẾNG ANH')}</p><h1>${t('A little English. A world of discovery.','Một chút tiếng Anh. Cả thế giới khám phá.')}</h1><p class="lede">${t('A boat on the water. A kite in the sky. Build a little world with Nim, and discover what English can help you make.','Thuyền trên nước, diều trên trời. Cùng Nim tạo một thế giới nhỏ và khám phá tiếng Anh qua những gì bạn làm.')}</p>${entryChoices({status:ui.cloudStatus,resume,language:language()})}<div class="arrival-steps" aria-label="${t('Your first steps','Những bước đầu')}"><span><b>1</b>${t('Choose a toy','Chọn đồ vật')}</span><span><b>2</b>${t('Find it a place','Chọn nơi đặt')}</span><span><b>3</b>${t('Make something yours','Sáng tạo theo ý bạn')}</span></div></div><figure class="welcome-world">${harborArt()}<figcaption><span aria-hidden="true">✦</span><span>${t('Your first discovery is waiting.','Khám phá đầu tiên đang chờ bạn.')}<small>${t('Build, rearrange, and help a new friend.','Xây dựng, sắp xếp và giúp người bạn mới.')}</small></span></figcaption></figure></section>
 <section class="returning-travelers">${profiles.length?`<h2>${t('Who’s playing today?','Hôm nay ai cùng chơi?')}</h2><div class="profile-grid">${profiles.map(p=>btn(`<span class="avatar" aria-hidden="true">${esc(p.name.slice(0,1))}</span><strong>${esc(p.name)}</strong><small>${t('Continue the journey','Tiếp tục hành trình')}</small>`,'choose-profile',`data-id="${p.id}"`,'traveler')).join('')}</div>`:''}</section>
 <details class="arrival-tools"><summary>${t('Restore a backup','Khôi phục bản sao')}</summary>${btn(t('Choose a backup file','Chọn tệp sao lưu'),'import')}<p>${t('Travelers on this device are visible to people sharing this browser.','Người dùng chung trình duyệt có thể xem các hồ sơ trên thiết bị.')}</p></details>`;

}

function entryScreen(){return `<section class="entry-scene panel"><div class="entry-companion" aria-hidden="true">${islandArt('A1',1)}</div><div class="entry-form"><button class="back-link" data-action="entry-back">← ${t('Back','Quay lại')}</button><p class="eyebrow">${t('Nim saved you a place','Nim dành một chỗ cho bạn')}</p><h1>${t('Nim is ready to play.','Nim sẵn sàng chơi rồi.')}</h1><p>${t('Choose the feel you like. Every activity stays available.','Chọn phong cách bạn thích. Mọi hoạt động vẫn luôn có sẵn.')}</p><form data-form="create-profile" class="traveler-form"><label for="traveler-name">${t('Your nickname (optional)','Biệt danh của bạn (không bắt buộc)')}<input id="traveler-name" name="name" maxlength="40" autocomplete="off" placeholder="${t('Explorer','Nhà khám phá')}"></label><fieldset class="entry-modes"><legend>${t('What feels right for you?','Bạn thích phong cách nào?')}</legend>${[['kids',t('Play with Nim','Chơi cùng Nim'),t('Gentle prompts and playful encouragement','Hướng dẫn nhẹ nhàng, khích lệ vui tươi')],['balanced',t('Learn & play','Học và chơi'),t('A little discovery, a little practice','Khám phá và luyện tập cùng nhau')],['serious',t('Focus on English','Tập trung tiếng Anh'),t('Practice directly, with clear feedback','Luyện tập ngay, với phản hồi rõ ràng')]].map(([id,title,copy])=>`<label><input type="radio" name="mode" value="${id}" ${id==='balanced'?'checked':''}><span><strong>${title}</strong><small>${copy}</small></span></label>`).join('')}</fieldset><details class="family-options"><summary>${t('Set up a guardian connection (optional)','Liên kết người giám hộ (tùy chọn)')}</summary><label>${t('Profile type','Loại hồ sơ')}<select name="kind"><option value="independent">${t('Personal traveler','Người khám phá cá nhân')}</option><option value="dependent">${t('Guardian managed','Người giám hộ quản lý')}</option></select></label><label>${t('Guardian','Người giám hộ')}<select name="guardianId"><option value="">${t('Choose a guardian','Chọn người giám hộ')}</option>${profiles.filter(p=>p.kind==='independent').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label></details>${ui.cloudStatus.approved?`<label class="entry-cloud-choice"><input type="checkbox" name="cloudSave" checked> <span>${t('Save this new learner to','Lưu người học mới vào')} <strong translate="no">${esc(ui.cloudStatus.email??ui.cloudStatus.displayName??'')}</strong></span></label>`:''}<div class="button-row"><button class="primary" type="submit" name="start" value="play">${t('Let’s play →','Cùng chơi nào →')}</button><button type="submit" name="start" value="placement">${t('Help me find my starting point','Giúp tôi chọn nơi bắt đầu')}</button></div><p class="local-save-note">${t('Your adventure saves on this device. Sign in with Google whenever you want to connect it to your family account. Shared browsers share local travelers.','Hành trình lưu trên thiết bị này. Đăng nhập Google khi bạn muốn kết nối tài khoản gia đình. Người dùng chung trình duyệt có thể xem hồ sơ ở đây.')}</p></form>${ui.showCloud?cloudView({status:ui.cloudStatus,profile:null,language:language(),presentation:'inline'}):''}</div></section>`;}

function modeCards(){return `<div class="mode-cards">${[
 ['kids','✦',t('Play first','Chơi để học'),t('A free construction toy. Share words with a grown-up; try visitor requests when ready.','Tự do sắp xếp đồ vật. Cùng người lớn học từ; thử lời nhờ của khách khi sẵn sàng.')],
 ['balanced','◈',t('Learn & play','Học và chơi'),t('Make a harbor for Nim’s visitors. Understand their requests through what you build.','Tạo bến cảng cho khách của Nim. Hiểu lời nhờ qua những gì bạn sắp xếp.')],
 ['serious','⌘',t('Study first','Học tập trung'),t('A direct workspace with objectives, clear feedback and evidence.','Không gian tập trung với mục tiêu, phản hồi và bằng chứng học tập.')],
 ].map(([id,icon,label,description])=>`<button type="button" class="mode-card ${profile.settings.mode===id?'chosen':''}" data-action="mode" data-value="${id}" ${pressed(profile.settings.mode,id)}><span class="mode-icon">${icon}</span><strong>${label}</strong><span>${description}</span></button>`).join('')}</div>`;}
function onboardScreen(){return `<section class="onboard panel"><p class="onboard-progress">${t('Your traveler is ready · Step 2 of 3','Đã tạo người khám phá · Bước 2 trong 3')}</p><p class="eyebrow">${t('YOUR ATLAS, YOUR WAY','BẢN ĐỒ THEO CÁCH CỦA BẠN')}</p><h1>${t('Choose your way to explore.','Chọn cách khám phá của bạn.')}</h1><p class="lede">${t('Playful, balanced or focused: choose what feels good today. Every style keeps the same discoveries and learning progress.','Vui chơi, cân bằng hay tập trung: chọn cách bạn thích hôm nay. Mọi cách đều giữ nguyên khám phá và tiến độ học tập.')}</p>${modeCards()}<div class="settings-grid"><label>${t('Guidance language','Ngôn ngữ hướng dẫn')}<select data-setting="language"><option value="en"${selected(profile.settings.language,'en')}>English only</option><option value="vi"${selected(profile.settings.language,'vi')}>Tiếng Việt hỗ trợ</option></select></label></div><details class="range-options"><summary>${t('Already know your English level? Choose a starting region.','Đã biết trình độ tiếng Anh? Chọn vùng đất khởi đầu.')}</summary><div class="settings-grid"><label>${t('Starting practice range','Mức luyện tập ban đầu')}<select data-journey="region">${LEVELS.map(level=>`<option${selected(profile.journey.region,level)}>${level}</option>`).join('')}</select></label></div><p class="fineprint">${t('This is a practice choice, not a test result. You can explore another range whenever you like.','Đây là lựa chọn luyện tập, không phải kết quả đánh giá. Bạn có thể khám phá mức khác bất cứ lúc nào.')}</p></details><div class="onboard-next"><div class="button-row">${btn(t('Start exploring →','Bắt đầu khám phá →'),'finish-onboard','','primary')}${btn(t('Help me find a starting point','Giúp tôi chọn nơi bắt đầu'),'start-placement','','text-button')}</div><p class="fineprint">${t('Start with a gentle first island, or try the optional reading orientation. You can change these preferences later.','Bắt đầu ở hòn đảo nhẹ nhàng hoặc thử bài định hướng đọc tùy chọn. Bạn có thể đổi tùy chọn sau.')}</p></div></section>`;}

function atlasScreen(){
 const level=profile.journey.region,r=REGIONS.find(r=>r.level===level),missions=availableMissions(pack,level,progress),done=missions.filter(m=>m.complete).length,next=nextMission(pack,level,profile.settings.mode==='serious'?{...progress,rewards:progress.completedMissions}:progress);
 return `${profile.settings.mode==='kids'?`<section class="kids-play-choice panel"><span class="nim-face" aria-hidden="true">✦</span><div><h2>${t('How shall we play today?','Hôm nay mình chơi gì?')}</h2><p>${t('Not reading yet? Explore six pictures with a grown-up. Ready for written clues? Open a story adventure below.','Chưa biết đọc? Cùng người lớn khám phá sáu bức tranh. Đọc được manh mối rồi? Mở truyện phiêu lưu bên dưới.')}</p><div class="button-row">${btn(t('Play with pictures','Chơi với tranh'),'picture-play','','primary')}${next?btn(t('Open a story adventure','Mở truyện phiêu lưu'),'begin',`data-id="${next.id}"`):''}</div><p class="fineprint">${t('Picture play is shared practice, with no CEFR score. Stories need reading support where appropriate.','Chơi với tranh là luyện tập cùng người lớn, không chấm CEFR. Truyện có thể cần hỗ trợ đọc.')}</p></div></section>`:''}${practiceBanner()}<section class="hero"><div class="hero-copy"><p class="eyebrow">${t('CHAPTER','CHƯƠNG')} ${LEVELS.indexOf(level)+1} / 6 · ${level}</p><h1>${esc(loc(r.name))}</h1><p class="lede">${esc(loc(r.description))}</p><p>${profile.settings.mode==='kids'?t('Nim found a folded map. Each discovery brings a little more of this world to life. Ready to help?','Nim tìm thấy tấm bản đồ gấp. Mỗi khám phá làm thế giới thêm sống động. Bạn giúp Nim nhé?'):profile.settings.mode==='serious'?t('Read, retrieve, construct and reflect. World completion and independent language evidence are tracked separately.','Đọc, nhớ lại, xây dựng và suy ngẫm. Hoàn thành thế giới và bằng chứng ngôn ngữ độc lập được ghi riêng.'):t('The map is unfinished. Follow a clue, make a plan, and leave this place a little brighter than you found it.','Bản đồ còn dang dở. Theo manh mối, lập kế hoạch và làm nơi này sáng hơn lúc bạn đến.')}</p><div class="button-row">${next?btn(t('Continue the journey →','Tiếp tục hành trình →'),'begin',`data-id="${next.id}"`,'primary'):btn(t('Visit your discoveries →','Xem các khám phá →'),'journal','','primary')}${progress.due.length?btn(`${t('Review ready','Đến lúc ôn')} · ${progress.due.length}`,'review'):''}</div><div class="hero-meta"><span>◇ ${done}/${missions.length} ${t('discoveries','khám phá')}</span><span>◎ ${level} ${t('practice range','mức luyện tập')}</span></div></div><div class="hero-world">${islandArt(level,done)}<span class="world-caption">${t('A little more unfolds with every discovery.','Mỗi khám phá mở thêm một phần thế giới.')}</span></div></section>
 <section aria-label="${t('Regions','Các vùng')}"><div class="region-strip">${REGIONS.map(region=>{const n=pack.missions.filter(m=>m.level===region.level&&progress.rewards.has(m.id)).length;return `<button type="button" class="region-tab ${level===region.level?'active':''}" data-action="region" data-value="${region.level}" ${pressed(level,region.level)}>${emblem(region.icon)}<span><strong>${region.level}</strong><small>${esc(loc(region.name))}</small></span>${n?`<span class="region-count">${n}</span>`:''}</button>`;}).join('')}</div></section>
 <section class="expeditions"><div class="section-heading"><div><p class="eyebrow">${t('FOLLOW YOUR CURIOSITY','THEO TRÍ TÒ MÒ')}</p><h2>${profile.settings.mode==='serious'?t('Learning path','Lộ trình học'):t('An unfinished corner of the world','Một góc thế giới còn dang dở')}</h2></div><span class="fineprint">${t('Explore any band. Unlock each region’s path through play.','Khám phá mọi mức. Mở lộ trình mỗi vùng bằng cách chơi.')}</span></div><div class="mission-grid">${missions.map(({mission:m,unlocked,complete},i)=>`<article class="mission-card ${!unlocked?'locked':''}"><div class="card-top"><span class="chapter-number">0${i+1}</span>${emblem(r.icon)}<span class="chip">${complete?t('Discovered','Đã khám phá'):progress.completedMissions.has(m.id)?t('Field clues complete','Đã xong manh mối'):unlocked?t('Ready to explore','Sẵn sàng'):t('Along the path','Trên lộ trình')}</span></div><h3>${esc(loc(m.title))}</h3><p>${esc(loc(m.summary))}</p><p class="card-objective">${esc(loc(m.objective))}</p><div class="card-bottom"><span>5 ${t('moments','chặng')} · ${m.level}</span>${btn(complete?t('Revisit ↗','Trở lại ↗'):unlocked?t('Explore →','Khám phá →'):t('Complete earlier path','Hoàn thành chặng trước'),'begin',`data-id="${m.id}" ${unlocked?'':'disabled'}`,unlocked?'text-button':'')}</div></article>`).join('')}</div></section>
 <aside class="observatory-invitation"><div>${emblem('star')}<h3>${t('A little light at the old observatory','Một chút ánh sáng ở đài quan sát cũ')}</h3><p>${t('Give Nim a plan. Move a mirror. See what changes when the mist rolls in. A free construction sandbox, separate from assessed learning.','Lập kế hoạch cho Nim. Xoay gương. Xem điều gì đổi khi sương đến. Không gian thử nghiệm tự do, tách biệt đánh giá học tập.')}</p></div><a class="button" href="./observatory.html">${t('Visit the observatory ↗','Đến đài quan sát ↗')}</a></aside>`;
}

function practiceBanner(){
 if(progress.rewards.size===pack.missions.length)return `<aside class="atlas-finale"><div class="finale-emblems">${REGIONS.map(r=>emblem(r.icon)).join('')}</div><p class="eyebrow">${t('A WORLD UNFOLDED BY YOU','THẾ GIỚI DO BẠN MỞ RA')}</p><h2>${t('The last fold opens onto a new beginning.','Nếp gấp cuối mở ra một khởi đầu mới.')}</h2><p>${t('Nim sets down the finished map. There is a place for every discovery—and room in the margins for everything you will learn next. Your journeys remain here to revisit.','Nim đặt tấm bản đồ hoàn chỉnh xuống. Mỗi khám phá có một chỗ, và lề giấy vẫn dành cho điều bạn sẽ học tiếp. Mọi hành trình ở đây để bạn trở lại.')}</p>${btn(t('Open my field journal →','Mở nhật ký của mình →'),'journal','','primary')}</aside>`;
 const suggestion=suggestPractice(progress,profile.journey.region);
 if(suggestion.action==='review')return `<aside class="practice-suggestion"><p>${t('A couple of recent clues deserve another look. A short review may help.','Một vài manh mối gần đây đáng xem lại. Ôn ngắn có thể giúp bạn.')}</p>${btn(t('Try targeted practice →','Luyện tập trọng tâm →'),'review','','text-button')}</aside>`;
 if(suggestion.action==='region')return `<aside class="practice-suggestion"><p>${t('Your recent independent responses suggest trying a stretch expedition. This is a practice suggestion, not a level award.','Các câu trả lời độc lập gần đây gợi ý thử chuyến khám phá khó hơn. Đây là gợi ý luyện tập, không phải chứng nhận lên trình độ.')}</p>${btn(`${t('Explore','Khám phá')} ${suggestion.level} →`,'region',`data-value="${suggestion.level}"`,'text-button')}</aside>`;
 return '';
}

function activityControls(a,placement=false){
 const disabled=Boolean(ui.feedback);const attr=disabled?'disabled':'';
 if(a.type==='choice')return `<div class="choice-grid">${shuffle(a.options,a.id).map((o,i)=>`<button type="button" class="choice ${ui.answer===o.id?'chosen':''}" data-action="choose" data-value="${o.id}" ${pressed(ui.answer,o.id)} ${attr}><span class="choice-letter">${String.fromCharCode(65+i)}</span><span lang="en">${esc(o.text)}</span>${profile.settings.mode==='kids'?'<span class="choice-arrow" aria-hidden="true">✦</span>':''}</button>`).join('')}</div>`;
 if(a.type==='gap')return `<label class="answer-label">${t('Your answer','Câu trả lời')}<input id="answer-input" class="gap-input" data-answer="gap" value="${esc(ui.answer??'')}" maxlength="500" autocomplete="off" spellcheck="false" lang="en" ${attr} placeholder="${t('Type the missing word(s)…','Nhập từ còn thiếu…')}"></label>`;
 if(a.type==='order')return `<div class="order-workspace"><p class="fineprint">${t('Use the arrows to arrange the pieces. No dragging required.','Dùng mũi tên để xếp các mảnh. Không cần kéo thả.')}</p><ol class="order-list">${ui.answer.map((id,i)=>{const token=a.tokens.find(t=>t.id===id);return `<li><span class="order-number">${i+1}</span><span lang="en">${esc(token.text)}</span><div>${btn('↑','move',`data-id="${id}" data-dir="-1" ${i===0||disabled?'disabled':''} aria-label="${t('Move up','Đưa lên')}: ${esc(token.text)}"`)}${btn('↓','move',`data-id="${id}" data-dir="1" ${i===ui.answer.length-1||disabled?'disabled':''} aria-label="${t('Move down','Đưa xuống')}: ${esc(token.text)}"`)}</div></li>`;}).join('')}</ol></div>`;
 if(a.type==='match')return `<div class="match-grid">${a.pairs.map(p=>`<label class="match-row"><span lang="en">${esc(p.left)}</span><span aria-hidden="true">→</span><select data-match="${p.id}" ${attr} lang="en"><option value="">${t('Choose its connection','Chọn liên kết')}</option>${shuffle(a.pairs,a.id).map(q=>`<option value="${q.id}"${selected(ui.answer?.[p.id],q.id)}>${esc(q.right)}</option>`).join('')}</select></label>`).join('')}</div>`;
 return `<label class="answer-label">${t('Your field note','Ghi chép của bạn')}<textarea data-answer="writing" rows="5" maxlength="5000" lang="en" ${attr} placeholder="${t('Leave a little English in the world…','Để lại đôi dòng tiếng Anh…')}">${esc(ui.answer?.text??'')}</textarea></label><div class="rubric"><p><strong>${t('Self-review, not automatic scoring','Tự xem lại, không chấm điểm tự động')}</strong></p>${a.rubric.map((r,i)=>`<label><input type="checkbox" data-check="${i}" ${ui.answer?.checks.includes(i)?'checked':''} ${attr}>${esc(loc(r))}</label>`).join('')}</div>${!placement?btn(t('Compare with one possible example','So với một ví dụ tham khảo'),'model','','text-button'):''}${ui.showModel?`<blockquote lang="en">${esc(a.example)}</blockquote>`:''}`;
}
function feedbackView(a){
 const f=ui.feedback;if(!f)return '';
 return `<section class="feedback ${f.correct===false?'try-again':'success'}" role="status" tabindex="-1"><span class="feedback-symbol">${f.correct===false?'↻':'✦'}</span><div><h3>${f.correct===null?t('A field note worth keeping','Ghi chép đáng giữ lại'):f.correct?t('A connection made.','Bạn đã kết nối được.'):t('A clue for your next try.','Manh mối cho lần thử tiếp theo.')}</h3><p>${esc(loc(a.explanation))}</p>${f.correct===false?`<p class="solution"><strong>${t('One accepted answer:','Một câu trả lời được chấp nhận:')}</strong> <span lang="en">${esc(solution(a))}</span></p>`:''}${f.correct===null?`<p class="fineprint">${t('Your writing is saved as self-reviewed practice. This does not show independently assessed writing proficiency.','Bài viết được lưu là luyện tập tự xem lại, không phải bằng chứng năng lực viết đã được đánh giá độc lập.')}</p>`:ui.supported?`<p class="fineprint">${t('Supported practice: the discovery counts, but this is not independent evidence.','Luyện tập có hỗ trợ: khám phá được ghi nhận, nhưng không là bằng chứng độc lập.')}</p>`:''}<div class="button-row">${f.correct===false?btn(t('Revise my plan','Sửa câu trả lời'),'retry','','primary'):btn(t(ui.screen==='quick'?'Next task →':ui.review?'Return to practice':'Keep exploring →',ui.screen==='quick'?'Câu tiếp theo →':ui.review?'Trở lại ôn tập':'Tiếp tục khám phá →'),'next','','primary')}${f.correct===false?btn(t('Continue and revisit later','Tiếp tục và ôn lại sau'),'next'):''}</div></div></section>`;
}

function clueScene(m,a,r,done){return `<section class="kids-clue panel"><div class="clue-illustration">${islandArt(m.level,done)}</div><div><span class="nim-avatar" aria-hidden="true">✦</span><p class="eyebrow">${t('LOOK WHAT NIM FOUND','XEM NIM TÌM ĐƯỢC GÌ')}</p><h1>${t('A little clue. A new possibility.','Manh mối nhỏ. Khả năng mới.')}</h1><p>${esc(loc(a.instruction))}</p><section class="source-card"><p lang="en">${esc(a.context)}</p></section>${btn(t('I’m ready to try →','Mình sẵn sàng thử →'),'ready','','primary')} ${btn(t('Save & return to the map','Lưu và về bản đồ'),'atlas','','text-button')}</div></section>`;}
function discoveryScene(m,r,done){return `<section class="discovery-scene panel"><div class="discovery-art">${islandArt(m.level,done)}</div><p class="eyebrow">${t('THE WORLD OPENS A LITTLE MORE','THẾ GIỚI MỞ THÊM MỘT CHÚT')}</p><h1>${done===5?t('The field clues are connected.','Các manh mối đã kết nối.'):t('One more piece found its place.','Thêm một mảnh đã tìm được chỗ.')}</h1><p class="lede">${done===5?t('Your place is restored. Bring your discovery home.','Bạn đã khôi phục nơi này. Mang khám phá về thôi.'):t(`${done} of 5 connections restored. Nim is keeping your discoveries safe.`,`${done} trong 5 kết nối đã được khôi phục. Nim giữ các khám phá giúp bạn.`)}</p><div class="discovery-pieces" aria-label="${done}/5">${m.activities.map(a=>`<span class="${progress.records[a.id]?.completed?'found':''}">${emblem(r.icon)}</span>`).join('')}</div>${btn(done===5?t('See my discovery →','Xem khám phá của mình →'):t('Follow the next clue →','Theo manh mối tiếp →'),'trail-next','','primary')}</section>`;}


function responseWorkspace(a,mode){return `<div class="activity-panel panel"><div class="activity-top"><span class="activity-kind">${esc(adventureStep(a,language()))}</span>${btn(ui.screen==='quick'?t('Choose another activity','Chọn hoạt động khác'):t('Back to this place','Về nơi này'),ui.screen==='quick'?'home':'world','','text-button')}</div><p class="instruction">${esc(loc(a.instruction))}</p><section class="source-card"><div class="source-title"><span>${ui.screen==='quick'?t('Read this','Đọc đoạn này'):t('Your clue','Manh mối của bạn')}</span>${(profile.settings.sound||mode==='kids')?btn(t('Hear the clue','Nghe manh mối'),'speak','','text-button'):''}</div><p lang="en" translate="no">${esc(a.context)}</p></section><h2 class="activity-prompt" lang="en" translate="no">${esc(a.prompt)}</h2>${activityControls(a)}${!ui.feedback?`<div class="activity-actions">${btn(mode==='kids'?t('Try it ✦','Thử nào ✦'):mode==='balanced'?t('Make the connection →','Kết nối nào →'):t('Check my response','Kiểm tra câu trả lời'),'submit','','primary')}${a.type!=='writing'?btn(t('Help me with an example','Xem ví dụ hỗ trợ'),'reveal','','text-button'):''}</div>${ui.showModel&&a.type!=='writing'?`<div class="hint-card"><strong>${t('Supported practice','Luyện tập có hỗ trợ')}</strong><p lang="en">${esc(solution(a))}</p></div>`:''}`:''}${feedbackView(a)}<p class="fineprint activity-save"><span class="draft-status" role="status">${ui.feedback?t('Response saved on this device','Đã lưu câu trả lời trên thiết bị'):t('Drafts save as you play','Bản nháp lưu khi bạn chơi')}</span></p></div>`;}
function missionScreen(){
 const m=currentMission(),a=currentActivity(),mode=profile.settings.mode,r=REGIONS.find(r=>r.level===m.level),done=m.activities.filter(a=>progress.records[a.id]?.completed).length;
 if(ui.stage==='route')return worldView();
 if(mode==='kids'&&ui.stage==='discovery')return discoveryScene(m,r,done);
 if(mode==='kids'&&ui.stage==='clue')return adventureView({mission:m,progress,mode,language:language(),activeId:a.id,workspace:`<section class="clue-preview">${btn(t("← This place","← Về nơi này"),"world","","back-link")}<span class="nim-face" aria-hidden="true">✦</span><h2>${esc(adventureStep(a,language()))}</h2><p>${esc(loc(a.instruction))}</p><section class="source-card"><p lang="en">${esc(a.context)}</p></section><div class="button-row">${btn(t('Hear the clue','Nghe manh mối'),'speak','','text-button')}${btn(t('Let’s try →','Cùng thử nhé →'),'ready','','primary')}</div><p class="fineprint">${t('A grown-up can help you read. Asking for help is always welcome.','Người lớn có thể giúp bạn đọc. Bạn luôn có thể nhờ giúp đỡ.')}</p></section>`});
 if(mode!=='serious'||ui.stage==='world'||ui.stage==='intro')return adventureView({mission:m,progress,mode,language:language(),intro:ui.stage==='intro',activeId:ui.stage==='activity'?a.id:null,workspace:ui.stage==='activity'?responseWorkspace(a,mode):''});
 return `<section class="study-session"><div class="expedition-header">${btn('← '+t('Learning path','Lộ trình học'),'atlas','','back-link')}<span class="chip">${m.level} · ${done}/5</span></div><h1>${esc(loc(m.title))}</h1><p>${esc(loc(m.objective))}</p><nav class="study-steps" aria-label="${t('Activities','Hoạt động')}">${m.activities.map((x,i)=>btn(`${i+1}. ${esc(adventureStep(x,language()))}${progress.records[x.id]?.completed?' ✓':''}`,'activity',`data-id="${x.id}" ${x.id===a.id?'aria-current="step"':''}`)).join('')}</nav>${responseWorkspace(a,mode)}</section>`;
}

function workshopCollection(){
 const state=workshopState();
 return `<section class="panel workshop-collection"><h2>${t('Made with Nim','Sáng tạo cùng Nim')}</h2><p>${t('Saved creations and reading practice are separate from your study results. A completed scene is not proof of proficiency.','Tác phẩm và luyện đọc được ghi riêng với kết quả học. Hoàn thành cảnh không chứng minh trình độ.')}</p><div class="workshop-postcards">${workshopBriefs.filter(b=>state.completed.has(b.id)).map(b=>{const record=state.completed.get(b.id);return `<article>${creationPreview(record.placement)}<h3>${esc(loc(b.title))}</h3><p>${record.independent?t('Matched without recorded hints or corrections','Khớp yêu cầu, không ghi nhận gợi ý hay sửa lỗi'):t('Made with practice or support','Hoàn thành qua luyện tập hoặc hỗ trợ')}</p>${btn(t('Build again','Tạo lại'),'workshop-revisit',`data-value="${b.id}"`)}</article>`;}).join('')||`<p>${t('Your first creation starts with a toy and a place.','Tác phẩm đầu tiên bắt đầu với đồ vật và nơi đặt.')}</p>`}</div>${btn(t('Return to Nim','Trở lại với Nim'),'atlas','','primary')}</section>`;
}
function journalScreen(){
 const records=Object.values(progress.records),graded=records.filter(r=>content().activities.get(r.id).type!=='writing');
 const focuses=new Map();for(const r of graded){const f=focuses.get(r.focus)??{attempts:0,correct:0};f.attempts+=r.attempts;f.correct+=r.correct;focuses.set(r.focus,f);}
 return `<section class="page-heading"><p class="eyebrow">${t('YOUR FIELD JOURNAL','NHẬT KÝ KHÁM PHÁ')}</p><h1>${t('Look how far curiosity takes you.','Trí tò mò đưa bạn đi thật xa.')}</h1><p class="lede">${t('Discoveries tell your story. Evidence helps choose what to practice next.','Khám phá kể câu chuyện của bạn. Bằng chứng giúp chọn nội dung luyện tiếp.')}</p></section>${workshopCollection()}<div class="stats-grid">${[[progress.rewards.size,t('World discoveries','Khám phá thế giới')],[progress.independent,t('Items answered independently','Mục trả lời độc lập')],[progress.retained,t('Items recalled across 3+ days','Mục nhớ lại qua 3+ ngày')],[progress.due.length,t('Ready for review','Sẵn sàng ôn')]].map(([v,l])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><div class="journal-grid"><section class="panel"><h2>${t('Language evidence','Bằng chứng ngôn ngữ')}</h2>${LEVELS.map(level=>{const rr=graded.filter(r=>r.level===level),n=rr.filter(r=>r.independent>0).length,total=pack.missions.filter(m=>m.level===level).flatMap(m=>m.activities).filter(a=>a.type!=='writing').length;return `<div class="level-evidence"><strong>${level}</strong><progress max="${total||1}" value="${n}" aria-label="${level} ${t('independent items','mục độc lập')}"></progress><span>${n}/${total}</span></div>`;}).join('')}<p class="fineprint">${t('These counts describe this library, not percentage mastery of a CEFR band. Reading and language-use items are automatically checked; writing is self-reviewed. Listening and speaking proficiency are not scored.','Số liệu mô tả thư viện này, không phải phần trăm thành thạo một mức CEFR. Đọc và sử dụng ngôn ngữ được kiểm tra tự động; viết do bạn tự xem lại. Không chấm năng lực nghe và nói.')}</p><p>${t('Practice suggestion','Gợi ý luyện tập')}: <strong>${progress.recommendation?.level??profile.journey.region}</strong> <span class="chip">${t('provisional','tạm thời')}</span></p>${btn(t('Revisit orientation','Làm lại định hướng'),'start-placement','','text-button')}</section><section class="panel"><h2>${t('Your discoveries','Các khám phá của bạn')}</h2>${progress.rewards.size?`<ul class="collection">${pack.missions.filter(m=>progress.rewards.has(m.id)).map(m=>`<li>${emblem(REGIONS.find(r=>r.level===m.level).icon)}<div><strong>${esc(loc(m.reward))}</strong><small>${m.level} · ${esc(loc(m.title))}</small></div>${btn('↗','begin',`data-id="${m.id}" aria-label="${esc(loc(m.title))}"`)}</li>`).join('')}</ul>`:`<div class="empty-state">${emblem('feather')}<p>${t('An empty page is an invitation. Your first discovery is waiting.','Trang trống là lời mời. Khám phá đầu tiên đang chờ bạn.')}</p>${btn(t('Explore the atlas','Khám phá bản đồ'),'atlas','','primary')}</div>`}</section></div><section class="panel"><h2>${t('Recent field notes','Ghi chép gần đây')}</h2>${progress.pictureFinds.size?`<p>${t('Picture-play collection','Bộ sưu tập tranh')}: ${progress.pictureFinds.size}/6 · ${t('Shared practice, separate from English evidence.','Luyện tập cùng nhau, tách biệt bằng chứng tiếng Anh.')}</p>`:''}${records.filter(r=>r.last.result.correct===null).length?records.filter(r=>r.last.result.correct===null).slice(-8).reverse().map(r=>`<details data-disclosure="writing-${esc(r.id)}"><summary>${esc(loc(content().missions.get(r.missionId).title))} · ${new Date(r.last.at).toLocaleDateString(profile.settings.language)}</summary><p class="writing-entry" lang="en">${esc(r.last.answer.text)}</p><p class="fineprint">${t('Self-reviewed practice. Not automatically graded.','Luyện tập tự xem lại. Không chấm tự động.')}</p></details>`).join(''):`<p>${t('Notes you write on your journeys will appear here.','Ghi chép trên hành trình sẽ hiện ở đây.')}</p>`}</section>`;
}

function reviewScreen(){
 const due=progress.due,weak=Object.values(progress.records).filter(r=>r.last.result.correct===false&&!due.some(d=>d.id===r.id));
 const recommended=[...due,...weak];
 return `<section class="page-heading"><p class="eyebrow">${t('THE RETURN JOURNEY','HÀNH TRÌNH TRỞ LẠI')}</p><h1>${t('Some things are worth finding again.','Có những điều đáng tìm lại.')}</h1><p class="lede">${t('A little retrieval keeps a discovery close. Reviews are invitations; missed days never erase your progress.','Nhớ lại một chút giúp khám phá ở lại. Ôn tập là lời mời; bỏ một ngày không xóa tiến độ.')}</p></section><aside class="studio-invitation"><div><h2>${t('Visit the echo studio','Ghé phòng tiếng vang')}</h2><p>${t('Listen to a clue, retell it aloud, and compare with the transcript. Optional, ungraded practice.','Nghe manh mối, kể lại thành tiếng và so với lời thoại. Luyện tập tùy chọn, không chấm điểm.')}</p></div>${btn(t('Listen & speak ↗','Luyện nghe và nói ↗'),'studio','','primary')}</aside><section class="panel"><div class="section-heading"><h2>${recommended.length?t('Your practice satchel','Túi luyện tập'):t('You have room to explore.','Bạn có thể khám phá tiếp.')}</h2><span>${recommended.length} ${t('suggestions','gợi ý')}</span></div>${recommended.length?`<div class="review-list">${recommended.slice(0,20).map(r=>{const a=content().activities.get(r.id);return `<article><span class="chip">${r.level}</span><div><h3>${esc(loc(content().missions.get(r.missionId).title))}</h3><p lang="en">${esc(a.focus.replace(/-/g,' '))}</p><small>${r.last.result.correct===false?t('A recent difficulty — try retrieving before opening the answer.','Điểm cần luyện — thử nhớ lại trước khi xem đáp án.'):t('Scheduled recall','Nhớ lại theo lịch')}</small></div>${btn(t('Practice →','Ôn tập →'),'review-item',`data-id="${a.id}"`,'primary')}</article>`;}).join('')}</div>`:`<div class="empty-state">${emblem('leaf')}<p>${t('Nothing is due right now. Continue an expedition or revisit a favorite discovery.','Chưa có mục đến hạn. Tiếp tục chuyến khám phá hoặc trở lại khám phá yêu thích.')}</p>${btn(t('Open the atlas','Mở bản đồ'),'atlas','','primary')}</div>`}<details><summary>${t('How review works','Cách ôn tập hoạt động')}</summary><p class="fineprint">${t('Scheduling uses a simple 1, 3, 7, 14, 30 day heuristic after independent recall on different days. Mistakes return sooner. It is a useful practice aid, not a validated memory model.','Lịch ôn dùng quy tắc đơn giản 1, 3, 7, 14, 30 ngày sau khi nhớ lại độc lập vào các ngày khác nhau. Mục sai trở lại sớm hơn. Đây là công cụ hỗ trợ, không phải mô hình trí nhớ đã được kiểm định.')}</p></details></section>`;
}

function studioScreen(){return studioView({missions:pack.missions,level:profile.journey.region,language:profile.settings.language,activityId:ui.studioId});}
function currentStudioActivity(){const activities=[...content().activities.values()].filter(a=>a.level===profile.journey.region&&a.skill==='reading');return activities.find(a=>a.id===ui.studioId)??activities[0];}
function speakText(text){if(!('speechSynthesis'in window))throw new Error(t('Read-aloud is unavailable. You can still read the transcript and rehearse aloud.','Không có giọng đọc. Bạn vẫn có thể đọc lời thoại và luyện nói.'));speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text),profileId=profile.id;voice.lang='en-GB';voice.rate=profile.journey.region==='A1'?.85:1;voice.onerror=event=>{if(profile?.id===profileId&&ui.screen==='little'&&!['canceled','interrupted'].includes(event.error)){ui.littleVoiceFailed=true;render();return;}if(profile?.id===profileId&&!['canceled','interrupted'].includes(event.error))reportError(new Error(t('The browser voice could not play. Read the transcript and rehearse aloud, or try another device voice.','Giọng đọc không phát được. Hãy đọc lời thoại và luyện nói, hoặc thử giọng khác trên thiết bị.')));};speechSynthesis.speak(voice);}

function cloudPanel(){return cloudView({status:ui.cloudStatus,profile,language:language(),open:Boolean(ui.showCloud)});}

function settingsScreen(){return `<section class="page-heading"><p class="eyebrow">${t('MAKE YOURSELF AT HOME','THOẢI MÁI THEO CÁCH CỦA BẠN')}</p><h1>${t('A journey that fits you.','Hành trình phù hợp với bạn.')}</h1><p>${t('Preferences never change your learning evidence or erase discoveries.','Tùy chọn không thay đổi bằng chứng học tập hay xóa khám phá.')}</p></section><section class="panel"><h2>${t('Experience','Trải nghiệm')}</h2>${modeCards()}<div class="settings-grid"><label>${t('Guidance language','Ngôn ngữ hướng dẫn')}<select data-setting="language"><option value="en"${selected(profile.settings.language,'en')}>English only</option><option value="vi"${selected(profile.settings.language,'vi')}>Tiếng Việt hỗ trợ</option></select></label><label>${t('Visual quality','Chất lượng hình ảnh')}<select data-setting="quality">${['auto','eco','balanced','ultra'].map(q=>`<option value="${q}"${selected(profile.settings.quality,q)}>${{auto:t('Auto — adapt to this device','Tự động — theo thiết bị'),eco:t('Eco — quiet & lightweight','Tiết kiệm — nhẹ và tĩnh'),balanced:t('Balanced — a little atmosphere','Cân bằng — thêm không khí'),ultra:t('Ultra — richer atmosphere','Cao — phong phú hơn')}[q]}</option>`).join('')}</select></label><label>${t('Motion','Chuyển động')}<select data-setting="motion">${[['system',t('Follow device preference','Theo thiết bị')],['reduced',t('Reduce motion','Giảm chuyển động')],['full',t('Allow gentle motion','Cho phép chuyển động nhẹ')]].map(([v,l])=>`<option value="${v}"${selected(profile.settings.motion,v)}>${l}</option>`).join('')}</select></label><label>${t('Read-aloud assistance','Hỗ trợ đọc thành tiếng')}<select data-setting="sound"><option value="false"${selected(String(profile.settings.sound),'false')}>${t('Off','Tắt')}</option><option value="true"${selected(String(profile.settings.sound),'true')}>${t('Available on request','Đọc khi yêu cầu')}</option></select></label></div><p class="fineprint">${t('All quality levels have the same content. Auto starts with device signals and can lower decorative quality if frames are slow. Read-aloud uses your browser’s available voices, which may use its voice service; it is optional practice support, not a listening test.','Mọi chất lượng đều có cùng nội dung. Tự động dùng tín hiệu thiết bị và có thể giảm trang trí khi khung hình chậm. Đọc thành tiếng dùng giọng sẵn có của trình duyệt, có thể dùng dịch vụ giọng nói; đây là hỗ trợ tùy chọn, không phải bài đánh giá nghe.')}</p></section><section class="panel"><h2>${t('Your profile & backups','Hồ sơ và bản sao lưu')}</h2><p class="offline-status" role="status">${ui.offlineReady?t('Offline library ready on this device.','Thư viện ngoại tuyến đã sẵn sàng trên thiết bị.'):t('Offline library not yet confirmed. Keep a connection until the first full download finishes.','Chưa xác nhận thư viện ngoại tuyến. Giữ kết nối cho đến khi tải xong lần đầu.')}</p><form class="form-row" data-form="rename"><label>${t('Display name','Tên hiển thị')}<input name="name" value="${esc(profile.name)}" maxlength="40" required></label><button type="submit">${t('Save name','Lưu tên')}</button></form><p>${t('Local progress is private to this browser’s storage, but is accessible to other people using this browser. Export regularly before clearing site data.','Tiến độ nằm trong bộ nhớ trình duyệt và có thể được xem bởi người dùng chung trình duyệt. Hãy xuất bản sao trước khi xóa dữ liệu trang.')}</p><div class="button-row">${btn(t('Export available learners','Xuất người học hiện có'),'export','','primary')}${btn(t('Import / merge a backup','Nhập / gộp bản sao'),'import')}${btn(t('Request persistent device storage','Yêu cầu lưu trữ bền vững'),'persist')}</div><p class="fineprint">${t('Backups contain names and written practice. Keep them somewhere private. Imports keep existing progress and check for conflicting copies.','Bản sao chứa tên và bài viết luyện tập. Hãy giữ ở nơi riêng tư. Nhập bản sao giữ tiến độ hiện có và kiểm tra các bản mâu thuẫn.')}</p>${cloudPanel()}</section><section class="panel"><h2>${t('Family care','Đồng hành gia đình')}</h2><p>${t('A guardian can create dependent travelers, help choose their practice and view their journal on this device. Mode is a preference, not an age claim. These controls do not lock the shared browser.','Người giám hộ có thể tạo hồ sơ phụ thuộc, hỗ trợ chọn bài và xem nhật ký trên thiết bị này. Chế độ là sở thích, không xác định tuổi. Các chức năng không khóa trình duyệt dùng chung.')}</p>${profile.kind==='dependent'?`<p>${t('Guardian','Người giám hộ')}: <strong>${esc(profiles.find(p=>p.id===profile.guardianId)?.name??'—')}</strong></p>`:`<ul class="family-list">${profiles.filter(p=>p.guardianId===profile.id).map(p=>`<li><span>${esc(p.name)}</span>${btn(t('Open journal & preferences','Mở nhật ký và tùy chọn'),'dependent',`data-id="${p.id}"`)}</li>`).join('')}</ul>${btn(t('Add a family traveler','Thêm thành viên gia đình'),'profiles')}`}</section><section class="panel"><h2>${t('About this atlas','Về bản đồ này')}</h2><p>${t('Reading-based learning expeditions across A1–C2. This is a finite foundation library, not a complete CEFR course. Automated checking covers bounded reading/language tasks. Writing is self-reviewed; speaking and listening are not assessed. No paid AI runs in the game.','Các chuyến khám phá qua đọc từ A1–C2. Đây là thư viện nền tảng hữu hạn, không phải khóa học CEFR hoàn chỉnh. Kiểm tra tự động giới hạn ở đọc và sử dụng ngôn ngữ. Viết do bạn tự xem lại; không đánh giá nói và nghe. Trò chơi không chạy AI trả phí.')}</p><details><summary>${t('Content references & rights','Nguồn tham khảo và quyền sử dụng')}</summary>${pack.provenance.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><br><small>${esc(s.usage)}</small></p>`).join('')}</details><details class="danger"><summary>${t('Remove this local profile','Xóa hồ sơ trên thiết bị')}</summary><p>${t('Export first if you want a recovery copy. This removes local history only. Cloud copies must be deleted separately. Guardians with dependent profiles cannot be removed until those dependents are removed.','Xuất bản sao trước nếu cần khôi phục. Việc này chỉ xóa lịch sử trên thiết bị. Bản đám mây phải xóa riêng. Không thể xóa người giám hộ còn hồ sơ phụ thuộc.')}</p><form data-form="delete"><label>${t('Type the display name to confirm','Nhập tên hiển thị để xác nhận')}<input name="confirm" autocomplete="off" required></label><button type="submit" class="danger-button">${t('Delete local profile','Xóa hồ sơ thiết bị')}</button></form>${ui.cloudStatus.approved&&profile.cloudOwnerUid===ui.cloudStatus.uid?btn(t('Delete this profile’s cloud copy','Xóa bản đám mây của hồ sơ'),'cloud-delete'):''}</details></section>`;}

function startPlacement(){ui.screen='starting';ui.answer=null;ui.feedback=null;render(true);}
function placementExposures(){return [...new Set(events.flatMap(e=>e.payload?.sessionId===ui.placementSession?[]:e.kind==='placement'?(e.payload.responses??[]).map(r=>r.activityId):['attempt','support','draft'].includes(e.kind)?[e.payload.activityId]:[]).filter(Boolean))];}
function preparePlacementItem(){
 const item=nextPlacementItem(ui.placement,placementItems,content().activities,assess,placementExposures());
 ui.placementActivity=item?.activityId??null;ui.feedback=null;ui.showModel=false;
 const a=content().activities.get(ui.placementActivity);
 ui.answer=a?.type==='order'?shuffle(a.tokens.map(x=>x.id),a.id+ui.placementSession):a?.type==='match'?{}:null;
}
function beginPlacement(){
 const saved=savedPlacement(events);ui.placementSession=saved&&saved.stage!=='accepted'?saved.sessionId:crypto.randomUUID();
 ui.placement=saved&&saved.stage!=='accepted'?structuredClone(saved.responses):[];preparePlacementItem();ui.screen='placement';render(true);
}
function placementScreen(){
 const a=content().activities.get(ui.placementActivity);
 if(!a){const result=startingPointResult(ui.placement,placementItems,content().activities,assess);
 const reviewHtml=Object.entries(result.bands).filter(([,b])=>b.total).map(([l,b])=>`<p>${l}: ${b.correct}/${b.total} ${t('responses matched','câu trả lời khớp yêu cầu')} · ${esc(rangeNames[l][language()])}</p>`).join('');
 return placementResultView({result,language:language(),reviewHtml});}
 return `<section class="panel orientation" data-placement-item="${a.id}"><p class="eyebrow">${t('FINDING YOUR START','TÌM ĐIỂM BẮT ĐẦU')} · ${ui.placement.length+1}/10 ${t('at most','tối đa')}</p><h1>${t('Take your time.','Cứ thong thả nhé.')}</h1><p>${t('Read on your own. If this feels unfamiliar, choose “Not sure yet”. The next task may be easier.','Hãy tự đọc. Nếu thấy chưa quen, chọn “Tôi chưa chắc”. Câu tiếp theo có thể dễ hơn.')}</p><div class="source-card" lang="en" translate="no">${esc(a.context)}</div><h2 class="activity-prompt" lang="en" translate="no">${esc(a.prompt)}</h2>${activityControls(a,true)}<div class="button-row">${btn(t('Continue','Tiếp tục'),'placement-next','','primary')}${btn(t('Not sure yet','Tôi chưa chắc'),'placement-skip')}${btn(t('Save and play for now','Lưu và chơi trước'),'atlas','','text-button')}</div><p class="fineprint">${t('Completed responses are saved. No timer, hints or translated answers. You can return from your journal.','Câu đã hoàn thành được lưu. Không bấm giờ, không gợi ý hay dịch đáp án. Bạn có thể tiếp tục từ nhật ký.')}</p></section>`;
}

function render(focusHeading=false){
 const active=document.activeElement,focusKey=active?.dataset?.focusKey,selection=active&&'selectionStart'in active?[active.selectionStart,active.selectionEnd]:null;
 if(!profile&&!['profiles','account','family'].includes(ui.screen))ui.screen='profiles';
 const context=`${ui.screen}:${profile?.id??''}`;
 const disclosureKey=detail=>detail.dataset.disclosure||detail.id||`${detail.className}:${detail.querySelector(':scope > summary')?.textContent??''}`;
 const disclosures=!focusHeading&&context===renderedContext?new Map([...app.querySelectorAll('details')].map(detail=>[disclosureKey(detail),detail.open])):new Map();
 // Readiness/status notifications may rebuild this view while a person types.
 // Keep transient profile forms only within the same view and learner. Explicit
 // navigation and successful create/delete flows render with focusHeading=true.
 const forms=!focusHeading&&context===renderedContext?[...app.querySelectorAll('form[data-form]')].map(form=>({
  name:form.dataset.form,open:form.closest('details')?.open,
  disclosures:[...form.querySelectorAll('details')].map(detail=>detail.open),
  controls:[...form.elements].filter(el=>el.name&&el.type!=='file').map(el=>({name:el.name,type:el.type,value:el.value,checked:el.checked})),
 })):[];
 const screens={home:homeScreen,quick:quickScreen,little:littleScreen,family:familyScreen,account:accountScreen,starting:()=>startingView({language:language(),saved:savedPlacement(events),level:profile.journey.region}),profiles:profilesScreen,onboard:onboardScreen,atlas:atlasScreen,library:atlasScreen,workshop:workshopScreen,mission:missionScreen,journal:journalScreen,review:reviewScreen,settings:settingsScreen,placement:placementScreen,studio:studioScreen,pictures:()=>picturePlayView({language:language(),index:ui.pictureIndex,found:ui.pictureFound,feedback:ui.pictureFeedback})};
 document.body.className=`mode-${profile?.settings.mode??'balanced'}`;
 app.innerHTML=`${header()}<main id="main" tabindex="-1">${ui.error?`<div class="alert error" role="alert">${esc(ui.error)} ${btn(t('Dismiss','Đóng'),'dismiss-error','','text-button')}</div>`:''}${ui.notice?`<div class="alert notice" role="status">${esc(ui.notice)} ${btn(t('Dismiss','Đóng'),'dismiss-notice','','text-button')}</div>`:''}${screens[ui.screen]()}</main><div class="busy-indicator" role="status">${t('One moment…','Chờ một chút…')}</div>${footer()}`;
 for(const detail of app.querySelectorAll('details')){const key=disclosureKey(detail);if(disclosures.has(key))detail.open=disclosures.get(key);}
 for(const saved of forms){
  const form=[...app.querySelectorAll('form[data-form]')].find(el=>el.dataset.form===saved.name);if(!form)continue;
  const controls=[...form.elements].filter(el=>el.name&&el.type!=='file');
  saved.controls.forEach((value,index)=>{const el=controls[index];if(!el||el.name!==value.name||el.type!==value.type)return;
   if(el.tagName==='SELECT'&&![...el.options].some(option=>option.value===value.value))return;
   el.value=value.value;if(el.type==='checkbox'||el.type==='radio')el.checked=value.checked;
  });
  const details=form.closest('details');if(details&&saved.open!==undefined)details.open=saved.open;
  [...form.querySelectorAll('details')].forEach((detail,index)=>{if(saved.disclosures[index]!==undefined)detail.open=saved.disclosures[index];});
 }
 app.querySelectorAll('button,input,select,textarea,summary,a').forEach((el,i)=>{
  const form=el.closest('form[data-form]')||(el.tagName==='SUMMARY'?el.parentElement.querySelector('form[data-form]'):null);
  el.dataset.focusKey=form?`form-${form.dataset.form}-${(el.type==='radio'?el.name+'-'+el.value:el.name)||(el.tagName==='SUMMARY'?(el.parentElement.id||el.parentElement.className||i):el.tagName)}`:el.tagName==='SUMMARY'?`detail-${disclosureKey(el.parentElement)}`:`${el.dataset.action??el.dataset.setting??el.dataset.answer??el.dataset.match??el.tagName}-${el.dataset.id??el.dataset.value??el.name??i}-${el.dataset.dir??''}`;
 });
 renderedContext=context;
 if(focusHeading){const h=app.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}scrollTo({top:0,behavior:'instant'});}
 else if(focusKey){const target=[...app.querySelectorAll('[data-focus-key]')].find(e=>e.dataset.focusKey===focusKey);if(target){target.focus({preventScroll:true});if(selection&&'setSelectionRange'in target&&target.type!=='checkbox')try{target.setSelectionRange(...selection);}catch{}}}
 app.setAttribute('aria-busy',String(ui.busy));
}

async function submit(){
 const a=currentActivity(),answer=structuredClone(ui.answer),result=assess(a,answer);if(!result.complete)throw new Error(t(a.type==='writing'?'Write at least a short response and check each self-review point.':'Complete your response first.','Hãy hoàn thành câu trả lời và các mục tự xem lại nếu có.'));
 ui.submitting=true;app.querySelectorAll('.activity-panel button,.activity-panel input,.activity-panel select,.activity-panel textarea').forEach(el=>el.disabled=true);
 try{await append('attempt',{activityId:a.id,missionId:ui.mission,contentVersion:pack.batchId,answer,supported:ui.supported,mode:profile.settings.mode,...(ui.screen==='quick'?{quickSessionId:ui.quick.sessionId,quickIndex:ui.quick.index}:{})});ui.answer=answer;ui.feedback=result;ui.draftKey=JSON.stringify({answer,supported:ui.supported});}
 finally{ui.submitting=false;}
 render();app.querySelector('.feedback')?.focus({preventScroll:true});
}
async function advance(){
 if(ui.screen==='quick'){if(!ui.feedback)return;const next={...ui.quick,index:ui.quick.index+1};await append('mission',{experience:'quick-practice-v1',...next});ui.quick=next;if(ui.quick.index<ui.quick.ids.length)prepareQuick();render(true);return;}
 if(ui.review){await navigate('review');return;}
 if(profile.settings.mode==='kids'){
  if(ui.feedback?.correct===false){await navigate('atlas');return;}
  ui.stage='discovery';render(true);return;
 }
 if(profile.settings.mode==='balanced'){ui.stage='world';ui.feedback=null;render(true);return;}
 await continueTrail();
}
async function continueTrail(){
 const m=currentMission(),i=m.activities.findIndex(a=>a.id===ui.activity);
 if(i<m.activities.length-1){initActivity(m.activities[i+1]);ui.stage=profile.settings.mode==='kids'?'clue':'activity';render(true);}
 else if(progress.completedMissions.has(m.id)){ui.stage='world';ui.feedback=null;render(true);}
 else {ui.notice=progress.rewards.has(m.id)?`${t('Discovery restored:','Đã khôi phục khám phá:')} ${loc(m.reward)}`:t('Your progress is saved. Revisit unfinished moments to complete this discovery.','Tiến độ đã lưu. Trở lại các chặng chưa xong để hoàn thành khám phá.');await navigate('atlas');}
}

async function action(name,el){
 if(name.startsWith('little-')){await handleLittle(name,el.dataset.value);return;}
 if(name==='quick-start'){await openQuick();return;}
 if(name.startsWith('workshop-')){await workshopAction(name,el.dataset.value);return;}

 if(name==='dismiss-error'){ui.error='';render();return;}if(name==='dismiss-notice'){ui.notice='';render();return;}
 if(name==='guidance-language'){await changeGuidance(el.dataset.value);return;}
 if(name==='start-traveler'){await saveDraft();ui.entering=true;ui.screen='profiles';render(true);app.querySelector('#traveler-name')?.focus({preventScroll:true});return;}
 if(name==='entry-back'){ui.entering=false;render(true);return;}
 if(name==='collect-discovery'){if(!canCollect(currentMission(),progress))throw new Error(t('Finish the remaining connections first.','Hãy hoàn thành các kết nối còn lại.'));if(!progress.rewards.has(ui.mission))await append('mission',{missionId:ui.mission,experience:'story-v1'});ui.stage='world';render(true);return;}
 if(name==='route-game'){await saveDraft();ui.stage='route';render(true);return;}
 if(name==='picture-play'){await saveDraft();ui.pictureIndex=0;ui.pictureFound=[];ui.pictureFeedback=null;ui.screen='pictures';render(true);return;}
 if(name==='picture-listen'){speakText(pictureItems[ui.pictureIndex].adultCue.en);return;}
 if(name==='picture-pick'){const item=pictureItems[ui.pictureIndex];if(!item||ui.pictureFeedback==='found')return;ui.pictureFeedback=el.dataset.value===item.answerId?'found':'again';if(ui.pictureFeedback==='found'&&!ui.pictureFound.includes(item.id)){if(!progress.pictureFinds.has(item.id))await append('mission',{experience:'picture-play-v1',itemId:item.id});ui.pictureFound.push(item.id);}render();app.querySelector('.picture-feedback')?.scrollIntoView({block:'nearest',behavior:'instant'});return;}
 if(name==='picture-next'){if(ui.pictureFeedback!=='found')return;ui.pictureIndex++;ui.pictureFeedback=null;render(true);return;}
 if(name==='picture-restart'){ui.pictureIndex=0;ui.pictureFound=[];ui.pictureFeedback=null;render(true);return;}
 if(name==='profiles'){ui.entering=false;await navigate('profiles');return;}
 if(['home','family','atlas','library','journal','review','settings','account'].includes(name)){await navigate(name);if(name==='settings')cloud.prepare?.().catch(reportError);return;}
 if(name==='choose-profile'){await saveDraft();await selectProfile(el.dataset.id);render(true);return;}
 if(name==='dependent'){await selectProfile(el.dataset.id);ui.screen='journal';render(true);return;}
 if(name==='mode'){await saveDraft();profile=await store.updateProfile(profile.id,{settings:{mode:el.dataset.value}});setPreferences();render();return;}
 if(name==='region'){await saveDraft();profile=await store.updateProfile(profile.id,{journey:{region:el.dataset.value}});render(true);return;}
 if(name==='finish-onboard'){profile=await store.updateProfile(profile.id,{journey:{onboarded:true}});await navigate('atlas');return;}
 if(name==='begin'){await beginMission(el.dataset.id);return;}
 if(name==='review-item'){const a=content().activities.get(el.dataset.id);await beginMission(a.missionId,a);return;}
 if(name==='activity'){await saveDraft();initActivity(content().activities.get(el.dataset.id));ui.stage=profile.settings.mode==='kids'&&!ui.review?'clue':'activity';render(true);return;}
 if(name==='investigate'){ui.stage='clue';render(true);return;}
 if(name==='ready'){ui.stage='activity';render(true);return;}
 if(name==='board'||name==='world'){await saveDraft();globalThis.speechSynthesis?.cancel();ui.stage='world';ui.feedback=null;render(true);return;}
 if(name==='trail-next'){await continueTrail();return;}
 if(name==='studio'){await navigate('studio');return;}
 if(name==='studio-listen'){speakText(currentStudioActivity().context);return;}
 if(name==='studio-stop'){globalThis.speechSynthesis?.cancel();return;}
 if(name==='world-inspect'){ui.worldInspected=[Number(el.dataset.x),Number(el.dataset.y)];render();return;}
 if(name==='world-move'){const command=el.dataset.value;if(profile.settings.mode==='kids')await runWorld([command]);else if(profile.settings.mode==='serious'){const plan=parseWorldPlan(ui.worldPlan??'');if(plan.length>=40)throw new Error(t('Run or clear this route before adding more.','Thử hoặc xóa lộ trình trước khi thêm.'));ui.worldPlan=[...plan,command].join(' ');render();}else{ui.worldQueue??=[];if(ui.worldQueue.length>=40)throw new Error(t('Try your plan before adding more steps.','Thử kế hoạch trước khi thêm bước.'));ui.worldQueue.push(command);render();}return;}
 if(name==='world-run'){const commands=profile.settings.mode==='serious'?parseWorldPlan(ui.worldPlan??''):ui.worldQueue??[];if(!commands.length)throw new Error(t('Add a few route commands first.','Thêm lệnh đi trước nhé.'));await runWorld(commands);ui.worldQueue=[];ui.worldPlan='';render();return;}
 if(name==='world-clear'){ui.worldQueue=[];ui.worldPlan='';render();return;}
 if(name==='world-reset'){await saveWorld([]);ui.worldQueue=[];ui.worldPlan='';ui.worldRoute=null;render();return;}
 if(name==='world-translate'){ui.worldTranslation=!ui.worldTranslation;await saveWorld(progress.worlds.states[currentBoard().id]?.commands??[]);return;}
 if(name==='world-hint'){ui.worldHint=true;await saveWorld(progress.worlds.states[currentBoard().id]?.commands??[]);return;}
 if(name==='world-route'){ui.worldHint=true;ui.worldRoute=findRoute(currentBoard());await saveWorld(progress.worlds.states[currentBoard().id]?.commands??[]);return;}
 if(name==='choose'){ui.answer=el.dataset.value;queueDraft();render();return;}
 if(name==='move'){const i=ui.answer.indexOf(el.dataset.id),j=i+Number(el.dataset.dir);if(j>=0&&j<ui.answer.length)[ui.answer[i],ui.answer[j]]=[ui.answer[j],ui.answer[i]];queueDraft();render();return;}
 if(name==='submit'){await submit();return;}
 if(name==='retry'){ui.feedback=null;ui.supported=true;ui.showModel=false;render();return;}
 if(name==='reveal'||name==='model'){const activity=currentActivity();await append('support',{activityId:activity.id,reason:'answer-revealed'});ui.showModel=true;ui.supported=true;queueDraft();render();return;}
 if(name==='next'){await advance();return;}
 if(name==='start-placement'){await saveDraft();startPlacement();return;}
 if(name==='placement-begin'){beginPlacement();return;}
 if(name==='placement-assisted'){ui.workshopProfile=profile.id;ui.workshopSpace='free';ui.workshopSelected=null;await navigate('workshop');return;}
 if(name==='placement-manual'){
  if(!LEVELS.includes(el.dataset.value))return;await append('placement',{method:'manual-start',level:el.dataset.value,count:0,provisional:true});profile=await store.updateProfile(profile.id,{journey:{region:el.dataset.value,onboarded:true}});ui.workshopSpace=null;await navigate('atlas');return;
 }
 if(name==='placement-next'||name==='placement-skip'){
  const a=content().activities.get(ui.placementActivity);if(!a)return;
  const result=assess(a,ui.answer);if(name==='placement-next'&&!result.complete)throw new Error(t('Choose a response, or choose “Not sure yet”.','Chọn câu trả lời hoặc chọn “Tôi chưa chắc”.'));
  ui.error='';ui.errorSource=null;
  const next=[...ui.placement,{activityId:a.id,answer:name==='placement-skip'?null:structuredClone(ui.answer),skipped:name==='placement-skip',seenBefore:placementExposures().includes(a.id)}];
  await append('placement',{method:'starting-point-v2',sessionId:ui.placementSession,stage:'progress',responses:next});
  ui.placement=next;preparePlacementItem();render(true);return;
 }
 if(name==='accept-placement'){
  if(ui.placementActivity)return;const recommendation=startingPointResult(ui.placement,placementItems,content().activities,assess);
  if(recommendation.count<4)return;await append('placement',{...recommendation,sessionId:ui.placementSession,stage:'accepted'});
  profile=await store.updateProfile(profile.id,{journey:{region:recommendation.level,onboarded:true}});ui.workshopSpace=null;
  await navigate(profile.settings.mode==='serious'?'library':'atlas');return;
 }
 if(name==='speak'){speakText(currentActivity().context);return;}
 if(name==='export'){await saveDraft();const data=accountBackup(await store.exportAll(),ui.cloudStatus),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`unfolding-atlas-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);ui.notice=t('Backup exported. Keep it somewhere private.','Đã xuất bản sao. Hãy giữ ở nơi riêng tư.');render();return;}
 if(name==='import'){document.querySelector('#import-file').click();return;}
 if(name==='persist'){const granted=await navigator.storage?.persist?.();ui.notice=granted?t('This browser granted persistent storage. Backups are still useful.','Trình duyệt đã cấp lưu trữ bền vững. Bản sao lưu vẫn hữu ích.'):t('Persistent storage was not granted. Local saving still works; keep a backup.','Chưa được cấp lưu trữ bền vững. Lưu trên thiết bị vẫn hoạt động; hãy giữ bản sao.');render();return;}
 if(name==='cloud-panel'){ui.showCloud=true;await cloud.prepare();render();app.querySelector('.cloud-panel summary,.cloud-panel button')?.focus({preventScroll:true});return;}
 if(name==='cloud-link-cancel'){ui.linkConfirm=false;render();return;}
 if(name==='cloud-link-confirm'){if(!ui.linkConfirm||!profile||!ui.cloudStatus.approved||ui.linkConfirm.uid!==ui.cloudStatus.uid||ui.linkConfirm.profileId!==profile.id)return;const linkingId=profile.id;await cloud.linkProfile(linkingId);await cloud.sync(linkingId);ui.linkConfirm=false;await refresh();render();return;}
 if(name==='family-invitations'){await cloud.listFamilyInvitations();render();return;}
 if(name==='family-revoke-invite'){await cloud.revokeFamilyInvitation(el.dataset.email);render();return;}
 if(name==='cloud-refresh'){ui.error='';await cloud.refreshAccess();render();return;}
 if(name==='cloud-request'){ui.error='';await cloud.requestFamilyAccess();render();return;}
 if(name==='family-refresh'){await cloud.listFamilyRequests();render();return;}
 if(name==='family-approve'||name==='family-block'){
  if(name==='family-block'&&!confirm(t('Turn off cloud access for this person? Their local travelers and saved cloud history are kept.','Tắt quyền đám mây của người này? Hồ sơ trên thiết bị và lịch sử đám mây đã lưu vẫn được giữ.')))return;
  await cloud.setFamilyAccess(el.dataset.id,name==='family-approve');render();return;
 }
 const operations={'cloud-signin':async()=>{ui.error='';ui.showCloud=true;await cloud.signIn();ui.entering=false;ui.screen='account';if(ui.cloudStatus.uid)ui.notice=t('You’re signed in.','Bạn đã đăng nhập.');},'cloud-signout':async()=>{await cloud.signOut();ui.linkConfirm=false;await refresh();ui.screen='account';},'cloud-link':()=>{ui.linkConfirm={uid:ui.cloudStatus.uid,profileId:profile.id};ui.screen='account';},'cloud-sync':async()=>{await cloud.sync(profile.id);if(ui.cloudStatus.code==='cloud/sync-complete')ui.notice=t('Your progress is saved to your account.','Tiến độ đã lưu vào tài khoản.');},'cloud-restore':()=>cloud.restoreProfiles(),'cloud-delete':()=>{if(!confirm(t('Delete this profile’s cloud copy? Local progress stays on this device.','Xóa bản đám mây? Tiến độ trên thiết bị được giữ lại.')))return;return cloud.deleteRemoteProfile(profile.id);}};
 if(operations[name]){await saveDraft();await operations[name]();await refresh();render();}
}
// Background work may fail while a foreground action still owns the interaction
// lock. Only run() releases that lock, after its awaited operation finishes.
function reportError(error){ui.errorSource=error;ui.error=errorMessage(error);render();}
async function run(task){if(ui.busy)return;ui.busy=true;app.setAttribute('aria-busy','true');try{await task();}catch(error){reportError(error);}finally{ui.busy=false;app.setAttribute('aria-busy','false');}}
app.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;e.preventDefault();if(el.disabled)return;run(()=>action(el.dataset.action,el));});
app.addEventListener('input',e=>{
 const el=e.target;if(ui.submitting)return;if(el.dataset.answer==='gap')ui.answer=el.value;
 if(el.dataset.answer==='writing')ui.answer={...ui.answer,text:el.value};
 if(el.hasAttribute('data-world-plan'))ui.worldPlan=el.value;
 if(el.dataset.answer)queueDraft();
});
app.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.answer==='gap'&&!ui.feedback){e.preventDefault();run(()=>ui.screen==='placement'?action('placement-next',e.target):submit());}});
app.addEventListener('keydown',e=>{const direction={ArrowUp:'N',ArrowRight:'E',ArrowDown:'S',ArrowLeft:'W'}[e.key];if(direction&&e.target.closest('.expedition-grid')){e.preventDefault();run(async()=>{await action('world-move',{dataset:{value:direction}});app.querySelector('.world-cell.nim-here')?.focus({preventScroll:true});});}});
app.addEventListener('toggle',e=>{if(e.target.classList?.contains('cloud-panel')&&app.contains(e.target)){const opening=e.target.open&&!ui.showCloud;ui.showCloud=e.target.open;if(opening)cloud?.prepare().catch(reportError);}},true);
const handleChange=e=>run(async()=>{
 const el=e.target;
 if(el.hasAttribute('data-studio-item')){ui.studioId=el.value;globalThis.speechSynthesis?.cancel();render();}
 if(el.dataset.setting==='language')await changeGuidance(el.value);
 else if(el.dataset.setting){await saveDraft();profile=await store.updateProfile(profile.id,{settings:{[el.dataset.setting]:el.dataset.setting==='sound'?el.value==='true':el.value}});setPreferences();render();}
 if(el.dataset.journey){profile=await store.updateProfile(profile.id,{journey:{[el.dataset.journey]:el.value}});render();}
 if(el.dataset.match){ui.answer={...ui.answer,[el.dataset.match]:el.value};queueDraft();}
 if(el.dataset.check!==undefined){const set=new Set(ui.answer.checks);el.checked?set.add(Number(el.dataset.check)):set.delete(Number(el.dataset.check));ui.answer={...ui.answer,checks:[...set]};queueDraft();}
 if(el.id==='import-file'&&el.files[0]){const file=el.files[0];el.value='';if(file.size>STORE_LIMITS.importBytes)throw new Error(t('Backup is too large.','Bản sao quá lớn.'));const data=JSON.parse(await file.text());await store.importAll(data);await refresh();ui.notice=t('Backup validated and merged. Existing history was preserved.','Bản sao đã kiểm tra và gộp. Lịch sử hiện có được giữ lại.');render();}
});
app.addEventListener('change',handleChange);
importInput.addEventListener('change',handleChange);
app.addEventListener('submit',e=>{e.preventDefault();const form=e.target,data=new FormData(form,e.submitter);run(async()=>{
 if(form.dataset.form==='create-profile'){const kind=data.get('kind')??'independent';if(kind==='dependent'&&!data.get('guardianId'))throw new Error(t('Choose a guardian first, or create a personal traveler.','Chọn người giám hộ hoặc hồ sơ cá nhân.'));const mode=['kids','balanced','serious'].includes(data.get('mode'))?data.get('mode'):'balanced';const accountUid=ui.cloudStatus.uid,saveToAccount=data.get('cloudSave')==='on'&&ui.cloudStatus.approved;const p=await store.createProfile({name:String(data.get('name')??'').trim()||t('Explorer','Nhà khám phá'),kind,guardianId:kind==='dependent'?data.get('guardianId'):null,settings:{language:language(),mode}});await selectProfile(p.id);profile=await store.updateProfile(p.id,{journey:{onboarded:true}});ui.entering=false;if(saveToAccount){
  if(ui.cloudStatus.uid!==accountUid)ui.notice=t('Your learner is saved here. Choose the account to save it to from Account & learners.','Người học đã lưu ở đây. Chọn tài khoản để lưu trong Tài khoản và người học.');
  else try{await cloud.linkProfile(p.id);await cloud.sync(p.id);await refresh();}catch(error){ui.notice=t('Your learner is saved on this device. Cloud saving needs attention in Account & learners. ','Người học đã lưu trên thiết bị. Hãy kiểm tra lưu đám mây trong Tài khoản và người học. ')+errorMessage(error);}
 }if(data.get('start')==='placement'){startPlacement();return;}await navigate('home');ui.notice=t('Your place is ready. Choose something to try.','Chỗ của bạn đã sẵn sàng. Chọn một hoạt động nhé.');render();}

 if(form.dataset.form==='family-invite'){await cloud.inviteFamilyMember(String(data.get('email')??'').trim());render();return;}
 if(form.dataset.form==='rename'){profile=await store.updateProfile(profile.id,{name:data.get('name')});await refresh();ui.notice=t('Name saved.','Đã lưu tên.');render();}
 if(form.dataset.form==='delete'){if(data.get('confirm')!==profile.name)throw new Error(t('The name does not match.','Tên chưa khớp.'));await store.deleteProfile(profile.id);profile=null;setActive('');setPreferences();await refresh();ui.screen='profiles';render(true);}
});});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&profile)saveDraft().catch(reportError);if(!document.hidden&&profile)refresh().then(()=>{if(!ui.entering&&ui.screen!=='mission'&&ui.screen!=='placement')render();}).catch(reportError);});
window.addEventListener('atlas:store-change',()=>{if(!ui.busy&&profile)refresh().then(()=>{if(!ui.entering&&!['mission','placement'].includes(ui.screen))render();}).catch(reportError);});
window.addEventListener('offline',()=>{ui.notice=ui.offlineReady?t('You’re offline. Downloaded journeys and local saving are available. Synchronize when you reconnect.','Bạn đang ngoại tuyến. Hành trình đã tải và lưu trên thiết bị vẫn dùng được. Hãy đồng bộ khi kết nối lại.'):t('You’re offline. Keep this tab open to continue. Local saving works; reopening may need a connection until the offline library is ready.','Bạn đang ngoại tuyến. Giữ thẻ này để tiếp tục. Vẫn lưu trên thiết bị; mở lại có thể cần kết nối nếu thư viện ngoại tuyến chưa sẵn sàng.');render();});
window.addEventListener('online',()=>{ui.notice=t('Connection restored. You can synchronize your linked profile in Settings.','Đã kết nối lại. Bạn có thể đồng bộ hồ sơ đã liên kết trong Cài đặt.');render();});

async function boot(){
 try{
  const [response,worldResponse]=await Promise.all([fetch(new URL('../data/published/atlas.json',import.meta.url)),fetch(new URL('../data/published/boards.json',import.meta.url))]);if(!response.ok||!worldResponse.ok)throw new Error('The atlas library could not load. Please reload when connected.');pack=await response.json();const worlds=await worldResponse.json();boards=worlds.boards;if(pack.schemaVersion!==1||!pack.missions?.length||!Array.isArray(boards)||pack.missions.some(m=>!boards.some(b=>b.missionId===m.id)))throw new Error('The atlas library is incomplete.');
  store=await openStore();profiles=accessibleProfiles(await store.listProfiles(),{});cloud=createCloud({store,onStatus:s=>{cloudStatusChanged(s).catch(reportError);}});ui.cloudStatus=cloud.status();
  let active;try{active=localStorage.getItem('atlas-active-profile');}catch{}
  if(active&&profiles.some(p=>p.id===active))await selectProfile(active);else ui.screen='profiles';
  setPreferences();render(true);if(ui.cloudStatus.configured)cloud.restoreSession().catch(()=>{});registerOffline({onReady:()=>{ui.offlineReady=true;if(!ui.entering&&!['mission','placement'].includes(ui.screen))render();},onUpdate:()=>{ui.notice=t('An atlas update is ready. It will activate after all atlas tabs close; your progress stays saved.','Có bản cập nhật. Bản mới dùng sau khi đóng mọi thẻ bản đồ; tiến độ được giữ.');render();}}).catch(()=>{});
 }catch(error){app.innerHTML=`<main class="startup-error panel"><img src="./assets/atlas-mark.svg" alt="" width="50"><h1>${t('The atlas needs a moment.','Bản đồ cần thêm một chút thời gian.')}</h1><p>${esc(errorMessage(error))}</p><p>${t('Your saved journey has not been reset. Check your connection and allow browser storage for this site.','Hành trình đã lưu không bị xóa. Hãy kiểm tra kết nối và cho phép lưu trữ của trang này.')}</p><button type="button" id="reload">${t('Try again','Thử lại')}</button></main>`;document.querySelector('#reload').onclick=()=>location.reload();}
}
installWorkshopInput(app,{onPlace:(prop,slot)=>run(async()=>{if(ui.screen!=='workshop')return;ui.workshopSelected=prop;await workshopAction('workshop-place',slot);})});
boot();
