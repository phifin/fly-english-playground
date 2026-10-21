import { cloudConfig } from '../public-config.js';

// Optional, pinned browser modules. Nothing is fetched until prepare/signIn.
export const FIREBASE_SDK_VERSION = '13.0.0';
const SDK_ROOT = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/`;
const MAX_RECORD_CHARS = 24000;
const MAX_REMOTE_EVENTS = 20000;
const idPattern = /^[A-Za-z0-9_-][A-Za-z0-9._:-]{0,127}$/;
const clone = value => structuredClone(value);
const shareableEvents = events => events.filter(event => event.kind !== 'draft');
const failure = (code, message) => Object.assign(new Error(message), { code });

export function stableJson(value) {
  return JSON.stringify(value, (_, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.keys(entry).sort().map(key => [key, entry[key]])) : entry);
}

export function validCloudConfig(config) {
  return config?.enabled === true && typeof config.firebase?.apiKey === 'string'
    && config.firebase.apiKey.length > 10 && typeof config.firebase.appId === 'string'
    && config.firebase.appId.length > 5 && /^[a-z0-9-]{6,60}$/.test(config.firebase.projectId || '')
    && config.firebase.authDomain === `${config.firebase.projectId}.firebaseapp.com`;
}

function safeId(id) {
  if (typeof id !== 'string' || !idPattern.test(id)) throw failure('cloud/invalid-id', 'Invalid cloud record identifier.');
  return id;
}

function encoded(value) {
  const body = stableJson(value);
  if (!body || body.length > MAX_RECORD_CHARS) throw failure('cloud/record-limit', 'This record is too large to synchronize. Local progress remains saved.');
  return body;
}

function decodeProfile(record, uid, profileId) {
  safeId(profileId);
  if (record.ownerUid !== uid || record.profileId !== profileId || typeof record.body !== 'string'
      || record.body.length > MAX_RECORD_CHARS) throw failure('cloud/invalid-record', 'Cloud profile ownership or format is inconsistent.');
  let profile;
  try { profile = JSON.parse(record.body); } catch { throw failure('cloud/invalid-record', 'Cloud profile is not valid JSON.'); }
  if (!profile || profile.id !== profileId || profile.cloudOwnerUid !== uid
      || profile.revision !== record.revision || !Number.isSafeInteger(profile.revision)
      || profile.revision < 0) throw failure('cloud/invalid-record', 'Cloud profile identifiers or revision do not match.');
  return profile;
}

function decodeEvent(record, uid, profileId, eventId) {
  safeId(eventId);
  if (record.ownerUid !== uid || record.profileId !== profileId || record.eventId !== eventId
      || typeof record.body !== 'string' || record.body.length > MAX_RECORD_CHARS) {
    throw failure('cloud/invalid-record', 'Cloud event ownership or format is inconsistent.');
  }
  let event;
  try { event = JSON.parse(record.body); } catch { throw failure('cloud/invalid-record', 'Cloud event is not valid JSON.'); }
  if (!event || event.id !== eventId || typeof event.kind !== 'string'
      || typeof event.at !== 'string' || !event.payload || typeof event.payload !== 'object') {
    throw failure('cloud/invalid-record', 'Cloud event identifiers or format do not match.');
  }
  return event;
}

/** Set union, never a score overwrite. Conflicting immutable IDs are rejected. */
export function mergeEventSets(local, remote) {
  const merged = new Map();
  for (const event of [...local, ...remote]) {
    safeId(event.id);
    const previous = merged.get(event.id);
    if (previous && stableJson(previous) !== stableJson(event)) {
      throw failure('cloud/event-conflict', 'The same event ID has different data. Export your local progress before resolving this conflict.');
    }
    merged.set(event.id, clone(event));
  }
  return [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function chooseProfile(local, remote) {
  if (!remote) return local;
  if (local.id !== remote.id || local.createdAt !== remote.createdAt || local.cloudOwnerUid !== remote.cloudOwnerUid) {
    throw failure('cloud/profile-conflict', 'Cloud and local profile identities conflict. Neither copy was overwritten.');
  }
  if (local.revision === remote.revision && stableJson(local) !== stableJson(remote)) {
    throw failure('cloud/profile-conflict', 'Profile settings changed on two devices. Export both copies and resolve the conflict before syncing.');
  }
  return local.revision > remote.revision ? local : remote;
}

/** Firebase adapter kept separate so synchronization can be tested without credentials. */
async function loadFirebaseBackend(config) {
  const [appSdk, authSdk, dbSdk] = await Promise.all([
    import(`${SDK_ROOT}firebase-app.js`),
    import(`${SDK_ROOT}firebase-auth.js`),
    import(`${SDK_ROOT}firebase-firestore-lite.js`),
  ]);
  const appName = `atlas-${config.projectId}`;
  const app = appSdk.getApps().find(candidate => candidate.name === appName)
    || appSdk.initializeApp(config, appName);
  const auth = authSdk.initializeAuth(app, { persistence: authSdk.inMemoryPersistence });
  const db = dbSdk.getFirestore(app);
  const profileRef = (uid, id) => dbSdk.doc(db, 'users', safeId(uid), 'profiles', safeId(id));
  const eventsRef = (uid, id) => dbSdk.collection(profileRef(uid, id), 'events');
  const deletedRef = (uid, id) => dbSdk.doc(db, 'users', safeId(uid), 'deletions', safeId(id));
  const readEvents = async (uid, id) => {
    const result = await dbSdk.getDocs(dbSdk.query(eventsRef(uid, id), dbSdk.limit(MAX_REMOTE_EVENTS + 1)));
    if (result.size > MAX_REMOTE_EVENTS) throw failure('cloud/history-limit', 'Cloud history exceeds this client’s safe sync limit. Export and contact the family owner.');
      return shareableEvents(result.docs.map(doc => decodeEvent(doc.data(), uid, id, doc.id)));
  };

  return {
    currentUid: () => auth.currentUser?.uid || null,
    async signIn() {
      const provider = new authSdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await authSdk.signInWithPopup(auth, provider, authSdk.browserPopupRedirectResolver);
      return { uid: result.user.uid };
    },
    signOut: () => authSdk.signOut(auth),
    async getGrant(uid) {
      const grant = await dbSdk.getDoc(dbSdk.doc(db, 'access', safeId(uid)));
      return grant.exists() ? grant.data() : null;
    },
    async isDeleted(uid, id) { return (await dbSdk.getDoc(deletedRef(uid, id))).exists(); },
    async getProfile(uid, id) {
      const result = await dbSdk.getDoc(profileRef(uid, id));
      return result.exists() ? decodeProfile(result.data(), uid, id) : null;
    },
    async listProfiles(uid) {
      const result = await dbSdk.getDocs(dbSdk.query(dbSdk.collection(db, 'users', safeId(uid), 'profiles'), dbSdk.limit(101)));
      if (result.size > 100) throw failure('cloud/profile-limit', 'More than 100 cloud profiles need an owner-assisted export.');
      const profiles = result.docs.map(doc => decodeProfile(doc.data(), uid, doc.id));
      const active = await Promise.all(profiles.map(async profile => (await this.isDeleted(uid, profile.id)) ? null : profile));
      return active.filter(Boolean);
    },
    listEvents: readEvents,
    async saveProfile(uid, profile) {
      return dbSdk.runTransaction(db, async transaction => {
        const ref = profileRef(uid, profile.id);
        const existing = await transaction.get(ref);
        const selected = chooseProfile(profile, existing.exists() ? decodeProfile(existing.data(), uid, profile.id) : null);
        if (!existing.exists() || stableJson(selected) !== stableJson(decodeProfile(existing.data(), uid, profile.id))) {
          transaction.set(ref, { ownerUid: uid, profileId: profile.id, revision: selected.revision, body: encoded(selected) });
        }
        return selected;
      });
    },
    async putEvent(uid, profileId, event) {
      const ref = dbSdk.doc(eventsRef(uid, profileId), safeId(event.id));
      return dbSdk.runTransaction(db, async transaction => {
        const existing = await transaction.get(ref);
        if (existing.exists()) {
          const remote = decodeEvent(existing.data(), uid, profileId, event.id);
          mergeEventSets([event], [remote]);
          return false;
        }
        transaction.set(ref, { ownerUid: uid, profileId, eventId: event.id, body: encoded(event) });
        return true;
      });
    },
    async deleteProfile(uid, profileId) {
      // A durable tombstone blocks offline clients from resurrecting this profile.
      const tombstone = deletedRef(uid, profileId);
      await dbSdk.runTransaction(db, async transaction => {
        if (!(await transaction.get(tombstone)).exists()) transaction.set(tombstone, { ownerUid: uid, profileId });
      });
      while (true) {
        const events = await dbSdk.getDocs(dbSdk.query(eventsRef(uid, profileId), dbSdk.limit(300)));
        if (events.empty) break;
        const batch = dbSdk.writeBatch(db);
        for (const event of events.docs) batch.delete(event.ref);
        await batch.commit();
      }
      await dbSdk.deleteDoc(profileRef(uid, profileId));
    },
  };
}

/** No implicit linking, automatic polling, persistent Auth cache, or hidden upload. */
export function createCloud({ store, config = cloudConfig, onStatus = () => {}, loadBackend = loadFirebaseBackend } = {}) {
  const configured = validCloudConfig(config);
  let backend;
  let loading;
  let uid = null;
  let generation = 0;
  let current = { configured, state: configured ? 'signed-out' : 'disabled', uid: null, boundProfileIds: [], message: configured ? 'Cloud is optional. Sign in to connect your approved account.' : 'Cloud is not configured. Progress is saved on this device; use export for backup.' };
  const pending = new Map();
  const publish = (state, message, extra = {}) => {
    current = { ...current, state, message, uid, ...extra };
    onStatus(clone(current));
    return clone(current);
  };
  const ensureStore = () => { if (!store) throw failure('cloud/no-store', 'Local storage must be available before cloud synchronization.'); };
  const ensureSession = (sessionUid = uid, sessionGeneration = generation) => {
    if (!uid || uid !== sessionUid || generation !== sessionGeneration || backend?.currentUid() !== uid) {
      throw failure('cloud/session-changed', 'The signed-in account changed. Local work remains saved; sign in and try again.');
    }
  };
  const boundIds = async () => (await store.listProfiles()).filter(profile => profile.cloudOwnerUid === uid).map(profile => profile.id);
  const importRecords = async (profiles, events) => store.importAll({ schemaVersion: 1, exportedAt: new Date().toISOString(), profiles, events });
  const controller = {
    configured,
    status: () => clone(current),
    async prepare() {
      if (!configured) return false;
      if (!loading) {
        const preparingGeneration = generation;
        loading = loadBackend(config.firebase).then(value => { backend = value; return value; }).catch(error => {
          loading = null;
          if (generation === preparingGeneration) publish('error', 'Cloud could not load. Local learning and exports remain available.');
          throw error;
        });
      }
      await loading;
      return true;
    },
    async signIn() {
      if (!configured) throw failure('cloud/not-configured', current.message);
      ensureStore();
      const signInGeneration = ++generation;
      uid = null;
      const checkSignIn = expectedUid => {
        if (generation !== signInGeneration || expectedUid && backend?.currentUid() !== expectedUid) throw failure('cloud/session-changed', 'Sign-in was cancelled or the account changed. Try again when ready.');
      };
      publish('signing-in', 'Opening Google sign-in…', { boundProfileIds: [] });
      try {
        await controller.prepare();
        checkSignIn();
        const result = await backend.signIn();
        checkSignIn(result.uid); safeId(result.uid);
        const grant = await backend.getGrant(result.uid);
        checkSignIn(result.uid);
        if (grant?.approved !== true) {
          throw failure('cloud/not-approved', 'This account is not approved. The family owner must add its Firebase UID to the server-managed access list.');
        }
        uid = result.uid;
        const boundProfileIds = await boundIds(); checkSignIn(result.uid);
        return publish('ready', 'Signed in. Link a local profile explicitly, or restore this account’s profiles.', { boundProfileIds });
      } catch (error) {
        if (generation === signInGeneration) {
          uid = null;
          const failedGeneration = ++generation;
          if (backend) await backend.signOut().catch(() => {});
          if (generation === failedGeneration) publish('error', error.code === 'cloud/not-approved' ? error.message : 'Sign-in failed or was cancelled. Popup restrictions or network access may be responsible. Local work is unchanged.', { boundProfileIds: [] });
        } else if (current.state === 'signed-out' && backend) {
          // A popup can resolve after sign-out; discard that stale SDK session too.
          await backend.signOut().catch(() => {});
        }
        throw error;
      }
    },
    async signOut() {
      uid = null; generation++;
      if (backend) await backend.signOut();
      return publish(configured ? 'signed-out' : 'disabled', 'Cloud is disconnected. Local profiles and unsynced work remain on this device.', { boundProfileIds: [] });
    },
    async linkProfile(profileId) {
      ensureStore(); ensureSession(); safeId(profileId);
      const sessionUid = uid, sessionGeneration = generation;
      const profile = await store.getProfile(profileId);
      ensureSession(sessionUid, sessionGeneration);
      if (!profile) throw failure('cloud/profile-missing', 'Choose an existing local profile.');
      if (profile.cloudOwnerUid && profile.cloudOwnerUid !== uid) throw failure('cloud/owner-mismatch', 'This profile belongs to a different cloud account. It cannot be relinked silently.');
      if (profile.kind === 'dependent') {
        const guardian = await store.getProfile(profile.guardianId);
        if (guardian?.cloudOwnerUid !== uid) throw failure('cloud/guardian-unlinked', 'Link this learner’s guardian profile to the same account first.');
      }
      if (await backend.isDeleted(uid, profileId)) throw failure('cloud/profile-deleted', 'This cloud profile was deleted. Create a new profile to begin a separate journey.');
      ensureSession(sessionUid, sessionGeneration);
      if (!profile.cloudOwnerUid) await store.updateProfile(profileId, { cloudOwnerUid: uid });
      return publish('ready', 'Profile linked. Use sync to upload its progress.', { boundProfileIds: await boundIds() });
    },
    async sync(profileId) {
      ensureStore(); ensureSession(); safeId(profileId);
      const operationKey = `${uid}:${generation}:${profileId}`;
      if (pending.has(operationKey)) return pending.get(operationKey);
      const sessionUid = uid, sessionGeneration = generation;
      const check = () => ensureSession(sessionUid, sessionGeneration);
      const operation = (async () => {
        let profile = await store.getProfile(profileId); check();
        if (!profile || profile.cloudOwnerUid !== sessionUid) throw failure('cloud/owner-mismatch', 'Link this profile to the current account before syncing.');
        if (profile.kind === 'dependent') await controller.sync(profile.guardianId);
        check();
        publish('syncing', 'Synchronizing saved events…');
        if (await backend.isDeleted(sessionUid, profileId)) throw failure('cloud/profile-deleted', 'This cloud profile was deleted. Your local export remains available.');
        const [remoteProfile, remoteEvents, localEvents] = await Promise.all([
          backend.getProfile(sessionUid, profileId), backend.listEvents(sessionUid, profileId), store.getEvents(profileId),
        ]);
        check();
        const merged = mergeEventSets(shareableEvents(localEvents), remoteEvents);
        if (merged.length > MAX_REMOTE_EVENTS) throw failure('cloud/history-limit', 'This merged history exceeds the safe cloud synchronization limit. Local progress remains saved; export before arranging a history migration.');
        // Refuse unsupported records before any profile/event upload begins.
        encoded(profile); merged.forEach(encoded);
        if (remoteProfile) await importRecords([remoteProfile], remoteEvents.map(event => ({ ...event, profileId })));
        else if (remoteEvents.length) throw failure('cloud/orphan-events', 'Cloud events have no parent profile. Contact the family owner before restoring.');
        check();
        profile = await store.getProfile(profileId); check();
        const savedProfile = await backend.saveProfile(sessionUid, profile); check();
        if (stableJson(savedProfile) !== stableJson(profile)) await importRecords([savedProfile], []);
        const mergedEvents = shareableEvents(await store.getEvents(profileId)); check();
        if (mergedEvents.length > MAX_REMOTE_EVENTS) throw failure('cloud/history-limit', 'Local history grew beyond the safe cloud synchronization limit. Export before arranging a history migration.');
        mergedEvents.forEach(encoded);
        const remoteIds = new Set(remoteEvents.map(event => event.id));
        let uploaded = 0;
        for (const event of mergedEvents) {
          check();
          if (!remoteIds.has(event.id) && await backend.putEvent(sessionUid, profileId, event)) uploaded++;
        }
        check();
        publish('ready', `Sync complete: ${uploaded} events uploaded; ${remoteEvents.length} cloud events checked.`, { boundProfileIds: await boundIds() });
        return { profileId, uploaded, checked: remoteEvents.length };
      })().catch(error => {
        if (uid === sessionUid && generation === sessionGeneration) publish('error', error.code?.startsWith('cloud/') ? error.message : 'Cloud sync failed. Local progress remains saved. Reconnect or export before retrying.');
        throw error;
      }).finally(() => pending.delete(operationKey));
      pending.set(operationKey, operation);
      return operation;
    },
    async restoreProfiles() {
      ensureStore(); ensureSession();
      const sessionUid = uid, sessionGeneration = generation;
      publish('syncing', 'Restoring this account’s profiles…');
      try {
        const profiles = await backend.listProfiles(sessionUid);
        const events = [];
        for (const profile of profiles) {
          ensureSession(sessionUid, sessionGeneration);
          for (const event of await backend.listEvents(sessionUid, profile.id)) events.push({ ...event, profileId: profile.id });
        }
        ensureSession(sessionUid, sessionGeneration);
        if (profiles.length) await importRecords(profiles, events);
        ensureSession(sessionUid, sessionGeneration);
        publish('ready', `${profiles.length} profiles restored without replacing immutable local history.`, { boundProfileIds: await boundIds() });
        return profiles.map(profile => profile.id);
      } catch (error) {
        if (uid === sessionUid && generation === sessionGeneration) publish('error', 'Restore failed. No local records were deleted; check the connection, ownership, or import conflict.');
        throw error;
      }
    },
    async deleteRemoteProfile(profileId) {
      ensureStore(); ensureSession(); safeId(profileId);
      const sessionUid = uid, sessionGeneration = generation;
      const profile = await store.getProfile(profileId);
      ensureSession(sessionUid, sessionGeneration);
      if (profile && profile.cloudOwnerUid !== sessionUid) throw failure('cloud/owner-mismatch', 'This local profile belongs to a different cloud account.');
      const remote = await backend.listProfiles(sessionUid);
      ensureSession(sessionUid, sessionGeneration);
      if (remote.some(candidate => candidate.guardianId === profileId)) {
        throw failure('cloud/profile-in-use', 'This guardian still has dependent cloud profiles. Delete each dependent profile’s cloud copy explicitly before deleting the guardian. No cloud profiles were deleted.');
      }
      ensureSession(sessionUid, sessionGeneration); await backend.deleteProfile(sessionUid, profileId);
      ensureSession(sessionUid, sessionGeneration);
      return publish('ready', 'This cloud profile was deleted. Its local copy remains available for export and cannot silently recreate the deleted cloud ID.');
    },
  };
  return controller;
}
