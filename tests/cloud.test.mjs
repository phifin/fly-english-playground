import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, mergeEventSets, stableJson, validCloudConfig } from '../src/cloud.js';
import { openMemoryStore } from '../src/storage.js';

const AT = '2026-10-20T10:00:00.000Z';
const config = { enabled: true, firebase: { apiKey: 'public-example-key', authDomain: 'demo-atlas.firebaseapp.com', projectId: 'demo-atlas', appId: 'demo-public-app' } };
const event = (id, payload = { correct: true }) => ({ id, kind: 'attempt', at: AT, payload });
const store = () => openMemoryStore({ clock: () => AT });
const profile = db => db.createProfile({ name: 'Learner', kind: 'independent', guardianId: null });
const copy = value => structuredClone(value);

function network() { return { profiles: new Map(), events: new Map(), deleted: new Set(), approved: new Set(['ownerA', 'ownerB']) }; }
function backend(data, account = 'ownerA') {
  let currentUid = null;
  const key = (uid, id) => `${uid}/${id}`;
  const authorize = uid => { if (uid !== currentUid || !data.approved.has(uid)) throw Object.assign(new Error('denied'), { code: 'permission-denied' }); };
  return {
    currentUid: () => currentUid,
    async signIn() { currentUid = account; return { uid: account }; },
    async signOut() { currentUid = null; },
    async getGrant(uid) { return data.approved.has(uid) ? { approved: true } : null; },
    async isDeleted(uid, id) { authorize(uid); return data.deleted.has(key(uid, id)); },
    async getProfile(uid, id) { authorize(uid); return copy(data.profiles.get(key(uid, id)) || null); },
    async listProfiles(uid) { authorize(uid); return [...data.profiles].filter(([id]) => id.startsWith(uid + '/') && !data.deleted.has(id)).map(([, value]) => copy(value)); },
    async listEvents(uid, id) { authorize(uid); return copy(data.events.get(key(uid, id)) || []); },
    async saveProfile(uid, value) { authorize(uid); data.profiles.set(key(uid, value.id), copy(value)); return copy(value); },
    async putEvent(uid, id, value) {
      authorize(uid); if (data.deleted.has(key(uid, id))) throw new Error('deleted');
      const events = data.events.get(key(uid, id)) || [];
      const existed = events.some(event => event.id === value.id);
      data.events.set(key(uid, id), mergeEventSets(events, [value])); return !existed;
    },
    async deleteProfile(uid, id) { authorize(uid); data.deleted.add(key(uid, id)); data.profiles.delete(key(uid, id)); data.events.delete(key(uid, id)); },
  };
}

async function connected(db, data, account = 'ownerA', overrides = {}) {
  const api = backend(data, account);
  Object.assign(api, overrides);
  const cloud = createCloud({ store: db, config, loadBackend: async () => api });
  await cloud.signIn(); return { cloud, api };
}

test('cloud is truly optional and configuration does not load the SDK', async () => {
  let loads = 0;
  const cloud = createCloud({ config: { enabled: false }, loadBackend: async () => { loads++; } });
  assert.equal(cloud.configured, false); assert.equal(cloud.status().state, 'disabled');
  assert.equal(await cloud.prepare(), false);
  await assert.rejects(cloud.signIn(), error => error.code === 'cloud/not-configured');
  assert.equal(loads, 0); assert.equal(validCloudConfig(config), true);
  assert.equal(validCloudConfig({ ...config, firebase: { ...config.firebase, authDomain: 'attacker.example' } }), false);
});

test('set merge deduplicates equivalent JSON without mutating input or accepting conflicting IDs', () => {
  const a = event('one', { answer: 'before', correct: true });
  const b = event('one', { correct: true, answer: 'before' });
  const merged = mergeEventSets([a], [b, event('two')]);
  assert.equal(merged.length, 2); merged[0].payload.correct = false;
  assert.equal(a.payload.correct, true); assert.equal(stableJson(a), stableJson(b));
  assert.throws(() => mergeEventSets([a], [event('one', { correct: false })]), error => error.code === 'cloud/event-conflict');
});

test('valid local profile and event identifiers with periods and colons synchronize and restore', async () => {
  const db = await store(), learner = await profile(db), data = network();
  const backup = await db.exportAll(); backup.profiles[0].id = 'profile.family:one';
  await db.importAll(backup);
  const { cloud } = await connected(db, data); await cloud.linkProfile('profile.family:one');
  await db.appendEvent('profile.family:one', event('attempt.family:one'));
  assert.equal((await cloud.sync('profile.family:one')).uploaded, 1);
  const restored = await store(), { cloud: other } = await connected(restored, data);
  await other.restoreProfiles();
  assert.deepEqual((await restored.getEvents('profile.family:one')).map(item => item.id), ['attempt.family:one']);
  assert.equal((await db.getProfile(learner.id)).cloudOwnerUid, null);
});

