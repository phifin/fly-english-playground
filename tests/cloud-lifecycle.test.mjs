import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, cloudErrorMessage, cloudStatusMessage } from '../src/cloud.js';
import { openMemoryStore } from '../src/storage.js';

const config = { enabled: true, firebase: { apiKey: 'public-example-key', authDomain: 'demo-atlas.firebaseapp.com', projectId: 'demo-atlas', appId: 'demo-public-app' } };
const failure = (code, message = 'PRIVATE PROVIDER DIAGNOSTIC') => Object.assign(new Error(message), { code });

async function setup({ uid = 'member-one', grant = null } = {}) {
  const store = await openMemoryStore({ clock: () => '2026-10-22T00:00:00.000Z' });
  const profile = await store.createProfile({ name: 'Local traveler' });
  let session = null, popups = 0, requests = 0, writes = 0, readFailure = null;
  const grants = new Map(grant ? [[uid, grant]] : []), submitted = new Map();
  const authorize = () => { if (!session || grants.get(session)?.approved !== true) throw failure('permission-denied'); };
  const requireOwner = () => { authorize(); if (grants.get(session)?.familyOwner !== true) throw failure('permission-denied'); };
  const api = {
    currentUid: () => session,
    async signIn() { popups++; session = uid; return { uid, email: `${uid}@example.test`, displayName: 'Family member' }; },
    async signOut() { session = null; },
    async getGrant(targetUid) { if (readFailure) throw readFailure; return grants.get(targetUid) ?? null; },
    async requestAccess() { requests++; submitted.set(uid, { uid, email: `${uid}@example.test`, displayName: 'Family member' }); },
    async listFamilyRequests() { requireOwner(); return [...submitted.values()].map(member => ({ ...member,
      state: grants.get(member.uid)?.approved === true ? 'approved' : grants.get(member.uid)?.approved === false ? 'blocked' : 'pending',
      familyOwner: grants.get(member.uid)?.familyOwner === true })); },
    async setFamilyAccess(targetUid, approved) { requireOwner(); if (targetUid === session || grants.get(targetUid)?.familyOwner) throw failure('cloud/owner-protected'); writes++; grants.set(targetUid, { approved }); },
    async isDeleted() { authorize(); return false; },
    async getProfile() { authorize(); return null; },
    async listProfiles() { authorize(); return []; },
    async listEvents() { authorize(); return []; },
    async saveProfile(owner, value) { authorize(); writes++; return value; },
    async putEvent() { authorize(); writes++; return true; },
    async deleteProfile() { authorize(); writes++; },
  };
  const history = [];
  const cloud = createCloud({ store, config, loadBackend: async () => api, onStatus: status => history.push(status) });
  return { cloud, store, profile, api, grants, submitted, history,
    counts: () => ({ popups, requests, writes }), failReads: error => { readFailure = error; } };
}

test('a pending Google identity is authenticated, uploads nothing and can continue local play', async () => {
  const x = await setup(), before = await x.store.exportAll();
  assert.equal((await x.cloud.signIn()).state, 'pending');
  assert.equal(x.cloud.status().email, 'member-one@example.test');
  assert.equal(x.cloud.status().approved, false);
  await assert.rejects(x.cloud.linkProfile(x.profile.id), { code: 'cloud/approval-required' });
  await assert.rejects(x.cloud.sync(x.profile.id), { code: 'cloud/approval-required' });
  await assert.rejects(x.cloud.restoreProfiles(), { code: 'cloud/approval-required' });
  await assert.rejects(x.cloud.deleteRemoteProfile(x.profile.id), { code: 'cloud/approval-required' });
  assert.deepEqual(x.counts(), { popups: 1, requests: 0, writes: 0 });
  assert.deepEqual(await x.store.exportAll(), before);
});

test('family access requests are explicit, and owner approval is recognized without another popup', async () => {
  const x = await setup(); await x.cloud.signIn();
  assert.equal(x.counts().requests, 0, 'Google sign-in alone must not share a join request.');
  assert.equal((await x.cloud.requestFamilyAccess()).code, 'cloud/request-sent');
  assert.equal(x.cloud.status().requestSubmitted, true);
  assert.equal(x.counts().requests, 1);
  x.grants.set('member-one', { approved: true });
  const refreshed = await x.cloud.refreshAccess();
  assert.equal(refreshed.state, 'ready'); assert.equal(refreshed.approved, true);
  await x.cloud.linkProfile(x.profile.id);
  assert.equal((await x.store.getProfile(x.profile.id)).cloudOwnerUid, 'member-one');
  assert.equal(x.counts().popups, 1);
});

