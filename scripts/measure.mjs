import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { cpus, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveProgress, indexContent, LEVELS } from '../src/learning.js';
import { validateEvent } from '../src/storage.js';
import { deriveExpeditions, findRoute } from '../src/expedition.js';

const root = new URL('../', import.meta.url);
export async function loadVerificationPack() {
  let paths = ['data/published/atlas.json'];
  let bodies;
  try { bodies = [await readFile(new URL(paths[0], root))]; }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    paths = ['data/staging/launch-sample/pack.json', 'data/staging/launch-core/pack.json'];
    bodies = await Promise.all(paths.map(path => readFile(new URL(path, root))));
  }
  const packs = bodies.map(body => JSON.parse(body.toString('utf8')));
  const pack = packs.length === 1 ? packs[0] : {
    schemaVersion: 1, batchId: 'candidate-verification-only',
    provenance: [...new Map(packs.flatMap(item => item.provenance).map(source => [source.id, source])).values()],
    missions: packs.flatMap(item => item.missions),
  };
  const missions = pack.missions.map(mission => mission.id);
  const activities = pack.missions.flatMap(mission => mission.activities.map(activity => activity.id));
  if (new Set(missions).size !== missions.length || new Set(activities).size !== activities.length) throw new Error('Verification inputs contain duplicate mission/activity IDs.');
  return { pack, source: { status: paths[0].startsWith('data/published/') ? 'published' : 'staged-candidates-not-accepted-by-this-script',
    files: bodies.map((body, index) => ({ path: paths[index], sha256: createHash('sha256').update(body).digest('hex'),
      rawBytes: body.length, gzipBytes: gzipSync(body).length })) } };
}

