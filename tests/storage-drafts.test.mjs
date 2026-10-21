import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, openMemoryStore, createMemoryDatabase, mergeExports, StorageError, STORE_LIMITS } from '../src/storage.js';

const AT = '2026-10-20T10:00:00.000Z';
const LATER = '2026-10-20T11:00:00.000Z';
const LAST = '2026-10-20T12:00:00.000Z';
const draft = (id, at = AT, activityId = 'writing-1', answer = 'A recoverable response') => ({
  id, kind: 'draft', at, payload: { activityId, answer, supported: false },
});
const attempt = (id, at = LATER, activityId = 'writing-1') => ({
  id, kind: 'attempt', at, payload: { activityId, answer: 'A submitted response', supported: false },
});
const code = expected => error => error instanceof StorageError && error.code === expected;
const encodedBytes = value => new TextEncoder().encode(JSON.stringify(value)).byteLength;
async function setup(database = createMemoryDatabase()) {
  const db = await openMemoryStore({ database, clock: () => AT });
  const learner = await db.createProfile({ name: 'Learner' });
  return { db, learner, database };
}
const accounting = database => database.run(['meta'], 'readonly', query => query.get('meta', 'stats'));
async function checkAccounting(db, database) {
  const data = await db.exportAll(), stats = await accounting(database);
  assert.deepEqual(stats, { key: 'stats', profileCount: data.profiles.length, eventCount: data.events.length,
    bytes: [...data.profiles, ...data.events].reduce((total, item) => total + encodedBytes(item), 0) });
}
async function seedLegacyEvents(database, profileId, events) {
  await database.run(['events', 'meta'], 'readwrite', async query => {
    const stats = await query.get('meta', 'stats');
    for (const event of events) {
      const stored = { ...event, profileId }; await query.add('events', stored);
      stats.eventCount++; stats.bytes += encodedBytes(stored);
    }
    await query.put('meta', stats);
  });
}
function faultDatabase() {
  const database = createMemoryDatabase(), run = database.run.bind(database);
  const control = { method: null, table: null, error: null };
  database.run = (tables, mode, work) => run(tables, mode, query => {
    const wrapped = { ...query };
    for (const method of ['add', 'put', 'remove']) wrapped[method] = async (...args) => {
      const result = await query[method](...args);
      if (control.method === method && control.table === args[0]) throw control.error;
      return result;
    };
    return work(wrapped);
  });
  return { database, control };
}

test('many writing autosaves retain one snapshot and correct storage accounting', async () => {
  const { db, learner, database } = await setup();
  for (let index = 0; index < 150; index++) await db.appendEvent(learner.id,
    draft(`draft-${String(index).padStart(3, '0')}`, new Date(Date.parse(AT) + index * 1500).toISOString(), 'writing-1', `Response revision ${index}`));
  const events = await db.getEvents(learner.id);
  assert.equal(events.length, 1); assert.equal(events[0].payload.answer, 'Response revision 149');
  await checkAccounting(db, database);
  db.close();
  const reopened = await openMemoryStore({ database, clock: () => AT });
  assert.deepEqual(await reopened.getEvents(learner.id), events);
});

