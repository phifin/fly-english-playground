// Browser persistence. Memory storage is an explicit test adapter, never a fallback.
export const STORE_LIMITS = Object.freeze({ profiles: 64, events: 100000,
  eventBytes: 32768, dataBytes: 36 * 1024 * 1024, importBytes: 40 * 1024 * 1024,
  stringCharacters: 5000, depth: 12, payloadNodes: 4000 });
export const STORE_EVENT = 'atlas:store-change';
const VERSION = 1;
const DATABASE_VERSION = 2;
const DEFAULT_NAME = 'unfolding-atlas-learning';
const TABLES = ['profiles', 'events', 'meta'];
const KINDS = new Set(['attempt', 'mission', 'placement', 'observatory', 'draft', 'expedition', 'support']);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const PROFILE_KEYS = ['id', 'name', 'kind', 'guardianId', 'createdAt', 'updatedAt',
  'revision', 'settings', 'journey', 'cloudOwnerUid'];
const DEFAULT_SETTINGS = Object.freeze({ mode: 'balanced', language: 'en', quality: 'auto', motion: 'system', sound: false });
const DEFAULT_JOURNEY = Object.freeze({ region: 'A1', onboarded: false });
const encoder = new TextEncoder();
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const bytes = value => encoder.encode(JSON.stringify(value)).byteLength;
const own = (value, key) => Object.hasOwn(value, key);
const fail = (code, message) => { throw new StorageError(code, message); };