test('over-limit merged history refuses all uploads and preserves the local recovery copy', async () => {
  const db = await store(), learner = await profile(db), data = network();
  const { cloud } = await connected({ ...db, getEvents: async () => Array.from({ length: 20001 }, (_, index) => event(`event-${index}`)) }, data);
  await cloud.linkProfile(learner.id);
  const before = await db.exportAll();
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/history-limit');
  assert.equal(data.profiles.size, 0); assert.equal(data.events.size, 0);
  assert.deepEqual(await db.exportAll(), before);
});

test('exact-limit history deduplicates and remains readable without truncating events', async () => {
  const db = await store(), learner = await profile(db), data = network();
  const events = Array.from({ length: 20000 }, (_, index) => event(`event-${index}`));
  const { cloud } = await connected({ ...db, getEvents: async () => events }, data);
  await cloud.linkProfile(learner.id);
  data.profiles.set(`ownerA/${learner.id}`, await db.getProfile(learner.id));
  data.events.set(`ownerA/${learner.id}`, events);
  const result = await cloud.sync(learner.id);
  assert.equal(result.uploaded, 0); assert.equal(result.checked, 20000);
  assert.equal(data.events.get(`ownerA/${learner.id}`).length, 20000);
});

test('two individually bounded offline histories cannot upload an over-limit union', async () => {
  const db = await store(), learner = await profile(db), data = network();
  const { cloud } = await connected({ ...db, getEvents: async () => Array.from({ length: 10001 }, (_, index) => event(`local-${index}`)) }, data);
  await cloud.linkProfile(learner.id);
  data.profiles.set(`ownerA/${learner.id}`, await db.getProfile(learner.id));
  data.events.set(`ownerA/${learner.id}`, Array.from({ length: 10000 }, (_, index) => event(`remote-${index}`)));
  const localBefore = await db.exportAll(), remoteBefore = copy(data);
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/history-limit');
  assert.deepEqual(data, remoteBefore); assert.deepEqual(await db.exportAll(), localBefore);
});

test('a history that grows during sync cannot upload beyond the cloud read limit', async () => {
  const db = await store(), learner = await profile(db), data = network();
  let reads = 0;
  const { cloud } = await connected({ ...db, getEvents: async () => ++reads === 1 ? [event('initial')]
    : Array.from({ length: 20001 }, (_, index) => event(`event-${index}`)) }, data);
  await cloud.linkProfile(learner.id);
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/history-limit');
  assert.equal(data.events.size, 0);
});

test('oversized cloud records fail preflight before uploading profile metadata or earlier events', async () => {
  const db = await store(), learner = await profile(db), data = network();
  const { cloud } = await connected(db, data); await cloud.linkProfile(learner.id);
  await db.appendEvent(learner.id, event('small-first'));
  await db.appendEvent(learner.id, event('large-last', Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`section${index}`, 'x'.repeat(5000)]))));
  const before = await db.exportAll();
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/record-limit');
  assert.equal(data.profiles.size, 0); assert.equal(data.events.size, 0);
  assert.deepEqual(await db.exportAll(), before);
});

test('sign-out during an admission check prevents a late sign-in from restoring ready state', async () => {
  const db = await store(), data = network(), api = backend(data);
  let release, notifyStarted;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  api.getGrant = async () => { notifyStarted(); return new Promise(resolve => { release = resolve; }); };
  const cloud = createCloud({ store: db, config, loadBackend: async () => api });
  const signingIn = cloud.signIn(); await started; await cloud.signOut(); release({ approved: true });
  await assert.rejects(signingIn, error => error.code === 'cloud/session-changed');
  assert.equal(cloud.status().state, 'signed-out'); assert.equal(cloud.status().uid, null); assert.equal(api.currentUid(), null);
});

test('a popup that resolves after sign-out has its stale SDK session discarded', async () => {
  const db = await store(), data = network(), api = backend(data), originalSignIn = api.signIn.bind(api);
  let release, notifyStarted, grants = 0;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  api.signIn = async () => { notifyStarted(); await new Promise(resolve => { release = resolve; }); return originalSignIn(); };
  api.getGrant = async () => { grants++; return { approved: true }; };
  const cloud = createCloud({ store: db, config, loadBackend: async () => api });
  const signingIn = cloud.signIn(); await started; await cloud.signOut(); release();
  await assert.rejects(signingIn, error => error.code === 'cloud/session-changed');
  assert.equal(cloud.status().state, 'signed-out'); assert.equal(api.currentUid(), null); assert.equal(grants, 0);
});