test('ordinary draft and attempt writes query only the selected profile/activity, including large unrelated history', async () => {
  const database = createMemoryDatabase(), run = database.run.bind(database), activityReads = [];
  let guardHotPath = false;
  database.run = (tables, mode, work) => run(tables, mode, query => work({ ...query,
    byProfile: async profileId => {
      assert.equal(guardHotPath, false, 'ordinary autosave must not read every profile event');
      return query.byProfile(profileId);
    },
    all: async table => {
      if (table === 'events') assert.equal(guardHotPath, false, 'ordinary autosave must not scan the event table');
      return query.all(table);
    },
    byActivity: async (profileId, activityId) => {
      const rows = await query.byActivity(profileId, activityId);
      if (guardHotPath) activityReads.push({ profileId, activityId, count: rows.length });
      return rows;
    },
  }));
  const { db, learner } = await setup(database), other = await db.createProfile({ name: 'Other learner' });
  const history = Array.from({ length: 1000 }, (_, index) => attempt(`unrelated-${index}`, AT, `other-activity-${index}`));
  const support = { id: 'immutable-support', kind: 'support', at: AT, payload: { activityId: 'writing-1', supported: true } };
  await seedLegacyEvents(database, learner.id, [...history, attempt('earlier-attempt', AT), support, draft('old-work', LATER)]);
  await seedLegacyEvents(database, other.id, [draft('other-profile-draft', LAST)]);
  guardHotPath = true;
  await db.appendEvent(learner.id, draft('new-work', LAST));
  await db.appendEvent(learner.id, attempt('new-submission', LAST));
  await db.appendEvent(learner.id, draft('delayed-work', LATER));
  assert.deepEqual(activityReads, Array.from({ length: 3 }, () => ({ profileId: learner.id, activityId: 'writing-1', count: 3 })));
  guardHotPath = false;
  const events = await db.getEvents(learner.id);
  assert.equal(events.length, history.length + 3);
  assert.equal(events.some(event => event.kind === 'draft'), false);
  assert.deepEqual(events.find(event => event.id === support.id), support);
  assert.deepEqual((await db.getEvents(other.id)).map(event => event.id), ['other-profile-draft']);
  await checkAccounting(db, database);
});

test('memory byActivity query returns isolated copies for the exact compound activity key', async () => {
  const { db, learner, database } = await setup(), other = await db.createProfile({ name: 'Other learner' });
  await db.appendEvent(learner.id, draft('target'));
  await db.appendEvent(learner.id, draft('other-activity', AT, 'writing-2'));
  await db.appendEvent(other.id, draft('other-profile'));
  const queryActivity = () => database.run(['events'], 'readonly', query => query.byActivity(learner.id, 'writing-1'));
  const rows = await queryActivity();
  assert.deepEqual(rows.map(event => event.id), ['target']);
  rows[0].payload.answer = 'Caller mutation';
  assert.equal((await queryActivity())[0].payload.answer, 'A recoverable response');
});

test('legacy drafts without string activity IDs keep the profile query fallback', async () => {
  const database = createMemoryDatabase(), run = database.run.bind(database);
  const reads = { profile: 0, activity: 0 };
  database.run = (tables, mode, work) => run(tables, mode, query => work({ ...query,
    byProfile: async profileId => { reads.profile++; return query.byProfile(profileId); },
    byActivity: async (...args) => { reads.activity++; return query.byActivity(...args); },
  }));
  const { db, learner } = await setup(database);
  const old = draft('legacy-old'), latest = draft('legacy-new', LATER);
  delete old.payload.activityId; delete latest.payload.activityId;
  await db.appendEvent(learner.id, old); await db.appendEvent(learner.id, latest);
  assert.deepEqual(reads, { profile: 2, activity: 0 });
  assert.deepEqual(await db.getEvents(learner.id), [latest]);
  await checkAccounting(db, database);
});

test('version-one upgrade requests only the compound index and leaves existing stores and metadata intact', async () => {
  const operations = [];
  const existingEvents = { createIndex: (name, keyPath) => operations.push({ name, keyPath }) };
  const database = {
    createObjectStore() { assert.fail('upgrading version one must not recreate any store'); },
    close() {},
  };
  const factory = { open(name, version) {
    assert.equal(version, 2);
    const request = { result: database, transaction: { objectStore(table) { assert.equal(table, 'events'); return existingEvents; } } };
    queueMicrotask(() => {
      request.onupgradeneeded({ oldVersion: 1 });
      request.onsuccess();
    });
    return request;
  } };
  const db = await openStore({ indexedDB: factory }); db.close();
  assert.deepEqual(operations, [{ name: 'byActivity', keyPath: ['profileId', 'payload.activityId'] }]);
});