export class StorageError extends Error {
  constructor(code, message, cause) { super(message, cause ? { cause } : undefined); this.name = 'StorageError'; this.code = code; }
}
function storageError(error) {
  if (error instanceof StorageError) return error;
  if (error?.name === 'QuotaExceededError') return new StorageError('STORAGE_QUOTA', 'Device storage is full. Existing progress was preserved; export a backup and free storage before retrying.', error);
  if (['SecurityError', 'NotAllowedError'].includes(error?.name)) return new StorageError('STORAGE_UNAVAILABLE', 'This browser denied persistent storage. Check private browsing or site permissions and retry.', error);
  return new StorageError('STORAGE_FAILED', 'Progress could not be saved or read. Keep this page open, export if possible, and retry.', error);
}
function record(value, required, allowed = required, label = 'record') {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('INVALID_DATA', `${label} must be a plain object.`);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || BLOCKED_KEYS.has(key) || !allowed.includes(key)
      || !descriptor.enumerable || !own(descriptor, 'value')) fail('INVALID_DATA', `${label} has an unsupported field.`);
  }
  if (required.some(key => !own(value, key))) fail('INVALID_DATA', `${label} is missing a required field.`);
  return value;
}
function text(value, max = STORE_LIMITS.stringCharacters, label = 'Text', allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || Array.from(value).length > max
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)
    || /<\/?[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html/iu.test(value)) fail('INVALID_DATA', `${label} is empty, too long, or contains unsupported markup.`);
  return value;
}
function id(value, label = 'Identifier') {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(value)) fail('INVALID_DATA', `${label} is invalid.`);
  return value;
}
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) fail('INVALID_DATA', 'Timestamps must be valid UTC ISO strings with milliseconds.');
  return value;
}
function oneOf(value, options, label) { if (!options.includes(value)) fail('INVALID_DATA', `${label} is invalid.`); }
function boolean(value, label) { if (typeof value !== 'boolean') fail('INVALID_DATA', `${label} must be true or false.`); }
function settings(value, partial = false) {
  record(value, partial ? [] : Object.keys(DEFAULT_SETTINGS), Object.keys(DEFAULT_SETTINGS), 'Settings');
  if (own(value, 'mode')) oneOf(value.mode, ['kids', 'balanced', 'serious'], 'Experience mode');
  if (own(value, 'language')) oneOf(value.language, ['en', 'vi'], 'Guidance language');
  if (own(value, 'quality')) oneOf(value.quality, ['auto', 'eco', 'balanced', 'ultra'], 'Quality');
  if (own(value, 'motion')) oneOf(value.motion, ['system', 'reduced', 'full'], 'Motion');
  if (own(value, 'sound')) boolean(value.sound, 'Sound');
}
function journey(value, partial = false) {
  record(value, partial ? [] : Object.keys(DEFAULT_JOURNEY), Object.keys(DEFAULT_JOURNEY), 'Journey');
  if (own(value, 'region')) oneOf(value.region, LEVELS, 'Region');
  if (own(value, 'onboarded')) boolean(value.onboarded, 'Onboarding');
}
function owner(value) {
  if (value !== null && (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/u.test(value))) fail('INVALID_DATA', 'Cloud owner UID is invalid.');
}
export function validateProfile(profile) {
  record(profile, PROFILE_KEYS, PROFILE_KEYS, 'Profile');
  id(profile.id); text(profile.name, 80, 'Profile name');
  oneOf(profile.kind, ['independent', 'dependent'], 'Profile kind');
  if (profile.guardianId !== null) id(profile.guardianId, 'Guardian ID');
  if (profile.kind === 'independent' && profile.guardianId !== null) fail('INVALID_GUARDIAN', 'An independent profile cannot have a guardian.');
  if (profile.kind === 'dependent' && !profile.guardianId) fail('INVALID_GUARDIAN', 'A dependent profile needs an existing independent guardian.');
  timestamp(profile.createdAt); timestamp(profile.updatedAt);
  if (profile.updatedAt < profile.createdAt || !Number.isSafeInteger(profile.revision) || profile.revision < 1) fail('INVALID_DATA', 'Profile revision or dates are inconsistent.');
  settings(profile.settings); journey(profile.journey); owner(profile.cloudOwnerUid);
  return profile;
}
function validateGraph(profiles) {
  const byId = new Map(profiles.map(profile => [profile.id, profile]));
  for (const profile of profiles) {
    if (profile.guardianId === null) continue;
    const guardian = byId.get(profile.guardianId);
    if (!guardian) fail('INVALID_GUARDIAN', 'A guardian reference points to a missing profile.');
    const seen = new Set([profile.id]);
    let current = profile;
    while (current?.guardianId !== null && current?.guardianId !== undefined) {
      if (seen.has(current.guardianId)) fail('INVALID_GUARDIAN', 'Guardian relationships cannot contain a cycle.');
      seen.add(current.guardianId); current = byId.get(current.guardianId);
    }
    if (guardian.kind !== 'independent') fail('INVALID_GUARDIAN', 'Only an independent profile may be a guardian.');
  }
}
function jsonPayload(payload) {
  record(payload, [], Object.keys(payload ?? {}), 'Event payload');
  let nodes = 0;
  function visit(value, depth) {
    if (++nodes > STORE_LIMITS.payloadNodes || depth > STORE_LIMITS.depth) fail('DATA_LIMIT', 'Event payload is too complex.');
    if (typeof value === 'string') return text(value, STORE_LIMITS.stringCharacters, 'Payload text', true);
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || value.length > 1000
        || Reflect.ownKeys(value).some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9]\d*)$/u.test(key)))) fail('INVALID_DATA', 'Payload array is invalid.');
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !own(descriptor, 'value')) fail('INVALID_DATA', 'Payload arrays cannot contain holes or accessors.');
        visit(descriptor.value, depth + 1);
      }
      return;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length > 100) fail('DATA_LIMIT', 'Payload object has too many fields.');
      record(value, [], keys, 'Payload object');
      for (const key of keys) { text(key, 128, 'Payload field'); visit(value[key], depth + 1); }
      return;
    }
    fail('INVALID_DATA', 'Event payload must contain only finite JSON data.');
  }
  visit(payload, 0);
}
export function validateEvent(event, withProfile = false) {
  const keys = ['id', 'kind', 'at', 'payload', ...(withProfile ? ['profileId'] : [])];
  record(event, keys, keys, 'Event');
  id(event.id); if (withProfile) id(event.profileId);
  if (!KINDS.has(event.kind)) fail('INVALID_DATA', 'Event kind is unsupported.');
  timestamp(event.at); jsonPayload(event.payload);
  if (bytes(event) > STORE_LIMITS.eventBytes) fail('DATA_LIMIT', 'Event is too large to save.');
  return event;
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const equal = (a, b) => canonical(a) === canonical(b);
const eventOrder = (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id);
const sortEvents = events => events.sort(eventOrder);
// Drafts are transient recovery snapshots, not immutable learning evidence.
// Legacy drafts without an activity ID share one slot within their profile.
const draftKey = event => canonical([event.profileId, event.payload.activityId ?? null]);
function compactDrafts(events) {
  const latest = new Map(), submissions = new Map();
  for (const event of events) {
    if (event.kind === 'draft') {
      const key = draftKey(event), previous = latest.get(key);
      if (!previous || eventOrder(previous, event) < 0) latest.set(key, event);
    } else if (event.kind === 'attempt' && typeof event.payload.activityId === 'string' && own(event.payload, 'answer')) {
      // Storage validates the envelope; the learning engine assesses completeness.
      const key = draftKey(event), previous = submissions.get(key);
      if (!previous || eventOrder(previous, event) < 0) submissions.set(key, event);
    }
  }
  return events.filter(event => event.kind !== 'draft'
    || latest.get(draftKey(event)) === event && !(submissions.get(draftKey(event))?.at >= event.at));
}
function statsFor(profiles, events) {
  const stats = { key: 'stats', profileCount: profiles.length, eventCount: events.length,
    bytes: profiles.reduce((total, item) => total + bytes(item), 0) + events.reduce((total, item) => total + bytes(item), 0) };
  checkStats(stats); return stats;
}
function checkStats(stats) {
  if (!stats || !['profileCount', 'eventCount', 'bytes'].every(key => Number.isSafeInteger(stats[key]) && stats[key] >= 0)) fail('STORAGE_CORRUPT', 'Storage accounting is missing or damaged. Export recovery data before resetting this device.');
  if (stats.profileCount > STORE_LIMITS.profiles || stats.eventCount > STORE_LIMITS.events || stats.bytes > STORE_LIMITS.dataBytes) fail('DATA_LIMIT', 'This device has reached its local data limit. Export a backup before removing an unused profile. Existing progress was preserved.');
}
function plainArray(value, max, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max
    || Reflect.ownKeys(value).some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9]\d*)$/u.test(key)))) fail('INVALID_DATA', `${label} must be a bounded plain array.`);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !own(descriptor, 'value')) fail('INVALID_DATA', `${label} cannot contain holes or accessors.`);
  }
}
function validateSnapshot(payload) {
  if (typeof payload === 'string') {
    if (encoder.encode(payload).byteLength > STORE_LIMITS.importBytes) fail('DATA_LIMIT', 'Backup is too large to import.');
    try { payload = JSON.parse(payload); } catch { fail('INVALID_DATA', 'Backup is not valid JSON.'); }
  }
  record(payload, ['schemaVersion', 'exportedAt', 'profiles', 'events'], undefined, 'Backup');
  if (payload.schemaVersion !== VERSION) fail('INVALID_DATA', 'This backup version is not supported.');
  timestamp(payload.exportedAt);
  plainArray(payload.profiles, STORE_LIMITS.profiles, 'Backup profiles');
  plainArray(payload.events, STORE_LIMITS.events, 'Backup events');
  payload.profiles.forEach(validateProfile); payload.events.forEach(event => validateEvent(event, true));
  if (new Set(payload.profiles.map(profile => profile.id)).size !== payload.profiles.length
    || new Set(payload.events.map(event => event.id)).size !== payload.events.length) fail('IMPORT_CONFLICT', 'Backup contains duplicate profile or event IDs.');
  if (bytes(payload) > STORE_LIMITS.importBytes) fail('DATA_LIMIT', 'Backup is too large to import.');
  return payload;
}
function validateReferences(profiles, events) {
  validateGraph(profiles);
  const ids = new Set(profiles.map(profile => profile.id));
  if (events.some(event => !ids.has(event.profileId))) fail('INVALID_DATA', 'An event belongs to a missing profile.');
}
export function validateExport(payload) {
  const data = validateSnapshot(payload);
  validateReferences(data.profiles, data.events); statsFor(data.profiles, data.events);
  return clone(data);
}
export function mergeExports(current, incoming) {
  current = validateExport(current); incoming = validateSnapshot(incoming);
  const profiles = new Map(current.profiles.map(profile => [profile.id, profile]));
  const events = new Map(current.events.map(event => [event.id, event]));
  const report = { profilesAdded: 0, profilesUpdated: 0, eventsAdded: 0, profilesUnchanged: 0, eventsUnchanged: 0 };
  for (const profile of incoming.profiles) {
    const previous = profiles.get(profile.id);
    if (!previous) { profiles.set(profile.id, clone(profile)); report.profilesAdded++; continue; }
    if (previous.createdAt !== profile.createdAt
      || previous.cloudOwnerUid && profile.cloudOwnerUid && previous.cloudOwnerUid !== profile.cloudOwnerUid) fail('IMPORT_CONFLICT', 'A profile ID has contradictory identity or cloud ownership. No data was imported.');
    if (equal(previous, profile)) { report.profilesUnchanged++; continue; }
    if (previous.revision === profile.revision) fail('IMPORT_CONFLICT', 'A profile has conflicting edits at the same revision. Export both copies before resolving the conflict.');
    const newer = profile.revision > previous.revision ? profile : previous;
    const older = newer === profile ? previous : profile;
    if (newer.updatedAt < older.updatedAt) fail('IMPORT_CONFLICT', 'Profile revision and modification dates disagree. No data was imported.');
    if (newer === profile) { profiles.set(profile.id, clone(profile)); report.profilesUpdated++; }
    else report.profilesUnchanged++;
  }
  for (const event of incoming.events) {
    const previous = events.get(event.id);
    if (previous && !equal(previous, event)) fail('IMPORT_CONFLICT', 'An event ID has contradictory data. No data was imported.');
    if (!previous) events.set(event.id, clone(event));
  }
  const retained = compactDrafts([...events.values()]);
  const retainedIds = new Set(retained.map(event => event.id));
  const currentIds = new Set(current.events.map(event => event.id));
  for (const event of incoming.events) {
    if (!currentIds.has(event.id) && retainedIds.has(event.id)) report.eventsAdded++;
    else report.eventsUnchanged++;
  }
  const merged = { schemaVersion: VERSION, exportedAt: [current.exportedAt, incoming.exportedAt].sort().at(-1),
    profiles: [...profiles.values()].sort((a, b) => a.id.localeCompare(b.id)), events: sortEvents(retained) };
  validateReferences(merged.profiles, merged.events); statsFor(merged.profiles, merged.events);
  if (bytes(merged) > STORE_LIMITS.importBytes) fail('DATA_LIMIT', 'Merged backup exceeds the device data limit. No data was imported.');
  return { data: merged, report };
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) fail('STORAGE_UNAVAILABLE', 'Secure random identifiers are unavailable in this browser.');
  const values = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return [...values].map(value => value.toString(16).padStart(2, '0')).join('');
}
function notifications(name, enabled) {
  const source = randomId();
  let channel;
  const dispatch = detail => {
    if (typeof globalThis.window?.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      globalThis.window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail }));
    }
  };
  if (enabled && typeof globalThis.window !== 'undefined' && typeof BroadcastChannel === 'function') {
    try {
      channel = new BroadcastChannel(`atlas-store:${name}`);
      channel.onmessage = ({ data }) => {
        if (data?.version === VERSION && data.source !== source && typeof data.operation === 'string'
          && ['create', 'update', 'append', 'import', 'delete', 'versionchange'].includes(data.operation)
          && (data.profileId === null || typeof data.profileId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/u.test(data.profileId))) {
          dispatch({ operation: data.operation, profileId: data.profileId, external: true });
        }
      };
    } catch { /* Notifications are optional; persistent storage is not. */ }
  }
  return { changed(operation, profileId = null) {
    dispatch({ operation, profileId, external: false });
    try { channel?.postMessage({ version: VERSION, source, operation, profileId }); } catch { /* committed save remains successful */ }
  }, close() { channel?.close(); } };
}

