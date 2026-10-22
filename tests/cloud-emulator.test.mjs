import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, mergeEventSets, stableJson } from '../src/cloud.js';
import { openMemoryStore } from '../src/storage.js';

const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const project = 'demo-atlas-rules';
const AT = '2026-10-20T10:00:00.000Z';

// The real controller and local validation talk to actual local Auth/Firestore
// engines through a REST test transport. This does not exercise CDN SDK/popup UI.
test('Auth and Firestore emulators verify approved family synchronization and recovery', {
  skip: !(firestoreHost && authHost) && process.env.ATLAS_REQUIRE_CLOUD_EMULATORS !== 'true',
}, async () => {
  for (const host of [firestoreHost, authHost]) assert.match(host ?? '', /^(127\.0\.0\.1|localhost):[0-9]+$/, 'Both emulators must run on loopback; live projects are forbidden.');
  const root = `http://${firestoreHost}/v1/projects/${project}/databases/(default)/documents/`;
  const prefix = `atlas-${Date.now()}`;
  const config = { enabled: true, firebase: { apiKey: 'emulator-public-key', projectId: project,
    authDomain: `${project}.firebaseapp.com`, appId: 'emulator-public-app' } };
  const error = (code, message) => Object.assign(new Error(message), { code });
  const fetchLocal = (url, options) => fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
  const fieldsFor = fields => Object.fromEntries(Object.entries(fields).map(([name, value]) => [name,
    typeof value === 'boolean' ? { booleanValue: value } : typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value }]));
  const decodeFields = doc => Object.fromEntries(Object.entries(doc.fields ?? {}).map(([key, value]) => [key,
    'booleanValue' in value ? value.booleanValue : 'integerValue' in value ? Number(value.integerValue) : value.stringValue]));
  const pathFor = path => path.split('/').map(encodeURIComponent).join('/');
  async function request(path, { token, admin = false, method = 'GET', fields, condition = '' } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token || admin) headers.Authorization = `Bearer ${admin ? 'owner' : token}`;
    const response = await fetchLocal(root + pathFor(path) + condition, { method, headers,
      body: fields && JSON.stringify({ fields: fieldsFor(fields) }) });
    if (response.status === 404) return { status: 404, document: null };
    if ([409, 412].includes(response.status)) return { status: response.status, document: null };
    if (!response.ok) throw error(response.status === 403 ? 'permission-denied' : 'emulator/request-failed', `Local Firestore rejected ${method} with status ${response.status}.`);
    const text = await response.text();
    return { status: response.status, document: text ? JSON.parse(text) : {} };
  }
  async function signInGoogle(subject) {
    const response = await fetchLocal(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=emulator-public-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        requestUri: 'http://localhost', returnSecureToken: true,
        postBody: new URLSearchParams({ providerId: 'google.com', id_token: JSON.stringify({
          sub: subject, email: `${subject}@example.test`, email_verified: true,
        }) }).toString(),
      }),
    });
    assert.equal(response.status, 200, 'Synthetic Google sign-in must complete in the Auth emulator.');
    const account = await response.json(); assert.equal(account.providerId, 'google.com');
    assert.equal(typeof account.idToken, 'string'); assert.equal(typeof account.localId, 'string');
    return { uid: account.localId, token: account.idToken };
  }
  function transport(subject) {
    let session = null;
    const profilePath = (uid, id) => `users/${uid}/profiles/${id}`;
    const read = async path => (await request(path, { token: session?.token })).document;
    async function list(path) {
      const documents = []; let pageToken = '';
      do {
        const result = await request(path, { token: session?.token,
          condition: '?pageSize=1000' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '') });
        documents.push(...(result.document.documents ?? [])); pageToken = result.document.nextPageToken;
        if (documents.length > 20000) throw error('cloud/history-limit', 'Test transport exceeded its bounded history.');
      } while (pageToken);
      return documents;
    }
    const body = doc => doc ? JSON.parse(decodeFields(doc).body) : null;
    return {
      currentUid: () => session?.uid ?? null,
      async signIn() { session = await signInGoogle(subject); return { uid: session.uid }; },
      async signOut() { session = null; },
      async getGrant(uid) { const doc = await read(`access/${uid}`); return doc ? decodeFields(doc) : null; },
      async isDeleted(uid, id) { return Boolean(await read(`users/${uid}/deletions/${id}`)); },
      async getProfile(uid, id) { return body(await read(profilePath(uid, id))); },
      async listProfiles(uid) {
        const profiles = (await list(`users/${uid}/profiles`)).map(body), active = [];
        for (const item of profiles) if (!await this.isDeleted(uid, item.id)) active.push(item);
        return active;
      },
      async listEvents(uid, id) { return (await list(profilePath(uid, id) + '/events')).map(body).filter(event => event.kind !== 'draft'); },
      async saveProfile(uid, value) {
        for (let retry = 0; retry < 4; retry++) {
          const path = profilePath(uid, value.id), previous = await read(path), existing = body(previous);
          if (existing?.revision === value.revision && stableJson(existing) !== stableJson(value)) throw error('cloud/profile-conflict', 'Conflicting test profile revisions.');
          if (existing && existing.revision >= value.revision) return existing;
          const result = await request(path, { token: session?.token, method: 'PATCH', fields: {
            ownerUid: uid, profileId: value.id, revision: value.revision, body: stableJson(value),
          }, condition: previous ? '?currentDocument.updateTime=' + encodeURIComponent(previous.updateTime) : '?currentDocument.exists=false' });
          if (result.document) return value;
        }
        throw error('emulator/contention', 'Test profile precondition repeatedly changed.');
      },
      async putEvent(uid, id, value) {
        const path = profilePath(uid, id) + '/events/' + value.id, existing = body(await read(path));
        if (existing) { mergeEventSets([value], [existing]); return false; }
        const result = await request(path, { token: session?.token, method: 'PATCH', condition: '?currentDocument.exists=false',
          fields: { ownerUid: uid, profileId: id, eventId: value.id, body: stableJson(value) } });
        if (!result.document) { mergeEventSets([value], [body(await read(path))]); return false; }
        return true;
      },
      async deleteProfile(uid, id) {
        const tombstone = `users/${uid}/deletions/${id}`;
        if (!await read(tombstone)) await request(tombstone, { token: session?.token, method: 'PATCH', fields: { ownerUid: uid, profileId: id } });
        for (const event of await this.listEvents(uid, id)) await request(profilePath(uid, id) + '/events/' + event.id, { token: session?.token, method: 'DELETE' });
        await request(profilePath(uid, id), { token: session?.token, method: 'DELETE' });
      },
    };
  }
  const ownerSubject = prefix + '-owner', outsiderSubject = prefix + '-outsider', otherSubject = prefix + '-other';
  const owner = await signInGoogle(ownerSubject), other = await signInGoogle(otherSubject), outsider = await signInGoogle(outsiderSubject);
  for (const account of [owner, other]) await request(`access/${account.uid}`, { admin: true, method: 'PATCH', fields: { approved: true } });
  await assert.rejects(request(`access/${outsider.uid}`, { token: outsider.token, method: 'PATCH', fields: { approved: true } }), { code: 'permission-denied' });
  const first = await openMemoryStore({ clock: () => AT }), second = await openMemoryStore({ clock: () => AT });
  const unapproved = createCloud({ store: second, config, loadBackend: async () => transport(outsiderSubject) });
  assert.equal((await unapproved.signIn()).state, 'pending');
  assert.equal(unapproved.status().uid, outsider.uid);
  await assert.rejects(unapproved.restoreProfiles(), { code: 'cloud/approval-required' });
  await request(`access/${outsider.uid}`, { admin: true, method: 'PATCH', fields: { approved: true } });
  assert.equal((await unapproved.refreshAccess()).state, 'ready', 'Server approval is recognized in the same authenticated session.');
  assert.deepEqual(await unapproved.restoreProfiles(), []);
  await request(`access/${outsider.uid}`, { admin: true, method: 'PATCH', fields: { approved: false } });
  assert.equal((await unapproved.refreshAccess()).state, 'blocked');
  await assert.rejects(unapproved.restoreProfiles(), { code: 'cloud/access-blocked' });
  const apiA = transport(ownerSubject), a = createCloud({ store: first, config, loadBackend: async () => apiA });
  const b = createCloud({ store: second, config, loadBackend: async () => transport(ownerSubject) });
  await a.signIn(); await b.signIn();
  const guardian = await first.createProfile({ name: 'Synthetic guardian' });
  const child = await first.createProfile({ name: 'Synthetic learner', kind: 'dependent', guardianId: guardian.id });
  await a.linkProfile(guardian.id); await a.linkProfile(child.id);
  const event = id => ({ id, kind: 'attempt', at: AT, payload: { activityId: 'choice-1', answer: 'choice-a', supported: false } });
  await first.appendEvent(child.id, event('attempt.family:one'));
  await first.appendEvent(child.id, { id: 'support.one', kind: 'support', at: AT, payload: { activityId: 'choice-1' } });
  await first.appendEvent(child.id, { id: 'draft.one', kind: 'draft', at: AT, payload: { activityId: 'writing-1', answer: 'Synthetic device-local draft' } });
  assert.equal((await a.sync(child.id)).uploaded, 2);
  assert.equal((await b.restoreProfiles()).length, 2);
  assert.equal((await second.getProfile(child.id)).guardianId, guardian.id);
  assert.equal((await second.getEvents(child.id)).some(item => item.kind === 'draft'), false);
  const childPath = `users/${owner.uid}/profiles/${child.id}`;
  await assert.rejects(request(childPath, { token: other.token }), { code: 'permission-denied' });
  await assert.rejects(request(childPath, { token: outsider.token }), { code: 'permission-denied' });
  await assert.rejects(request(childPath + '/events/attempt.family:one', { token: owner.token, method: 'PATCH', fields: {
    ownerUid: owner.uid, profileId: child.id, eventId: 'attempt.family:one', body: '{}',
  } }), { code: 'permission-denied' });
  await first.appendEvent(child.id, event('offline-a')); await second.appendEvent(child.id, event('offline-b'));
  await b.sync(child.id); await a.sync(child.id); await b.sync(child.id);
  const shared = items => items.filter(item => item.kind !== 'draft');
  assert.deepEqual(shared(await first.getEvents(child.id)), await second.getEvents(child.id));
  const originalPut = apiA.putEvent.bind(apiA); let lostAcknowledgement = true;
  apiA.putEvent = async (...args) => { const result = await originalPut(...args); if (lostAcknowledgement) { lostAcknowledgement = false; throw new Error('Synthetic lost acknowledgement'); } return result; };
  await first.appendEvent(child.id, event('lost-acknowledgement'));
  await assert.rejects(a.sync(child.id), /Synthetic lost acknowledgement/);
  assert.equal((await a.sync(child.id)).uploaded, 0);
  await request(`access/${owner.uid}`, { admin: true, method: 'PATCH', fields: { approved: false } });
  const recovery = await first.exportAll(); await assert.rejects(a.sync(child.id), { code: 'cloud/access-blocked' });
  assert.deepEqual(await first.exportAll(), recovery);
  await request(`access/${owner.uid}`, { admin: true, method: 'PATCH', fields: { approved: true } });
  await assert.rejects(a.deleteRemoteProfile(guardian.id), { code: 'cloud/profile-in-use' });
  await a.deleteRemoteProfile(child.id);
  await assert.rejects(b.sync(child.id), { code: 'cloud/profile-deleted' });
  assert.ok(await first.getProfile(child.id)); assert.ok(await second.getProfile(child.id));
  await a.signOut(); await assert.rejects(a.sync(guardian.id), { code: 'cloud/session-changed' });
});