test('sign-out while the SDK is preparing prevents opening a sign-in popup', async () => {
  const db = await store(), data = network(), api = backend(data);
  let release, popups = 0;
  api.signIn = async () => { popups++; return { uid: 'ownerA' }; };
  const cloud = createCloud({ store: db, config, loadBackend: () => new Promise(resolve => { release = resolve; }) });
  const signingIn = cloud.signIn(); await cloud.signOut(); release(api);
  await assert.rejects(signingIn, error => error.code === 'cloud/session-changed');
  assert.equal(popups, 0); assert.equal(cloud.status().state, 'signed-out');
});

test('a failed SDK preparation arriving after sign-out cannot replace the disconnected status', async () => {
  const db = await store(); let rejectLoad;
  const cloud = createCloud({ store: db, config, loadBackend: () => new Promise((resolve, reject) => { rejectLoad = reject; }) });
  const signingIn = cloud.signIn(); await cloud.signOut(); rejectLoad(new Error('Synthetic SDK failure'));
  await assert.rejects(signingIn, /Synthetic SDK failure/);
  assert.equal(cloud.status().state, 'signed-out'); assert.equal(cloud.status().uid, null);
});

test('an SDK account change during admission cannot produce a ready controller for the stale identity', async () => {
  const db = await store(), data = network(), api = backend(data);
  api.getGrant = async () => { await api.signOut(); return { approved: true }; };
  const cloud = createCloud({ store: db, config, loadBackend: async () => api });
  await assert.rejects(cloud.signIn(), error => error.code === 'cloud/session-changed');
  assert.equal(cloud.status().state, 'error'); assert.equal(cloud.status().uid, null); assert.equal(api.currentUid(), null);
});

test('unapproved Google identities stay signed in for approval but never link a local profile', async () => {
  const db = await store(); const data = network(); const api = backend(data, 'outsider');
  const cloud = createCloud({ store: db, config, loadBackend: async () => api });
  assert.equal((await cloud.signIn()).state, 'pending');
  assert.equal(cloud.status().approved, false);
  assert.equal(cloud.status().uid, 'outsider'); assert.equal(api.currentUid(), 'outsider');
  await assert.rejects(cloud.linkProfile('missing'), error => error.code === 'cloud/approval-required');
  assert.equal(data.profiles.size, 0);
});

test('sync requires explicit linking and preserves owner binding after sign-out', async () => {
  const db = await store(); const learner = await profile(db); const data = network();
  const { cloud } = await connected(db, data);
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/owner-mismatch');
  assert.equal(data.profiles.size, 0);
  await cloud.linkProfile(learner.id); await db.appendEvent(learner.id, event('local-one'));
  assert.equal((await cloud.sync(learner.id)).uploaded, 1);
  assert.equal((await cloud.sync(learner.id)).uploaded, 0);
  assert.deepEqual(cloud.status().boundProfileIds, [learner.id]);
  await cloud.signOut(); assert.equal(cloud.status().state, 'signed-out');
  assert.equal((await db.getProfile(learner.id)).cloudOwnerUid, 'ownerA');
  const { cloud: other } = await connected(db, data, 'ownerB');
  await assert.rejects(other.linkProfile(learner.id), error => error.code === 'cloud/owner-mismatch');
  await assert.rejects(other.sync(learner.id), error => error.code === 'cloud/owner-mismatch');
});

test('two offline devices converge by event ID while drafts stay device-local', async () => {
  const first = await store(), second = await store(), data = network(); const learner = await profile(first);
  const { cloud: a } = await connected(first, data); await a.linkProfile(learner.id);
  await first.appendEvent(learner.id, event('first'));
  await first.appendEvent(learner.id, { ...event('draft-one', { answer: 'Private writing' }), kind: 'draft' });
  await a.sync(learner.id);
  const { cloud: b } = await connected(second, data); assert.deepEqual(await b.restoreProfiles(), [learner.id]);
  assert.deepEqual((await second.getEvents(learner.id)).map(item => item.id), ['first']);
  await first.appendEvent(learner.id, event('second')); await second.appendEvent(learner.id, event('third'));
  await b.sync(learner.id); await a.sync(learner.id); await b.sync(learner.id);
  assert.deepEqual((await first.getEvents(learner.id)).map(item => item.id), ['draft-one', 'first', 'second', 'third']);
  assert.deepEqual((await second.getEvents(learner.id)).map(item => item.id), ['first', 'second', 'third']);
});

test('contradictory cloud event IDs never replace local history', async () => {
  const db = await store(); const learner = await profile(db); const data = network(); const { cloud } = await connected(db, data);
  await cloud.linkProfile(learner.id); await db.appendEvent(learner.id, event('same')); await cloud.sync(learner.id);
  data.events.set(`ownerA/${learner.id}`, [event('same', { correct: false })]);
  const before = await db.exportAll();
  await assert.rejects(cloud.sync(learner.id), error => error.code === 'cloud/event-conflict');
  assert.deepEqual(await db.exportAll(), before);
});

