import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublicRelative } from './public-files.mjs';

const LIMIT = 50 * 1024 * 1024;
const required = ['index.html', 'observatory.html', 'atlas.css', 'public-config.js', 'src/main.js',
  'data/published/atlas.json', 'data/published/boards.json', 'build-report.json'];
const privatePaths = ['package.json', 'docs/PROJECT_STATE.md', 'cloud/firestore.rules',
  'data/staging/launch-sample/pack.json', 'experiments/luna-trial/staging/dataset.json'];
const sha256 = value => createHash('sha256').update(value).digest('hex');

export function deploymentUrl(value) {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  assert.ok(url.protocol === 'https:' || url.protocol === 'http:' && loopback,
    'Verification requires HTTPS, or an explicit loopback preview.');
  assert.ok(!url.username && !url.password && !url.search && !url.hash,
    'The deployment URL must not contain credentials, queries, or fragments.');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

/** GET-only public-release verification. No authentication or learner records. */
export async function verifyDeployment({ url, expectedRelease, fetcher = globalThis.fetch } = {}) {
  const base = deploymentUrl(url);
  assert.match(expectedRelease ?? '', /^[a-f0-9]{20}$/, 'Supply the expected built release ID.');
  const started = Date.now();
  const get = async path => {
    const target = new URL(path, base);
    assert.ok(target.origin === base.origin && target.pathname.startsWith(base.pathname), 'Verification must stay within the deployment directory.');
    return fetcher(target, { method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store',
      signal: AbortSignal.timeout(15000) });
  };
  const manifestResponse = await get('offline-manifest.json');
  assert.equal(manifestResponse.status, 200, 'The deployed offline manifest must be available.');
  const manifest = await manifestResponse.json();
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseId, expectedRelease, 'Pages is not yet serving the expected build.');
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0 && manifest.files.length <= 2000, 'Invalid release file inventory.');
  const seen = new Set(); let totalBytes = 0;
  for (const entry of manifest.files) {
    assert.ok(entry && isPublicRelative(entry.path) && !/[?#%]/.test(entry.path) && !['sw.js', 'offline-manifest.json'].includes(entry.path)
      && !seen.has(entry.path) && /^[a-f0-9]{64}$/.test(entry.sha256)
      && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0, 'Unsafe or duplicate manifest entry.');
    seen.add(entry.path); totalBytes += entry.bytes;
  }
  assert.ok(totalBytes <= LIMIT, 'The deployed offline library exceeds its size budget.');
  for (const path of required) assert.ok(seen.has(path), `The deployment is missing ${path}.`);
  const bodies = new Map();
  for (let index = 0; index < manifest.files.length; index += 4) {
    const results = await Promise.allSettled(manifest.files.slice(index, index + 4).map(async entry => {
      const response = await get(entry.path);
      assert.equal(response.status, 200, `Deployed file is unavailable: ${entry.path}`);
      const body = Buffer.from(await response.arrayBuffer());
      assert.equal(body.length, entry.bytes, `Deployed byte count differs: ${entry.path}`);
      assert.equal(sha256(body), entry.sha256, `Deployed content hash differs: ${entry.path}`);
      bodies.set(entry.path, body);
    }));
    for (const result of results) if (result.status === 'rejected') throw result.reason;
  }
  assert.match(bodies.get('index.html').toString('utf8'), new RegExp(`name=["']atlas-release["']\\s+content=["']${expectedRelease}["']`));
  assert.equal(JSON.parse(bodies.get('build-report.json')).releaseId, expectedRelease);
  const worker = await get('sw.js');
  assert.equal(worker.status, 200, 'The deployed service worker must be available.');
  assert.ok((await worker.text()).includes(`const RELEASE_ID = '${expectedRelease}'`), 'The service worker belongs to a different release.');
  const library = JSON.parse(bodies.get('data/published/atlas.json'));
  const world = JSON.parse(bodies.get('data/published/boards.json'));
  assert.equal(library.schemaVersion, 1); assert.equal(world.schemaVersion, 1);
  assert.ok(Array.isArray(library.missions) && Array.isArray(world.boards));
  assert.ok(library.missions.every(mission => mission && typeof mission.id === 'string' && Array.isArray(mission.activities)), 'Invalid deployed mission data.');
  assert.equal(new Set(library.missions.map(mission => mission.id)).size, library.missions.length, 'Duplicate deployed mission identity.');
  assert.deepEqual([...new Set(library.missions.map(mission => mission.level))].sort(), ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  assert.equal(world.boards.length, library.missions.length, 'Deployed missions and boards must stay together.');
  assert.ok(library.missions.every(mission => world.boards.some(board => board.missionId === mission.id && board.level === mission.level)));
  for (const path of privatePaths) assert.equal((await get(path)).status, 404, `Private repository path was published: ${path}`);
  return { passed: true, url: base.href, releaseId: expectedRelease, filesVerified: manifest.files.length,
    publicBytes: totalBytes, missions: library.missions.length, activities: library.missions.reduce((count, mission) => count + mission.activities.length, 0),
    boards: world.boards.length, privatePathsChecked: privatePaths.length, elapsedMs: Date.now() - started };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = new URL('../artifacts/deployment-report.json', import.meta.url);
  let report;
  try {
    const args = process.argv.slice(2), allowed = new Set(['--url', '--expected-release']);
    assert.ok(args.length % 2 === 0 && args.every((value, index) => index % 2 !== 0 || allowed.has(value)), 'Use --url URL --expected-release ID.');
    const options = Object.fromEntries(Array.from({ length: args.length / 2 }, (_, index) => [args[index * 2], args[index * 2 + 1]]));
    report = await verifyDeployment({ url: options['--url'] || process.env.ATLAS_URL,
      expectedRelease: options['--expected-release'] || process.env.ATLAS_EXPECTED_RELEASE });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report = { passed: false, checkedAt: new Date().toISOString(), failure: error.message };
    console.error(`Deployment verification failed: ${error.message}`); process.exitCode = 1;
  } finally {
    await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  }
}
