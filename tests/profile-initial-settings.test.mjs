import test from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryStore } from '../src/storage.js';
test('a traveler atomically inherits validated arrival guidance without changing default mode or evidence',async()=>{
  const store=await openMemoryStore();
  const profile=await store.createProfile({name:'Mây',settings:{language:'vi'}});
  assert.equal((await store.getProfile(profile.id)).settings.language,'vi');
  assert.equal(profile.settings.mode,'balanced');assert.equal(profile.journey.onboarded,false);
  assert.deepEqual(await store.getEvents(profile.id),[]);
  for(const settings of [{language:'C2'},{language:'vi',approved:true},{mode:'admin'}]){
    await assert.rejects(store.createProfile({name:'Rejected',settings}),error=>error.code==='INVALID_DATA');
  }
  assert.equal((await store.listProfiles()).length,1);
});
