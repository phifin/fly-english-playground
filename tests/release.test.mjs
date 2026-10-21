import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { join, resolve, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { build } from '../scripts/build.mjs';
import { publicPath, startServer, normalizeBasePath } from '../scripts/serve.mjs';
import { contentSecurityPolicy, isPublicRelative } from '../scripts/public-files.mjs';

const root = new URL('../', import.meta.url);
const disabled = { enabled: false };
const digest = value => createHash('sha256').update(value).digest('hex');
async function scratch(t) {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-release-test-'));
  t.after(async () => {
    const checked = relative(resolve(tmpdir()), resolve(directory));
    assert.match(checked, /^atlas-release-test-[A-Za-z0-9_-]+$/);
    await rm(directory, { recursive: true, force: true });
  });
  const files = {
    'package.json': '{"type":"module"}',
    'index.html': '<html><head></head><body>Atlas</body></html>',
    'observatory.html': '<html><head></head><body>Observatory</body></html>',
    'styles.css': 'body{color:#123}', 'atlas.css': '@import "./styles.css";',
    'src/main.js': 'export const local = true;',
    'assets/icon.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
    'data/published/atlas.json': '{"missions":[]}',
    'data/staging/private.json': '{"notPublic":true}',
    'docs/private.md': 'Not a deployed asset',
    'experiments/private.json': '{}',
    'public-config.js': 'export const cloudConfig={enabled:false};',
    'sw.js': await readFile(new URL('sw.js', root), 'utf8'),
  };
  for (const [path, body] of Object.entries(files)) { await mkdir(dirname(join(directory, path)), { recursive: true }); await writeFile(join(directory, path), body); }
  return directory;
}

test('public server paths exclude staging, private files, unknown documents and traversal', () => {
  for (const path of ['/', '/index.html', '/observatory.html', '/atlas.css', '/src/cloud.js', '/data/published/atlas.json']) assert.ok(publicPath(path));
  for (const path of ['/data/staging/private.json', '/docs/README.md', '/package.json', '/cloud/firestore.rules', '/src/%2e%2e%2fdocs/private.js', '/src/%5cprivate.js', '/src/%00.js', '/unknown.html', '/assets/private.html']) assert.equal(publicPath(path), null, path);
  assert.equal(isPublicRelative('src/.hidden.js'), false);
  assert.equal(contentSecurityPolicy(disabled).includes('gstatic'), false);
  assert.match(contentSecurityPolicy({ enabled: true, firebase: { authDomain: 'demo-atlas.firebaseapp.com' } }), /https:\/\/firestore.googleapis.com/);
  assert.throws(() => contentSecurityPolicy({ enabled: true, firebase: { authDomain: 'untrusted.example' } }));
});

test('build publishes only explicit assets, keeps project-relative URLs and hashes offline content', async t => {
  const directory = await scratch(t);
  const report = await build({ sourceRoot: directory, config: disabled });
  assert.equal(report.stagingIncluded, false); assert.equal(report.publishedPacks, 1);
  const out = join(directory, 'dist');
  assert.deepEqual((await readdir(out)).sort(), ['assets', 'atlas.css', 'build-report.json', 'data', 'index.html', 'observatory.html', 'offline-manifest.json', 'public-config.js', 'src', 'styles.css', 'sw.js']);
  assert.deepEqual(await readdir(join(out, 'data')), ['published']);
  const html = await readFile(join(out, 'index.html'), 'utf8');
  assert.match(html, /name="atlas-release"/); assert.match(html, /Content-Security-Policy/);
  assert.equal(html.includes('gstatic'), false);
  const manifest = JSON.parse(await readFile(join(out, 'offline-manifest.json'), 'utf8'));
  for (const file of manifest.files) { assert.equal(file.path.startsWith('/'), false); assert.equal(digest(await readFile(join(out, file.path))), file.sha256); }
  assert.equal((await build({ sourceRoot: directory, config: disabled })).releaseId, report.releaseId);
});

test('build refuses suspicious public inputs or unknown dist files before changing output', async t => {
  const directory = await scratch(t); await build({ sourceRoot: directory, config: disabled });
  await writeFile(join(directory, 'dist', 'private.txt'), 'preserve me');
  await assert.rejects(build({ sourceRoot: directory, config: disabled }), /Unexpected file in dist/);
  assert.equal(await readFile(join(directory, 'dist', 'private.txt'), 'utf8'), 'preserve me');
  await rm(join(directory, 'dist', 'private.txt'));
  await writeFile(join(directory, 'src', 'private.key'), 'not a module');
  await assert.rejects(build({ sourceRoot: directory, config: disabled }), /Unexpected file in a public input/);
});

test('build rejects malformed enabled cloud before changing the release and emits matching CSP for valid configuration', async t => {
  const directory = await scratch(t);
  await build({ sourceRoot: directory, config: disabled });
  const before = await readFile(join(directory, 'dist', 'index.html'), 'utf8');
  const configured = { enabled: true, firebase: { apiKey: 'public-example-key', appId: 'public-example-app',
    projectId: 'demo-atlas', authDomain: 'demo-atlas.firebaseapp.com' } };
  for (const value of [ { enabled: true },
    { ...configured, firebase: { ...configured.firebase, apiKey: '' } },
    { ...configured, firebase: { ...configured.firebase, appId: '' } },
    { ...configured, firebase: { ...configured.firebase, authDomain: 'other-project.firebaseapp.com' } } ]) {
    await assert.rejects(build({ sourceRoot: directory, config: value }), /complete and internally consistent/);
    assert.equal(await readFile(join(directory, 'dist', 'index.html'), 'utf8'), before,
      'Invalid cloud configuration must preserve the previous usable release.');
  }
  await writeFile(join(directory, 'public-config.js'), `export const cloudConfig=${JSON.stringify(configured)};`);
  const result = await build({ sourceRoot: directory });
  assert.equal(result.cloudConfigured, true);
  const html = await readFile(join(directory, 'dist', 'index.html'), 'utf8');
  assert.ok(html.includes(contentSecurityPolicy(configured).replaceAll('&', '&amp;').replaceAll('"', '&quot;')));
});

test('preview serves reviewed content and returns 404 instead of HTML for absent JSON', async t => {
  const directory = await scratch(t);
  const server = await startServer({ directory, port: 0 });
  t.after(() => new Promise(resolveDone => server.close(resolveDone)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/observatory.html')).status, 200);
  const json = await fetch(base + '/data/published/atlas.json');
  assert.match(json.headers.get('content-type'), /application\/json/);
  assert.equal((await fetch(base + '/data/published/missing.json')).status, 404);
  assert.equal((await fetch(base + '/data/staging/private.json')).status, 404);
  assert.equal((await fetch(base + '/cloud/firestore.rules')).status, 404);
  assert.equal((await fetch(base + '/src/main.js', { method: 'POST' })).status, 404);
});

test('Pages project preview mounts under its real prefix without exposing origin-root or private paths', async t => {
  const directory = await scratch(t);
  const basePath = '/fly-english-playground/';
  const server = await startServer({ directory, port: 0, basePath });
  t.after(() => new Promise(resolveDone => server.close(resolveDone)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = new URL(basePath, origin);
  const redirect = await fetch(new URL(basePath.slice(0, -1), origin), { redirect: 'manual' });
  assert.equal(redirect.status, 308); assert.equal(redirect.headers.get('location'), basePath);
  for (const path of ['', 'index.html', 'src/main.js', 'assets/icon.svg', 'data/published/atlas.json', 'observatory.html']) {
    assert.equal((await fetch(new URL(path, base))).status, 200, path);
  }
  for (const path of ['/index.html', '/src/main.js', '/fly-english-playground-other/index.html',
    basePath + 'package.json', basePath + 'data/staging/private.json', basePath + 'src/%2e%2e%2fdocs/private.js']) {
    assert.equal((await fetch(new URL(path, origin))).status, 404, path);
  }
  assert.equal(new URL('../data/published/atlas.json', new URL('src/main.js', base)).pathname,
    basePath + 'data/published/atlas.json', 'Content URLs resolved from browser modules must stay under the Pages prefix.');
  for (const value of ['/missing-slash', 'relative/', '//host/', '/repo/../', '/repo%2f/', '/repo/?key=secret']) {
    assert.throws(() => normalizeBasePath(value), /clean absolute directory/);
  }
});

async function workerHarness() {
  const listeners = new Map(), stores = new Map();
  const scope = 'https://example.test/family/';
  const resource = new Map([['index.html', 'ATLAS SHELL'], ['src/main.js', 'export const local=true;'], ['data/published/atlas.json', '{"missions":[]}']]);
  const manifest = { schemaVersion: 1, releaseId: 'test-release', files: [...resource].map(([path, body]) => ({ path, sha256: digest(body), bytes: Buffer.byteLength(body) })) };
  resource.set('offline-manifest.json', JSON.stringify(manifest));
  const caches = {
    async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { put: async (url, response) => store.set(String(url), response.clone()), match: async url => store.get(String(url))?.clone() };
    },
  };
  let networkEnabled = true;
  const fetchResource = async request => {
    if (!networkEnabled) throw new Error('offline');
    const url = new URL(typeof request === 'string' ? request : request.url);
    const body = resource.get(url.href.slice(scope.length));
    return new Response(body ?? 'NOT FOUND', { status: body === undefined ? 404 : 200 });
  };
  const context = { URL, Response, Request, Uint8Array, crypto: webcrypto, caches, fetch: fetchResource,
    self: { registration: { scope }, clients: { claim: async () => {} }, skipWaiting: () => {}, addEventListener: (type, listener) => listeners.set(type, listener) } };
  vm.runInNewContext((await readFile(new URL('sw.js', root), 'utf8')).replaceAll('__ATLAS_RELEASE_ID__', 'test-release'), context);
  const dispatch = async type => { let result; listeners.get(type)({ waitUntil: promise => { result = promise; } }); await result; };
  const request = async (path, options) => {
    let response;
    listeners.get('fetch')({ request: new Request(new URL(path, scope), options), respondWith: promise => { response = promise; } });
    return response === undefined ? null : await response;
  };
  return { dispatch, request, stores, scope, offline: () => { networkEnabled = false; } };
}

test('offline worker scopes its cache, preserves private boundaries, and never substitutes HTML for JSON', async () => {
  const worker = await workerHarness();
  worker.stores.set('another-app-cache', new Map());
  await worker.dispatch('install'); await worker.dispatch('activate'); worker.offline();
  assert.equal(await (await worker.request('./')).text(), 'ATLAS SHELL');
  assert.equal(await (await worker.request('data/published/atlas.json')).text(), '{"missions":[]}');
  for (const path of ['data/staging/private.json', '../other-app/index.html', 'https://firestore.googleapis.com/test', 'index.html?code=secret']) assert.equal(await worker.request(path), null, path);
  assert.equal(await worker.request('src/main.js', { method: 'POST' }), null);
  assert.equal(await worker.request('src/main.js', { headers: { Authorization: 'Bearer private' } }), null);
  await assert.rejects(worker.request('data/published/missing.json'), /offline/);
  assert.equal(worker.stores.has('another-app-cache'), true);
});
