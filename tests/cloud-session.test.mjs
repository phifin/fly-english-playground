import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloud, invitationEmail, cloudErrorMessage} from '../src/cloud.js';
import {openMemoryStore} from '../src/storage.js';

const config={enabled:true,firebase:{apiKey:'public-example-key',authDomain:'demo-atlas.firebaseapp.com',projectId:'demo-atlas',appId:'demo-public-app'}};
const fail=code=>Object.assign(new Error('Provider details must stay private'),{code});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({grant={approved:true},session='member'}={}){
  const store=await openMemoryStore({clock:()=> '2026-10-28T00:00:00.000Z'}),profile=await store.createProfile({name:'Local traveler'});
  let current=session,listener,popups=0,uploads=0,claims=0;
  const grants=new Map(grant?[['member',grant]]:[]),invitations=new Map(),history=[];
  const identity=()=>current?{uid:current,email:`${current}@example.test`,displayName:'Traveler'}:null;
  const api={currentUid:()=>current,restoreSession:async()=>identity(),
    onAuthChange(callback){listener=callback;return()=>{listener=null;};},
    async signIn(){popups++;current='member';return identity();},async signOut(){current=null;listener?.(null);},
    getGrant:async uid=>grants.get(uid)||null,
    async claimInvitation(){claims++;if(invitations.get(`${current}@example.test`)?.enabled){grants.set(current,{approved:true});return true;}return false;},
    async listFamilyInvitations(){return [...invitations.values()];},
    async setInvitation(email,enabled){invitations.set(email,{email,enabled,claimedBy:'',state:enabled?'invited':'revoked'});},
    isDeleted:async()=>false,getProfile:async()=>null,listEvents:async()=>[],
    async saveProfile(uid,p){uploads++;return p;},async putEvent(){uploads++;return true;}};
  const cloud=createCloud({config,store,loadBackend:async()=>api,onStatus:s=>history.push(s)});
  return{store,profile,api,cloud,grants,invitations,history,counts:()=>({popups,uploads,claims}),
    change(uid){current=uid;listener?.(identity());}};
}

test('a saved Google session restores identity without popup, linking, or uploads',async()=>{
  const x=await fixture(),before=await x.store.exportAll();
  assert.equal(x.cloud.status().authReady,false);
  const status=await x.cloud.restoreSession();
  assert.equal(status.uid,'member');assert.equal(status.authReady,true);assert.equal(status.state,'ready');
  assert.equal(status.syncedProfileId,null);assert.deepEqual(x.counts(),{popups:0,uploads:0,claims:0});
  assert.deepEqual(await x.store.exportAll(),before);
  assert.ok(x.history.some(s=>s.state==='restoring-session'&&!s.authReady));
});

test('fresh guest session is ready without inventing a signed-in identity',async()=>{
  const x=await fixture({session:null});const status=await x.cloud.restoreSession();
  assert.equal(status.uid,null);assert.equal(status.authReady,true);assert.equal(status.state,'signed-out');
});

test('a late persisted-session read cannot undo explicit sign-out',async()=>{
  const x=await fixture(),gate=deferred();x.api.restoreSession=()=>gate.promise;
  const restoring=x.cloud.restoreSession();await settle();await x.cloud.signOut();
  gate.resolve({uid:'member',email:'member@example.test'});await restoring;
  assert.equal(x.cloud.status().uid,null);assert.equal(x.cloud.status().state,'signed-out');
});

test('sign-out immediately hides private state and ignores delayed provider observations',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});await x.cloud.restoreSession();
  const gate=deferred();x.api.signOut=()=>gate.promise;
  const signingOut=x.cloud.signOut();
  assert.equal(x.cloud.status().uid,null);assert.equal(x.cloud.status().familyOwner,false);
  x.change('member');await settle();assert.equal(x.cloud.status().uid,null);
  gate.resolve();await signingOut;assert.equal(x.cloud.status().state,'signed-out');
});

