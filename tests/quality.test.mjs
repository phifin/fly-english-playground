import test from 'node:test';
import assert from 'node:assert/strict';
import { initialQuality } from '../src/quality.js';

test('unknown device capability starts conservatively', () => {
  assert.equal(initialQuality({ quality: 'auto' }), 'eco');
  assert.equal(initialQuality({ quality: 'auto' }, { cores: undefined, memory: undefined }), 'eco');
});
test('a weak CPU or limited memory independently selects Eco', () => {
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 2, memory: 16 }), 'eco');
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 16, memory: 2 }), 'eco');
});
test('capable device signals distinguish medium and high quality', () => {
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 6, memory: 6 }), 'balanced');
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 8, memory: 8 }), 'ultra');
});
test('data and motion preferences conservatively lower automatic decoration', () => {
  const strong = { cores: 16, memory: 16 };
  assert.equal(initialQuality({ quality: 'auto' }, { ...strong, reducedData: true }), 'eco');
  assert.equal(initialQuality({ quality: 'auto' }, { ...strong, reducedMotion: true }), 'eco');
});
test('explicit graphical choice remains a user override', () => {
  for (const quality of ['eco', 'balanced', 'ultra']) {
    assert.equal(initialQuality({ quality }, { cores: 1, memory: 1, reducedMotion: true, reducedData: true }), quality);
  }
});
test('screen size does not stand in for processing capability', () => {
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 2, memory: 2, width: 2560, height: 1440 }), 'eco');
  assert.equal(initialQuality({ quality: 'auto' }, { cores: 8, memory: 8, width: 320, height: 640 }), 'ultra');
});
