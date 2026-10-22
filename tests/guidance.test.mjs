import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDANCE_KEY, readGuidance, writeGuidance } from '../src/guidance.js';
test('arrival language honors an explicit choice before browser language', () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readGuidance(storage, 'vi-VN'), 'vi');
  writeGuidance('en', storage); assert.equal(values.get(GUIDANCE_KEY), 'en');
  assert.equal(readGuidance(storage, 'vi-VN'), 'en');
  writeGuidance('vi', storage); assert.equal(readGuidance(storage, 'en-US'), 'vi');
});
test('invalid saved values and unavailable arrival storage never prevent onboarding', () => {
  assert.equal(readGuidance({ getItem: () => 'C2' }, 'en-US'), 'en');
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.equal(readGuidance(blocked, 'vi'), 'vi'); assert.equal(writeGuidance('vi', blocked), 'vi');
  assert.throws(() => writeGuidance('fr', blocked), RangeError);
});