test('failed provider sign-out blocks restoration and auth observation until explicit retry succeeds',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});await x.cloud.restoreSession();
  const original=x.api.signOut;x.api.signOut=async()=>{throw fail('auth/network-request-failed');};
  await assert.rejects(x.cloud.signOut(),{code:'cloud/signout-failed'});
  assert.equal(x.cloud.status().uid,null);assert.equal(x.cloud.status().code,'cloud/signout-failed');
  x.change('member');await settle();assert.equal(x.cloud.status().uid,null);
  assert.equal((await x.cloud.restoreSession()).state,'signout-failed');
  await assert.rejects(x.cloud.signIn(),{code:'cloud/signout-failed'});
  assert.equal(x.counts().popups,0);
  for(const language of ['en','vi'])assert.doesNotMatch(cloudErrorMessage(x.cloud.status(),language),/Provider details/);
  assert.match(cloudErrorMessage(x.cloud.status()),/may still be signed in/);
  x.api.signOut=original;assert.equal((await x.cloud.signOut()).state,'signed-out');
  assert.equal(x.api.currentUid(),null);assert.equal((await x.cloud.signIn()).uid,'member');
});

test('pending sign-out survives reload without restoring private identity and retry clears the intent',async()=>{
  const x=await fixture(),values=new Map();
  const authIntentStore={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const first=createCloud({config,store:x.store,loadBackend:async()=>x.api,authIntentStore});await first.restoreSession();
  const original=x.api.signOut;x.api.signOut=async()=>{throw fail('unavailable');};
  await assert.rejects(first.signOut(),{code:'cloud/signout-failed'});assert.equal(values.size,1);
  let loads=0;const reload=createCloud({config,store:x.store,loadBackend:async()=>{loads++;return x.api;},authIntentStore});
  assert.equal((await reload.restoreSession()).state,'signout-failed');assert.equal(loads,0);
  assert.equal(reload.status().uid,null);assert.equal(reload.status().authReady,true);
  x.api.signOut=original;await reload.signOut();assert.equal(loads,1);assert.equal(values.size,0);
  assert.equal((await reload.restoreSession()).state,'signed-out');assert.equal(x.api.currentUid(),null);
});

test('sync watermark cannot claim that progress added during upload has already been saved',async()=>{
  const x=await fixture();await x.cloud.restoreSession();await x.cloud.linkProfile(x.profile.id);
  await x.store.appendEvent(x.profile.id,{id:'before',kind:'mission',at:new Date().toISOString(),payload:{}});
  const gate=deferred();let started;const uploading=new Promise(resolve=>{started=resolve;});
  x.api.putEvent=async()=>{started();await gate.promise;return true;};
  const sync=x.cloud.sync(x.profile.id);await uploading;
  // Distinct future timestamp models a user action after the upload snapshot.
  const at=new Date(Date.now()+1000).toISOString();
  await x.store.appendEvent(x.profile.id,{id:'during',kind:'mission',at,payload:{}});
  gate.resolve();await sync;assert.ok(x.cloud.status().syncedAt<at);
});

test('SDK outage during restore is recoverable and never dereferences an absent adapter',async()=>{
  const x=await fixture();let calls=0;
  const cloud=createCloud({config,store:x.store,loadBackend:async()=>{if(++calls===1)throw fail('unavailable');return x.api;}});
  await assert.rejects(cloud.restoreSession(),{code:'unavailable'});
  assert.equal(cloud.status().authReady,true);assert.equal(cloud.status().code,'cloud/sdk-load-failed');
  assert.equal((await cloud.restoreSession()).uid,'member');
});

test('cross-tab account changes clear private status and never carry owner privileges',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});
  await x.cloud.restoreSession();await x.cloud.inviteFamilyMember('Child@Example.Test');
  await x.cloud.linkProfile(x.profile.id);await x.cloud.sync(x.profile.id);
  assert.equal(x.cloud.status().syncedProfileId,x.profile.id);
  assert.ok(x.cloud.status().syncedAt);assert.equal(x.cloud.status().syncingProfileId,null);
  assert.ok(x.history.some(s=>s.syncingProfileId===x.profile.id));
  x.change('other');await settle();
  const status=x.cloud.status();assert.equal(status.uid,'other');assert.equal(status.state,'pending');
  assert.equal(status.familyOwner,false);assert.deepEqual(status.familyInvitations,[]);
  assert.deepEqual(status.boundProfileIds,[]);assert.equal(status.syncedProfileId,null);assert.equal(status.syncedAt,null);
  assert.equal((await x.store.getProfile(x.profile.id)).cloudOwnerUid,'member','Account switch never relinks local progress.');
  x.change(null);await settle();assert.equal(x.cloud.status().state,'signed-out');
});