test('an explicit declined grant is different from pending and cannot be bypassed by another request', async () => {
  const x = await setup({ grant: { approved: false } });
  assert.equal((await x.cloud.signIn()).state, 'blocked');
  await assert.rejects(x.cloud.requestFamilyAccess(), { code: 'cloud/access-blocked' });
  await assert.rejects(x.cloud.linkProfile(x.profile.id), { code: 'cloud/access-blocked' });
  assert.equal(x.counts().requests, 0); assert.equal(x.cloud.status().uid, 'member-one');
});

test('revocation blocks an already signed-in account before a new cloud action and preserves the local recovery copy', async () => {
  const x = await setup({ grant: { approved: true } });
  await x.cloud.signIn(); await x.cloud.linkProfile(x.profile.id);
  const before = await x.store.exportAll();
  x.grants.set('member-one', { approved: false });
  await assert.rejects(x.cloud.sync(x.profile.id), { code: 'cloud/access-blocked' });
  assert.equal(x.cloud.status().state, 'blocked'); assert.equal(x.cloud.status().approved, false);
  assert.deepEqual(await x.store.exportAll(), before); assert.equal(x.counts().writes, 0);
  x.grants.set('member-one', { approved: true });
  await x.cloud.refreshAccess(); await x.cloud.sync(x.profile.id);
  assert.equal(x.cloud.status().code, 'cloud/sync-complete'); assert.equal(x.counts().popups, 1);
});

test('an admission network error retains the Google identity and recovers without repeat authentication', async () => {
  const x = await setup({ grant: { approved: true } });
  x.failReads(failure('unavailable'));
  await assert.rejects(x.cloud.signIn(), { code: 'unavailable' });
  assert.equal(x.cloud.status().state, 'access-error'); assert.equal(x.cloud.status().uid, 'member-one');
  assert.equal(x.cloud.status().approved, false); assert.equal(x.api.currentUid(), 'member-one');
  x.failReads(null); assert.equal((await x.cloud.refreshAccess()).state, 'ready');
  assert.equal(x.counts().popups, 1);
});

test('the Google popup being blocked is a genuine authentication error with no session', async () => {
  const x = await setup(); x.api.signIn = async () => { throw failure('auth/popup-blocked'); };
  await assert.rejects(x.cloud.signIn(), { code: 'auth/popup-blocked' });
  assert.equal(x.cloud.status().state, 'error'); assert.equal(x.cloud.status().uid, null);
  assert.match(cloudStatusMessage(x.cloud.status()), /Allow popups/);
  assert.match(cloudStatusMessage(x.cloud.status(), 'vi'), /cho phép/);
});

test('a late approval refresh cannot reconnect an identity after sign-out', async () => {
  const x = await setup(); await x.cloud.signIn();
  let release, started; const beginning = new Promise(resolve => { started = resolve; });
  x.api.getGrant = async () => { started(); return new Promise(resolve => { release = resolve; }); };
  const checking = x.cloud.refreshAccess(); await beginning; await x.cloud.signOut(); release({ approved: true });
  await assert.rejects(checking, { code: 'cloud/session-changed' });
  assert.equal(x.cloud.status().state, 'signed-out'); assert.equal(x.cloud.status().uid, null);
  assert.equal(x.cloud.status().email, null); assert.deepEqual(x.cloud.status().familyRequests, []);
});

test('a failed provider sign-out still clears all app access and private account presentation', async () => {
  const x = await setup({ grant: { approved: true, familyOwner: true } }); await x.cloud.signIn();
  x.api.signOut = async () => { throw failure('auth/network-request-failed'); };
  await assert.rejects(x.cloud.signOut(), { code: 'cloud/signout-failed' });
  assert.equal(x.cloud.status().state, 'signout-failed'); assert.equal(x.cloud.status().approved, false);
  assert.equal(x.cloud.status().uid, null); assert.equal(x.cloud.status().email, null);
  assert.equal(x.cloud.status().familyOwner, false);
  await assert.rejects(x.cloud.linkProfile(x.profile.id), { code: 'cloud/session-changed' });
});