test('lost acknowledgements are recoverable without clearing or duplicating events', async () => {
  const db = await store(); const learner = await profile(db); const data = network(); const api = backend(data);
  const originalPut = api.putEvent.bind(api); let failOnce = true;
  api.putEvent = async (...args) => { const result = await originalPut(...args); if (failOnce) { failOnce = false; throw new Error('lost acknowledgement'); } return result; };
  const cloud = createCloud({ store: db, config, loadBackend: async () => api }); await cloud.signIn(); await cloud.linkProfile(learner.id);
  await db.appendEvent(learner.id, event('once'));
  await assert.rejects(cloud.sync(learner.id), /lost acknowledgement/);
  assert.equal((await db.getEvents(learner.id)).length, 1);
  await cloud.sync(learner.id); assert.equal(data.events.get(`ownerA/${learner.id}`).length, 1);
});

test('account changes interrupt an in-flight sync before local merge or upload', async () => {
  const db = await store(); const learner = await profile(db); const data = network();
  let release; let readStarted;
  const started = new Promise(resolve => { readStarted = resolve; });
  const { cloud } = await connected(db, data, 'ownerA', { getProfile: async () => { readStarted(); return new Promise(resolve => { release = resolve; }); } });
  await cloud.linkProfile(learner.id); await db.appendEvent(learner.id, event('private'));
  const syncing = cloud.sync(learner.id); await started; await cloud.signOut(); release(null);
  await assert.rejects(syncing, error => error.code === 'cloud/session-changed');
  assert.equal(data.profiles.size, 0); assert.equal(data.events.size, 0);
});

test('guardian and dependent profiles restore together and deletion prevents resurrection', async () => {
  const db = await store(); const guardian = await profile(db);
  const child = await db.createProfile({ name: 'Young learner', kind: 'dependent', guardianId: guardian.id });
  const data = network(); const { cloud } = await connected(db, data);
  await assert.rejects(cloud.linkProfile(child.id), error => error.code === 'cloud/guardian-unlinked');
  await cloud.linkProfile(guardian.id); await cloud.linkProfile(child.id);
  await db.appendEvent(child.id, event('child-event')); await cloud.sync(child.id);
  const restored = await store(); const { cloud: other } = await connected(restored, data); await other.restoreProfiles();
  assert.equal((await restored.getProfile(child.id)).guardianId, guardian.id);
  const before = copy(data), localBefore = await db.exportAll();
  await assert.rejects(cloud.deleteRemoteProfile(guardian.id), error => error.code === 'cloud/profile-in-use'
    && /each dependent profile/i.test(error.message));
  assert.deepEqual(data, before, 'Refusing guardian deletion must not delete profiles, events, or create tombstones.');
  assert.deepEqual(await db.exportAll(), localBefore);
  await cloud.deleteRemoteProfile(child.id);
  assert.equal(data.profiles.size, 1); assert.equal(data.deleted.size, 1);
  assert.equal(data.profiles.has(`ownerA/${guardian.id}`), true);
  assert.equal(data.events.has(`ownerA/${child.id}`), false);
  await cloud.deleteRemoteProfile(guardian.id);
  assert.equal(data.profiles.size, 0); assert.equal(data.deleted.size, 2);
  await assert.rejects(other.sync(guardian.id), error => error.code === 'cloud/profile-deleted');
  await assert.rejects(other.sync(child.id), error => error.code === 'cloud/profile-deleted');
  assert.equal(data.profiles.size, 0, 'Offline copies cannot recreate either explicitly deleted profile.');
  assert.equal((await restored.listProfiles()).length, 2, 'Cloud deletion does not remove local recovery copies.');
  assert.equal((await db.getEvents(child.id)).length, 1);
});

test('account changes interrupt a pending deletion before any cloud profile is removed', async () => {
  const db = await store(), guardian = await profile(db), data = network();
  let release, readStarted;
  const started = new Promise(resolve => { readStarted = resolve; });
  const { cloud } = await connected(db, data, 'ownerA', {
    listProfiles: async () => { readStarted(); return new Promise(resolve => { release = resolve; }); },
  });
  await cloud.linkProfile(guardian.id);
  await cloud.sync(guardian.id);
  const before = copy(data);
  const deleting = cloud.deleteRemoteProfile(guardian.id);
  await started; await cloud.signOut(); release([]);
  await assert.rejects(deleting, error => error.code === 'cloud/session-changed');
  assert.deepEqual(data, before);
  assert.equal(data.deleted.size, 0); assert.equal(data.profiles.size, 1);
  assert.equal(cloud.status().state, 'signed-out');
});
