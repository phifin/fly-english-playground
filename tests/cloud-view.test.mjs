import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudView } from '../src/cloud-view.js';
import { cloudStatusMessage } from '../src/cloud-messages.js';
const status={configured:true,state:'pending',code:'cloud/pending',uid:'member',email:'river@example.test',approved:false};

test('invitations expose state and withdraw only unused enabled invitations',()=>{
 const owner={...status,approved:true,familyOwner:true,familyInvitations:[{email:'unused@example.test',enabled:true,claimedBy:'',state:'invited'},{email:'joined@example.test',enabled:true,claimedBy:'joined',state:'approved'},{email:'off@example.test',enabled:false,claimedBy:'',state:'revoked'}]};
 for(const language of ['en','vi']){const html=cloudView({status:owner,language});assert.equal((html.match(/data-action="family-revoke-invite"/g)||[]).length,1);assert.match(html,/data-email="unused@example.test"/);assert.doesNotMatch(html,/data-email="joined@example.test"/);assert.doesNotMatch(cloudView({status:{...owner,familyOwner:false},language}),/family-invite/);}
});
test('failed provider signout offers retry instead of claiming the account is disconnected',()=>{
 const html=cloudView({status:{configured:true,code:'cloud/signout-failed',state:'error',uid:null}});
 assert.match(html,/data-action="cloud-signout"/);assert.doesNotMatch(html,/data-action="cloud-signin"/);
});
test('pending and declined authentication remain distinct from sign-in and cannot offer private data actions',()=>{
  for(const state of ['pending','blocked','access-error']){
    const view=cloudView({status:{...status,state,code:`cloud/${state}`}});
    assert.match(view,/cloud-refresh/);assert.match(view,/cloud-signout/);
    assert.doesNotMatch(view,/data-action="cloud-(link|sync|restore|signin)"/);
    assert.doesNotMatch(view,/Firebase|Firestore|UID|server-managed/);
  }
});
test('approved cloud actions reflect actual traveler binding and language independently',()=>{
  const approved={...status,state:'ready',code:'cloud/ready',approved:true};
  assert.match(cloudView({status:approved,profile:{cloudOwnerUid:null}}),/data-action="cloud-link"/);
  const vi=cloudView({status:approved,profile:{cloudOwnerUid:'member'},language:'vi'});
  assert.match(vi,/Lưu và đồng bộ hồ sơ/);assert.match(vi,/data-action="cloud-sync"/);assert.doesNotMatch(vi,/data-action="cloud-link"/);
  assert.doesNotMatch(cloudView({status:approved}),/data-action="cloud-(link|sync)"/);
  const different=cloudView({status:approved,profile:{cloudOwnerUid:'another-account'}});
  assert.doesNotMatch(different,/data-action="cloud-(link|sync)"/);
  assert.match(different,/data-action="cloud-restore"/);
});
test('only a server-approved owner sees management; member labels are escaped and owner controls protected',()=>{
  const member={uid:'other',email:'<bad>@example.test',displayName:'<img src=x>',state:'pending'};
  const owner={...status,approved:true,familyOwner:true,state:'ready',code:'cloud/ready',familyRequests:[member,{...member,uid:'owner',familyOwner:true}]};
  const html=cloudView({status:owner});assert.match(html,/family-approve/);assert.match(html,/family-block/);
  assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img src=x>/);
  assert.doesNotMatch(html,/data-id="owner"/);
  assert.doesNotMatch(cloudView({status:{...owner,approved:false}}),/family-admin/);
  assert.doesNotMatch(cloudView({status:{...owner,familyOwner:false}}),/family-admin/);
});
test('arrival exposes Google sign-in directly and makes optional local play and backup limits explicit',()=>{
  for(const language of ['en','vi']){
    const html=cloudView({status:{configured:true,state:'signed-out',code:'cloud/signed-out'},language,presentation:'inline'});
    assert.match(html,/<section class="cloud-panel cloud-panel-inline"/);
    assert.match(html,/data-action="cloud-signin"/);
    assert.doesNotMatch(html,/<details|<summary|data-action="cloud-(sync|link|restore)"/);
    assert.match(html,language==='en'?/without an account/:/không cần tài khoản/);
    assert.match(html,language==='en'?/Signing in alone does not back it up/:/Chỉ đăng nhập chưa tạo bản sao lưu/);
  }
});
test('inline display never expands cloud permissions and signed-in context explains the next save step',()=>{
  const pending=cloudView({status,presentation:'inline'});
  assert.match(pending,/data-action="cloud-request"/);
  assert.doesNotMatch(pending,/data-action="cloud-(sync|link|restore)"/);
  const approved={...status,approved:true,state:'ready',code:'cloud/ready'};
  const local=cloudView({status:approved,profile:{cloudOwnerUid:null},presentation:'inline'});
  assert.match(local,/Link it to your account, then save a cloud copy/);
  assert.match(local,/Linking is not a backup/);
  const linked=cloudView({status:approved,profile:{cloudOwnerUid:'member'},presentation:'inline'});
  assert.match(linked,/Save before moving to another device/);
  const noProfile=cloudView({status:approved,presentation:'inline'});
  assert.match(noProfile,/Bring back your saved travelers/);
  assert.doesNotMatch(noProfile,/data-action="cloud-(sync|link)"/);
});
test('account identity remains escaped and protected from automatic browser translation',()=>{
  const html=cloudView({status:{...status,email:'<owner>@example.test'}});
  assert.match(html,/<strong translate="no">&lt;owner&gt;@example.test<\/strong>/);
  assert.doesNotMatch(html,/<owner>/);
  assert.match(html,/<details class="cloud-panel"/);
});
test('a previous successful sync is described as a past save, not an ongoing guarantee for all travelers',()=>{
  const saved={code:'cloud/sync-complete'};
  assert.match(cloudStatusMessage(saved),/last save finished/);
  assert.match(cloudStatusMessage(saved),/Save again after playing/);
  assert.doesNotMatch(cloudStatusMessage(saved),/up to date/);
  assert.match(cloudStatusMessage(saved,'vi'),/Lần lưu vừa rồi đã hoàn tất/);
});
