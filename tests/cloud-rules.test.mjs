import test from 'node:test';
import assert from 'node:assert/strict';

// Actual rules-engine integration, optional locally. Never contact a live project.
const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = 'demo-atlas-rules';
function token(uid) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid, aud: project,
    iss: `https://securetoken.google.com/${project}`, iat: now, exp: now + 3600,
    firebase: { sign_in_provider: 'custom', identities: {} } })}.`;
}

test('Firestore emulator enforces membership, owner isolation, immutability and deletion markers', {
  skip: !host && process.env.ATLAS_REQUIRE_FIRESTORE_EMULATOR !== 'true',
}, async () => {
  assert.equal(typeof host, 'string', 'This verification job requires a running Firestore emulator; skipping is not permitted.');
  assert.match(host, /^(127\.0\.0\.1|localhost):[0-9]+$/, 'Only a local emulator is permitted.');
  const base = `http://${host}/v1/projects/${project}/databases/(default)/documents/`;
  const call = async (path, { uid, admin = false, method = 'GET', fields } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (admin || uid) headers.Authorization = `Bearer ${admin ? 'owner' : token(uid)}`;
    const body = fields && JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key,
      typeof value === 'boolean' ? { booleanValue: value } : typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value }])) });
    return fetch(base + path, { method, headers, body });
  };
  const prefix = `rules-${Date.now()}`;
  const owner = prefix + '-a', other = prefix + '-b', outsider = prefix + '-x';
  await call(`access/${owner}`, { admin: true, method: 'PATCH', fields: { approved: true } });
  await call(`access/${other}`, { admin: true, method: 'PATCH', fields: { approved: true } });
  const profile = `users/${owner}/profiles/profile-one`;
  const profileFields = { ownerUid: owner, profileId: 'profile-one', revision: 1, body: '{}' };
  assert.equal((await call(profile)).status, 403);
  assert.equal((await call(`access/${outsider}`, { uid: outsider, method: 'PATCH', fields: { approved: true } })).status, 403);
  assert.equal((await call(profile, { uid: owner, method: 'PATCH', fields: profileFields })).status, 200);
  assert.equal((await call(profile, { uid: other })).status, 403);
  assert.equal((await call(profile, { uid: outsider })).status, 403);
  assert.equal((await call(profile, { uid: owner, method: 'PATCH', fields: { ...profileFields, ownerUid: other } })).status, 403);
  assert.equal((await call(profile, { uid: owner, method: 'PATCH', fields: { ...profileFields, admin: true } })).status, 403);
  const compoundProfileId = 'profile.family:one', compoundProfile = `users/${owner}/profiles/${compoundProfileId}`;
  assert.equal((await call(compoundProfile, { uid: owner, method: 'PATCH', fields: { ...profileFields, profileId: compoundProfileId } })).status, 200);
  assert.equal((await call(compoundProfile + '/events/attempt.family:one', { uid: owner, method: 'PATCH', fields: {
    ownerUid: owner, profileId: compoundProfileId, eventId: 'attempt.family:one', body: '{}' } })).status, 200);
  assert.equal((await call(`users/${owner}/profiles/bad!id`, { uid: owner, method: 'PATCH', fields: { ...profileFields, profileId: 'bad!id' } })).status, 403);
  const eventPath = profile + '/events/event-one';
  const eventFields = { ownerUid: owner, profileId: 'profile-one', eventId: 'event-one', body: '{"id":"event-one"}' };
  assert.equal((await call(eventPath, { uid: owner, method: 'PATCH', fields: eventFields })).status, 200);
  assert.equal((await call(eventPath, { uid: owner, method: 'PATCH', fields: { ...eventFields, body: '{}' } })).status, 403);
  assert.equal((await call(eventPath, { uid: owner, method: 'DELETE' })).status, 403);
  const tombstone = `users/${owner}/deletions/profile-one`;
  assert.equal((await call(tombstone, { uid: owner, method: 'PATCH', fields: { ownerUid: owner, profileId: 'profile-one' } })).status, 200);
  assert.equal((await call(eventPath, { uid: owner, method: 'DELETE' })).status, 200);
  assert.equal((await call(profile, { uid: owner, method: 'PATCH', fields: { ...profileFields, revision: 2 } })).status, 403);
  assert.equal((await call(profile + '/events/event-two', { uid: owner, method: 'PATCH', fields: { ...eventFields, eventId: 'event-two' } })).status, 403);
  await call(`access/${owner}`, { admin: true, method: 'PATCH', fields: { approved: false } });
  assert.equal((await call(profile, { uid: owner })).status, 403);
});
