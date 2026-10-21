import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';

// Execute the real worker in a small Cache/Fetch adapter. This verifies failure
// behavior without pretending that a Node adapter is a graphical browser test.
async function worker() {
  const scope = 'https://family.example/atlas/';
  const listeners = new Map(), stores = new Map(), calls = [];
  const resources = new Map([
    ['index.html', '<!doctype html><p>Saved atlas</p>'],
    ['src/main.js', 'export const version = "old";'],
    ['data/published/atlas.json', '{"schemaVersion":1}'],
  ]);
  const manifest = {
    schemaVersion: 1, releaseId: 'review-release',
    files: [...resources].map(([path, body]) => ({ path, bytes: Buffer.byteLength(body),
      sha256: createHash('sha256').update(body).digest('hex') })),
  };
  let offline = false;
  const caches = {
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const rows = stores.get(name);
      return { put: async (url, response) => rows.set(String(url), response.clone()),
        match: async url => rows.get(String(url))?.clone() };
    },
  };
  async function fetchResource(request, options) {
    const url = typeof request === 'string' ? request : request.url;
    calls.push({ url, options });
    if (offline) throw new Error('offline');
    const path = url.slice(scope.length);
    const body = path === 'offline-manifest.json' ? JSON.stringify(manifest) : resources.get(path);
    return new Response(body ?? '<p>Deployment missing</p>', { status: body === undefined ? 404 : 200 });
  }
  const context = { URL, Request, Response, Uint8Array, crypto: webcrypto, caches, fetch: fetchResource,
    self: { registration: { scope }, clients: { claim: async () => {} }, skipWaiting() {},
      addEventListener: (name, listener) => listeners.set(name, listener) } };
  const source = (await readFile(new URL('../sw.js', import.meta.url), 'utf8'))
    .replaceAll('__ATLAS_RELEASE_ID__', 'review-release');
  vm.runInNewContext(source, context);
  return {
    scope, resources, manifest, stores, calls,
    offline() { offline = true; },
    async install() { let work; listeners.get('install')({ waitUntil(value) { work = value; } }); await work; },
    remove(path) { for (const rows of stores.values()) rows.delete(scope + path); },
    async request(path, options) {
      let response;
      listeners.get('fetch')({ request: new Request(new URL(path, scope), options),
        respondWith(value) { response = value; } });
      return response === undefined ? null : response;
    },
  };
}

test('a partial static cache recovers only an exact release file and caches the verified response', async () => {
  const sw = await worker(); await sw.install(); sw.remove('src/main.js');
  const response = await sw.request('src/main.js');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), sw.resources.get('src/main.js'));
  assert.deepEqual(JSON.parse(JSON.stringify(sw.calls.at(-1).options)), { cache: 'no-store', credentials: 'omit', redirect: 'error' });
  const networkCalls = sw.calls.length;
  sw.offline();
  assert.equal((await sw.request('src/main.js')).status, 200);
  assert.equal(sw.calls.length, networkCalls, 'Verified recovery must be cached for the next offline request.');
});

for (const [label, path, changed] of [
  ['same-size changed module', 'src/main.js', 'export const version = "new";'],
  ['different-size content', 'data/published/atlas.json', '{}'],
  ['missing server file', 'src/main.js', undefined],
]) test(`an older worker refuses ${label} after a cache miss`, async () => {
  const sw = await worker(); await sw.install(); sw.remove(path);
  if (changed === undefined) sw.resources.delete(path); else sw.resources.set(path, changed);
  const response = await sw.request(path);
  assert.equal(response.status, 503);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.doesNotMatch(await response.text(), /<[^>]+>/, 'Errors must never masquerade as an application HTML shell.');
  assert.equal([...sw.stores.values()].some(rows => rows.has(sw.scope + path)), false);
});

test('a missing release manifest or offline cache entry fails closed without replacing learner history', async () => {
  const sw = await worker(); await sw.install(); sw.remove('offline-manifest.json');
  assert.equal((await sw.request('src/main.js')).status, 503);
  const next = await worker(); await next.install(); next.remove('index.html'); next.offline();
  assert.equal((await next.request('index.html')).status, 503);
  for (const path of ['data/staging/private.json', '../other/index.html', 'https://firestore.googleapis.com/private', 'index.html?code=private']) {
    assert.equal(await next.request(path), null, path);
  }
  assert.equal(await next.request('src/main.js', { headers: { Authorization: 'Bearer private' } }), null);
});

test('worker installation checks declared bytes and rejects invalid manifest paths before activation', async () => {
  const wrongSize = await worker(); wrongSize.manifest.files[0].bytes++;
  await assert.rejects(wrongSize.install(), /integrity check/);
  assert.equal(wrongSize.stores.size, 0, 'Failed installation must remove its incomplete static cache.');
  for (const path of ['../private.json', 'https://untrusted.example/main.js', 'src/.hidden.js', 'data/staging/private.json']) {
    const sw = await worker(); sw.manifest.files[0].path = path;
    await assert.rejects(sw.install(), /Invalid offline file/);
    assert.equal(sw.stores.size, 0);
  }
});