test('new database schema creates both event indexes while backup schema stays version one', async () => {
  const operations = [], stores = new Map();
  const database = {
    createObjectStore(name, options) {
      const store = { createIndex(index, keyPath) { operations.push({ table: name, index, keyPath }); },
        put(value) { assert.equal(name, 'meta'); assert.deepEqual(value, { key: 'stats', profileCount: 0, eventCount: 0, bytes: 0 }); } };
      stores.set(name, store); assert.equal(options.keyPath, name === 'meta' ? 'key' : 'id'); return store;
    },
    close() {},
  };
  const factory = { open(name, version) {
    assert.equal(version, 2);
    const request = { result: database, transaction: { objectStore: table => stores.get(table) } };
    queueMicrotask(() => { request.onupgradeneeded({ oldVersion: 0 }); request.onsuccess(); });
    return request;
  } };
  const indexed = await openStore({ indexedDB: factory }); indexed.close();
  assert.deepEqual([...stores.keys()], ['profiles', 'events', 'meta']);
  assert.deepEqual(operations, [{ table: 'events', index: 'byProfile', keyPath: 'profileId' },
    { table: 'events', index: 'byActivity', keyPath: ['profileId', 'payload.activityId'] }]);
  const { db } = await setup(); assert.equal((await db.exportAll()).schemaVersion, 1);
});

test('draft ordering uses timestamp then ID and older receipts cannot replace current text', async () => {
  const { db, learner } = await setup();
  await db.appendEvent(learner.id, draft('draft-z', LATER));
  const stale = draft('draft-a', AT, 'writing-1', 'Old response');
  assert.deepEqual(await db.appendEvent(learner.id, stale), stale);
  await db.appendEvent(learner.id, draft('draft-a-tie', LATER));
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['draft-z']);
  await db.appendEvent(learner.id, draft('draft-zz', LATER));
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['draft-zz']);
});

test('retained draft IDs remain idempotent and conflicting content or profiles are refused', async () => {
  const { db, learner } = await setup();
  const other = await db.createProfile({ name: 'Other learner' });
  const saved = draft('same-id', LATER);
  await db.appendEvent(learner.id, saved); await db.appendEvent(learner.id, saved);
  await assert.rejects(db.appendEvent(learner.id, draft('same-id', AT)), code('EVENT_CONFLICT'));
  await assert.rejects(db.appendEvent(other.id, saved), code('EVENT_CONFLICT'));
  assert.equal((await db.getEvents(learner.id)).length, 1);
  assert.deepEqual(await db.getEvents(other.id), []);
});

test('legacy draft history is excluded from export and compacted on an identical append retry', async () => {
  const { db, learner, database } = await setup();
  const old = draft('legacy-old'), latest = draft('legacy-latest', LATER);
  await seedLegacyEvents(database, learner.id, [old, latest]);
  const backup = await db.exportAll();
  assert.deepEqual(backup.events.map(event => event.id), ['legacy-latest']);
  const conflicting = structuredClone(backup);
  conflicting.events = [{ ...draft('legacy-old', AT, 'writing-1', 'Changed legacy content'), profileId: learner.id }];
  await assert.rejects(db.importAll(conflicting), code('IMPORT_CONFLICT'));
  assert.equal((await db.getEvents(learner.id)).length, 2);
  await db.appendEvent(learner.id, latest);
  assert.deepEqual(await db.getEvents(learner.id), [latest]);
  await checkAccounting(db, database);
});

test('an empty import compacts legacy snapshots while preserving every learning record', async () => {
  const { db, learner, database } = await setup();
  const submitted = attempt('legacy-submission');
  await seedLegacyEvents(database, learner.id, [draft('legacy-stale'), submitted]);
  const incoming = await db.exportAll(); incoming.events = [];
  assert.equal((await db.importAll(incoming)).eventsAdded, 0);
  assert.deepEqual(await db.getEvents(learner.id), [submitted]);
  await checkAccounting(db, database);
});

