import assert from 'node:assert/strict';
import { FIREBASE_SDK_VERSION, validCloudConfig } from '../src/cloud.js';
import { contentSecurityPolicy } from './public-files.mjs';

/** Validate observed browser behavior, never a mocked Firebase adapter. */
export function validateCloudSdkProbe(probe, { requireCsp = true } = {}) {
  const enabled = probe.config?.enabled === true;
  assert.equal(probe.sdkVersion, FIREBASE_SDK_VERSION, 'The deployed adapter must use the reviewed, pinned SDK version.');
  if (enabled) assert.ok(validCloudConfig(probe.config), 'Enabled cloud configuration must be complete and internally consistent.');
  assert.equal(probe.configured, enabled, 'Enabled cloud must not silently fall back to disabled.');
  assert.deepEqual(probe.prepared, [enabled, enabled], 'Actual SDK preparation must finish successfully and remain reusable.');
  assert.equal(probe.status.state, enabled ? 'signed-out' : 'disabled');
  assert.equal(probe.status.uid, null, 'Preparing the SDK must not authenticate a traveler.');
  assert.equal(probe.popups, 0, 'SDK preparation must not open authentication popups.');
  assert.deepEqual(probe.failures, [], 'SDK loading must have no failed external requests.');
  assert.deepEqual(probe.violations, [], 'SDK loading must comply with the page CSP.');
  if (requireCsp || probe.policy) {
    assert.equal(probe.policy, contentSecurityPolicy(probe.config), 'The actual page CSP must match its deployed cloud configuration.');
  }
  const root = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/`;
  if (!enabled) assert.deepEqual(probe.requests, [], 'Disabled cloud must not fetch SDK, authentication, tracking or data services.');
  else {
    for (const request of probe.requests) {
      const url = new URL(request);
      assert.ok(url.href.startsWith(root) && !url.search && !url.hash && url.pathname.endsWith('.js'),
        `Credential-free SDK preparation must contact only the pinned CDN modules: ${url.origin}${url.pathname}`);
    }
    for (const file of ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore-lite.js']) {
      assert.ok(probe.responses.some(response => response.url === root + file && response.status === 200),
        `The actual adapter must load ${file} successfully from the pinned CDN.`);
    }
    assert.deepEqual(probe.responses.filter(response => response.status < 200 || response.status >= 300), [],
      'Every requested SDK module must load successfully.');
  }
  return { configured: enabled, projectId: enabled ? probe.config.firebase.projectId : null,
    authDomain: enabled ? probe.config.firebase.authDomain : null, sdkVersion: probe.sdkVersion,
    cspVerified: Boolean(probe.policy), state: probe.status.state, uid: probe.status.uid,
    externalModules: [...new Set(probe.responses.map(response => response.url))] };
}

/** Use a fresh, unsigned-in page. This never signs in or reads/writes cloud data. */
export async function verifyCloudSdk(page, { requireCsp = true, timeout = 45000, navigateTo } = {}) {
  const origin = new URL(navigateTo ?? page.url()).origin;
  const requests = [], responses = [], failures = [];
  const external = value => ['http:', 'https:'].includes(new URL(value).protocol) && new URL(value).origin !== origin;
  let popups = 0;
  const onRequest = request => { if (external(request.url())) requests.push(request.url()); };
  const onResponse = response => { if (external(response.url())) responses.push({ url: response.url(), status: response.status() }); };
  const onFailure = request => { if (external(request.url())) failures.push({ url: request.url(), error: request.failure()?.errorText }); };
  const onPopup = popup => { popups++; popup.close().catch(() => {}); };
  page.on('request', onRequest); page.on('response', onResponse); page.on('requestfailed', onFailure); page.on('popup', onPopup);
  let timer;
  try {
    // Boot restores persistent authentication, which starts SDK loading. Observe
    // from before navigation so cached imports cannot erase the actual evidence.
    if (navigateTo) await page.goto(navigateTo, { waitUntil: 'domcontentloaded' });
    const result = await Promise.race([
      page.evaluate(async () => {
        const violations = [];
        const record = event => violations.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
        document.addEventListener('securitypolicyviolation', record);
        try {
          const { cloudConfig: config } = await import(new URL('public-config.js', location.href).href);
          const { createCloud, FIREBASE_SDK_VERSION: sdkVersion } = await import(new URL('src/cloud.js', location.href).href);
          const cloud = createCloud({ config });
          const prepared = await Promise.all([cloud.prepare(), cloud.prepare()]);
          return { config, sdkVersion, configured: cloud.configured, prepared, status: cloud.status(),
            policy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? null, violations };
        } finally { document.removeEventListener('securitypolicyviolation', record); }
      }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Credential-free Firebase SDK preparation timed out.')), timeout); }),
    ]);
    return validateCloudSdkProbe({ ...result, requests, responses, failures, popups }, { requireCsp });
  } finally {
    clearTimeout(timer);
    page.off('request', onRequest); page.off('response', onResponse); page.off('requestfailed', onFailure); page.off('popup', onPopup);
  }
}
