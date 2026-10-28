import test from 'node:test';import assert from 'node:assert/strict';
import {accessibleProfiles,accountBackup,profileSaveStatus} from '../src/identity-policy.js';
const profiles=[{id:'guest'},{id:'a',cloudOwnerUid:'alice'},{id:'b',cloudOwnerUid:'bob'},{id:'child',guardianId:'a'}];
test('sign-out and account switching hide other account learners and orphaned dependents',()=>{
 assert.deepEqual(accessibleProfiles(profiles,{}).map(p=>p.id),['guest']);
 assert.deepEqual(accessibleProfiles(profiles,{uid:'alice'}).map(p=>p.id),['guest','a','child']);
 assert.deepEqual(accessibleProfiles(profiles,{uid:'bob'}).map(p=>p.id),['guest','b']);
});
test('shared-device backup cannot expose other-account history through an export button',()=>{
 const backup={schemaVersion:1,profiles,events:profiles.map(p=>({id:p.id,profileId:p.id}))};
 const copy=accountBackup(backup,{uid:'bob'});assert.deepEqual(copy.events.map(e=>e.id),['guest','b']);assert.equal(backup.profiles.length,4);
});
test('last saved label is profile-specific and becomes stale after new work or preference changes',()=>{
 const state={uid:'alice',syncedProfileId:'a',syncedAt:'2026-10-27T00:00:00.000Z'},p={id:'a',updatedAt:'2026-10-26T00:00:00.000Z'};
 assert.equal(profileSaveStatus(state,p).syncedProfileId,'a');
 assert.equal(profileSaveStatus(state,{...p,id:'b'}).syncedProfileId,null);
 assert.equal(profileSaveStatus(state,p,[{kind:'mission',at:'2026-10-27T00:01:00.000Z'}]).syncedProfileId,null);
 assert.equal(profileSaveStatus(state,{...p,updatedAt:'2026-10-27T00:02:00.000Z'}).syncedProfileId,null);
});