async function indexedBackend(factory, name, invalidated) {
  if (!factory || typeof factory.open !== 'function') fail('STORAGE_UNAVAILABLE', 'IndexedDB is unavailable. Progress cannot be saved; use a browser with persistent site storage.');
  let db;
  try {
    db = await new Promise((resolve, reject) => {
      let finished = false;
      const request = factory.open(name, DATABASE_VERSION);
      request.onupgradeneeded = ({ oldVersion }) => {
        const database = request.result;
        if (oldVersion < 1) {
          database.createObjectStore('profiles', { keyPath: 'id' });
          database.createObjectStore('events', { keyPath: 'id' }).createIndex('byProfile', 'profileId');
          database.createObjectStore('meta', { keyPath: 'key' }).put({ key: 'stats', profileCount: 0, eventCount: 0, bytes: 0 });
        }
        if (oldVersion < 2) request.transaction.objectStore('events').createIndex('byActivity', ['profileId', 'payload.activityId']);
      };
      request.onblocked = () => { finished = true; reject(new StorageError('STORAGE_BLOCKED', 'Another tab is blocking the storage upgrade. Close other game tabs and reload.')); };
      request.onerror = () => { finished = true; reject(request.error); };
      request.onsuccess = () => { if (finished) request.result.close(); else { finished = true; resolve(request.result); } };
    });
  } catch (error) { throw storageError(error); }
  db.onversionchange = () => { db.close(); invalidated(); };
  return {
    async run(names, mode, work) {
      let tx;
      try {
        try { tx = db.transaction(names, mode, mode === 'readwrite' ? { durability: 'strict' } : undefined); }
        catch (error) { if (error instanceof TypeError) tx = db.transaction(names, mode); else throw error; }
        const done = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error ?? new StorageError('STORAGE_ABORTED', 'Storage transaction was interrupted. Existing progress was preserved.')); });
        // Attach a rejection observer immediately; request failure can abort before
        // the work promise unwinds. We still await the original completion below.
        done.catch(() => {});
        const request = operation => new Promise((resolve, reject) => {
          const result = operation(); result.onsuccess = () => resolve(result.result); result.onerror = () => reject(result.error);
        });
        const query = {
          get: (table, key) => request(() => tx.objectStore(table).get(key)),
          all: table => request(() => tx.objectStore(table).getAll()),
          byProfile: profileId => request(() => tx.objectStore('events').index('byProfile').getAll(profileId)),
          byActivity: (profileId, activityId) => request(() => tx.objectStore('events').index('byActivity').getAll([profileId, activityId])),
          put: (table, value) => request(() => tx.objectStore(table).put(value)),
          add: (table, value) => request(() => tx.objectStore(table).add(value)),
          remove: (table, key) => request(() => tx.objectStore(table).delete(key)),
        };
        let result;
        try { result = await work(query); }
        catch (error) { try { tx.abort(); } catch { /* already aborted */ } await done.catch(() => {}); throw error; }
        await done; return result;
      } catch (error) { throw storageError(error); }
    }, close() { db.close(); },
  };
}