test('concurrent approval checks share one read and cannot publish competing stale decisions', async () => {
  const x = await setup(); await x.cloud.signIn();
  let reads = 0, release;
  x.api.getGrant = () => { reads++; return new Promise(resolve => { release = resolve; }); };
  const a = x.cloud.refreshAccess(), b = x.cloud.refreshAccess();
  assert.equal(reads, 1); release({ approved: true });
  assert.equal((await a).state, 'ready'); assert.equal((await b).state, 'ready');
});

test('owner membership management uses explicit decisions and protects owner roles', async () => {
  const x = await setup({ uid: 'family-owner', grant: { approved: true, familyOwner: true } });
  x.submitted.set('new-member', { uid: 'new-member', email: 'new@example.test', displayName: 'New member' });
  await x.cloud.signIn(); assert.equal(x.cloud.status().familyOwner, true);
  assert.equal((await x.cloud.listFamilyRequests()).familyRequests[0].state, 'pending');
  assert.equal((await x.cloud.setFamilyAccess('new-member', true)).familyRequests[0].state, 'approved');
  assert.deepEqual(x.grants.get('new-member'), { approved: true });
  assert.equal((await x.cloud.setFamilyAccess('new-member', false)).familyRequests[0].state, 'blocked');
  await assert.rejects(x.cloud.setFamilyAccess('family-owner', false), { code: 'cloud/owner-protected' });
  x.grants.set('other-owner', { approved: true, familyOwner: true });
  await assert.rejects(x.cloud.setFamilyAccess('other-owner', false), { code: 'cloud/owner-protected' });
  await assert.rejects(x.cloud.setFamilyAccess('new-member', 'true'), { code: 'cloud/invalid-record' });
});

test('ordinary approved members and revoked owners cannot list requests or manage access', async () => {
  const x = await setup({ grant: { approved: true } }); await x.cloud.signIn();
  await assert.rejects(x.cloud.listFamilyRequests(), { code: 'cloud/owner-required' });
  await assert.rejects(x.cloud.setFamilyAccess('anyone', true), { code: 'cloud/owner-required' });
  x.grants.set('member-one', { approved: true, familyOwner: true });
  await x.cloud.refreshAccess(); assert.equal(x.cloud.status().familyOwner, true);
  x.grants.set('member-one', { approved: false, familyOwner: true });
  await assert.rejects(x.cloud.setFamilyAccess('anyone', true), { code: 'cloud/access-blocked' });
  assert.equal(x.counts().writes, 0);
});

test('a join request denied by older deployed rules gets an actionable setup message', async () => {
  const x = await setup(); await x.cloud.signIn();
  x.api.requestAccess = async () => { throw failure('permission-denied'); };
  await assert.rejects(x.cloud.requestFamilyAccess(), error => error.code === 'cloud/request-unavailable' && /finish cloud setup/.test(error.message));
  assert.equal(x.cloud.status().state, 'pending'); assert.equal(x.cloud.status().requestSubmitted, false);
});

test('unclassified provider failures carry a stable UI category while diagnostics remain available to tests', async () => {
  const x = await setup(); await x.cloud.signIn();
  x.api.requestAccess = async () => { throw new Error('PRIVATE PROVIDER DIAGNOSTIC'); };
  await assert.rejects(x.cloud.requestFamilyAccess(), error => error.code === 'cloud/unknown'
    && /PRIVATE PROVIDER/.test(error.message)
    && !/PRIVATE PROVIDER/.test(cloudErrorMessage(error)));
});

test('cloud status and errors are localized without exposing provider diagnostics or technical enrollment terms', () => {
  for (const code of ['cloud/pending', 'cloud/blocked', 'cloud/request-sent', 'cloud/ready', 'cloud/access-check-failed',
    'auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/network-request-failed', 'cloud/request-unavailable', 'cloud/owner-required']) {
    const en = cloudErrorMessage(failure(code)), vi = cloudErrorMessage(failure(code), 'vi');
    assert.notEqual(en, vi); assert.ok(en.length > 15); assert.ok(vi.length > 15);
    assert.doesNotMatch(en + vi, /PRIVATE PROVIDER|Firebase|Firestore|UID|server-managed|allowlist/i);
  }
  assert.doesNotMatch(cloudErrorMessage(failure('new/provider-code', 'SECRET ERROR')), /SECRET ERROR/);
});
