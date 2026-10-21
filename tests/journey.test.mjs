import test from 'node:test';
import assert from 'node:assert/strict';
import { openMemoryStore, createMemoryDatabase, StorageError } from '../src/storage.js';
import { assess, deriveProgress, availableMissions, LEVELS, indexContent } from '../src/learning.js';
import { loadVerificationPack, authorAnswer } from '../scripts/measure.mjs';

const { pack, source } = await loadVerificationPack();
const indexed = indexContent(pack);
const AT = '2026-10-01T09:00:00.000Z';
const NOW = Date.parse('2026-10-20T12:00:00.000Z');
const open = () => openMemoryStore({ database: createMemoryDatabase(), clock: () => AT });
const profile = store => store.createProfile({ name: 'Journey traveler', kind: 'independent', guardianId: null });
const progress = async (store, id) => deriveProgress(await store.getEvents(id), pack, NOW);
// Export array order is not part of identity; compare complete records by ID.
const snapshotData = ({ exportedAt, profiles, events, ...data }) => ({ ...data,
  profiles: [...profiles].sort((a, b) => a.id.localeCompare(b.id)),
  events: [...events].sort((a, b) => a.id.localeCompare(b.id)) });
function attempt(activity, id, at = AT, supported = false, answer = authorAnswer(activity)) {
  return { id, kind: 'attempt', at, payload: { activityId: activity.id, missionId: activity.missionId,
    contentVersion: pack.batchId, answer: structuredClone(answer), supported, mode: 'balanced' } };
}
async function solveMission(store, traveler, mission, prefix, minute = 0) {
  for (const [index, raw] of mission.activities.entries()) {
    const activity = indexed.activities.get(raw.id);
    const event = attempt(activity, `${prefix}-${index}`, new Date(Date.parse(AT) + (minute + index) * 60000).toISOString());
    const result = assess(activity, event.payload.answer);
    assert.equal(result.complete, true, activity.id);
    assert.equal(result.correct, activity.type === 'writing' ? null : true, activity.id);
    await store.appendEvent(traveler.id, event);
  }
}

