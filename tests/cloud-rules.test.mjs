import test from 'node:test';
import assert from 'node:assert/strict';

// Actual rules-engine integration, optional locally. Never contact a live project.
const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = 'demo-atlas-rules';
function token(uid, claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid, aud: project,
    iss: `https://securetoken.google.com/${project}`, iat: now, exp: now + 3600,
    firebase: { sign_in_provider: 'custom', identities: {} }, ...claims })}.`;
}

test('Firestore invitations require an exact verified identity and atomic one-time admission without privileges', {
  skip: !host && process.env.ATLAS_REQUIRE_FIRESTORE_EMULATOR !== 'true',
}, async () => {
  assert.match(host ?? '', /^(127\.0\.0\.1|localhost):[0-9]+$/, 'Only a local emulator is permitted.');
  const prefix=`invite-${Date.now()}`,owner=prefix+'-owner',member=prefix+'-member',other=prefix+'-other';
  const email=`${member}@example.test`,collection=`projects/${project}/databases/(default)/documents`;
  const base=`http://${host}/v1/${collection}`;
  const google=(uid,address=`${uid}@example.test`)=>({email:address,email_verified:true,firebase:{sign_in_provider:'google.com',identities:{}}});
  const fieldsFor=values=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?{integerValue:String(value)}:{stringValue:value}]));
  const headers=(uid,claims=google(uid))=>({'Content-Type':'application/json',Authorization:`Bearer ${uid==='owner'?'owner':token(uid,claims)}`});
  const request=(path,{uid=owner,claims,method='GET',fields}={})=>fetch(`${base}/${path}`,{method,headers:headers(uid,claims),body:fields&&JSON.stringify({fields:fieldsFor(fields)}),signal:AbortSignal.timeout(10000)});
  const invitePath=`familyInvitations/${email}`,admission=`access/${member}`;
  const invite={email,enabled:true,claimedBy:''};
  const commit=(uid,updates,claims=google(uid))=>fetch(`${base}:commit`,{method:'POST',headers:headers(uid,claims),body:JSON.stringify({writes:updates.map(([path,fields])=>({update:{name:`${collection}/${path}`,fields:fieldsFor(fields)}}))}),signal:AbortSignal.timeout(10000)});
  const claim=(uid=member,extra={},claims=google(uid))=>commit(uid,[[`access/${uid}`,{approved:true,...extra}],[invitePath,{...invite,claimedBy:uid}]],claims);
  assert.equal((await request(`access/${owner}`,{uid:'owner',method:'PATCH',fields:{approved:true,familyOwner:true}})).status,200);
  assert.equal((await request(`access/${other}`,{uid:'owner',method:'PATCH',fields:{approved:true}})).status,200);
  assert.equal((await request(invitePath,{uid:other,method:'PATCH',fields:invite})).status,403);
  assert.equal((await request(invitePath,{method:'PATCH',fields:{...invite,extra:true}})).status,403);
  assert.equal((await request(invitePath,{method:'PATCH',fields:{...invite,claimedBy:member}})).status,403);
  assert.equal((await request(invitePath,{method:'PATCH',fields:invite})).status,200);
  assert.equal((await request(invitePath,{uid:member})).status,200);
  assert.equal((await request(invitePath,{uid:other})).status,403,'Ordinary members cannot read other email invitations.');
  assert.equal((await request(invitePath,{uid:member,method:'DELETE'})).status,403);
  assert.equal((await request(admission,{uid:member,method:'PATCH',fields:{approved:true}})).status,403,'Admission alone cannot consume an invitation.');
  assert.equal((await request(invitePath,{uid:member,method:'PATCH',fields:{...invite,claimedBy:member}})).status,403,'Claim alone cannot create access.');
  assert.equal((await claim(member,{familyOwner:true})).status,403,'Self-enrollment never creates owner authority.');
  assert.equal((await claim(member,{}, {...google(member),email_verified:false})).status,403);
  assert.equal((await claim(member,{}, {...google(member),firebase:{sign_in_provider:'password',identities:{}}})).status,403);
  assert.equal((await claim(other)).status,403,'An invitation is not transferable.');
  assert.equal((await request(invitePath,{method:'PATCH',fields:{...invite,enabled:false}})).status,200);
  assert.equal((await claim()).status,403,'Revoked invitation cannot enroll.');
  assert.equal((await request(invitePath,{method:'PATCH',fields:invite})).status,200);
  assert.equal((await claim(member,{},google(member,email.toUpperCase()))).status,200,'Case-normalized verified email can claim exactly once.');
  const grant=await (await request(admission,{uid:member})).json();assert.deepEqual(grant.fields,{approved:{booleanValue:true}});
  assert.equal((await claim()).status,403,'An existing grant cannot be rewritten by the claimant.');
  assert.equal((await request(invitePath,{method:'PATCH',fields:invite})).status,403,'Owner cannot reset an already consumed claim for reuse.');
  assert.equal((await request(admission,{method:'PATCH',fields:{approved:false}})).status,200);
  assert.equal((await claim()).status,403,'An invitation does not undo explicit account revocation.');
  const profile=`users/${member}/profiles/private`;
  assert.equal((await request(profile,{uid:member,method:'PATCH',fields:{ownerUid:member,profileId:'private',revision:0,body:'{}'}})).status,403);
  const query=limit=>fetch(`${base}:runQuery`,{method:'POST',headers:headers(owner),body:JSON.stringify({structuredQuery:{from:[{collectionId:'familyInvitations'}],...(limit===null?{}:{limit})}}),signal:AbortSignal.timeout(10000)});
  assert.equal((await query(100)).status,200);assert.equal((await query(101)).status,403);assert.equal((await query(null)).status,403);
  // A previously blocked identity must not claim even a fresh invitation.
  const blocked=prefix+'-blocked',blockedEmail=`${blocked}@example.test`;
  assert.equal((await request(`access/${blocked}`,{method:'PATCH',fields:{approved:false}})).status,200);
  assert.equal((await request(`familyInvitations/${blockedEmail}`,{method:'PATCH',fields:{email:blockedEmail,enabled:true,claimedBy:''}})).status,200);
  assert.equal((await commit(blocked,[[`access/${blocked}`,{approved:true}],[`familyInvitations/${blockedEmail}`,{email:blockedEmail,enabled:true,claimedBy:blocked}]] )).status,403);
});

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