test('auth observation survives an admission outage and invalidates an in-flight stale check',async()=>{
  const x=await fixture();x.api.getGrant=async()=>{throw fail('unavailable');};
  await assert.rejects(x.cloud.signIn(),{code:'unavailable'});
  assert.equal(x.cloud.status().state,'access-error');
  const gate=deferred();x.api.getGrant=()=>gate.promise;const read=x.cloud.refreshAccess();
  x.change(null);gate.resolve({approved:true});await assert.rejects(read,{code:'cloud/session-changed'});
  assert.equal(x.cloud.status().uid,null);
});

test('a matching invitation is claimed only for a missing grant, never a revoked admission',async()=>{
  const x=await fixture({grant:null});x.invitations.set('member@example.test',{enabled:true});
  assert.equal((await x.cloud.restoreSession()).state,'ready');assert.equal(x.counts().claims,1);
  x.grants.set('member',{approved:false});assert.equal((await x.cloud.refreshAccess()).state,'blocked');
  assert.equal(x.counts().claims,1);assert.equal(x.counts().uploads,0);
});

test('older server rules retain pending access without turning valid Google login into an error',async()=>{
  const x=await fixture({grant:null});x.api.claimInvitation=async()=>{throw fail('permission-denied');};
  const state=await x.cloud.restoreSession();assert.equal(state.state,'pending');assert.equal(state.uid,'member');
  assert.equal(state.invitationAvailable,false);assert.equal(state.authReady,true);
});

test('owner invitation management normalizes exact email keys and rejects ordinary members',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});await x.cloud.restoreSession();
  await x.cloud.inviteFamilyMember(' Child+Atlas@Example.Test ');
  assert.equal(x.cloud.status().familyInvitations[0].email,'child+atlas@example.test');
  await x.cloud.revokeFamilyInvitation('child+atlas@example.test');
  assert.equal(x.cloud.status().familyInvitations[0].state,'revoked');
  await assert.rejects(x.cloud.inviteFamilyMember('child/other@example.test'),{code:'cloud/invalid-email'});
  x.grants.set('member',{approved:true});
  await assert.rejects(x.cloud.inviteFamilyMember('other@example.test'),{code:'cloud/owner-required'});
  assert.equal(x.invitations.size,1);
});

test('invitation list arriving after sign-out cannot expose owner data to the next session',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});await x.cloud.restoreSession();
  const gate=deferred();x.api.listFamilyInvitations=()=>gate.promise;
  const request=x.cloud.listFamilyInvitations();await settle();await x.cloud.signOut();
  gate.resolve([{email:'private@example.test',enabled:true,claimedBy:'',state:'invited'}]);
  await assert.rejects(request,{code:'cloud/session-changed'});assert.deepEqual(x.cloud.status().familyInvitations,[]);
});

test('invitation errors explain fallback in both guidance languages without leaking diagnostics',async()=>{
  const x=await fixture({grant:{approved:true,familyOwner:true}});await x.cloud.restoreSession();
  x.api.setInvitation=async()=>{throw fail('permission-denied');};
  await assert.rejects(x.cloud.inviteFamilyMember('child@example.test'),{code:'cloud/invitations-unavailable'});
  for(const code of ['cloud/restoring-session','cloud/invalid-email','cloud/invitations-unavailable','cloud/invitations-loaded','cloud/invitation-saved','cloud/invitation-revoked']){
    assert.notEqual(cloudErrorMessage({code},'en'),cloudErrorMessage({code},'vi'));
    assert.doesNotMatch(cloudErrorMessage({code},'en'),/Firebase|Firestore|UID|Provider details/);
  }
  assert.equal(invitationEmail(' Person@EXAMPLE.COM '),'person@example.com');
  for(const value of ['',null,'../abc@example.com','a@localhost','a'.repeat(255)+'@example.com'])assert.throws(()=>invitationEmail(value),{code:'cloud/invalid-email'});
});