test('verification uses actual delivered missions across all six bands', () => {
  assert.ok(['published', 'staged-candidates-not-accepted-by-this-script'].includes(source.status));
  for (const level of LEVELS) assert.ok(pack.missions.some(mission => mission.level === level), `No ${level} mission available`);
  assert.equal(indexed.activities.size, pack.missions.reduce((count, mission) => count + mission.activities.length, 0));
});
test('a stored complete journey unlocks every band path and keeps writing separate from independent evidence', async () => {
  const store = await open(); const traveler = await profile(store); let missionNumber = 0;
  for (const level of LEVELS) {
    for (const mission of pack.missions.filter(item => item.level === level)) {
      const before = await progress(store, traveler.id);
      assert.equal(availableMissions(pack, level, before).find(item => item.mission.id === mission.id).unlocked, true);
      await solveMission(store, traveler, mission, `full-${missionNumber}`, missionNumber++ * 10);
    }
  }
  const result = await progress(store, traveler.id);
  assert.equal(result.rewards.size, pack.missions.length);
  assert.equal(result.attempts, indexed.activities.size);
  assert.equal(result.independent, [...indexed.activities.values()].filter(activity => activity.type !== 'writing').length);
  assert.equal(result.retained, 0);
  for (const activity of indexed.activities.values()) {
    assert.equal(result.records[activity.id].completed, true);
    if (activity.type === 'writing') {
      assert.equal(result.records[activity.id].last.result.automatic, false);
      assert.equal(result.records[activity.id].last.result.correct, null);
      assert.equal(result.records[activity.id].independent, 0);
    }
  }
  store.close();
});
test('retrying immutable writes and replaying a mission cannot duplicate world rewards or spaced retention', async () => {
  const store = await open(); const traveler = await profile(store); const mission = pack.missions[0];
  await solveMission(store, traveler, mission, 'original');
  const events = await store.getEvents(traveler.id); const before = await progress(store, traveler.id);
  for (const event of events) await store.appendEvent(traveler.id, event);
  assert.equal((await store.getEvents(traveler.id)).length, mission.activities.length);
  await solveMission(store, traveler, mission, 'same-day-replay', 30);
  const after = await progress(store, traveler.id);
  assert.deepEqual(after.rewards, before.rewards); assert.equal(after.independent, before.independent); assert.equal(after.retained, 0);
  store.close();
});
test('mode, language and graphical quality change independently without changing stored learning evidence', async () => {
  const store = await open(); const traveler = await profile(store);
  await solveMission(store, traveler, pack.missions[0], 'preferences');
  await store.updateProfile(traveler.id, { journey: { region: 'C1', onboarded: true } });
  const events = await store.getEvents(traveler.id); const before = await progress(store, traveler.id);
  for (const mode of ['kids', 'balanced', 'serious']) for (const language of ['en', 'vi']) for (const quality of ['auto', 'eco', 'balanced', 'ultra']) {
    const updated = await store.updateProfile(traveler.id, { settings: { mode, language, quality } });
    assert.deepEqual(updated.journey, { region: 'C1', onboarded: true });
    assert.equal(updated.settings.mode, mode); assert.equal(updated.settings.language, language); assert.equal(updated.settings.quality, quality);
  }
  assert.deepEqual(await store.getEvents(traveler.id), events);
  assert.deepEqual(await progress(store, traveler.id), before);
  store.close();
});
test('family profiles share content but never share event history or rewards', async () => {
  const store = await open(); const first = await profile(store); const second = await profile(store);
  await solveMission(store, first, pack.missions[0], 'first-learner');
  const before = await progress(store, first.id);
  assert.equal((await progress(store, second.id)).attempts, 0);
  const activity = indexed.activities.get(pack.missions[0].activities[0].id);
  await store.appendEvent(second.id, attempt(activity, 'second-learner', AT, true));
  assert.equal((await progress(store, second.id)).independent, 0);
  assert.deepEqual(await progress(store, first.id), before);
  store.close();
});
test('three distinct review days create only the declared item recall heuristic', async () => {
  const store = await open(); const traveler = await profile(store);
  const activity = [...indexed.activities.values()].find(item => item.type === 'gap');
  for (const [index, at] of ['2026-10-01T09:00:00.000Z', '2026-10-02T09:00:00.000Z', '2026-10-05T09:00:00.000Z'].entries()) {
    await store.appendEvent(traveler.id, attempt(activity, `review-day-${index}`, at));
  }
  const result = await progress(store, traveler.id);
  assert.equal(result.records[activity.id].streak, 3); assert.equal(result.retained, 1);
  assert.equal(result.independent, 1); assert.equal(result.rewards.size, 0);
  assert.equal(result.due.some(record => record.id === activity.id), true);
  await store.appendEvent(traveler.id, attempt(activity, 'same-day-repeat', '2026-10-05T09:05:00.000Z'));
  assert.equal((await progress(store, traveler.id)).records[activity.id].streak, 3);
  store.close();
});
test('revealed answers and failed first attempts cannot become independent same-day evidence', async () => {
  const store = await open(); const traveler = await profile(store);
  const choice = [...indexed.activities.values()].find(activity => activity.type === 'choice');
  const gap = [...indexed.activities.values()].find(activity => activity.type === 'gap');
  // Assistance is durable evidence; a disposable autosave snapshot is not its receipt.
  await store.appendEvent(traveler.id, { id: 'revealed-support', kind: 'support', at: AT,
    payload: { activityId: gap.id, reason: 'answer-revealed' } });
  await store.appendEvent(traveler.id, { id: 'revealed-draft', kind: 'draft', at: AT,
    payload: { activityId: gap.id, missionId: gap.missionId, answer: null, supported: true } });
  await store.appendEvent(traveler.id, attempt(gap, 'after-reveal', '2026-10-01T09:01:00.000Z'));
  const wrong = choice.options.find(option => option.id !== choice.answer).id;
  await store.appendEvent(traveler.id, attempt(choice, 'failed-first', AT, false, wrong));
  await store.appendEvent(traveler.id, attempt(choice, 'correct-after-feedback', '2026-10-01T09:02:00.000Z'));
  await store.appendEvent(traveler.id, attempt(choice, 'repeated-after-feedback', '2026-10-01T09:03:00.000Z'));
  assert.equal((await progress(store, traveler.id)).independent, 0);
  assert.deepEqual((await progress(store, traveler.id)).drafts, {});
  await store.appendEvent(traveler.id, attempt(choice, 'fresh-next-day', '2026-10-02T09:00:00.000Z'));
  assert.equal((await progress(store, traveler.id)).independent, 1);
  store.close();
});
test('two device backups converge by immutable ID without losing unique learning history', async () => {
  const left = await open(); const traveler = await profile(left); const right = await open();
  await right.importAll(await left.exportAll());
  const first = indexed.activities.get(pack.missions[0].activities[0].id);
  const second = indexed.activities.get(pack.missions[0].activities[1].id);
  await left.appendEvent(traveler.id, attempt(first, 'left-offline-event'));
  await right.appendEvent(traveler.id, attempt(second, 'right-offline-event', '2026-10-02T09:00:00.000Z'));
  await left.updateProfile(traveler.id, { settings: { language: 'vi' } });
  await left.importAll(await right.exportAll()); await right.importAll(await left.exportAll());
  assert.deepEqual(snapshotData(await left.exportAll()), snapshotData(await right.exportAll()));
  assert.deepEqual(await progress(left, traveler.id), await progress(right, traveler.id));
  assert.equal((await right.getEvents(traveler.id)).length, 2);
  assert.equal((await right.getProfile(traveler.id)).settings.language, 'vi');
  assert.equal((await left.importAll(await right.exportAll())).eventsAdded, 0);
  left.close(); right.close();
});
test('contradictory cloud/backup evidence and simultaneous profile edits refuse the merge atomically', async () => {
  const left = await open(); const traveler = await profile(left); const activity = [...indexed.activities.values()][0];
  await left.appendEvent(traveler.id, attempt(activity, 'shared-event'));
  const right = await open(); await right.importAll(await left.exportAll());
  const before = await left.exportAll(); const conflict = await right.exportAll();
  conflict.events[0].payload.supported = true;
  await assert.rejects(left.importAll(conflict), error => error instanceof StorageError && error.code === 'IMPORT_CONFLICT');
  assert.deepEqual(await left.exportAll(), before);
  await left.updateProfile(traveler.id, { settings: { language: 'vi' } });
  await right.updateProfile(traveler.id, { settings: { mode: 'serious' } });
  const changed = await left.exportAll();
  await assert.rejects(left.importAll(await right.exportAll()), error => error.code === 'IMPORT_CONFLICT');
  assert.deepEqual(await left.exportAll(), changed);
  left.close(); right.close();
});
