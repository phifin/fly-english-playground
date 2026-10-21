import test from 'node:test';
import assert from 'node:assert/strict';
import { FIREBASE_SDK_VERSION } from '../src/cloud.js';
import { contentSecurityPolicy } from '../scripts/public-files.mjs';
import { validateCloudSdkProbe } from '../scripts/cloud-sdk-check.mjs';

const config = { enabled: true, firebase: { apiKey: 'public-example-key', appId: 'public-example-app',
  projectId: 'demo-atlas', authDomain: 'demo-atlas.firebaseapp.com' } };
const root = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/`;
function probe(enabled = true) {
  const deployed = enabled ? structuredClone(config) : { enabled: false };
  const requests = enabled ? ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore-lite.js'].map(file => root + file) : [];
  return { config: deployed, configured: enabled, sdkVersion: FIREBASE_SDK_VERSION, prepared: [enabled, enabled],
    status: { state: enabled ? 'signed-out' : 'disabled', uid: null }, popups: 0, failures: [], violations: [],
    policy: contentSecurityPolicy(deployed), requests, responses: requests.map(url => ({ url, status: 200 })) };
}

test('enabled SDK gate requires actual pinned modules and reports only public identifiers', () => {
  const result = validateCloudSdkProbe(probe());
  assert.equal(result.configured, true); assert.equal(result.cspVerified, true);
  assert.equal(result.state, 'signed-out'); assert.equal(result.uid, null);
  assert.equal(result.externalModules.length, 3); assert.equal(result.projectId, 'demo-atlas');
  assert.equal(JSON.stringify(result).includes(config.firebase.apiKey), false);
});

test('disabled cloud gate accepts no external requests and no SDK preparation', () => {
  assert.equal(validateCloudSdkProbe(probe(false)).configured, false);
  const bad = probe(false); bad.requests.push(root + 'firebase-app.js');
  assert.throws(() => validateCloudSdkProbe(bad), /Disabled cloud must not fetch/);
});

for (const [name, change, message] of [
  ['incomplete enabled config', value => { value.config.firebase.apiKey = ''; }, /complete and internally consistent/],
  ['silent disabled fallback', value => { value.configured = false; }, /silently fall back/],
  ['unfinished prepare', value => { value.prepared = [true, false]; }, /preparation must finish/],
  ['missing actual Firestore module', value => { value.responses.pop(); }, /load firebase-firestore-lite/],
  ['SDK version drift', value => { value.sdkVersion = '99.0.0'; }, /reviewed, pinned SDK version/],
  ['transitive module version drift', value => { value.requests.push('https://www.gstatic.com/firebasejs/99.0.0/firebase-app.js'); }, /only the pinned CDN/],
  ['unexpected authentication call', value => { value.requests.push('https://identitytoolkit.googleapis.com/v1/accounts:signUp'); }, /only the pinned CDN/],
  ['unexpected data call', value => { value.requests.push('https://firestore.googleapis.com/v1/projects/demo-atlas/databases/(default)/documents'); }, /only the pinned CDN/],
  ['failed SDK response', value => { value.responses[0].status = 404; }, /load firebase-app/],
  ['blocked SDK request', value => { value.failures.push({ url: root + 'firebase-auth.js', error: 'net::ERR_BLOCKED_BY_CSP' }); }, /no failed external requests/],
  ['CSP violation', value => { value.violations.push({ directive: 'script-src', blocked: root + 'firebase-auth.js' }); }, /comply with the page CSP/],
  ['weakened CSP', value => { value.policy += '; script-src *'; }, /actual page CSP/],
  ['unexpected signed-in user', value => { value.status.uid = 'some-user'; }, /must not authenticate/],
  ['authentication popup', value => { value.popups = 1; }, /must not open authentication popups/],
]) {
  test(`credential-free SDK gate rejects ${name}`, () => {
    const value = probe(); change(value);
    assert.throws(() => validateCloudSdkProbe(value), message);
  });
}
