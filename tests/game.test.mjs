import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  evaluatePlan,
  recordAttempt,
  applyTransfer,
  getNextWeather,
  resetSession,
} from '../src/game.js';

// Deliberately synthetic P0 rule fixtures, not validated educational content.
const orders = [
  ['shutter', 'mirror', 'light'],
  ['mirror', 'shutter', 'light'],
  ['shutter', 'light', 'mirror'],
  ['mirror', 'light', 'shutter'],
  ['light', 'shutter', 'mirror'],
  ['light', 'mirror', 'shutter'],
];

function validPlan(route = 'roof', weather = 'clear', order = orders[0]) {
  return {
    route,
    shutter: route === 'roof' ? 'closed' : 'open',
    mirror: (route === 'roof') === (weather === 'clear') ? 'sky' : 'path',
    order: [...order],
  };
}

test('every route/weather combination has exactly two successful command orders', () => {
  for (const weather of ['clear', 'mist']) {
    for (const route of ['roof', 'garden']) {
      let successes = 0;
      for (const order of orders) {
        const result = evaluatePlan(validPlan(route, weather, order), weather);
        const lightLast = order.at(-1) === 'light';
        assert.equal(result.success, lightLast, `${weather}/${route}/${order}`);
        assert.equal(result.code, lightLast ? 'success' : 'order');
        assert.equal(result.discovery, lightLast ? (route === 'roof' ? 'stars' : 'flowers') : null);
        successes += Number(result.success);
      }
      assert.equal(successes, 2);
    }
  }
});

test('mist changes mirror targets without changing shutters or route rewards', () => {
  for (const route of ['roof', 'garden']) {
    const clearPlan = validPlan(route);
    const clear = evaluatePlan(clearPlan);
    const mist = evaluatePlan(clearPlan, 'mist');
    assert.equal(mist.code, 'mirror');
    assert.equal(mist.expected.shutter, clear.expected.shutter);
    assert.notEqual(mist.expected.mirror, clear.expected.mirror);
    assert.equal(evaluatePlan(validPlan(route, 'mist'), 'mist').discovery, clear.discovery);
  }
});

test('malformed plans fail safely without a partial command trace', () => {
  const base = validPlan();
  const invalidPlans = [
    null, undefined, {}, [], 'roof',
    { ...base, route: 'cellar' },
    { ...base, shutter: 'ajar' },
    { ...base, mirror: 'floor' },
    { ...base, order: null },
    { ...base, order: 'shutter,mirror,light' },
    { ...base, order: ['shutter', 'light'] },
    { ...base, order: ['shutter', 'shutter', 'light'] },
    { ...base, order: ['shutter', 'mirror', 'unknown'] },
    { ...base, order: ['shutter', 'mirror', 'light', 'light'] },
    { ...base, order: ['shutter', 'mirror', ,] },
  ];
  for (const plan of invalidPlans) {
    const result = evaluatePlan(plan);
    assert.equal(result.success, false);
    assert.equal(result.code, 'invalid-plan');
    assert.equal(result.discovery, null);
    assert.deepEqual(result.steps, []);
  }
  assert.equal(evaluatePlan(base, 'snow').code, 'invalid-plan');
  assert.deepEqual(evaluatePlan(null).expected, { shutter: null, mirror: null });
});

test('error precedence is order, then shutter, then mirror', () => {
  const wrongBoth = { ...validPlan(), shutter: 'open', mirror: 'path' };
  assert.equal(evaluatePlan({ ...wrongBoth, order: orders[2] }).code, 'order');
  assert.equal(evaluatePlan(wrongBoth).code, 'shutter');
  assert.equal(evaluatePlan({ ...validPlan(), mirror: 'path' }).code, 'mirror');

  // Garden defaults already match: missing explicit setup before light still fails.
  assert.equal(evaluatePlan(validPlan('garden', 'clear', orders[4])).code, 'order');
});