const MEMORY_BRAND = Symbol('explicit-test-memory-database');
export function createMemoryDatabase() {
  let tables = { profiles: new Map(), events: new Map(), meta: new Map([['stats', { key: 'stats', profileCount: 0, eventCount: 0, bytes: 0 }]]) };
  let queue = Promise.resolve();
  return { [MEMORY_BRAND]: true, run(names, mode, work) {
    const job = queue.then(async () => {
      const active = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, new Map([...rows].map(([key, value]) => [key, clone(value)]))]));
      const table = name => { if (!names.includes(name)) fail('STORAGE_FAILED', 'Table is outside the test transaction.'); return active[name]; };
      const write = name => { if (mode !== 'readwrite') fail('STORAGE_FAILED', 'Read-only test transaction.'); return table(name); };
      const result = await work({
        get: async (name, key) => clone(table(name).get(key)), all: async name => [...table(name).values()].map(clone),
        byProfile: async profileId => [...table('events').values()].filter(event => event.profileId === profileId).map(clone),
        byActivity: async (profileId, activityId) => [...table('events').values()].filter(event => event.profileId === profileId && event.payload.activityId === activityId).map(clone),
        put: async (name, value) => write(name).set(value.id ?? value.key, clone(value)),
        add: async (name, value) => { if (write(name).has(value.id)) fail('IMPORT_CONFLICT', 'Duplicate key.'); write(name).set(value.id, clone(value)); },
        remove: async (name, key) => write(name).delete(key),
      });
      if (mode === 'readwrite') tables = active;
      return result;
    });
    queue = job.catch(() => {}); return job;
  } };
}

