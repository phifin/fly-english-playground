// P0 synthetic mechanics only. These results are not English proficiency evidence.

const COMMANDS = ['shutter', 'mirror', 'light'];
const CONTENT_VERSION = 'p0-1';

/** Return a fresh state; preferences and experience modes live outside these rules. */
export function createState() {
  return {
    weather: 'clear',
    attempts: [],
    discoveries: [],
    lastResult: null,
    transfer: null,
    nextAttemptId: 1,
  };
}

/** Evaluate a bounded command plan without changing it or any saved state. */
export function evaluatePlan(plan, weather = 'clear') {
  const validRoute = plan?.route === 'roof' || plan?.route === 'garden';
  const validWeather = weather === 'clear' || weather === 'mist';
  const expected = validRoute && validWeather
    ? {
        shutter: plan.route === 'roof' ? 'closed' : 'open',
        mirror: (plan.route === 'roof') === (weather === 'clear') ? 'sky' : 'path',
      }
    : { shutter: null, mirror: null };

  const validOrder = Array.isArray(plan?.order)
    && plan.order.length === COMMANDS.length
    && COMMANDS.every((command) => plan.order.includes(command));

  if (!validRoute || !validWeather || !validOrder
      || !['open', 'closed'].includes(plan?.shutter)
      || !['sky', 'path'].includes(plan?.mirror)) {
    return { success: false, code: 'invalid-plan', discovery: null, expected, steps: [] };
  }

  // Every attempt starts from the same physical state. Both setup commands are
  // still required before light, even when a default happens to match the goal.
  let shutter = 'open';
  let mirror = 'path';
  let atLight;
  const steps = [];

  for (const command of plan.order) {
    if (command === 'shutter') shutter = plan.shutter;
    if (command === 'mirror') mirror = plan.mirror;
    if (command === 'light') atLight = { shutter, mirror };
    steps.push({ command, shutter, mirror });
  }

  const lightIndex = plan.order.indexOf('light');
  let code = 'success';
  if (plan.order.indexOf('shutter') > lightIndex || plan.order.indexOf('mirror') > lightIndex) {
    code = 'order';
  } else if (atLight.shutter !== expected.shutter) {
    code = 'shutter';
  } else if (atLight.mirror !== expected.mirror) {
    code = 'mirror';
  }

  const success = code === 'success';
  return {
    success,
    code,
    discovery: success ? (plan.route === 'roof' ? 'stars' : 'flowers') : null,
    expected,
    steps,
  };
}

/** Append a snapshot and award each discovery once, independently of UI mode. */
export function recordAttempt(state, plan, support = {}) {
  const result = evaluatePlan(plan, state.weather);
  const attempt = {
    id: `attempt-${state.nextAttemptId}`,
    contentVersion: CONTENT_VERSION,
    plan: structuredClone(plan),
    support: structuredClone(support),
    weather: state.weather,
    result,
  };
  const discoveries = result.discovery && !state.discoveries.includes(result.discovery)
    ? [...state.discoveries, result.discovery]
    : [...state.discoveries];

  return {
    ...state,
    attempts: [...state.attempts, attempt],
    discoveries,
    lastResult: result,
    nextAttemptId: state.nextAttemptId + 1,
  };
}

/** A separate synthetic follow-up result; it awards no mastery or world reward. */
export function applyTransfer(state, answer) {
  return { ...state, transfer: { answer, correct: answer === 'before' } };
}

/** Return the replay condition; changing it must not reset saved progress. */
export function getNextWeather(state) {
  return state.weather === 'clear' ? 'mist' : 'clear';
}

/** Explicit full reset; switching mode or weather should never call this. */
export function resetSession() {
  return createState();
}
