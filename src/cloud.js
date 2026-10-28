import { cloudConfig } from '../public-config.js';
import { cloudErrorMessage } from './cloud-messages.js';
export { cloudErrorMessage, cloudStatusMessage } from './cloud-messages.js';

// Optional, pinned browser modules. Loading begins only when the controller is prepared.
export const FIREBASE_SDK_VERSION = '13.0.0';
const SDK_ROOT = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/`;
const MAX_RECORD_CHARS = 24000;
const MAX_REMOTE_EVENTS = 20000;
const idPattern = /^[A-Za-z0-9_-][A-Za-z0-9._:-]{0,127}$/;
const clone = value => structuredClone(value);
const shareableEvents = events => events.filter(event => event.kind !== 'draft');
const failure = (code, message) => Object.assign(new Error(message), { code });
const SIGN_OUT_INTENT = 'atlas.pending-sign-out';
function browserIntentStore() { try { return globalThis.localStorage ?? null; } catch { return null; } }
export function invitationEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if(email.length > 254 || !/^[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+[.][a-z]{2,}$/.test(email))
    throw failure('cloud/invalid-email', cloudErrorMessage({code:'cloud/invalid-email'}));
  return email;
}

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
  const auth = authSdk.initializeAuth(app, { persistence: [authSdk.indexedDBLocalPersistence, authSdk.browserLocalPersistence] });
  const db = dbSdk.getFirestore(app);
  const identity = user => user ? {uid:user.uid,email:user.email,displayName:user.displayName,emailVerified:user.emailVerified} : null;
  const invitationRef = email => dbSdk.doc(db, 'familyInvitations', invitationEmail(email));
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
    async restoreSession() { await auth.authStateReady(); return identity(auth.currentUser); },
    onAuthChange: callback => authSdk.onAuthStateChanged(auth,user=>callback(identity(user))),
    async signIn() {
      const provider = new authSdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await authSdk.signInWithPopup(auth, provider, authSdk.browserPopupRedirectResolver);
      return { uid: result.user.uid, email: result.user.email, displayName: result.user.displayName,
        emailVerified: result.user.emailVerified };
    },
    signOut: () => authSdk.signOut(auth),
    async getGrant(uid) {
      const grant = await dbSdk.getDoc(dbSdk.doc(db, 'access', safeId(uid)));
      return grant.exists() ? grant.data() : null;
    },
    async claimInvitation() {
      const user=auth.currentUser;
      if(!user?.emailVerified||!user.email||!user.providerData.some(p=>p.providerId==='google.com'))return false;
      const email=invitationEmail(user.email),ref=invitationRef(email),grantRef=dbSdk.doc(db,'access',safeId(user.uid));
      const requestRef=dbSdk.doc(db,'joinRequests',safeId(user.uid));
      return dbSdk.runTransaction(db,async transaction=>{
        const [grant,invite,request]=await Promise.all([transaction.get(grantRef),transaction.get(ref),transaction.get(requestRef)]);
        if(grant.exists()||!invite.exists()||invite.data().enabled!==true||invite.data().claimedBy!=='')return false;
        transaction.set(grantRef,{approved:true});
        transaction.set(ref,{email,enabled:true,claimedBy:user.uid});
        if(!request.exists())transaction.set(requestRef,{uid:user.uid,email:user.email,displayName:(user.displayName?.trim()||user.email).slice(0,80)});
        return true;
      });
    },
    async listFamilyInvitations() {
      const result=await dbSdk.getDocs(dbSdk.query(dbSdk.collection(db,'familyInvitations'),dbSdk.limit(100)));
      return Promise.all(result.docs.map(async doc=>{
        const value=doc.data();
        if(invitationEmail(doc.id)!==value.email||typeof value.enabled!=='boolean'||typeof value.claimedBy!=='string'
          ||(value.claimedBy&&!idPattern.test(value.claimedBy)))throw failure('cloud/invalid-record','Invalid invitation');
        const grant=value.claimedBy?await this.getGrant(value.claimedBy):null;
        return {...value,state:value.claimedBy?(grant?.approved?'approved':'blocked'):value.enabled?'invited':'revoked'};
      }));
    },
    async setInvitation(email,enabled) {
      const ref=invitationRef(email);
      await dbSdk.runTransaction(db,async transaction=>{
        const old=await transaction.get(ref);
        transaction.set(ref,{email:invitationEmail(email),enabled,claimedBy:old.data()?.claimedBy??''});
      });
    },
    async requestAccess() {
      const user = auth.currentUser;
      if (!user?.emailVerified || !user.email || !user.providerData.some(provider => provider.providerId === 'google.com')) {
        throw failure('cloud/verified-google-required', cloudErrorMessage({ code: 'cloud/verified-google-required' }));
      }
      const ref = dbSdk.doc(db, 'joinRequests', safeId(user.uid));
      await dbSdk.runTransaction(db, async transaction => {
        if ((await transaction.get(ref)).exists()) return;
        transaction.set(ref, { uid: user.uid, email: user.email,
          displayName: (user.displayName?.trim() || user.email).slice(0, 80) });
      });
    },
    async listFamilyRequests() {
      const result = await dbSdk.getDocs(dbSdk.query(dbSdk.collection(db, 'joinRequests'), dbSdk.limit(100)));
      return Promise.all(result.docs.map(async doc => {
        const request = doc.data();
        if (request.uid !== doc.id || typeof request.email !== 'string' || request.email.length > 254
            || typeof request.displayName !== 'string' || request.displayName.length > 80) {
          throw failure('cloud/invalid-record', 'A family request has an invalid format.');
        }
        const grant = await this.getGrant(doc.id);
        return { uid: doc.id, email: request.email, displayName: request.displayName,
          state: grant?.approved === true ? 'approved' : grant?.approved === false ? 'blocked' : 'pending',
          familyOwner: grant?.familyOwner === true };
      }));
    },
    async setFamilyAccess(targetUid, approved) {
      safeId(targetUid);
      if (typeof approved !== 'boolean') throw failure('cloud/invalid-record', 'An approval decision must be Boolean.');
      if (targetUid === auth.currentUser?.uid) throw failure('cloud/owner-protected', cloudErrorMessage({ code: 'cloud/owner-protected' }));
      const ref = dbSdk.doc(db, 'access', targetUid);
      return dbSdk.runTransaction(db, async transaction => {
        const previous = await transaction.get(ref);
        if (previous.data()?.familyOwner === true) throw failure('cloud/owner-protected', cloudErrorMessage({ code: 'cloud/owner-protected' }));
        transaction.set(ref, { approved });
      });
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

/** Auth can be remembered; learner linking, cloud restores and uploads stay explicit. */
export function createCloud({ store, config = cloudConfig, onStatus = () => {}, loadBackend = loadFirebaseBackend, authIntentStore = browserIntentStore() } = {}) {
  const configured = validCloudConfig(config);
  let backend;
  let loading;
  let uid = null;
  let generation = 0;
  let accessRead;
  let authListener;
  let restoring;
  let signingOut = false;
  let signOutRequired = false;
  try { signOutRequired = authIntentStore?.getItem(SIGN_OUT_INTENT) === '1'; } catch { /* Storage can be unavailable; retain the in-memory guard. */ }
  const setSignOutRequired = required => {
    signOutRequired = required;
    try { if(required)authIntentStore?.setItem(SIGN_OUT_INTENT,'1');else authIntentStore?.removeItem(SIGN_OUT_INTENT); } catch { /* Never remove learner records to repair provider persistence. */ }
  };
  let current = { configured, state: configured ? signOutRequired ? 'signout-failed' : 'signed-out' : 'disabled', uid: null, approved: false,
    familyOwner: false, email: null, displayName: null, requestSubmitted: false, familyRequests: [],
    familyInvitations: [], invitationAvailable: null, authReady: !configured, syncedProfileId: null, syncedAt: null, syncingProfileId: null,
    boundProfileIds: [], code: configured ? signOutRequired ? 'cloud/signout-failed' : 'cloud/signed-out' : 'cloud/disabled' };
  if(signOutRequired)current.authReady=true;
  current.message = cloudErrorMessage(current);
  const pending = new Map();
  const publish = (state, code, extra = {}) => {
    current = { ...current, state, code, message: cloudErrorMessage({ code }), uid, ...extra };
    onStatus(clone(current));
    return clone(current);
  };
  const ensureStore = () => { if (!store) throw failure('cloud/no-store', 'Local storage must be available before cloud synchronization.'); };
  const ensureIdentity = (sessionUid = uid, sessionGeneration = generation) => {
    if (!uid || uid !== sessionUid || generation !== sessionGeneration || backend?.currentUid() !== uid) {
      throw failure('cloud/session-changed', 'The signed-in account changed. Local work remains saved; sign in and try again.');
    }
  };
  const ensureSession = (sessionUid = uid, sessionGeneration = generation) => {
    ensureIdentity(sessionUid, sessionGeneration);
    if (!current.approved) throw failure(current.state === 'blocked' ? 'cloud/access-blocked' : 'cloud/approval-required', cloudErrorMessage(current));
  };
  const boundIds = async () => (await store.listProfiles()).filter(profile => profile.cloudOwnerUid === uid).map(profile => profile.id);
  const importRecords = async (profiles, events) => store.importAll({ schemaVersion: 1, exportedAt: new Date().toISOString(), profiles, events });
  const readAccess = async (sessionUid, sessionGeneration, announce = true) => {
    ensureIdentity(sessionUid, sessionGeneration);
    const key = `${sessionUid}:${sessionGeneration}`;
    if (accessRead?.key === key) return accessRead.promise;
    const promise = (async () => {
      if (announce) publish('checking-access', 'cloud/checking-access');
      try {
        let grant = await backend.getGrant(sessionUid);
        // A server-created invitation admits only its verified email. Old rules
        // denying this optional path retain the existing pending/request flow.
        let invitationAvailable=current.invitationAvailable;
        if(!grant&&backend.claimInvitation){
          ensureIdentity(sessionUid, sessionGeneration);
          try { if(await backend.claimInvitation())grant=await backend.getGrant(sessionUid);invitationAvailable=true; }
          catch(error){if(/permission-denied$/.test(error.code||''))invitationAvailable=false;else throw error;}
        }
        ensureIdentity(sessionUid, sessionGeneration);
        const approved = grant?.approved === true;
        const boundProfileIds = approved ? await boundIds() : [];
        ensureIdentity(sessionUid, sessionGeneration);
        return publish(approved ? 'ready' : grant?.approved === false ? 'blocked' : 'pending',
          approved ? 'cloud/ready' : grant?.approved === false ? 'cloud/blocked' : current.requestSubmitted ? 'cloud/request-sent' : 'cloud/pending',
          { approved, authReady:true, invitationAvailable, familyOwner: approved && grant?.familyOwner === true, boundProfileIds,
            familyRequests: approved && grant?.familyOwner === true ? current.familyRequests : [],
            familyInvitations:approved && grant?.familyOwner === true ? current.familyInvitations : [] });
      } catch (error) {
        if (uid === sessionUid && generation === sessionGeneration) {
          publish('access-error', 'cloud/access-check-failed', { authReady:true,approved: false, familyOwner: false, boundProfileIds: [], familyRequests: [],familyInvitations:[] });
        }
        throw error;
      }
    })();
    accessRead = { key, promise };
    try { return await promise; } finally { if (accessRead?.promise === promise) accessRead = null; }
  };
  const authorize = async (sessionUid = uid, sessionGeneration = generation, owner = false) => {
    ensureIdentity(sessionUid, sessionGeneration);
    await readAccess(sessionUid, sessionGeneration, false);
    ensureSession(sessionUid, sessionGeneration);
    if (owner && !current.familyOwner) throw failure('cloud/owner-required', cloudErrorMessage({ code: 'cloud/owner-required' }));
  };
  const clearIdentity = () => ({authReady:true,approved:false,familyOwner:false,email:null,displayName:null,
    requestSubmitted:false,familyRequests:[],familyInvitations:[],invitationAvailable:null,boundProfileIds:[],syncedProfileId:null,syncedAt:null,syncingProfileId:null});
  const adopt = async result => {
    uid=result?.uid??null;const sessionGeneration=++generation;
    if(!uid)return publish(configured?'signed-out':'disabled','cloud/signed-out',clearIdentity());
    safeId(uid);publish('checking-access','cloud/checking-access',{...clearIdentity(),email:typeof result.email==='string'?result.email.slice(0,254):null,displayName:typeof result.displayName==='string'?result.displayName.slice(0,80):null});
    return readAccess(uid,sessionGeneration);
  };
  const watchIdentity = () => {
    if(authListener||!backend?.onAuthChange)return;
    authListener=backend.onAuthChange(result=>{
      if(signingOut||signOutRequired||current.state==='signing-in'||(result?.uid??null)===uid)return;
      adopt(result).catch(()=>{}); // readAccess publishes a localized recoverable error.
    });
  };
  const controller = {
    configured,
    status: () => clone(current),
    async prepare() {
      if (!configured) return false;
      if (!loading) {
        const preparingGeneration = generation;
        loading = loadBackend(config.firebase).then(value => { backend = value; return value; }).catch(error => {
          loading = null;
          if (generation === preparingGeneration) publish('error', 'cloud/sdk-load-failed');
          throw error;
        });
      }
      await loading;
      return true;
    },
    async restoreSession() {
      if(!configured)return clone(current);
      if(signOutRequired||signingOut)return clone(current);
      if(restoring)return restoring;
      const restoringGeneration=generation;
      publish('restoring-session','cloud/restoring-session',{authReady:false});
      restoring=(async()=>{
        try{
          await controller.prepare();
          const result=backend.restoreSession?await backend.restoreSession():null;
          if(generation!==restoringGeneration)return clone(current);
          const restored=await adopt(result);watchIdentity();return restored;
        }catch(error){if(generation===restoringGeneration)publish('error','cloud/sdk-load-failed',{authReady:true});watchIdentity();throw error;}
        finally{restoring=null;}
      })();return restoring;
    },
    async signIn() {
      if (!configured) throw failure('cloud/not-configured', current.message);
      if(signOutRequired||signingOut)throw failure('cloud/signout-failed',cloudErrorMessage({code:'cloud/signout-failed'}));
      ensureStore();
      const signInGeneration = ++generation;
      uid = null;
      const checkSignIn = expectedUid => {
        if (generation !== signInGeneration || expectedUid && backend?.currentUid() !== expectedUid) throw failure('cloud/session-changed', 'Sign-in was cancelled or the account changed. Try again when ready.');
      };
      publish('signing-in', 'cloud/signing-in', {...clearIdentity(),authReady:false});
      try {
        await controller.prepare();
        checkSignIn();
        const result = await backend.signIn();
        checkSignIn(result.uid); safeId(result.uid);
        uid = result.uid;
        current.email = typeof result.email === 'string' ? result.email.slice(0, 254) : null;
        current.displayName = typeof result.displayName === 'string' ? result.displayName.slice(0, 80) : null;
        // Authentication does not link or upload a local traveler. Keep observing
        // account changes even if the admission check encounters a network error.
        watchIdentity();return await readAccess(uid, signInGeneration);
      } catch (error) {
        if (generation === signInGeneration) {
          // A network failure checking admission must not undo successful Google
          // authentication or force the learner through consent a second time.
          if (uid && backend?.currentUid() === uid && current.state === 'access-error') throw error;
          uid = null;
          const failedGeneration = ++generation;
          if (backend) await backend.signOut().catch(() => {});
          if (generation === failedGeneration) publish('error', current.code === 'cloud/sdk-load-failed' ? current.code : error.code || 'cloud/unknown', {
            ...clearIdentity() });
        } else if (current.state === 'signed-out' && backend) {
          // A popup can resolve after sign-out; discard that stale SDK session too.
          await backend.signOut().catch(() => {});
        }
        throw error;
      }
    },
    async signOut() {
      uid = null; generation++; signingOut = true;setSignOutRequired(true);
      publish(configured ? 'signing-out' : 'disabled', 'cloud/signing-out', clearIdentity());
      try {
        // A retry after reload still has to clear the provider's persisted session.
        if(configured&&!backend)await controller.prepare();
        if (backend) await backend.signOut();
        setSignOutRequired(false);
        signingOut = false;
        publish(configured ? 'signed-out' : 'disabled', 'cloud/disconnected', clearIdentity());
      } catch(cause) {
        signingOut = false;
        publish('signout-failed','cloud/signout-failed',clearIdentity());
        throw Object.assign(failure('cloud/signout-failed',cloudErrorMessage({code:'cloud/signout-failed'})),{cause});
      }
      return clone(current);
    },
    async refreshAccess() {
      ensureStore();
      return readAccess(uid, generation);
    },
    async requestFamilyAccess() {
      ensureStore(); ensureIdentity();
      const sessionUid = uid, sessionGeneration = generation;
      await readAccess(sessionUid, sessionGeneration, false);
      ensureIdentity(sessionUid, sessionGeneration);
      if (current.approved) return clone(current);
      if (current.state === 'blocked') throw failure('cloud/access-blocked', cloudErrorMessage({ code: 'cloud/access-blocked' }));
      if (!backend.requestAccess) throw failure('cloud/request-unavailable', cloudErrorMessage({ code: 'cloud/request-unavailable' }));
      try { await backend.requestAccess(); }
      catch (error) {
        // Older deployed rules correctly deny this new collection. Keep their
        // security boundary intact and explain setup, rather than exposing SDK text.
        if (/permission-denied$/.test(error.code || '')) throw failure('cloud/request-unavailable', cloudErrorMessage({ code: 'cloud/request-unavailable' }));
        throw error;
      }
      ensureIdentity(sessionUid, sessionGeneration);
      return publish('pending', 'cloud/request-sent', { requestSubmitted: true });
    },
    async listFamilyRequests() {
      ensureStore(); ensureIdentity();
      const sessionUid = uid, sessionGeneration = generation;
      await authorize(sessionUid, sessionGeneration, true);
      if (!backend.listFamilyRequests) throw failure('cloud/request-unavailable', cloudErrorMessage({ code: 'cloud/request-unavailable' }));
      const familyRequests = await backend.listFamilyRequests();
      ensureSession(sessionUid, sessionGeneration);
      if (!current.familyOwner) throw failure('cloud/owner-required', cloudErrorMessage({ code: 'cloud/owner-required' }));
      return publish('ready', 'cloud/family-loaded', { familyRequests });
    },
    async setFamilyAccess(targetUid, approved) {
      ensureStore(); ensureIdentity(); safeId(targetUid);
      if (typeof approved !== 'boolean') throw failure('cloud/invalid-record', 'An approval decision must be Boolean.');
      const sessionUid = uid, sessionGeneration = generation;
      await authorize(sessionUid, sessionGeneration, true);
      if (targetUid === sessionUid || current.familyRequests.some(member => member.uid === targetUid && member.familyOwner)) {
        throw failure('cloud/owner-protected', cloudErrorMessage({ code: 'cloud/owner-protected' }));
      }
      if (!backend.setFamilyAccess) throw failure('cloud/request-unavailable', cloudErrorMessage({ code: 'cloud/request-unavailable' }));
      await backend.setFamilyAccess(targetUid, approved);
      ensureSession(sessionUid, sessionGeneration);
      const familyRequests = await backend.listFamilyRequests();
      ensureSession(sessionUid, sessionGeneration);
      return publish('ready', 'cloud/family-updated', { familyRequests });
    },
    async listFamilyInvitations(){
      ensureStore();ensureIdentity();const sessionUid=uid,sessionGeneration=generation;
      await authorize(sessionUid,sessionGeneration,true);
      if(!backend.listFamilyInvitations)throw failure('cloud/invitations-unavailable',cloudErrorMessage({code:'cloud/invitations-unavailable'}));
      try{const familyInvitations=await backend.listFamilyInvitations();ensureSession(sessionUid,sessionGeneration);return publish('ready','cloud/invitations-loaded',{familyInvitations,invitationAvailable:true});}
      catch(error){if(/permission-denied$/.test(error.code||''))throw failure('cloud/invitations-unavailable',cloudErrorMessage({code:'cloud/invitations-unavailable'}));throw error;}
    },
    async inviteFamilyMember(value){return controller.setFamilyInvitation(value,true);},
    async revokeFamilyInvitation(value){return controller.setFamilyInvitation(value,false);},
    async setFamilyInvitation(value,enabled){
      const email=invitationEmail(value);ensureStore();ensureIdentity();const sessionUid=uid,sessionGeneration=generation;
      await authorize(sessionUid,sessionGeneration,true);
      if(typeof enabled!=='boolean'||!backend.setInvitation)throw failure('cloud/invitations-unavailable',cloudErrorMessage({code:'cloud/invitations-unavailable'}));
      try{await backend.setInvitation(email,enabled);ensureSession(sessionUid,sessionGeneration);await controller.listFamilyInvitations();return publish('ready',enabled?'cloud/invitation-saved':'cloud/invitation-revoked');}
      catch(error){if(/permission-denied$/.test(error.code||''))throw failure('cloud/invitations-unavailable',cloudErrorMessage({code:'cloud/invitations-unavailable'}));throw error;}
    },
    async linkProfile(profileId) {
      ensureStore(); ensureIdentity(); safeId(profileId);
      const sessionUid = uid, sessionGeneration = generation;
      await authorize(sessionUid, sessionGeneration);
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
      const boundProfileIds = await boundIds(); ensureSession(sessionUid, sessionGeneration);
      return publish('ready', 'cloud/linked', { boundProfileIds });
    },
    async sync(profileId) {
      ensureStore(); ensureIdentity(); safeId(profileId);
      const operationKey = `${uid}:${generation}:${profileId}`;
      if (pending.has(operationKey)) return pending.get(operationKey);
      const sessionUid = uid, sessionGeneration = generation;
      // A completion timestamp would incorrectly cover work added while this
      // upload was running. The UI treats anything newer than this conservative
      // watermark as still needing synchronization.
      const syncStartedAt = new Date().toISOString();
      const check = () => ensureSession(sessionUid, sessionGeneration);
      const operation = (async () => {
        await authorize(sessionUid, sessionGeneration);
        let profile = await store.getProfile(profileId); check();
        if (!profile || profile.cloudOwnerUid !== sessionUid) throw failure('cloud/owner-mismatch', 'Link this profile to the current account before syncing.');
        if (profile.kind === 'dependent') await controller.sync(profile.guardianId);
        check();
        publish('syncing', 'cloud/syncing',{syncedProfileId:null,syncedAt:null,syncingProfileId:profileId});
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
        const boundProfileIds = await boundIds(); check();
        publish('ready', 'cloud/sync-complete', { boundProfileIds, uploaded, checked: remoteEvents.length,syncedProfileId:profileId,syncedAt:syncStartedAt,syncingProfileId:null });
        return { profileId, uploaded, checked: remoteEvents.length };
      })().catch(error => {
        if (uid === sessionUid && generation === sessionGeneration && current.approved) publish('error', error.code || 'cloud/unknown',{syncingProfileId:null});
        throw error;
      }).finally(() => pending.delete(operationKey));
      pending.set(operationKey, operation);
      return operation;
    },
    async restoreProfiles() {
      ensureStore(); ensureIdentity();
      const sessionUid = uid, sessionGeneration = generation;
      await authorize(sessionUid, sessionGeneration);
      publish('syncing', 'cloud/restoring');
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
        const boundProfileIds = await boundIds(); ensureSession(sessionUid, sessionGeneration);
        publish('ready', 'cloud/restored', { boundProfileIds, restored: profiles.length });
        return profiles.map(profile => profile.id);
      } catch (error) {
        if (uid === sessionUid && generation === sessionGeneration) publish('error', error.code || 'cloud/unknown');
        throw error;
      }
    },
    async deleteRemoteProfile(profileId) {
      ensureStore(); ensureIdentity(); safeId(profileId);
      const sessionUid = uid, sessionGeneration = generation;
      await authorize(sessionUid, sessionGeneration);
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
      return publish('ready', 'cloud/deleted');
    },
  };
  // Provider exceptions retain their diagnostic message for developers/tests, but
  // always carry a stable category so the UI never has to show raw SDK text.
  for (const [name, operation] of Object.entries(controller)) {
    if (!['status'].includes(name) && typeof operation === 'function') controller[name] = async (...args) => {
      try { return await operation(...args); }
      catch (error) {
        if (error instanceof Error && !error.code) error.code = 'cloud/unknown';
        throw error;
      }
    };
  }
  return controller;
}