test('draft compaction isolates activities and profiles and preserves all learning kinds', async () => {
  const { db, learner, database } = await setup();
  const other = await db.createProfile({ name: 'Other learner' });
  const history = ['attempt', 'mission', 'placement', 'observatory', 'expedition', 'support'].map(kind => ({
    id: `evidence-${kind}`, kind, at: AT, payload: { activityId: 'other-activity', answer: 'Evidence', commands: ['N', 'X'] },
  }));
  for (const event of history) await db.appendEvent(learner.id, event);
  await db.appendEvent(learner.id, draft('a-old'));
  await db.appendEvent(learner.id, draft('b', AT, 'writing-2'));
  await db.appendEvent(other.id, draft('other-profile'));
  await db.appendEvent(learner.id, draft('a-new', LATER));
  const events = await db.getEvents(learner.id);
  assert.equal(events.length, history.length + 2);
  for (const event of history) assert.deepEqual(events.find(item => item.id === event.id), event);
  assert.deepEqual((await db.getEvents(other.id)).map(event => event.id), ['other-profile']);
  await checkAccounting(db, database);
});

test('a submission atomically removes only its own older draft and blocks stale append or restore', async () => {
  const { db, learner, database } = await setup();
  await db.appendEvent(learner.id, draft('draft-before-submit'));
  await db.appendEvent(learner.id, draft('other-activity', AT, 'writing-2'));
  const stale = await db.exportAll();
  const submitted = attempt('submitted'); await db.appendEvent(learner.id, submitted);
  await db.appendEvent(learner.id, draft('delayed-autosave'));
  await db.appendEvent(learner.id, draft('zz-same-time', LATER));
  const report = await db.importAll(stale);
  assert.equal(report.eventsAdded, 0);
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['other-activity', 'submitted']);
  assert.deepEqual((await db.getEvents(learner.id)).find(event => event.id === submitted.id), submitted);
  await checkAccounting(db, database);
});

test('equal-time submissions clear drafts regardless of random ID order', async () => {
  for (const [draftId, attemptId] of [['a-draft', 'z-attempt'], ['z-draft', 'a-attempt']]) {
    const { db, learner } = await setup();
    await db.appendEvent(learner.id, draft(draftId));
    await db.appendEvent(learner.id, attempt(attemptId, AT));
    await db.appendEvent(learner.id, draft('zz-stale', AT));
    assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), [attemptId]);
  }
});

test('attempt envelopes without answers cannot discard drafts, and old attempts preserve newer work', async () => {
  const { db, learner } = await setup();
  await db.appendEvent(learner.id, draft('new-work', LAST));
  await db.appendEvent(learner.id, { id: 'orphan', kind: 'attempt', at: LAST, payload: { activityId: 'writing-1' } });
  await db.appendEvent(learner.id, { id: 'wrong-type', kind: 'attempt', at: LAST, payload: { activityId: null, answer: null } });
  await db.appendEvent(learner.id, attempt('older-submission'));
  assert.equal((await db.getEvents(learner.id)).filter(event => event.kind === 'draft').length, 1);
  await db.appendEvent(learner.id, { ...attempt('valid-envelope', LAST), payload: { activityId: 'writing-1', answer: null } });
  assert.equal((await db.getEvents(learner.id)).filter(event => event.kind === 'draft').length, 0);
  assert.equal((await db.getEvents(learner.id)).filter(event => event.kind === 'attempt').length, 4);
});

test('empty snapshots replace recoverable text while every prior attempt remains immutable', async () => {
  const { db, learner } = await setup();
  const evidence = attempt('earlier-attempt', AT); await db.appendEvent(learner.id, evidence);
  await db.appendEvent(learner.id, draft('typing', LATER));
  await db.appendEvent(learner.id, draft('cleared', LAST, 'writing-1', null));
  const events = await db.getEvents(learner.id);
  assert.deepEqual(events, [evidence, draft('cleared', LAST, 'writing-1', null)]);
});