function api(backend, notices, clock = () => new Date().toISOString()) {
  let closed = false;
  const ensure = () => { if (closed) fail('STORAGE_CLOSED', 'This storage connection is closed. Reload or open a new connection.'); };
  const transact = async (names, mode, work) => { ensure(); try { return await backend.run(names, mode, work); } catch (error) { throw storageError(error); } };
  const now = () => timestamp(clock());
  const snapshot = async query => ({ schemaVersion: VERSION, exportedAt: now(), profiles: await query.all('profiles'), events: await query.all('events') });
  const methods = {
    async listProfiles() { return transact(['profiles'], 'readonly', async query => (await query.all('profiles')).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))); },
    async getProfile(profileId) { id(profileId); return transact(['profiles'], 'readonly', async query => (await query.get('profiles', profileId)) ?? null); },
    async createProfile(input) {
      record(input, ['name'], ['name', 'kind', 'guardianId', 'settings'], 'New profile');
      if (own(input, 'settings')) settings(input.settings, true);
      const at = now();
      const profile = { id: `profile-${randomId()}`, name: typeof input.name === 'string' ? input.name.trim() : input.name,
        kind: input.kind ?? 'independent', guardianId: input.guardianId ?? null, createdAt: at, updatedAt: at, revision: 1,
        settings: { ...DEFAULT_SETTINGS, ...input.settings }, journey: { ...DEFAULT_JOURNEY }, cloudOwnerUid: null };
      validateProfile(profile);
      await transact(TABLES, 'readwrite', async query => {
        validateGraph([...(await query.all('profiles')), profile]);
        const stats = await query.get('meta', 'stats'); checkStats(stats);
        const next = { ...stats, profileCount: stats.profileCount + 1, bytes: stats.bytes + bytes(profile) }; checkStats(next);
        await query.add('profiles', profile); await query.put('meta', next);
      });
      notices.changed('create', profile.id); return clone(profile);
    },
    async updateProfile(profileId, patch) {
      id(profileId); record(patch, [], ['name', 'kind', 'guardianId', 'settings', 'journey', 'cloudOwnerUid'], 'Profile patch');
      if (own(patch, 'settings')) settings(patch.settings, true);
      if (own(patch, 'journey')) journey(patch.journey, true);
      patch = clone(patch);
      const result = await transact(TABLES, 'readwrite', async query => {
        const previous = await query.get('profiles', profileId);
        if (!previous) fail('PROFILE_NOT_FOUND', 'The selected learner profile no longer exists.');
        const profile = { ...previous, ...patch, settings: { ...previous.settings, ...patch.settings }, journey: { ...previous.journey, ...patch.journey } };
        if (own(patch, 'name') && typeof profile.name === 'string') profile.name = profile.name.trim();
        validateProfile(profile);
        if (equal(profile, previous)) return { profile, changed: false };
        profile.revision++; profile.updatedAt = [now(), previous.updatedAt].sort().at(-1); validateProfile(profile);
        validateGraph((await query.all('profiles')).map(item => item.id === profileId ? profile : item));
        const stats = await query.get('meta', 'stats'); checkStats(stats);
        const next = { ...stats, bytes: stats.bytes - bytes(previous) + bytes(profile) }; checkStats(next);
        await query.put('profiles', profile); await query.put('meta', next); return { profile, changed: true };
      });
      if (result.changed) notices.changed('update', profileId); return clone(result.profile);
    },
    async appendEvent(profileId, event) {
      id(profileId); validateEvent(event);
      event = clone(event);
      const stored = clone({ ...event, profileId }); validateEvent(stored, true);
      const changed = await transact(TABLES, 'readwrite', async query => {
        if (!await query.get('profiles', profileId)) fail('PROFILE_NOT_FOUND', 'The selected learner profile no longer exists.');
        const previous = await query.get('events', event.id);
        if (previous && !equal(previous, stored)) fail('EVENT_CONFLICT', 'This event ID already belongs to different data. Existing evidence was preserved.');
        if (previous && !['draft', 'attempt'].includes(stored.kind)) return false;
        const existing = !['draft', 'attempt'].includes(stored.kind) ? []
          : typeof stored.payload.activityId === 'string' ? await query.byActivity(profileId, stored.payload.activityId)
          : await query.byProfile(profileId);
        const retainedIds = new Set(compactDrafts(previous ? existing : [...existing, stored]).map(item => item.id));
        const removed = existing.filter(item => !retainedIds.has(item.id));
        const added = !previous && retainedIds.has(stored.id);
        if (!added && !removed.length) return false;
        const stats = await query.get('meta', 'stats'); checkStats(stats);
        const next = { ...stats, eventCount: stats.eventCount + Number(added) - removed.length,
          bytes: stats.bytes + (added ? bytes(stored) : 0) - removed.reduce((total, item) => total + bytes(item), 0) }; checkStats(next);
        for (const item of removed) await query.remove('events', item.id);
        if (added) await query.add('events', stored);
        await query.put('meta', next); return true;
      });
      if (changed) notices.changed('append', profileId); return clone(event);
    },
    async getEvents(profileId) {
      id(profileId); return transact(['profiles', 'events'], 'readonly', async query => {
        if (!await query.get('profiles', profileId)) fail('PROFILE_NOT_FOUND', 'The selected learner profile no longer exists.');
        return sortEvents(await query.byProfile(profileId)).map(({ profileId: ignored, ...event }) => event);
      });
    },
    async exportAll() { return transact(['profiles', 'events'], 'readonly', async query => {
      const data = await snapshot(query);
      return validateExport({ ...data, events: compactDrafts(data.events) });
    }); },
    async importAll(payload) {
      const incoming = clone(validateSnapshot(payload));
      const result = await transact(TABLES, 'readwrite', async query => {
        const current = await snapshot(query);
        const merged = mergeExports(current, incoming);
        const retainedIds = new Set(merged.data.events.map(event => event.id));
        const removed = current.events.filter(event => !retainedIds.has(event.id));
        // All validation precedes every write; one transaction covers history and snapshots.
        for (const event of removed) await query.remove('events', event.id);
        for (const profile of merged.data.profiles) await query.put('profiles', profile);
        for (const event of merged.data.events) await query.put('events', event);
        await query.put('meta', statsFor(merged.data.profiles, merged.data.events));
        return { report: merged.report, removed: removed.length };
      });
      const { report } = result;
      if (report.profilesAdded || report.profilesUpdated || report.eventsAdded || result.removed) notices.changed('import'); return report;
    },
    async deleteProfile(profileId) {
      id(profileId);
      const result = await transact(TABLES, 'readwrite', async query => {
        const profile = await query.get('profiles', profileId);
        if (!profile) return { deleted: false, eventCount: 0 };
        if ((await query.all('profiles')).some(item => item.guardianId === profileId)) fail('PROFILE_IN_USE', 'Reassign or remove dependent profiles before deleting their guardian.');
        const events = await query.byProfile(profileId);
        const stats = await query.get('meta', 'stats'); checkStats(stats);
        const next = { ...stats, profileCount: stats.profileCount - 1, eventCount: stats.eventCount - events.length,
          bytes: stats.bytes - bytes(profile) - events.reduce((total, event) => total + bytes(event), 0) }; checkStats(next);
        for (const event of events) await query.remove('events', event.id);
        await query.remove('profiles', profileId); await query.put('meta', next);
        return { deleted: true, eventCount: events.length };
      });
      if (result.deleted) notices.changed('delete', profileId); return result;
    },
    close() { if (!closed) { closed = true; backend.close(); notices.close(); } },
  };
  return Object.freeze(methods);
}

export async function openStore({ name = DEFAULT_NAME, indexedDB = globalThis.indexedDB } = {}) {
  text(name, 100, 'Database name');
  const notices = notifications(name, true);
  let store;
  try {
    const backend = await indexedBackend(indexedDB, name, () => { notices.changed('versionchange'); store?.close(); });
    store = api(backend, notices); return store;
  } catch (error) { notices.close(); throw storageError(error); }
}
export async function openMemoryStore({ database = createMemoryDatabase(), clock } = {}) {
  if (!database?.[MEMORY_BRAND]) fail('INVALID_DATA', 'An explicit test memory database is required.');
  return api({ run: database.run.bind(database), close() {} }, { changed() {}, close() {} }, clock);
}
