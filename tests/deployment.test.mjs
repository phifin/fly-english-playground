import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { deploymentUrl, verifyDeployment } from '../scripts/verify-deployment.mjs';

const release = '1234567890abcdef1234';
const prefix = '/fly-english-playground/';
const site = 'https://phifin.github.io' + prefix;
const digest = body => createHash('sha256').update(body).digest('hex');
function deployment() {
  const missions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => ({ id: level.toLowerCase() + '-test', level, activities: [{}] }));
  const files = new Map(Object.entries({
    'index.html': `<!doctype html><meta name="atlas-release" content="${release}"><main>Atlas</main>`,
    'observatory.html': '<!doctype html><main>Observatory</main>', 'atlas.css': 'body{color:green}',
    'src/main.js': 'export const atlas = true;', 'public-config.js': 'export const cloudConfig={enabled:false};',
    'data/published/atlas.json': JSON.stringify({ schemaVersion: 1, missions }),
    'data/published/boards.json': JSON.stringify({ schemaVersion: 1, boards: missions.map(mission => ({ missionId: mission.id, level: mission.level })) }),
    'build-report.json': JSON.stringify({ releaseId: release }),
  }));
  const manifest = { schemaVersion: 1, releaseId: release, files: [] };
  const refreshManifest = () => { manifest.files = [...files].map(([path, body]) => ({ path, bytes: Buffer.byteLength(body), sha256: digest(body) })); };
  refreshManifest();
  const calls = [];
  let worker = `const RELEASE_ID = '${release}';`;
  const publishedPrivate = new Set();
  async function fetcher(url, options) {
    assert.equal(url.origin, 'https://phifin.github.io');
    assert.equal(url.pathname.startsWith(prefix), true, 'Every verification read stays under the project directory.');
    assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
    calls.push(url.href);
    const path = url.pathname.slice(prefix.length);
    const body = path === 'offline-manifest.json' ? JSON.stringify(manifest) : path === 'sw.js' ? worker : files.get(path);
    if (publishedPrivate.has(path)) return new Response('Should never be published', { status: 200 });
    return new Response(body ?? 'Not found', { status: body === undefined ? 404 : 200 });
  }
  return { files, manifest, fetcher, calls, refreshManifest, publishedPrivate, setWorker: value => { worker = value; } };
}

test('deployed verification is GET-only, validates a full release and never leaves its Pages project prefix', async () => {
  const siteData = deployment();
  const report = await verifyDeployment({ url: site.slice(0, -1), expectedRelease: release, fetcher: siteData.fetcher });
  assert.equal(report.passed, true); assert.equal(report.url, site); assert.equal(report.releaseId, release);
  assert.equal(report.missions, 6); assert.equal(report.boards, 6); assert.equal(report.activities, 6);
  assert.equal(report.filesVerified, siteData.files.size); assert.equal(report.privatePathsChecked, 5);
  assert.equal(siteData.calls.length, siteData.files.size + 7);
});

test('verification URLs require secure public access or loopback without credentials or query material', () => {
  assert.equal(deploymentUrl('http://127.0.0.1:4173/repo').pathname, '/repo/');
  assert.equal(deploymentUrl('http://localhost:4173/').hostname, 'localhost');
  for (const url of ['http://phifin.github.io/repo/', 'https://user:secret@phifin.github.io/repo/', 'https://phifin.github.io/repo/?token=secret', 'https://phifin.github.io/repo/#fragment']) {
    assert.throws(() => deploymentUrl(url));
  }
});

test('a stale deployed release ID is rejected before downloading its public files', async () => {
  const siteData = deployment(); siteData.manifest.releaseId = 'abcdef1234567890abcd';
  await assert.rejects(verifyDeployment({ url: site, expectedRelease: release, fetcher: siteData.fetcher }), /expected build/);
  assert.equal(siteData.calls.length, 1);
});

for (const [label, change] of [
  ['same-sized changed module', data => data.files.set('src/main.js', 'export const atlas = null;')],
  ['missing asset', data => data.files.delete('atlas.css')],
  ['stale service worker', data => data.setWorker("const RELEASE_ID = 'older-build';")],
  ['published private file', data => data.publishedPrivate.add('cloud/firestore.rules')],
]) test(`deployed verification rejects ${label}`, async () => {
  const siteData = deployment(); change(siteData);
  await assert.rejects(verifyDeployment({ url: site, expectedRelease: release, fetcher: siteData.fetcher }));
});

test('unsafe, duplicate and encoded manifest paths are rejected before requesting an asset', async () => {
  for (const path of ['../private.json', 'https://untrusted.example/private.js', 'src/%2e%2e%2fprivate.js', 'src/main.js?token=secret', 'data/staging/private.json', 'index.html']) {
    const siteData = deployment();
    siteData.manifest.files.push({ path, bytes: 0, sha256: digest('') });
    await assert.rejects(verifyDeployment({ url: site, expectedRelease: release, fetcher: siteData.fetcher }), /Unsafe or duplicate/);
    assert.equal(siteData.calls.length, 1);
  }
});

test('deployed missions and expedition boards cannot come from different published libraries', async () => {
  const siteData = deployment();
  const worlds = JSON.parse(siteData.files.get('data/published/boards.json'));
  worlds.boards[0].missionId = 'different-mission';
  siteData.files.set('data/published/boards.json', JSON.stringify(worlds)); siteData.refreshManifest();
  await assert.rejects(verifyDeployment({ url: site, expectedRelease: release, fetcher: siteData.fetcher }));
});