test('concurrent connections deterministically retain newest drafts and protect submissions', async () => {
  const { db, learner, database } = await setup();
  const second = await openMemoryStore({ database, clock: () => AT });
  await Promise.all(Array.from({ length: 30 }, (_, index) => (index % 2 ? db : second).appendEvent(learner.id,
    draft(`draft-${String(29 - index).padStart(2, '0')}`, LATER))));
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['draft-29']);
  await Promise.all([second.appendEvent(learner.id, attempt('submitted', LAST)), db.appendEvent(learner.id, draft('pending', LATER))]);
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['submitted']);
  await checkAccounting(db, database);
});

test('draft export contains current recoverable content and excludes prior writing revisions', async () => {
  const { db, learner } = await setup();
  await db.appendEvent(learner.id, draft('private-old', AT, 'writing-1', 'discarded private phrasing'));
  await db.appendEvent(learner.id, draft('current', LATER, 'writing-1', 'current private phrasing'));
  const backup = await db.exportAll(), serialized = JSON.stringify(backup);
  assert.equal(serialized.includes('discarded private phrasing'), false);
  assert.equal(serialized.includes('current private phrasing'), true);
  backup.events[0].payload.answer = 'external mutation';
  assert.equal((await db.getEvents(learner.id))[0].payload.answer, 'current private phrasing');
});

test('imports compact multiple drafts, merge older and newer work, and remain idempotent', async () => {
  const { db, learner, database } = await setup();
  await db.appendEvent(learner.id, draft('local-current', LATER));
  const incoming = await db.exportAll(); incoming.events = [
    { ...draft('old-import'), profileId: learner.id },
    { ...draft('latest-import', LAST), profileId: learner.id },
    { ...draft('second-activity', LATER, 'writing-2'), profileId: learner.id },
  ];
  const report = await db.importAll(JSON.stringify(incoming));
  assert.equal(report.eventsAdded, 2); assert.equal(report.eventsUnchanged, 1);
  assert.equal((await db.importAll(incoming)).eventsAdded, 0);
  const older = structuredClone(incoming); older.events = [{ ...draft('old-only'), profileId: learner.id }];
  assert.equal((await db.importAll(older)).eventsAdded, 0);
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['second-activity', 'latest-import']);
  await checkAccounting(db, database);
});

test('pure merge retains union of immutable history while submissions suppress stale drafts in either order', async () => {
  const { db, learner } = await setup();
  const left = await db.exportAll(), right = structuredClone(left);
  left.events = [{ ...draft('old'), profileId: learner.id }, { ...attempt('left-attempt', AT, 'other-activity'), profileId: learner.id }];
  right.events = [{ ...attempt('right-attempt'), profileId: learner.id }];
  const originalLeft = structuredClone(left), originalRight = structuredClone(right);
  for (const result of [mergeExports(left, right), mergeExports(right, left)]) {
    assert.deepEqual(result.data.events.map(event => event.id), ['left-attempt', 'right-attempt']);
  }
  assert.deepEqual(left, originalLeft); assert.deepEqual(right, originalRight);
});

test('import checks conflicting retained IDs before removing drafts or adding learning evidence', async () => {
  const { db, learner, database } = await setup();
  await db.appendEvent(learner.id, draft('conflict'));
  const before = await db.exportAll(), incoming = structuredClone(before);
  incoming.events.push({ ...attempt('new-submission'), profileId: learner.id });
  incoming.events[0].payload.answer = 'conflicting draft content';
  await assert.rejects(db.importAll(incoming), code('IMPORT_CONFLICT'));
  assert.deepEqual(await db.exportAll(), before); await checkAccounting(db, database);
});

