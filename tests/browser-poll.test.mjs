import test from 'node:test';
import assert from 'node:assert/strict';
import { pollAsyncResult } from '../scripts/browser-poll.mjs';

test('async browser polling awaits false samples before returning the actual observation', async () => {
  const expected = { probe: { inputEvents: 1, changeEvents: 1, sawBusy: true } };
  const observations = [false, false, expected];
  let calls = 0;
  const actual = await pollAsyncResult(async () => { await Promise.resolve(); return observations[calls++]; },
    { timeoutMs: 1000, intervalMs: 0 });
  assert.equal(actual, expected);
  assert.equal(calls, 3, 'The first truthy Promise must not stop polling before its false result is awaited.');
});

test('async browser polling times out when committed state never arrives', async () => {
  let calls = 0;
  await assert.rejects(pollAsyncResult(async () => { calls++; return false; },
    { timeoutMs: 20, intervalMs: 1, description: 'committed records' }), /Timed out after 20 ms waiting for committed records/);
  assert.ok(calls > 0);
});

test('async browser polling bounds a browser observation that never resolves', async () => {
  let calls = 0;
  await assert.rejects(pollAsyncResult(() => { calls++; return new Promise(() => {}); },
    { timeoutMs: 20, intervalMs: 1 }), /Timed out after 20 ms/);
  assert.equal(calls, 1);
});

test('async browser polling preserves actual read errors without retrying', async () => {
  const expected = new Error('Actual IndexedDB read failed');
  let calls = 0;
  await assert.rejects(pollAsyncResult(async () => { calls++; throw expected; }), error => error === expected);
  assert.equal(calls, 1);
});
