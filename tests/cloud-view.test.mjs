import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudView } from '../src/cloud-view.js';
const status={configured:true,state:'pending',code:'cloud/pending',uid:'member',email:'river@example.test',approved:false};
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