test('Firestore enrollment rules isolate requests, bound owner management and prevent role escalation', {
  skip: !host && process.env.ATLAS_REQUIRE_FIRESTORE_EMULATOR !== 'true',
}, async () => {
  assert.match(host ?? '', /^(127\.0\.0\.1|localhost):[0-9]+$/, 'Only a required local emulator is permitted.');
  const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
  const prefix = `enrollment-${Date.now()}`;
  const owner = prefix + '-owner', secondOwner = prefix + '-second-owner';
  const member = prefix + '-member', other = prefix + '-other', outsider = prefix + '-outsider';
  const google = uid => ({ email: `${uid}@example.test`, email_verified: true,
    firebase: { sign_in_provider: 'google.com', identities: {} } });
  const fieldsFor = fields => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key,
    typeof value === 'boolean' ? { booleanValue: value } : typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value }]));
  const request = async (path, { uid, admin = false, claims = google(uid), method = 'GET', fields } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (admin || uid) headers.Authorization = `Bearer ${admin ? 'owner' : token(uid, claims)}`;
    return fetch(`${base}/${path}`, { method, headers,
      body: fields && JSON.stringify({ fields: fieldsFor(fields) }), signal: AbortSignal.timeout(10000) });
  };
  const list = (uid, limit) => fetch(`${base}:runQuery`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(uid, google(uid))}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'joinRequests' }], ...(limit == null ? {} : { limit }) } }),
    signal: AbortSignal.timeout(10000) });
  const admission = (uid, approved, actor = owner, extra = {}) => request(`access/${uid}`, {
    uid: actor, method: 'PATCH', fields: { approved, ...extra } });
  const join = (uid, fields = {}, options = {}) => request(`joinRequests/${uid}`, { uid, method: 'PATCH',
    fields: { uid, email: google(uid).email, displayName: 'Family traveler', ...fields }, ...options });
  for (const uid of [owner, secondOwner]) assert.equal((await request(`access/${uid}`, {
    admin: true, method: 'PATCH', fields: { approved: true, familyOwner: true } })).status, 200);
  assert.equal((await request(`access/${other}`, { admin: true, method: 'PATCH', fields: { approved: true } })).status, 200);

  // Only explicit verified Google identities can create their own bounded request.
  assert.equal((await join(member, {}, { uid: undefined })).status, 403, 'Anonymous requests are denied.');
  assert.equal((await join(member, {}, { claims: { ...google(member), email_verified: false } })).status, 403);
  assert.equal((await join(member, {}, { claims: { ...google(member), firebase: { sign_in_provider: 'password', identities: {} } } })).status, 403);
  assert.equal((await join(member, { uid: other })).status, 403);
  assert.equal((await join(member, { email: google(other).email })).status, 403);
  assert.equal((await join(member, { approved: true })).status, 403);
  assert.equal((await join(member, { familyOwner: true })).status, 403);
  assert.equal((await join(member, { displayName: '' })).status, 403);
  assert.equal((await join(member, { displayName: 'x'.repeat(81) })).status, 403);
  assert.equal((await join(member, { displayName: 7 })).status, 403);
  const longEmail = 'x'.repeat(255);
  assert.equal((await join(member, { email: longEmail }, { claims: { ...google(member), email: longEmail } })).status, 403);
  assert.equal((await join(member)).status, 200);
  assert.equal((await join(outsider)).status, 200);
  assert.equal((await join(member, { displayName: 'Replacement' })).status, 403, 'Requesters cannot rewrite their submitted identity.');
  assert.equal((await request(`joinRequests/${member}`, { uid: member })).status, 200);
  assert.equal((await request(`joinRequests/${member}`, { uid: owner })).status, 200);
  assert.equal((await request(`joinRequests/${member}`, { uid: other })).status, 403);
  assert.equal((await request(`joinRequests/${member}`)).status, 403);
  assert.equal((await request(`joinRequests/${member}`, { uid: member, method: 'DELETE' })).status, 403);
  assert.equal((await request(`joinRequests/${member}`, { uid: owner, method: 'DELETE' })).status, 403);
  assert.equal((await list(owner, 100)).status, 200);
  assert.equal((await list(owner, 101)).status, 403);
  assert.equal((await list(owner)).status, 403, 'Owner listing must be bounded.');
  assert.equal((await list(member, 100)).status, 403);
  assert.equal((await list(other, 100)).status, 403);

  // Approval and revocation cannot create or replace trusted family-owner roles.
  assert.equal((await admission(member, true, member)).status, 403);
  assert.equal((await admission(outsider, true, other)).status, 403);
  assert.equal((await admission(member, true, owner, { familyOwner: true })).status, 403);
  assert.equal((await admission(member, true, owner, { unexpected: 'field' })).status, 403);
  assert.equal((await admission(member, 'true')).status, 403);
  assert.equal((await admission(owner, true)).status, 403, 'An owner cannot replace their own authority record.');
  assert.equal((await admission(secondOwner, false)).status, 403, 'Owners cannot replace another owner record.');
  assert.equal((await request(`access/${owner}`, { uid: owner, method: 'DELETE' })).status, 403);
  assert.equal((await admission(member, true)).status, 200);
  assert.equal((await request(`access/${member}`, { uid: member })).status, 200);
  assert.equal((await request(`access/${member}`, { uid: owner })).status, 200);
  assert.equal((await request(`access/${member}`, { uid: other })).status, 403);
  assert.equal((await request('access?pageSize=100', { uid: owner })).status, 403, 'Admission does not expose a directory.');
  assert.equal((await admission(member, true, member, { familyOwner: true })).status, 403);
  assert.equal((await admission(member, true, owner, { familyOwner: true })).status, 403, 'An owner cannot promote an existing member.');
  assert.equal((await admission(outsider, true, member)).status, 403);

  // Management authority does not grant access to another account's learning history.
  const path = `users/${member}/profiles/member-profile`;
  const fields = { ownerUid: member, profileId: 'member-profile', revision: 1, body: '{}' };
  assert.equal((await request(path, { uid: member, method: 'PATCH', fields })).status, 200);
  assert.equal((await request(path, { uid: owner })).status, 403);
  assert.equal((await request(path, { uid: owner, method: 'PATCH', fields })).status, 403);
  assert.equal((await admission(member, false)).status, 200);
  assert.equal((await request(path, { uid: member })).status, 403, 'Revocation applies to the same signed-in identity immediately.');
  assert.equal((await request(path, { uid: member, method: 'PATCH', fields: { ...fields, revision: 2 } })).status, 403);
  assert.equal((await join(member)).status, 403, 'A blocked account cannot replace its request to gain approval.');
  assert.equal((await request(`joinRequests/${member}`, { uid: member })).status, 200, 'A blocked account can still see its own request.');
  assert.equal((await admission(member, true)).status, 200);
  assert.equal((await request(path, { uid: member })).status, 200, 'Approval changes are reflected without changing the account.');
  assert.equal((await request(`access/${owner}`, { admin: true, method: 'PATCH', fields: { approved: false, familyOwner: true } })).status, 200);
  assert.equal((await list(owner, 100)).status, 403, 'A revoked owner immediately loses management authority.');
  assert.equal((await admission(outsider, true)).status, 403);
});