// Uses delivered author answers solely as deterministic verification inputs.
export function authorAnswer(activity) {
  if (activity.type === 'choice') return activity.answer;
  if (activity.type === 'gap') return activity.accepted[0];
  if (activity.type === 'order') return [...activity.answer];
  if (activity.type === 'match') return Object.fromEntries(activity.pairs.map(pair => [pair.id, pair.id]));
  if (activity.type === 'writing') return { text: activity.example, checks: activity.rubric.map((_, index) => index) };
  throw new Error(`Unsupported verification activity ${activity.type}`);
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const round = value => Math.round(value * 1000) / 1000;
export function measureDerivation(pack, eventCount, samples = 7) {
  const activities = [...indexContent(pack).activities.values()];
  if (!activities.length) throw new Error('Cannot measure an empty library.');
  const beforeInput = process.memoryUsage();
  const events = Array.from({ length: eventCount }, (_, index) => {
    const activity = activities[index % activities.length];
    return freeze({ id: `measure-${String(index).padStart(8, '0')}`, kind: 'attempt',
      at: new Date(Date.UTC(2026, 9, 1) + index * 60000).toISOString(),
      payload: { activityId: activity.id, missionId: activity.missionId, contentVersion: pack.batchId,
        answer: authorAnswer(activity), supported: index % 7 === 0, mode: ['kids', 'balanced', 'serious'][index % 3] } });
  }).reverse();
  Object.freeze(events);
  for (const event of [...events.slice(0, 10), ...events.slice(-10)]) validateEvent(event);
  const afterInput = process.memoryUsage();
  const at = Date.UTC(2026, 10, 1);
  deriveProgress(events, pack, at); // Warm JIT/code paths; excluded from samples.
  const runs = [];
  let result;
  for (let iteration = 0; iteration < samples; iteration++) {
    const before = process.memoryUsage();
    const start = performance.now(); result = deriveProgress(events, pack, at);
    const elapsedMs = performance.now() - start;
    const after = process.memoryUsage();
    runs.push({ elapsedMs: round(elapsedMs), heapUsedBeforeBytes: before.heapUsed, heapUsedAfterBytes: after.heapUsed,
      heapUsedDeltaBytes: after.heapUsed - before.heapUsed, rssAfterBytes: after.rss });
  }
  const times = runs.map(run => run.elapsedMs).sort((a, b) => a - b);
  return { eventCount, inputOrder: 'reverse chronological; sorting included', immutableInput: true,
    inputHeapUsedDeltaBytes: afterInput.heapUsed - beforeInput.heapUsed, inputRssDeltaBytes: afterInput.rss - beforeInput.rss,
    warmupRuns: 1, samples, minMs: times[0], medianMs: times[Math.floor(times.length / 2)], maxMs: times.at(-1),
    meanMs: round(times.reduce((total, value) => total + value, 0) / times.length), runs,
    result: { processedAttempts: result.attempts, trackedActivities: Object.keys(result.records).length, completedLearningMissions: result.rewards.size } };
}
function measureWorldDerivation(boards, eventCount, samples = 7) {
  const routes = boards.map(findRoute);
  const events = Array.from({ length: eventCount }, (_, index) => {
    const boardIndex = index % boards.length, route = routes[boardIndex];
    // Repeated visits include cumulative paths, solved paths and fresh resets.
    const visit = Math.floor(index / boards.length);
    return freeze({ id: `world-measure-${String(index).padStart(8, '0')}`, kind: 'expedition',
      at: new Date(Date.UTC(2026, 9, 1) + index * 60000).toISOString(),
      payload: { boardId: boards[boardIndex].id, commands: route.slice(0, visit % (route.length + 1)), supported: false } });
  }).reverse();
  Object.freeze(events);
  deriveExpeditions(events, boards);
  const runs = []; let result;
  for (let index = 0; index < samples; index++) {
    const start = performance.now(); result = deriveExpeditions(events, boards);
    runs.push(round(performance.now() - start));
  }
  const sorted = [...runs].sort((a,b) => a-b);
  return { eventCount, boards: boards.length, inputOrder: 'reverse chronological; sorting included', immutableInput: true,
    warmupRuns: 1, samples, minMs: sorted[0], medianMs: sorted[Math.floor(sorted.length / 2)], maxMs: sorted.at(-1), runs,
    result: { restoredPositions: Object.keys(result.states).length, verifiedDiscoveries: result.solved.size } };
}
export async function measure() {
  const { pack, source } = await loadVerificationPack();
  let worlds = null;
  try { worlds = JSON.parse(await readFile(new URL('data/published/boards.json', root), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const compact = Buffer.from(JSON.stringify(pack));
  const report = { schemaVersion: 1, measuredAt: new Date().toISOString(),
    environment: { runtime: process.version, platform: process.platform, architecture: process.arch,
      logicalCpus: cpus().length, cpuModel: cpus()[0]?.model ?? 'unknown', physicalMemoryBytes: totalmem(),
      garbageCollectionControlled: false },
    content: { ...source, missions: pack.missions.length, activities: pack.missions.reduce((count, mission) => count + mission.activities.length, 0),
      missionsByLevel: Object.fromEntries(LEVELS.map(level => [level, pack.missions.filter(mission => mission.level === level).length])),
      fileRawBytes: source.files.reduce((total, file) => total + file.rawBytes, 0),
      fileGzipBytes: source.files.reduce((total, file) => total + file.gzipBytes, 0),
      compactEngineJsonBytes: compact.length, compactEngineJsonGzipBytes: gzipSync(compact).length },
    derivation: [measureDerivation(pack, 1000), measureDerivation(pack, 10000)],
    exploration: worlds ? [measureWorldDerivation(worlds.boards, 1000), measureWorldDerivation(worlds.boards, 10000)] : [],
    limitations: ['Node desktop computation only; no browser rendering, IndexedDB, network, layout or input latency measurement.',
      'Synthetic immutable histories use actual delivered activity shapes and author answers; this is not learner data or educational efficacy evidence.',
      'Heap/RSS snapshots are approximate and garbage collection is uncontrolled; negative deltas are possible and these are not peak allocations.',
      'A desktop CPU result does not establish a low-end phone performance budget or a frame-rate guarantee.',
      'Candidate inputs are never accepted or published by this measurement script.'] };
  await mkdir(new URL('artifacts/', root), { recursive: true });
  await writeFile(new URL('artifacts/performance.json', root), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await measure();
  console.log(JSON.stringify({ content: report.content,
    derivation: report.derivation.map(({ eventCount, minMs, medianMs, maxMs, result }) => ({ eventCount, minMs, medianMs, maxMs, result })),
    exploration: report.exploration,
    output: 'artifacts/performance.json' }, null, 2));
}
