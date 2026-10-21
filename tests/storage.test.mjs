import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, openMemoryStore, createMemoryDatabase, validateExport, validateEvent,
  mergeExports, StorageError, STORE_LIMITS } from '../src/storage.js';

const AT = '2026-10-20T10:00:00.000Z';
const LATER = '2026-10-20T11:00:00.000Z';
const event = (id = 'event-1', extra = {}) => ({ id, kind: 'attempt', at: AT,
  payload: { activityId: 'a1-test-01', answer: 'Learner response', correct: true }, ...extra });
const store = options => openMemoryStore({ clock: () => AT, ...options });
const profile = db => db.createProfile({ name: 'Learner', kind: 'independent', guardianId: null });
const dataOnly = ({ exportedAt, ...data }) => data;
const code = expected => error => error instanceof StorageError && error.code === expected;

test('browser opening never silently uses volatile memory', async () => {
  await assert.rejects(openStore({ indexedDB: undefined }), code('STORAGE_UNAVAILABLE'));
});
test('memory adapter is explicit and rejects an unbranded backend', async () => {
  await assert.rejects(openMemoryStore({ database: {} }), code('INVALID_DATA'));
});
test('profiles preserve independent settings and journey through merged updates', async () => {
  const db = await store(); const learner = await profile(db);
  assert.equal(learner.settings.sound, false); assert.equal(learner.cloudOwnerUid, null);
  await db.appendEvent(learner.id, event());
  await db.updateProfile(learner.id, { settings: { mode: 'kids', language: 'vi' }, journey: { onboarded: true } });
  const updated = await db.updateProfile(learner.id, { settings: { quality: 'eco' }, journey: { region: 'B1' } });
  assert.deepEqual(updated.settings, { mode: 'kids', language: 'vi', quality: 'eco', motion: 'system', sound: false });
  assert.deepEqual(updated.journey, { region: 'B1', onboarded: true });
  assert.equal(updated.revision, 3); assert.equal((await db.getEvents(learner.id)).length, 1);
  assert.equal((await db.updateProfile(learner.id, { settings: { quality: 'eco' } })).revision, 3);
});
test('parallel connections to the same memory database do not lose independent profile patches', async () => {
  const database = createMemoryDatabase(); const first = await store({ database }); const second = await store({ database });
  const learner = await profile(first);
  await Promise.all([first.updateProfile(learner.id, { settings: { mode: 'serious' } }), second.updateProfile(learner.id, { settings: { language: 'vi' } })]);
  const result = await first.getProfile(learner.id);
  assert.equal(result.settings.mode, 'serious'); assert.equal(result.settings.language, 'vi'); assert.equal(result.revision, 3);
});
test('memory close/reopen retains saved state in the explicitly shared test database', async () => {
  const database = createMemoryDatabase(); const first = await store({ database }); const learner = await profile(first);
  await first.appendEvent(learner.id, event()); first.close(); first.close();
  await assert.rejects(first.getEvents(learner.id), code('STORAGE_CLOSED'));
  const reopened = await store({ database }); assert.equal((await reopened.getEvents(learner.id))[0].id, 'event-1');
});
test('simultaneous retries append an immutable event exactly once', async () => {
  const db = await store(); const learner = await profile(db);
  await Promise.all(Array.from({ length: 20 }, () => db.appendEvent(learner.id, event())));
  assert.equal((await db.getEvents(learner.id)).length, 1);
  await assert.rejects(db.appendEvent(learner.id, event('event-1', { payload: { correct: false } })), code('EVENT_CONFLICT'));
  assert.equal((await db.getEvents(learner.id))[0].payload.correct, true);
});
test('event IDs cannot move to a different profile', async () => {
  const db = await store(); const a = await profile(db); const b = await profile(db);
  await db.appendEvent(a.id, event());
  await assert.rejects(db.appendEvent(b.id, event()), code('EVENT_CONFLICT'));
  assert.deepEqual(await db.getEvents(b.id), []);
});
test('distinct concurrent events survive and sort deterministically', async () => {
  const db = await store(); const learner = await profile(db);
  await Promise.all(['z', 'a', 'm'].map(id => db.appendEvent(learner.id, event(id))));
  assert.deepEqual((await db.getEvents(learner.id)).map(item => item.id), ['a', 'm', 'z']);
});
test('caller mutation cannot change committed records or queued append/update inputs', async () => {
  const db = await store(); const learner = await profile(db); learner.settings.mode = 'kids';
  assert.equal((await db.getProfile(learner.id)).settings.mode, 'balanced');
  const submitted = event(); const saving = db.appendEvent(learner.id, submitted); submitted.payload.correct = false; submitted.id = 'changed';
  assert.equal((await saving).id, 'event-1');
  const patch = { settings: { language: 'vi' } }; const updating = db.updateProfile(learner.id, patch); patch.settings.language = 'en';
  await updating; assert.equal((await db.getProfile(learner.id)).settings.language, 'vi');
  const read = await db.getEvents(learner.id); read[0].payload.correct = false;
  assert.equal((await db.getEvents(learner.id))[0].payload.correct, true);
});
test('guardian relationships require an existing independent profile', async () => {
  const db = await store();
  await assert.rejects(db.createProfile({ name: 'Child', kind: 'dependent', guardianId: 'missing' }), code('INVALID_GUARDIAN'));
  const parent = await profile(db);
  const child = await db.createProfile({ name: 'Child', kind: 'dependent', guardianId: parent.id });
  await assert.rejects(db.createProfile({ name: 'Other child', kind: 'dependent', guardianId: child.id }), code('INVALID_GUARDIAN'));
  await assert.rejects(db.updateProfile(parent.id, { kind: 'dependent', guardianId: child.id }), code('INVALID_GUARDIAN'));
  await assert.rejects(db.updateProfile(child.id, { guardianId: child.id }), code('INVALID_GUARDIAN'));
  assert.equal((await db.getProfile(parent.id)).kind, 'independent');
});
test('guardian deletion is constrained; explicit profile deletion removes only its own events', async () => {
  const db = await store(); const parent = await profile(db);
  const child = await db.createProfile({ name: 'Child', kind: 'dependent', guardianId: parent.id });
  await db.appendEvent(parent.id, event('parent-event')); await db.appendEvent(child.id, event('child-event'));
  await assert.rejects(db.deleteProfile(parent.id), code('PROFILE_IN_USE'));
  assert.deepEqual(await db.deleteProfile(child.id), { deleted: true, eventCount: 1 });
  assert.equal((await db.exportAll()).events.length, 1);
  assert.equal((await db.getEvents(parent.id))[0].id, 'parent-event');
  assert.deepEqual(await db.deleteProfile(child.id), { deleted: false, eventCount: 0 });
  await db.deleteProfile(parent.id); assert.deepEqual((await db.exportAll()).profiles, []);
});
test('export/import roundtrip merges event history and is idempotent', async () => {
  const source = await store(); const learner = await profile(source); await source.appendEvent(learner.id, event());
  const backup = await source.exportAll(); const target = await store();
  assert.equal((await target.importAll(JSON.stringify(backup))).eventsAdded, 1);
  assert.equal((await target.importAll(backup)).eventsAdded, 0);
  assert.deepEqual(dataOnly(await target.exportAll()), dataOnly(backup));
  const returned = await target.exportAll(); returned.profiles[0].name = 'changed';
  assert.equal((await target.getProfile(learner.id)).name, 'Learner');
});
test('stale profile metadata cannot replace newer settings but its unique events are recovered', async () => {
  const source = await store(); const learner = await profile(source); const old = await source.exportAll();
  await source.updateProfile(learner.id, { settings: { language: 'vi' } });
  old.events.push({ ...event('recovered'), profileId: learner.id });
  const report = await source.importAll(old);
  assert.equal(report.eventsAdded, 1); assert.equal((await source.getProfile(learner.id)).settings.language, 'vi');
});
test('newer profile metadata imports without removing current events', async () => {
  const db = await store(); const learner = await profile(db); await db.appendEvent(learner.id, event());
  const incoming = await db.exportAll(); incoming.events = [];
  incoming.profiles[0].revision++; incoming.profiles[0].updatedAt = LATER; incoming.profiles[0].journey.region = 'C1';
  assert.equal((await db.importAll(incoming)).profilesUpdated, 1);
  assert.equal((await db.getProfile(learner.id)).journey.region, 'C1'); assert.equal((await db.getEvents(learner.id)).length, 1);
});
test('same-ID event conflict rejects the entire import without partial additions', async () => {
  const db = await store(); const learner = await profile(db); await db.appendEvent(learner.id, event());
  const before = await db.exportAll(); const incoming = structuredClone(before);
  incoming.events.unshift({ ...event('new-before-conflict'), profileId: learner.id });
  incoming.events[1].payload.correct = false;
  await assert.rejects(db.importAll(incoming), code('IMPORT_CONFLICT'));
  assert.deepEqual(await db.exportAll(), before);
});
test('equal-revision profile conflicts and changed immutable identity are refused', async () => {
  const db = await store(); const learner = await profile(db); const before = await db.exportAll();
  const incoming = structuredClone(before); incoming.profiles[0].settings.language = 'vi';
  await assert.rejects(db.importAll(incoming), code('IMPORT_CONFLICT'));
  incoming.profiles[0].revision++; incoming.profiles[0].createdAt = '2026-10-19T10:00:00.000Z';
  await assert.rejects(db.importAll(incoming), code('IMPORT_CONFLICT'));
  assert.equal((await db.getProfile(learner.id)).settings.language, 'en');
});
test('cloud owner binding is explicit, persists, and conflicting import ownership is refused', async () => {
  const db = await store(); const learner = await profile(db);
  await db.updateProfile(learner.id, { cloudOwnerUid: 'uid-family-1' });
  const incoming = await db.exportAll(); incoming.profiles[0].cloudOwnerUid = 'uid-family-2'; incoming.profiles[0].revision++;
  await assert.rejects(db.importAll(incoming), code('IMPORT_CONFLICT'));
  assert.equal((await db.getProfile(learner.id)).cloudOwnerUid, 'uid-family-1');
});
test('partial restore may refer to an already present guardian, but final graph cannot dangle', async () => {
  const db = await store(); const parent = await profile(db);
  const child = await db.createProfile({ name: 'Child', kind: 'dependent', guardianId: parent.id });
  const full = await db.exportAll(); const target = await store();
  const parentOnly = structuredClone(full); parentOnly.profiles = parentOnly.profiles.filter(item => item.id === parent.id); await target.importAll(parentOnly);
  const childOnly = structuredClone(full); childOnly.profiles = childOnly.profiles.filter(item => item.id === child.id);
  assert.throws(() => validateExport(childOnly), code('INVALID_GUARDIAN'));
  await target.importAll(childOnly); assert.equal((await target.listProfiles()).length, 2);
  const empty = await store(); await assert.rejects(empty.importAll(childOnly), code('INVALID_GUARDIAN'));
});
test('duplicate imports, orphan events, unsupported versions and bad timestamps are rejected', async () => {
  const db = await store(); const learner = await profile(db); const valid = await db.exportAll();
  for (const mutate of [
    value => { value.profiles.push(structuredClone(value.profiles[0])); },
    value => { value.events.push({ ...event(), profileId: 'missing-profile' }); },
    value => { value.schemaVersion = 2; },
    value => { value.profiles[0].createdAt = '2026-02-30T10:00:00.000Z'; },
    value => { value.profiles[0].unknown = true; },
    value => { value.events.push({ ...event(), profileId: learner.id }, { ...event(), profileId: learner.id }); },
  ]) {
    const broken = structuredClone(valid); mutate(broken);
    await assert.rejects(db.importAll(broken), error => error instanceof StorageError);
    assert.deepEqual(await db.exportAll(), valid);
  }
});
test('prototype pollution, executable values, accessors and raw HTML are rejected without evaluating getters', async () => {
  const db = await store(); const learner = await profile(db); let called = false;
  const accessor = {}; Object.defineProperty(accessor, 'response', { enumerable: true, get() { called = true; return 'value'; } });
  for (const payload of [JSON.parse('{"__proto__":{"polluted":true}}'), { nested: { constructor: {} } },
    { fn() {} }, { n: Infinity }, { html: '<img src=x onerror=alert(1)>' }, { url: 'javascript:alert(1)' },
    { bad: undefined }, { bad: 1n }, accessor, { array: [, 'hole'] }, { value: new Date() }]) {
    await assert.rejects(db.appendEvent(learner.id, event('unsafe', { payload })), error => error instanceof StorageError);
  }
  assert.equal(called, false); assert.equal({}.polluted, undefined); assert.equal((await db.getEvents(learner.id)).length, 0);
});
test('import array accessors and extra properties are rejected before evaluation', async () => {
  const db = await store(); await profile(db); const incoming = await db.exportAll(); let called = false;
  Object.defineProperty(incoming.profiles, '0', { get() { called = true; throw new Error('must not execute'); }, configurable: true });
  await assert.rejects(db.importAll(incoming), code('INVALID_DATA')); assert.equal(called, false);
  const next = await db.exportAll(); next.events.extra = true;
  await assert.rejects(db.importAll(next), code('INVALID_DATA'));
});
test('non-enumerable fields cannot pass validation and disappear during JSON cloning', async () => {
  const db = await store(); const learner = await profile(db); const submitted = event();
  Object.defineProperty(submitted, 'payload', { value: submitted.payload, enumerable: false });
  await assert.rejects(db.appendEvent(learner.id, submitted), code('INVALID_DATA'));
  const backup = await db.exportAll(); Object.defineProperty(backup.profiles[0], 'name', { value: 'Hidden', enumerable: false });
  await assert.rejects(db.importAll(backup), code('INVALID_DATA'));
});
test('drafts accept 5000 characters and reject excessive payload strings, byte sizes and nesting', async () => {
  const db = await store(); const learner = await profile(db);
  await db.appendEvent(learner.id, event('draft-1', { kind: 'draft', payload: { activityId: 'activity-1', missionId: 'mission-1', answer: 'a'.repeat(5000), supported: true } }));
  assert.equal((await db.getEvents(learner.id))[0].payload.answer.length, 5000);
  await assert.rejects(db.appendEvent(learner.id, event('draft-long', { payload: { answer: 'a'.repeat(5001) } })), code('INVALID_DATA'));
  await assert.rejects(db.appendEvent(learner.id, event('too-many-bytes', { payload: Object.fromEntries(Array.from({ length: 8 }, (_, index) => [`part${index}`, 'x'.repeat(5000)])) })), code('DATA_LIMIT'));
  let nested = {}; for (let index = 0; index < 15; index++) nested = { nested };
  await assert.rejects(db.appendEvent(learner.id, event('deep', { payload: nested })), code('DATA_LIMIT'));
});
test('failed transaction after an event write rolls back, and retry can succeed', async () => {
  const database = createMemoryDatabase(); const original = database.run.bind(database); let interrupt = false;
  database.run = (tables, mode, work) => original(tables, mode, query => work({ ...query,
    put: async (table, value) => { if (interrupt && table === 'meta') throw new StorageError('STORAGE_ABORTED', 'Injected test interruption'); return query.put(table, value); },
  }));
  const db = await store({ database }); const learner = await profile(db);
  interrupt = true; await assert.rejects(db.appendEvent(learner.id, event()), code('STORAGE_ABORTED'));
  assert.deepEqual(await db.getEvents(learner.id), []);
  interrupt = false; await db.appendEvent(learner.id, event()); assert.equal((await db.getEvents(learner.id)).length, 1);
});
test('data limit failure does not evict previous history', async () => {
  const database = createMemoryDatabase(); const db = await store({ database }); const learner = await profile(db);
  await db.appendEvent(learner.id, event());
  await database.run(['meta'], 'readwrite', async query => { const stats = await query.get('meta', 'stats'); await query.put('meta', { ...stats, bytes: STORE_LIMITS.dataBytes }); });
  await assert.rejects(db.appendEvent(learner.id, event('over-limit')), code('DATA_LIMIT'));
  assert.equal((await db.getEvents(learner.id)).length, 1);
});
test('pure merge treats JSON key order as equivalent and does not mutate inputs', async () => {
  const db = await store(); const learner = await profile(db); await db.appendEvent(learner.id, event());
  const first = await db.exportAll(); const second = structuredClone(first);
  second.events[0].payload = { correct: true, answer: 'Learner response', activityId: 'a1-test-01' };
  const before = JSON.stringify(first); const merged = mergeExports(first, second);
  assert.equal(merged.report.eventsAdded, 0); assert.equal(JSON.stringify(first), before);
});
test('validation rejects unknown event kinds and invalid identity fields', () => {
  assert.throws(() => validateEvent(event('bad event id')), code('INVALID_DATA'));
  assert.throws(() => validateEvent(event('event', { kind: 'arbitrary-executable-event' })), code('INVALID_DATA'));
});