for (const [method, table] of [['remove', 'events'], ['add', 'events'], ['put', 'meta']]) {
  test(`draft replacement rollback preserves recovery snapshot after ${method} ${table} quota failure`, async () => {
    const { database, control } = faultDatabase(), { db, learner } = await setup(database);
    await db.appendEvent(learner.id, draft('recoverable'));
    const before = await db.exportAll(), stats = await accounting(database);
    Object.assign(control, { method, table, error: new DOMException('Injected device quota failure', 'QuotaExceededError') });
    await assert.rejects(db.appendEvent(learner.id, draft('replacement', LATER)), code('STORAGE_QUOTA'));
    assert.deepEqual(await db.exportAll(), before); assert.deepEqual(await accounting(database), stats);
    control.method = null;
    await db.appendEvent(learner.id, draft('replacement', LATER)); await checkAccounting(db, database);
  });
}

test('failed submission after draft pruning rolls back both evidence and draft changes', async () => {
  const { database, control } = faultDatabase(), { db, learner } = await setup(database);
  await db.appendEvent(learner.id, draft('recoverable'));
  const before = await db.exportAll();
  Object.assign(control, { method: 'add', table: 'events', error: new StorageError('STORAGE_ABORTED', 'Injected transaction interruption') });
  await assert.rejects(db.appendEvent(learner.id, attempt('submission')), code('STORAGE_ABORTED'));
  assert.deepEqual(await db.exportAll(), before); await checkAccounting(db, database);
  control.method = null;
  await db.appendEvent(learner.id, attempt('submission')); await checkAccounting(db, database);
});

for (const [method, table] of [['remove', 'events'], ['put', 'events'], ['put', 'meta']]) {
  test(`import pruning and writes roll back together after ${method} ${table} failure`, async () => {
    const { database, control } = faultDatabase(), { db, learner } = await setup(database);
    await db.appendEvent(learner.id, draft('recoverable'));
    const before = await db.exportAll(), incoming = structuredClone(before);
    incoming.events = [{ ...draft('replacement', LATER), profileId: learner.id }, { ...attempt('other-evidence', LATER, 'other-activity'), profileId: learner.id }];
    Object.assign(control, { method, table, error: new StorageError('STORAGE_ABORTED', 'Injected transaction interruption') });
    await assert.rejects(db.importAll(incoming), code('STORAGE_ABORTED'));
    assert.deepEqual(await db.exportAll(), before); await checkAccounting(db, database);
    control.method = null;
    await db.importAll(incoming); await checkAccounting(db, database);
  });
}

test('data budget failure preserves prior draft before any pruning, but replacements receive reclaimed byte credit', async () => {
  const { db, learner, database } = await setup();
  await db.appendEvent(learner.id, draft('recoverable', AT, 'writing-1', 'x'));
  const before = await db.exportAll();
  await database.run(['meta'], 'readwrite', async query => {
    const stats = await query.get('meta', 'stats'); await query.put('meta', { ...stats, bytes: STORE_LIMITS.dataBytes });
  });
  await assert.rejects(db.appendEvent(learner.id, draft('large-replacement', LATER, 'writing-1', 'x'.repeat(5000))), code('DATA_LIMIT'));
  assert.deepEqual(await db.exportAll(), before);
  await db.appendEvent(learner.id, draft('new', LATER, 'writing-1', 'x'));
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['new']);
  assert.ok((await accounting(database)).bytes <= STORE_LIMITS.dataBytes);
});

test('a different profile submission cannot suppress a same-activity draft during import', async () => {
  const { db, learner, database } = await setup();
  const other = await db.createProfile({ name: 'Other learner' });
  const incoming = await db.exportAll(); incoming.events = [
    { ...draft('learner-draft'), profileId: learner.id },
    { ...attempt('other-submission'), profileId: other.id },
  ];
  await db.importAll(incoming);
  assert.deepEqual((await db.getEvents(learner.id)).map(event => event.id), ['learner-draft']);
  assert.deepEqual((await db.getEvents(other.id)).map(event => event.id), ['other-submission']);
  await checkAccounting(db, database);
});