test('the trace captures physical state when light runs, not subsequent setup', () => {
  const plan = validPlan('roof', 'clear', orders[4]);
  const before = structuredClone(plan);
  const result = evaluatePlan(plan);
  assert.deepEqual(result.steps, [
    { command: 'light', shutter: 'open', mirror: 'path' },
    { command: 'shutter', shutter: 'closed', mirror: 'path' },
    { command: 'mirror', shutter: 'closed', mirror: 'sky' },
  ]);
  assert.deepEqual(plan, before);
});

test('attempt recording is immutable and snapshots plan, order, and support', () => {
  const state = createState();
  const before = structuredClone(state);
  const plan = validPlan();
  const support = { hint: true, details: { language: 'vi' } };
  const next = recordAttempt(state, plan, support);
  assert.deepEqual(state, before);
  assert.notEqual(next, state);
  assert.notEqual(next.attempts, state.attempts);
  assert.equal(next.attempts[0].id, 'attempt-1');
  assert.equal(next.attempts[0].contentVersion, 'p0-1');
  assert.equal(next.attempts[0].weather, 'clear');
  assert.equal(next.lastResult.success, true);
  assert.equal('cefr' in next.attempts[0], false);
  assert.equal('mastery' in next.attempts[0], false);

  plan.route = 'garden';
  plan.order.reverse();
  support.details.language = 'en';
  assert.equal(next.attempts[0].plan.route, 'roof');
  assert.deepEqual(next.attempts[0].plan.order, orders[0]);
  assert.equal(next.attempts[0].support.details.language, 'vi');

  const twice = recordAttempt(next, validPlan('garden'));
  assert.equal(next.attempts.length, 1);
  assert.equal(twice.attempts[1].id, 'attempt-2');
  assert.deepEqual(twice.attempts[1].support, {});
});

test('discoveries are unique across repeated attempts, weather, and UI modes', () => {
  let state = createState();
  for (const mode of ['kids', 'balanced', 'serious']) {
    state = { ...state, mode };
    state = recordAttempt(state, validPlan('roof', state.weather));
    state = recordAttempt(state, validPlan('garden', state.weather));
    state = { ...state, weather: getNextWeather(state) };
  }
  assert.equal(state.attempts.length, 6);
  assert.deepEqual(state.discoveries, ['stars', 'flowers']);
  assert.ok(state.attempts.every((attempt) => attempt.result.success));
  assert.equal(state.mode, 'serious');

  const failed = recordAttempt(state, { ...validPlan(), shutter: 'open' });
  assert.deepEqual(failed.discoveries, ['stars', 'flowers']);
  assert.equal(failed.lastResult.success, false);
});

test('the follow-up response is exact, independent, and awards no discovery', () => {
  const state = recordAttempt(createState(), validPlan());
  const before = structuredClone(state);
  const wrong = applyTransfer(state, 'after');
  assert.deepEqual(wrong.transfer, { answer: 'after', correct: false });
  const right = applyTransfer(wrong, 'before');
  assert.deepEqual(right.transfer, { answer: 'before', correct: true });
  assert.equal(applyTransfer(state, 'Before').transfer.correct, false);
  assert.deepEqual(state, before);
  assert.deepEqual(right.attempts, state.attempts);
  assert.deepEqual(right.discoveries, state.discoveries);
  assert.deepEqual(right.lastResult, state.lastResult);
  assert.equal(recordAttempt(right, validPlan('garden')).transfer.correct, true);
});

test('weather selection preserves progress and fresh resets do not share arrays', () => {
  const state = recordAttempt(createState(), validPlan());
  const before = structuredClone(state);
  assert.equal(getNextWeather(state), 'mist');
  assert.deepEqual(state, before);
  const replay = { ...state, weather: getNextWeather(state) };
  assert.equal(getNextWeather(replay), 'clear');
  assert.deepEqual(replay.discoveries, ['stars']);
  assert.equal(replay.attempts.length, 1);
  assert.deepEqual(resetSession(), createState());

  const first = createState();
  const second = createState();
  first.discoveries.push('stars');
  assert.deepEqual(second.discoveries, []);
});
