const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=language=>(en,vi)=>language==='vi'?vi:en;
const button=(label,action,extra='',classes='')=>`<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;
const checking=s=>['restoring-session','checking-session','signing-in','checking-access'].includes(s?.state)||s?.restoringSession===true;
const visible=(profile,status)=>profile&&!profile.cloudOwnerUid||Boolean(profile&&status?.uid&&profile.cloudOwnerUid===status.uid);

/** Official logo asset; identity and data mutation remain the caller's responsibility. */
export function googleButton({language='en',label,action='cloud-signin'}={}){
 const t=copy(language),allowed=['cloud-signin','cloud-switch'];
 if(!allowed.includes(action))throw new TypeError('Unsupported Google sign-in action');
 return button(`<img src="./assets/google-g.svg" alt="" width="20" height="20"><span>${esc(label??t('Sign in with Google','Đăng nhập bằng Google'))}</span>`,action,'','google-signin');
}

/** A selected learner is not proof of Google authentication or successful sync. */
export function accountLabel({status:s={},profile=null,language='en'}={}){
 const t=copy(language),label=(title,detail,tone)=>({title,detail,tone});
 if(s.code==='cloud/signout-failed')return label(t('Sign-out needs another try','Cần thử đăng xuất lại'),t('Your Google session may still be active. Open your account and retry before leaving this shared device.','Phiên Google có thể vẫn còn. Mở tài khoản và thử lại trước khi rời thiết bị dùng chung.'),'signout-error');
 if(checking(s))return label(t('Checking account…','Đang kiểm tra tài khoản…'),t('You can keep playing on this device.','Bạn vẫn có thể chơi trên thiết bị này.'),'checking');
 if(profile?.cloudOwnerUid&&profile.cloudOwnerUid!==s.uid)return label(t('Choose your learner','Chọn người học'),t('This learner is saved with another Google account.','Người học này được lưu bằng tài khoản Google khác.'),'other-account');
 if(!s.uid)return label(t('Guest · this device','Khách · thiết bị này'),t('Progress saves here. Google sign-in is optional.','Tiến độ lưu ở đây. Đăng nhập Google là tùy chọn.'),'guest');
 if(s.state==='blocked')return label(t('Signed in · cloud access off','Đã đăng nhập · đám mây đang tắt'),t('Your local progress is kept. The family owner can help with cloud access.','Tiến độ trên thiết bị vẫn được giữ. Chủ gia đình có thể hỗ trợ quyền đám mây.'),'blocked');
 if(!s.approved)return label(t('Signed in · device saving','Đã đăng nhập · lưu trên thiết bị'),s.state==='access-error'?t('Family access could not be checked. Try again from your account.','Chưa kiểm tra được quyền gia đình. Thử lại trong tài khoản.'):t('You can play now. Open your account to join family cloud saving.','Bạn có thể chơi ngay. Mở tài khoản để tham gia lưu đám mây gia đình.'),'pending');
 if(!profile)return label(t('Signed in with Google','Đã đăng nhập Google'),t('Choose a learner to continue.','Chọn người học để tiếp tục.'),'signed-in');
 if(!profile.cloudOwnerUid)return label(t('Signed in · learner saved here','Đã đăng nhập · người học lưu ở đây'),t('This learner is not linked yet. Choose whether to save it to your account.','Người học này chưa được liên kết. Bạn có thể chọn lưu vào tài khoản.'),'local');
 if(s.offline===true||s.online===false||s.state==='offline')return label(t('Offline · saving here','Ngoại tuyến · lưu ở đây'),t('Your linked learner can sync when you reconnect.','Người học đã liên kết có thể đồng bộ khi kết nối lại.'),'offline');
 if(s.state==='syncing'&&s.syncingProfileId===profile.id)return label(t('Saving to your account…','Đang lưu vào tài khoản…'),t('Local progress stays saved while this finishes.','Tiến độ vẫn lưu trên thiết bị trong lúc chờ.'),'syncing');
 const stamp=Date.parse(s.syncedAt),updated=Date.parse(profile.updatedAt);
 const dirty=s.dirty===true||s.dirtyProfileIds?.includes(profile.id);
 if(s.syncedProfileId===profile.id&&Number.isFinite(stamp)&&(!Number.isFinite(updated)||updated<=stamp)&&!dirty)return label(t('Cloud save completed','Đã lưu lên đám mây'),t('Your latest confirmed save is on this account.','Lần lưu được xác nhận gần nhất đã có trong tài khoản.'),'saved');
 return label(t('Linked · saved on this device','Đã liên kết · lưu trên thiết bị'),t('Save to your account before continuing on another device.','Lưu vào tài khoản trước khi tiếp tục trên thiết bị khác.'),'linked');
}

export function accountHeader({status={},profile=null,language='en'}={}){
 const t=copy(language),state=accountLabel({status,profile,language});
 const name=visible(profile,status)?profile.name:status.uid?(status.displayName||t('My account','Tài khoản của tôi')):t('Guest','Khách');
 const initial=Array.from(name.trim())[0]||'•';
 return button(`<span class="avatar" aria-hidden="true">${esc(initial)}</span><span class="account-pill-copy"><strong translate="no">${esc(name)}</strong><small>${esc(state.title)}</small></span>`,'account',`aria-label="${esc(t('Account and learners','Tài khoản và người học')+': '+name+'. '+state.title)}"`,'profile-pill account-pill');
}

export function entryChoices({status={},resume=null,language='en'}={}){
 const t=copy(language),learner=visible(resume,status)?resume:null;
 const primary=learner?button(`${esc(t('Continue as','Tiếp tục cùng'))} ${esc(learner.name)} <span aria-hidden="true">→</span>`,'choose-profile',`data-id="${esc(learner.id)}"`,'primary welcome-primary'):button(t(status.uid?'Create a learner →':'Play as guest →',status.uid?'Tạo người học →':'Chơi với tư cách khách →'),'start-traveler','','primary welcome-primary');
 const secondary=checking(status)?`<p class="entry-account-check" role="status">${t('Checking your saved account…','Đang kiểm tra tài khoản đã lưu…')}</p>`:status.uid?button(t('Account & learners','Tài khoản và người học'),'account','','text-button'):status.configured?googleButton({language}):'';
 return `<div class="welcome-actions entry-choices">${primary}${secondary}${learner?button(t('New learner','Người học mới'),'start-traveler','','text-button'):''}</div><p class="entry-saving-note">${status.uid?t('Google is signed in. Each learner keeps a separate journey.','Bạn đã đăng nhập Google. Mỗi người học có hành trình riêng.'):t('Guest play saves on this device. You can connect an account later.','Chơi với tư cách khách lưu trên thiết bị này. Bạn có thể kết nối tài khoản sau.')}</p>`;
}

export function accountView({status={},profile=null,profiles=[],language='en',cloudHtml=''}={}){
 const t=copy(language),state=accountLabel({status,profile,language}),learners=profiles.filter(p=>visible(p,status));
 const linked=learners.filter(p=>p.cloudOwnerUid),local=learners.filter(p=>!p.cloudOwnerUid);
 const cards=list=>list.map(p=>button(`<span class="avatar" aria-hidden="true">${esc(Array.from(p.name)[0])}</span><span><strong translate="no">${esc(p.name)}</strong><small>${p.id===profile?.id?t('Playing now','Đang chơi'):t('Continue this journey','Tiếp tục hành trình')}</small></span>`,'choose-profile',`data-id="${esc(p.id)}"${p.id===profile?.id?' aria-current="true"':''}`,'learner-card')).join('');
 return `<section class="account-page"><header class="page-heading"><p class="eyebrow">${t('YOUR PLACE IN THE ATLAS','GÓC CỦA BẠN TRONG ATLAS')}</p><h1>${t('Account & learners','Tài khoản và người học')}</h1><p>${t('One account can keep separate journeys for people learning together.','Một tài khoản có thể lưu hành trình riêng cho những người cùng học.')}</p></header><section class="account-summary" data-identity-state="${state.tone}"><div><h2>${esc(state.title)}</h2><p>${esc(state.detail)}</p>${status.uid?`<p class="account-address" translate="no">${esc(status.email||status.displayName||'')}</p>`:''}</div>${profile&&visible(profile,status)?button(t('Back to my activities →','Về các hoạt động →'),'home','','primary'):''}</section><section class="learner-picker" aria-labelledby="learners-heading"><div class="section-heading"><h2 id="learners-heading">${t('Who’s playing?','Ai đang chơi?')}</h2>${button(t('New learner','Người học mới'),'start-traveler','','text-button')}</div>${linked.length?`<h3>${t('Learners linked to your account','Người học liên kết với tài khoản của bạn')}</h3><div class="learner-cards">${cards(linked)}</div>`:''}${local.length?`<h3>${t('Guests on this device','Khách trên thiết bị này')}</h3><div class="learner-cards">${cards(local)}</div><p class="fineprint">${t('Guest journeys are shared with people who use this browser. Linking one to an account is your choice.','Người dùng chung trình duyệt có thể xem hành trình khách. Bạn tự chọn có liên kết với tài khoản hay không.')}</p>`:''}${!learners.length?`<p class="account-empty">${t('Create your first learner, or bring back learners saved to your Google account below.','Tạo người học đầu tiên hoặc lấy lại người học đã lưu trong tài khoản Google bên dưới.')}</p>`:''}</section>${cloudHtml}</section>`;
}
