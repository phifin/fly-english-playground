import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { journeyProgress } from '../src/journey.js';
import { deriveExpeditions, findRoute, validateBoard } from '../src/expedition.js';
import { mergeExports } from '../src/storage.js';
import { deploymentUrl } from './verify-deployment.mjs';
import { verifyCloudSdk } from './cloud-sdk-check.mjs';
import { pollAsyncResult } from './browser-poll.mjs';

// Verification tooling only. This script neither installs packages nor provisions
// services. Every traveler, response and backup belongs to a fresh test context.
const base = deploymentUrl(process.env.ATLAS_URL || 'http://127.0.0.1:4173');
const expectedRelease = process.env.ATLAS_EXPECTED_RELEASE;
if (expectedRelease) assert.match(expectedRelease, /^[a-f0-9]{20}$/, 'Expected release must be an actual build ID.');
const directory = new URL('../artifacts/', import.meta.url);
await mkdir(directory, { recursive: true });
const report = {
  date: new Date().toISOString(), url: base.href, expectedRelease: expectedRelease ?? null, checks: [], errors: [],
  limitations: ['Chromium with a mobile viewport is not a real low-end phone.',
    'No live Google sign-in, cloud data synchronization, educational efficacy or complete WCAG certification is tested.'],
};
const check = message => { report.checks.push(message); console.log(`PASS: ${message}`); };
const localModule = value => value.startsWith('file:') ? value : pathToFileURL(resolve(value)).href;
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const savedData = value => ({ schemaVersion: value.schemaVersion,
  profiles: [...value.profiles].sort((a, b) => a.id.localeCompare(b.id)),
  events: [...value.events].sort((a, b) => a.id.localeCompare(b.id)) });

// Runs in the browser: inspect an existing database through one read-only
// transaction. No application store methods, test adapters or writes are used.
async function readImportState({ expected = null, expectError = false } = {}) {
  const name = 'unfolding-atlas-learning';
  if (!(await indexedDB.databases()).some(database => database.name === name)) throw new Error('The actual learner database is missing.');
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onupgradeneeded = () => { request.transaction.abort(); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('The read-only import inspection is blocked.'));
  });
  let snapshot;
  try {
    snapshot = await new Promise((resolve, reject) => {
      const transaction = database.transaction(['profiles', 'events'], 'readonly');
      const profiles = transaction.objectStore('profiles').getAll(), events = transaction.objectStore('events').getAll();
      transaction.oncomplete = () => resolve({ schemaVersion: 1, exportedAt: new Date().toISOString(),
        profiles: profiles.result, events: events.result });
      transaction.onabort = () => reject(transaction.error ?? new Error('Import inspection was aborted.'));
    });
  } finally { database.close(); }
  const observed = window.__atlasImportProbe;
  const probe = observed ? { inputEvents: observed.inputEvents, changeEvents: observed.changeEvents,
    connectedAtChange: observed.connectedAtChange, sawBusy: observed.sawBusy } : null;
  const state = { snapshot, probe, busy: document.querySelector('#app')?.getAttribute('aria-busy') !== 'false',
    notices: [...document.querySelectorAll('.alert.notice')].map(element => element.innerText),
    errors: [...document.querySelectorAll('.alert.error')].map(element => element.innerText) };
  if (expected === null) return state;
  if (!probe?.changeEvents || !probe.sawBusy || state.busy) return false;
  if (state.errors.length) return state;
  if (expectError) return false;
  const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  const actual = { schemaVersion: snapshot.schemaVersion,
    profiles: snapshot.profiles.sort((a, b) => a.id.localeCompare(b.id)), events: snapshot.events.sort((a, b) => a.id.localeCompare(b.id)) };
  return canonical(actual) === expected ? state : false;
}

let browser;
let page;
let failurePage;
const contexts = [];
try {
  let playwright;
  for (const candidate of [process.env.ATLAS_PLAYWRIGHT_MODULE && localModule(process.env.ATLAS_PLAYWRIGHT_MODULE),
    process.env.P0_PLAYWRIGHT_MODULE && localModule(process.env.P0_PLAYWRIGHT_MODULE),
    'playwright', '@playwright/test',
    new URL('../../my-toolings/node_modules/@playwright/test/index.mjs', import.meta.url).href].filter(Boolean)) {
    try { const module = await import(candidate); if (module.chromium || module.default?.chromium) { playwright = module.chromium ? module : module.default; report.tooling = candidate; break; } }
    catch { /* Existing local tooling only; never download a fallback. */ }
  }
  assert.ok(playwright, 'Install optional Playwright tooling separately or set ATLAS_PLAYWRIGHT_MODULE. This script downloads nothing.');
  const response = await fetch(new URL('data/published/atlas.json', base));
  assert.equal(response.status, 200, 'Build and start the public preview with an accepted learning library before running browser checks.');
  const pack = await response.json();
  assert.equal(pack.schemaVersion, 1);
  const boardResponse = await fetch(new URL('data/published/boards.json', base));
  assert.equal(boardResponse.status, 200, 'The release needs accepted expedition boards, not staged submissions.');
  const boardPack = await boardResponse.json();
  assert.equal(boardPack.schemaVersion, 1);
  assert.equal(boardPack.boards.length, pack.missions.length);
  const boards = new Map(boardPack.boards.map(board => {
    assert.deepEqual(validateBoard(board), [], `Invalid published board ${board.id}`);
    return [board.missionId, board];
  }));
  assert.equal(boards.size, pack.missions.length, 'Every published mission needs its own distinct board.');
  function evidenceFor(events) {
    return journeyProgress(events, pack, boardPack.boards);
  }
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const first = new Map(levels.map(level => [level, pack.missions.find(m => m.level === level)]));
  assert.ok([...first.values()].every(Boolean), 'Published launch content must contain all six practice bands.');
  const samples = [first.get('A1'), first.get('A2'), first.get('B2')];
  const types = new Set(samples.flatMap(m => m.activities.map(a => a.type)));
  for (const mission of first.values()) {
    if (types.size === 5) break;
    if (!samples.includes(mission) && mission.activities.some(a => !types.has(a.type))) {
      samples.push(mission); for (const activity of mission.activities) types.add(activity.type);
    }
  }
  assert.deepEqual([...types].sort(), ['choice', 'gap', 'match', 'order', 'writing']);
  assert.ok(samples.length <= 5, 'The representative suite must not traverse the entire content library.');

  let axePath = process.env.ATLAS_AXE_PATH;
  if (!axePath) {
    try { axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js'); }
    catch { const sibling = fileURLToPath(new URL('../../my-toolings/node_modules/axe-core/axe.min.js', import.meta.url)); try { await access(sibling); axePath = sibling; } catch { /* Optional. */ } }
  }
  if (axePath) await access(axePath);
  else report.limitations.push('axe-core is not installed; automated axe checks were skipped. Manual/DOM interaction checks still run.');
  if (process.env.CI) assert.ok(axePath, 'CI must install axe-core and run the accessibility checks; skipping is not permitted.');
  const channel = process.env.ATLAS_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
  const options = { headless: true, chromiumSandbox: true, ...(channel ? { channel } : {}) };
  if (process.env.ATLAS_BROWSER_EXECUTABLE) { options.executablePath = process.env.ATLAS_BROWSER_EXECUTABLE; delete options.channel; }
  report.launch = { channel: options.channel ?? (options.executablePath ? 'explicit-executable' : 'bundled-chromium'),
    chromiumSandbox: options.chromiumSandbox, connection: process.env.ATLAS_CDP_URL ? 'cdp' : 'local' };
  browser = process.env.ATLAS_CDP_URL
    ? await playwright.chromium.connectOverCDP(process.env.ATLAS_CDP_URL)
    : await playwright.chromium.launch(options);
  report.browser = await browser.version();
  const external = [];
  async function newContext(options = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true,
      reducedMotion: 'reduce', acceptDownloads: true, ...options });
    contexts.push(context);
    if (axePath) await context.addInitScript({ path: axePath });
    context.on('request', request => { const url = new URL(request.url()); if (['http:', 'https:'].includes(url.protocol) && url.origin !== base.origin) external.push(url.origin); });
    return context;
  }
  function observe(target) {
    target.on('pageerror', error => report.errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  }
  const context = await newContext(); page = await context.newPage(); observe(page);
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(45000);
  async function ready(target = page) {
    // The initial HTML uses the same panel class while modules fetch the
    // library. Only the final boot-error panel has a heading/retry action.
    await target.waitForFunction(() => document.querySelector('#app')?.getAttribute('aria-busy') === 'false' || document.querySelector('.startup-error h1'));
    if (await target.locator('.startup-error h1').count()) throw new Error(await target.locator('.startup-error').innerText());
  }
  async function noError(target = page) { assert.equal(await target.locator('.alert.error').count(), 0, await target.locator('.alert.error').allTextContents()); }
  async function revealDetails(locator, target = page) {
    // Follow the same disclosure path as a person. Never force clicks through
    // hidden administrative sections or change their open state in page code.
    const parents = locator.locator('xpath=ancestor::details');
    for (let index = 0; index < await parents.count(); index++) {
      if (await locator.isVisible()) break;
      const parent = parents.nth(index);
      if (!(await parent.evaluate(element => element.open))) {
        await parent.locator(':scope > summary').click();
        await ready(target);
      }
    }
  }
  async function click(locator, { allowError = false, keyboard = false } = {}) {
    await ready();
    if (keyboard) { await locator.focus(); await page.keyboard.press('Enter'); }
    else await locator.click();
    await ready(); if (!allowError) await noError();
  }
  const button = (action, suffix = '') => page.locator(`[data-action="${action}"]${suffix}:visible`).first();
  const action = (name, suffix = '', options) => click(button(name, suffix), options);
  async function select(selector, value) { await ready(); await page.locator(selector).selectOption(value); await ready(); await noError(); }
  async function chooseProfile(id) { await action('profiles'); await action('choose-profile', `[data-id="${id}"]`); }
  async function activeId() { return page.evaluate(() => localStorage.getItem('atlas-active-profile')); }
  async function preserveFormThroughNotification(name, values, focus = 'name') {
    await ready();
    const selector = `[data-form="${name}"]`, form = page.locator(selector);
    const control = form.locator(`[name="${focus}"]`);
    const expansion = element => ({ enclosing: element.closest('details')?.open ?? null,
      nested: [...element.querySelectorAll('details')].map(detail => detail.open) });
    const expanded = await form.evaluate(expansion);
    await control.focus();
    const selection = await control.evaluate(element => {
      element.setSelectionRange(1, Math.min(3, element.value.length));
      return [element.selectionStart, element.selectionEnd];
    });
    // Deliver a browser connectivity notification through the real listener.
    // No app state, storage, successful response or render function is mocked.
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await ready(); await noError();
    await page.locator('.alert.notice').filter({ hasText: /Connection restored|Đã kết nối lại/ }).waitFor({ state: 'visible' });
    for (const [field, value] of Object.entries(values)) {
      assert.equal(await form.locator(`[name="${field}"]`).inputValue(), value,
        `A background connection notification must preserve the ${name} form's ${field}.`);
    }
    assert.deepEqual(await form.evaluate(expansion), expanded,
      `A background notification must preserve the ${name} form's expanded section.`);
    assert.equal(await control.evaluate(element => element === document.activeElement), true,
      `A background notification must preserve focus in the ${name} form.`);
    assert.deepEqual(await control.evaluate(element => [element.selectionStart, element.selectionEnd]), selection,
      `A background notification must preserve the ${name} text selection.`);
  }
  async function createProfile(name, { kind = 'independent', guardianId = '', mode = 'balanced', language = 'en' } = {}) {
    if (!(await page.locator('[data-form="create-profile"]').count())) { await action('profiles'); await action('start-traveler'); }
    await action('guidance-language', `[data-value="${language}"]`);
    const form = page.locator('[data-form="create-profile"]');
    await form.locator('[name="name"]').fill(name);
    await form.locator(`[name="mode"][value="${mode}"]`).check(); await ready();
    await revealDetails(form.locator('[name="kind"]'));
    await form.locator('[name="kind"]').selectOption(kind);
    await ready();
    if (guardianId) await form.locator('[name="guardianId"]').selectOption(guardianId);
    await preserveFormThroughNotification('create-profile', { name, kind, guardianId });
    assert.equal(await form.locator(`[name="mode"][value="${mode}"]`).isChecked(), true,
      'A background update must preserve the selected way to play.');
    await click(form.locator('button[type="submit"]'));
    const id = await activeId();
    assert.equal(await button('finish-onboard').count(), 0, 'New players must enter play without a second configuration page.');
    assert.equal(await page.locator('body').evaluate((element, value) => element.classList.contains(`mode-${value}`), mode), true);
    if (mode === 'kids') await button('picture-play').waitFor({ state: 'visible' });
    else if (mode === 'balanced') await page.locator('.story-expedition').waitFor({ state: 'visible' });
    else await button('submit').waitFor({ state: 'visible' });
    return id;
  }
  async function settings({ mode, language, quality, motion } = {}) {
    await action('settings');
    if (mode) await action('mode', `[data-value="${mode}"]`);
    for (const [name, value] of Object.entries({ language, quality, motion })) if (value) await select(`[data-setting="${name}"]`, value);
  }
  async function backup(target = page) {
    if (target === page) {
      if (!(await button('export').count())) await action('settings');
      const waiting = target.waitForEvent('download'); await action('export');
      const download = await waiting;
      const path = await download.path();
      if (path) return JSON.parse(await readFile(path, 'utf8'));
      const stream = await download.createReadStream(); const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    const waiting = target.waitForEvent('download'); await target.locator('[data-action="export"]').click(); await ready(target);
    return JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
  }
  async function upload(value, { malformed = false, target = page } = {}) {
    let before, expected;
    try {
      await ready(target);
      before = (await target.evaluate(readImportState)).snapshot;
      // This model handles newer revisions and obsolete draft pruning. Pure
      // merge semantics have separate unit tests; here we verify the real UI
      // committed the exact resulting records to browser IndexedDB.
      expected = malformed ? before : mergeExports(before, value).data;
      // A native file input dispatches input before change. Deliver a real
      // background notification in that interval: the selected file and its
      // delegated change handler must survive the resulting UI update.
      await target.locator('#import-file').evaluate(element => {
        const app = document.querySelector('#app');
        const probe = { inputEvents: 0, changeEvents: 0, connectedAtChange: false, sawBusy: false };
        const observer = new MutationObserver(records => {
          if (app.getAttribute('aria-busy') === 'true' || records.some(record => record.oldValue === 'true')) probe.sawBusy = true;
        });
        observer.observe(app, { attributes: true, attributeFilter: ['aria-busy'], attributeOldValue: true });
        element.addEventListener('input', () => { probe.inputEvents++; window.dispatchEvent(new Event('online')); }, { once: true });
        element.addEventListener('change', () => { probe.changeEvents++; probe.connectedAtChange = element.isConnected; }, { once: true });
        probe.dispose = () => observer.disconnect();
        window.__atlasImportProbe = probe;
      });
      await target.locator('#import-file').setInputFiles({ name: 'browser-test-backup.json', mimeType: 'application/json',
        buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
      const outcome = await pollAsyncResult(() => target.evaluate(readImportState,
        { expected: canonical(savedData(expected)), expectError: malformed }),
      { timeoutMs: 15000, intervalMs: 100, description: 'committed import records and a completed native file-change action' });
      assert.equal(outcome.probe.inputEvents, 1, 'The actual selected file must deliver its native input event.');
      assert.equal(outcome.probe.changeEvents, 1, 'The actual selected file must deliver its native change event.');
      assert.equal(outcome.probe.connectedAtChange, true, 'The file input must remain connected through the background notification.');
      assert.equal(canonical(savedData(outcome.snapshot)), canonical(savedData(expected)),
        malformed ? 'Rejected imports must leave the exact committed records unchanged.' : 'The UI import must commit the exact expected profiles and immutable event history.');
      if (malformed) assert.ok(outcome.errors.length, 'A rejected import must explain the failure.');
      else { assert.deepEqual(outcome.errors, [], 'A successful committed import must not display an error.'); await noError(target); }
      report.imports ??= [];
      report.imports.push({ url: target.url(), rejected: malformed, profiles: outcome.snapshot.profiles.length,
        events: outcome.snapshot.events.length, probe: outcome.probe, notices: outcome.notices, errors: outcome.errors });
    } catch (error) {
      failurePage = target;
      report.importFailure = { rejected: malformed, before, expected };
      try { report.importFailure.actual = await target.evaluate(readImportState); }
      catch (inspectionError) { report.importFailure.inspectionError = inspectionError.message; }
      throw error;
    } finally {
      await target.evaluate(() => { window.__atlasImportProbe?.dispose(); delete window.__atlasImportProbe; }).catch(() => {});
    }
  }
  async function journal(expected, target = page) {
    if (target === page) await action('journal');
    else { await target.locator('.main-nav [data-action="journal"]').click(); await ready(target); }
    const values = (await target.locator('.stats-grid .stat > strong').allTextContents()).map(Number);
    assert.equal(values[0], expected.rewards.size, 'World discoveries are profile-specific.');
    assert.equal(values[1], expected.independent, 'Writing and supported attempts must not become independent evidence.');
    assert.equal(values[2], expected.retained);
    assert.equal(values[3], expected.due.length);
  }
  async function openMission(mission, mode, { assertEntry = false } = {}) {
    await action('atlas');
    await action('region', `[data-value="${mission.level}"]`);
    await action('begin', `[data-id="${mission.id}"]`);
    if (mode === 'kids') {
      await button('investigate').waitFor({ state: 'visible' });
      assert.equal(await button('submit').count(), 0);
      await action('investigate');
      assert.ok(await button('ready').count(), 'Kids investigation opens a guided clue scene.');
      assert.equal(await button('submit').count(), 0, 'Kids investigates before entering the response workspace.');
    } else if (assertEntry && mode === 'balanced') {
      assert.equal(await button('submit').count(), 0, 'Balanced begins with an interactive story scene.');
      assert.equal(await page.locator('.story-expedition').count(), 1);
      assert.equal(await page.locator('.expedition-grid').count(), 0, 'A coordinate puzzle must not block entry to the adventure.');
      assert.ok(await button('activity').count());
    } else if (assertEntry && mode === 'serious') {
      await button('submit').waitFor({ state: 'visible' });
      assert.equal(await button('investigate').count(), 0);
    }
  }
  async function openActivity(activity, mode) {
    // Kids' clue scene deliberately has no path-navigation controls. Follow its
    // ready button instead of bypassing the distinct guided flow.
    if (mode === 'kids') {
      if (!(await button('ready').count())) await action('activity', `[data-id="${activity.id}"]`);
      await button('ready').waitFor({ state: 'visible' });
      assert.equal(await button('submit').count(), 0, 'Kids reads the actual English clue before answering.');
      await action('ready');
    } else await action('activity', `[data-id="${activity.id}"]`);
    await button('submit').waitFor({ state: 'visible' });
    assert.equal((await page.locator('.activity-prompt').textContent()).trim(), activity.prompt.trim());
  }
  async function solve(activity, { wrong = false } = {}) {
    if (activity.type === 'choice') {
      const answer = wrong ? activity.options.find(option => option.id !== activity.answer).id : activity.answer;
      await action('choose', `[data-value="${answer}"]`);
    } else if (activity.type === 'gap') {
      await page.locator('[data-answer="gap"]').fill(wrong ? '__browser_wrong_answer__' : activity.accepted[0]);
    } else if (activity.type === 'match') {
      for (const pair of activity.pairs) await select(`[data-match="${pair.id}"]`, pair.id);
    } else if (activity.type === 'order') {
      const positions = () => page.locator('.order-list li').evaluateAll(rows => rows.map(row => row.querySelector('[data-action="move"]').dataset.id));
      for (let target = 0; target < activity.answer.length; target++) {
        const id = activity.answer[target]; let index = (await positions()).indexOf(id);
        while (index > target) { await action('move', `[data-id="${id}"][data-dir="-1"]`); index--; }
      }
      assert.deepEqual(await positions(), activity.answer);
    } else if (activity.type === 'writing') {
      // The published example is test input, not independent writing evidence.
      await page.locator('[data-answer="writing"]').fill(activity.example);
      for (let index = 0; index < activity.rubric.length; index++) { await page.locator(`[data-check="${index}"]`).check(); await ready(); }
    } else throw new Error(`Untested response type: ${activity.type}`);
    await action('submit');
    await page.locator(wrong ? '.feedback.try-again' : '.feedback.success').waitFor({ state: 'visible' });
    assert.ok((await page.locator('.feedback').innerText()).includes(activity.explanation.en));
    if (activity.type === 'writing') assert.match(await page.locator('.feedback').innerText(), /self-reviewed|not.*assess/i);
  }
  async function finishMoment(mode) {
    await action('next');
    if (mode === 'kids') {
      await button('trail-next').waitFor({ state: 'visible' });
      await action('trail-next');
    }
  }
  async function solveWorld(mission, mode) {
    await openMission(mission, mode);
    if (await button('world').count()) await action('world');
    // Legacy route games remain available by explicit choice, not as a gate.
    if (!(await page.locator('[data-action="route-game"]').count())) await action('world');
    await revealDetails(page.locator('[data-action="route-game"]'));
    await action('route-game');
    await action('world-reset');
    const board = boards.get(mission.id), route = findRoute(board);
    assert.ok(route?.length && route.length <= 40, 'Accepted boards need a bounded route through a bridge switch.');
    assert.ok(route.includes('X'), 'The discovery must require a real switch interaction.');
    if (mode === 'serious') {
      await page.locator('[data-world-plan]').fill(route.join(','));
      await action('world-run');
    } else {
      for (const command of route) await action('world-move', `[data-value="${command}"]`);
      if (mode === 'balanced') await action('world-run');
    }
    await action('world-reset');
    const snapshot = await backup();
    const saved = snapshot.events.filter(event => event.profileId === mainId);
    const world = deriveExpeditions(saved, boardPack.boards);
    assert.equal(world.solved.has(board.id), true,
      'The actual saved command path must replay to the destination; a submitted solved flag is insufficient.');
    assert.deepEqual(world.states[board.id].commands, [], 'Reset persists the current route without deleting an earned discovery.');
    check(`${mode} solves ${mission.level} through its own controls; saved path replay preserves discoveries after a reset.`);
  }
  async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'The 390px layout must not overflow horizontally.'); }
  async function axe(label, target = page) {
    if (!axePath) return;
    const result = await target.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
    report.axe ??= []; report.axe.push({ page: label, violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) })) });
    assert.deepEqual(result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id), [], `Serious accessibility violations on ${label}`);
  }

  await page.goto(base.href); await ready();
  if (expectedRelease) {
    assert.equal(await page.locator('meta[name="atlas-release"]').getAttribute('content'), expectedRelease,
      'The actual browser must load the expected deployed release, not an older cached shell.');
    check('The browser loaded the expected release at its configured project URL.');
  }

  // Keep this first-visit journey independent of the three travelers whose
  // exact journals and backups are checked later. It uses only real controls
  // and read-only inspection of records committed by the application.
  const arrivalContext = await newContext({ locale: 'en-GB' });
  const arrivalPage = await arrivalContext.newPage(); observe(arrivalPage);
  arrivalPage.setDefaultTimeout(15000); arrivalPage.setDefaultNavigationTimeout(45000);
  try {
    await arrivalPage.goto(base.href); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('html').getAttribute('lang'), 'en');
    const englishHeading = await arrivalPage.locator('.welcome h1').innerText();
    const languageButton = value => arrivalPage.locator(`.masthead [data-action="guidance-language"][data-value="${value}"]`);
    const start = arrivalPage.locator('.welcome [data-action="start-traveler"]');
    report.arrivalObservations = [];
    const withinFirstViewport = async locator => {
      const expectedViewport = arrivalPage.viewportSize();
      return pollAsyncResult(async () => {
        const sample = await locator.evaluate(element => {
          const box = element.getBoundingClientRect();
          const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          const style = getComputedStyle(element);
          return { connected: element.isConnected, action: element.dataset.action, value: element.dataset.value ?? null,
            rect: { x: box.x, y: box.y, top: box.top, left: box.left, right: box.right, bottom: box.bottom },
            viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY,
              visualWidth: visualViewport?.width, visualHeight: visualViewport?.height },
            hit: top ? { tag: top.tagName, id: top.id, classes: String(top.className),
              action: top.dataset?.action ?? null, text: top.textContent?.trim().slice(0, 100) } : null,
            style: { display: style.display, visibility: style.visibility, pointerEvents: style.pointerEvents },
            inViewport: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
            unobscured: Boolean(top && element.contains(top)), width: box.width, height: box.height };
        });
        // A background readiness render can replace the locator's resolved node
        // before evaluate runs. Only retry an invalid detached-node/resize
        // observation; a connected bad layout or obstruction fails immediately.
        report.arrivalObservations.push({ expectedViewport, ...sample });
        return sample.connected && sample.viewport.width === expectedViewport.width && sample.viewport.height === expectedViewport.height
          ? sample : false;
      }, { timeoutMs: 15000, intervalMs: 100, description: 'a connected arrival control at the requested viewport size' });
    };
    const appearance = [];
    report.arrival = { appearance };
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      await arrivalPage.setViewportSize(viewport);
      await arrivalPage.evaluate(() => scrollTo(0, 0));
      const callToAction = await withinFirstViewport(start);
      appearance.push({ viewport, callToAction });
      assert.equal(callToAction.inViewport && callToAction.unobscured, true,
        `The first action must be visible and unobscured on arrival at ${viewport.width}px: ${JSON.stringify(callToAction)}`);
      assert.ok(callToAction.height >= 44, 'The primary entry action needs a full touch target.');
      const google = await withinFirstViewport(arrivalPage.locator('.welcome [data-action="cloud-signin"]'));
      assert.equal(google.inViewport && google.unobscured,true,'Google sign-in must be discoverable in the first viewport alongside local play.');
      for (const value of ['en', 'vi']) {
        const language = await withinFirstViewport(languageButton(value));
        assert.equal(language.inViewport && language.unobscured, true,
          `Both written language choices must be immediately discoverable: ${JSON.stringify(language)}`);
        assert.ok(language.height >= 44 && language.width >= 44, 'Header guidance choices need usable touch targets.');
      }
      assert.equal(await arrivalPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true,
        `The welcome screen must not overflow at ${viewport.width}px.`);
      if (viewport.width === 1440) await arrivalPage.screenshot({ path: fileURLToPath(new URL('release-welcome-desktop.png', directory)), fullPage: true });
    }
    await languageButton('vi').focus(); await languageButton('vi').press('Enter'); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('html').getAttribute('lang'), 'vi');
    assert.equal(await languageButton('vi').getAttribute('aria-pressed'), 'true');
    assert.notEqual(await arrivalPage.locator('.welcome h1').innerText(), englishHeading, 'Changing guidance must translate the welcome, not just its selector.');
    await arrivalPage.reload({ waitUntil: 'domcontentloaded' }); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('html').getAttribute('lang'), 'vi', 'Pre-profile guidance must survive a fresh visit.');
    assert.equal(await languageButton('vi').getAttribute('aria-pressed'), 'true');
    await arrivalPage.setViewportSize({ width: 390, height: 844 });
    await arrivalPage.screenshot({ path: fileURLToPath(new URL('release-welcome-vietnamese.png', directory)), fullPage: true });
    await axe('Vietnamese welcome at 390px', arrivalPage);
    const typography = await arrivalPage.locator('.welcome h1').evaluate(el=>{const st=getComputedStyle(el);return {text:el.textContent,spacing:st.letterSpacing,lineHeight:parseFloat(st.lineHeight),size:parseFloat(st.fontSize),font:st.fontFamily,translation:document.documentElement.translate};});
    assert.equal(typography.spacing,'normal');assert.ok(typography.lineHeight>=typography.size*1.3);assert.equal(typography.translation,false);assert.equal(typography.text,typography.text.normalize('NFC'));
    assert.doesNotMatch(typography.text,/\uFFFD/);report.typography=typography;
    for(const value of ['en','vi'])assert.equal(await languageButton(value).evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');


    await start.click(); await ready(arrivalPage);
    const name = arrivalPage.locator('#traveler-name');
    assert.equal(await name.evaluate(element => element === document.activeElement), true,
      'Starting the adventure must open traveler creation and focus its name field.');
    const travelerName = 'Mây UI CI';
    await name.fill(travelerName);
    const form = arrivalPage.locator('[data-form="create-profile"]');
    assert.match(await form.locator('label').filter({ has: name }).innerText(), /Bạn|Tên|[Bb]iệt danh/,
      'Essential traveler guidance must be Vietnamese before profile creation.');
    await languageButton('en').click(); await ready(arrivalPage);
    assert.equal(await name.inputValue(), travelerName, 'Switching guidance must preserve a partly entered traveler name.');
    assert.equal(await form.isVisible(), true, 'The entry form stays visible without a disclosure gate.');
    await languageButton('vi').click(); await ready(arrivalPage);
    assert.equal(await name.inputValue(), travelerName);
    await revealDetails(form.locator('[name="kind"]'), arrivalPage);
    const kind = form.locator('[name="kind"]');
    await arrivalPage.keyboard.press('Tab');
    await kind.focus();
    const selectAppearance = await kind.evaluate(element => {
      const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
      return { height: bounds.height, width: bounds.width, native: element.tagName === 'SELECT',
        outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        shadow: style.boxShadow !== 'none', paddingRight: parseFloat(style.paddingRight) };
    });
    assert.equal(selectAppearance.native, true, 'Family profile selection must retain native keyboard and assistive-technology behavior.');
    assert.ok(selectAppearance.height >= 44 && selectAppearance.width >= 44, 'Native selectors need comfortable control dimensions.');
    assert.ok(selectAppearance.outline || selectAppearance.shadow, 'A focused native selector needs a visible focus treatment.');
    assert.ok(selectAppearance.paddingRight >= 24, 'Selector text and arrow need room at the trailing edge.');
    const familySummary = form.locator('.family-options > summary');
    await familySummary.focus();
    await arrivalPage.evaluate(() => window.dispatchEvent(new Event('online')));
    await ready(arrivalPage);
    assert.equal(await familySummary.evaluate(element => element === document.activeElement), true,
      'A background notification must preserve focus on the nested family disclosure instead of moving it to the outer create section.');
    assert.equal(await form.locator('.family-options').evaluate(element => element.open), true,
      'The optional family controls must stay expanded while their summary is focused.');
    assert.equal(await form.isVisible(), true, 'The entry form stays visible without a disclosure gate.');
    assert.equal(await name.inputValue(), travelerName);
    assert.equal(await kind.inputValue(), 'independent');
    await axe('Vietnamese traveler creation at 390px', arrivalPage);
    await form.locator('button[type="submit"]').click(); await ready(arrivalPage);
    await arrivalPage.locator('.story-expedition').waitFor({ state: 'visible' });
    assert.equal(await arrivalPage.locator('[data-action="finish-onboard"]').count(),0);
    assert.equal(await arrivalPage.locator('.expedition-grid').count(),0);
    let committed = (await arrivalPage.evaluate(readImportState)).snapshot;
    assert.equal(committed.profiles.length, 1);
    const traveler = committed.profiles[0];
    assert.equal(traveler.name, travelerName);
    assert.equal(traveler.settings.language, 'vi', 'New travelers must inherit the guidance chosen before registration.');
    assert.equal(committed.events.length, 0, 'Onboarding preferences must not manufacture learning evidence.');
    await arrivalPage.locator('.main-nav [data-action="settings"]').click(); await ready(arrivalPage);
    await arrivalPage.locator('[data-action="mode"][data-value="kids"]').click(); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('html').getAttribute('lang'), 'vi', 'Play-first selection must not redefine guidance language.');
    await arrivalPage.locator('.main-nav [data-action="atlas"]').click(); await ready(arrivalPage);
    await arrivalPage.locator('.profile-pill').click(); await ready(arrivalPage);
    const resume = arrivalPage.locator(`.welcome [data-action="choose-profile"][data-id="${traveler.id}"]`);
    assert.equal((await withinFirstViewport(resume)).inViewport, true, 'Returning travelers need a visible resume action above the fold.');
    await resume.click(); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('.main-nav [data-action="atlas"]').getAttribute('aria-current'), 'page');
    await arrivalPage.reload({ waitUntil: 'domcontentloaded' }); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('.profile-pill').innerText().then(text => text.includes(travelerName)), true);
    assert.equal(await arrivalPage.locator('[data-action="finish-onboard"]').count(), 0, 'Returning travelers must not repeat onboarding.');
    committed = (await arrivalPage.evaluate(readImportState)).snapshot;
    assert.equal(committed.profiles[0].id, traveler.id);
    assert.equal(committed.profiles[0].settings.language, 'vi');
    assert.equal(committed.profiles[0].settings.mode, 'kids');
    assert.deepEqual(committed.events, [], 'Resume and mode changes must preserve the untouched learning journal.');
    report.arrival = { appearance, selectAppearance, language: 'vi', inherited: true, resumed: true };
    await arrivalPage.locator('[data-action="picture-play"]').click(); await ready(arrivalPage);
    const pictureWords=['lantern','bell','boat','shell','kite','leaf'];
    await arrivalPage.screenshot({path:fileURLToPath(new URL('release-picture-play-vietnamese.png',directory)),fullPage:true});
    await axe('Vietnamese assisted picture play at 390px',arrivalPage);
    assert.equal(await arrivalPage.locator('.picture-card').count(),3);
    await arrivalPage.locator('.picture-card:not([data-value="lantern"])').first().click(); await ready(arrivalPage);
    assert.equal(await arrivalPage.locator('[data-action="picture-next"]').count(),0,'Wrong picture selections do not advance or earn a collection');
    assert.equal((await arrivalPage.evaluate(readImportState)).snapshot.events.length,0);
    for(const word of pictureWords){
      const card=arrivalPage.locator('[data-action="picture-pick"][data-value="'+word+'"]');
      const box=await card.boundingBox();assert.ok(box.width>=44&&box.height>=44);
      await card.focus();await card.press('Enter');await ready(arrivalPage);
      assert.equal(await arrivalPage.locator('.picture-card:not(:disabled)').count(),0);
      await arrivalPage.locator('[data-action="picture-next"]').click();await ready(arrivalPage);
    }
    const pictureSaved=(await arrivalPage.evaluate(readImportState)).snapshot;
    assert.equal(pictureSaved.events.filter(e=>e.kind==='mission'&&e.payload.experience==='picture-play-v1').length,6);
    assert.equal(pictureSaved.events.filter(e=>['attempt','placement'].includes(e.kind)).length,0);
    await arrivalPage.locator('[data-action="atlas"]').filter({hasText:/Bản đồ|bản đồ/}).last().click();await ready(arrivalPage);
    await arrivalPage.reload({waitUntil:'domcontentloaded'});await ready(arrivalPage);
    assert.equal(canonical((await arrivalPage.evaluate(readImportState)).snapshot.events),canonical(pictureSaved.events));
    check('Adult-assisted picture play gives retry feedback, keyboard/touch targets and a six-picture collection that persists without CEFR evidence.');

  } catch (error) { failurePage = arrivalPage; throw error; }
  finally {
    // Keep a failing page open for the outer evidence collector.
    if (failurePage !== arrivalPage) { await arrivalContext.close(); contexts.splice(contexts.indexOf(arrivalContext), 1); }
  }
  check('First-view entry and written language choices work at 1440px, 390px and 320px; Vietnamese guidance persists before registration and is inherited without losing typed names.');
  check('Native selectors retain visible focus and touch spacing; a new play-first traveler can resume directly without repeating onboarding or creating learning evidence.');

  const cloudContext = await newContext(); const cloudPage = await cloudContext.newPage(); observe(cloudPage);
  try {
    await cloudPage.goto(base.href); await ready(cloudPage);
    report.cloudSdk = await verifyCloudSdk(cloudPage, { requireCsp: Boolean(process.env.CI || expectedRelease) });
  } finally { await cloudContext.close(); contexts.splice(contexts.indexOf(cloudContext), 1); }
  check(report.cloudSdk.configured
    ? 'The deployed Firebase SDK prepares under its actual CSP using pinned CDN modules, without sign-in, popups or cloud data requests.'
    : 'The deployed disabled cloud prepares without external SDK or service requests.');
  if (report.cloudSdk.configured) {
    // This negative test has its own console collector because HTTP 503 module
    // loads correctly produce browser console errors. Block service workers only
    // in this fresh context so unrelated download-readiness notifications cannot
    // be mistaken for a cloud-error render loop; normal offline checks run below.
    const outageContext = await newContext({ serviceWorkers: 'block' });
    const outagePage = await outageContext.newPage();
    outagePage.setDefaultTimeout(15000); outagePage.setDefaultNavigationTimeout(45000);
    const sdkRoot = `https://www.gstatic.com/firebasejs/${report.cloudSdk.sdkVersion}/`;
    const requests = [], blocked = [], uncaught = [], consoleErrors = [];
    let popups = 0;
    outagePage.on('request', request => {
      if (new URL(request.url()).origin !== base.origin) requests.push(request.url());
    });
    outagePage.on('pageerror', error => uncaught.push(error.message));
    outagePage.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    outagePage.on('popup', popup => { popups++; popup.close().catch(() => {}); });
    await outageContext.route(`${sdkRoot}**`, async route => {
      blocked.push(route.request().url());
      await route.fulfill({ status: 503, contentType: 'application/javascript',
        headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
        body: '/* Intentional SDK CDN outage for the browser regression. */' });
    });
    try {
      await outagePage.goto(base.href); await ready(outagePage);
      await outagePage.locator('[data-action="start-traveler"]').click(); await ready(outagePage);
      const form = outagePage.locator('[data-form="create-profile"]');
      const name = 'CDN outage CI';
      await form.locator('[name="name"]').fill(name);
      await outagePage.locator('.entry-form > [data-action="cloud-signin"]').click();
      await outagePage.locator('.alert.error').waitFor({ state: 'visible' });
      await outagePage.locator('.cloud-status[data-cloud-state="error"]').waitFor({ state: 'visible' });
      assert.ok((await outagePage.locator('.cloud-status').innerText()).trim().length > 12,
        'A connection failure must show a useful readable explanation.');
      await ready(outagePage);
      assert.ok(blocked.length > 0, 'The real adapter must attempt a pinned SDK load before the outage can be tested.');
      const attempts = blocked.length;
      const mutations = await outagePage.evaluate(() => new Promise(resolve => {
        let changes = 0;
        const observer = new MutationObserver(records => { changes += records.length; });
        observer.observe(document.querySelector('#app'), { childList: true });
        setTimeout(() => { observer.disconnect(); resolve(changes); }, 500);
      }));
      assert.equal(mutations, 0, 'An open cloud panel must settle after an SDK failure without repeating error renders.');
      assert.equal(blocked.length, attempts, 'An SDK failure must not automatically repeat CDN load attempts.');
      assert.equal(await form.locator('[name="name"]').inputValue(), name, 'An SDK outage must preserve the typed traveler name.');
      assert.equal(await form.isVisible(), true, 'The entry form must stay visible after an SDK outage.');
      assert.equal(await outagePage.locator('.cloud-panel').isVisible(), true, 'The failed cloud panel must remain visible so its status is readable.');
      assert.ok(requests.every(url => url.startsWith(sdkRoot)), 'The outage check must not contact authentication or learner-data services.');
      assert.equal(popups, 0, 'Opening the cloud panel must not open a sign-in popup.');
      assert.deepEqual(uncaught, [], 'Expected CDN errors must be handled by the app without uncaught exceptions.');
      report.cloudOutage = { sdkRoot, blockedModules: [...new Set(blocked)], observationMs: 500,
        appMutations: mutations, consoleErrors: consoleErrors.length, popups, uncaught };
    } finally { await outageContext.close(); contexts.splice(contexts.indexOf(outageContext), 1); }
    check('A real pinned-SDK HTTP 503 settles without error-render loops or automatic retries while preserving the typed traveler and readable open cloud panel.');
  } else report.limitations.push('Cloud is disabled: the real SDK CDN-outage and open-panel recovery regression was skipped.');
  const mainName = 'River CI', otherName = 'Sky CI', childName = 'Moss CI';
  const mainId = await createProfile(mainName, { mode: 'balanced', language: 'vi' });
  check('Traveler creation preserves typed names, open sections, focus and selection through a background notification before successful submission.');
  await settings({ quality: 'eco', motion: 'reduced' });
  await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
  assert.equal(await activeId(), mainId);
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('mode-balanced')), true);
  assert.equal(await page.locator('html').getAttribute('lang'), 'vi');
  assert.equal(await page.locator('html').getAttribute('data-quality'), 'eco');
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
  await settings({ language: 'en' });
  check('Profile creation, onboarding, language, mode, quality and motion persist through reload.');

  // Exercise ordinary rename/deletion on a disposable traveler, then return to
  // the original profile. Unsaved controls must not leak across profile changes.
  const disposableId = await createProfile('Form CI');
  const renamed = 'Form CI renamed';
  await settings();
  const renameForm = page.locator('[data-form="rename"]');
  await renameForm.locator('[name="name"]').fill(renamed);
  await preserveFormThroughNotification('rename', { name: renamed });
  await click(renameForm.locator('button[type="submit"]'));
  assert.ok((await page.locator('.profile-pill').innerText()).includes(renamed), 'The preserved rename must actually save.');
  const deleteForm = page.locator('[data-form="delete"]');
  await page.locator('details').filter({ has: deleteForm }).locator('summary').click();
  await deleteForm.locator('[name="confirm"]').fill(renamed);
  await preserveFormThroughNotification('delete', { confirm: renamed }, 'confirm');
  await click(deleteForm.locator('button[type="submit"]'));
  await button('choose-profile', `[data-id="${mainId}"]`).waitFor({ state: 'visible' });
  assert.equal(await page.locator(`[data-action="choose-profile"][data-id="${disposableId}"]`).count(), 0,
    'Submitting the preserved deletion confirmation must remove the disposable traveler.');
  await action('choose-profile', `[data-id="${mainId}"]`);
  await settings();
  assert.equal(await page.locator('[data-form="rename"] [name="name"]').inputValue(), mainName,
    'The deleted traveler\'s form values must not leak into the restored active traveler.');
  assert.equal(await page.locator('[data-form="delete"] [name="confirm"]').inputValue(), '',
    'Deletion confirmation must reset when the active traveler changes.');
  check('Rename and deletion confirmations retain input, expansion, focus and selection through background notifications; submissions work and profile changes reset them.');

  // A background storage failure must not release another action's lock. Keep
  // the device-storage request pending, then fault one real refresh read.
  await page.evaluate(() => {
    if (document.hidden) throw new Error('The async-lock test requires the active visible page.');
    window.__atlasLockFault = { descriptor: Object.getOwnPropertyDescriptor(navigator.storage, 'persist'), started: false };
    Object.defineProperty(navigator.storage, 'persist', { configurable: true, value: () => {
      window.__atlasLockFault.started = true;
      return new Promise(resolve => { window.__atlasLockFault.resolve = resolve; });
    } });
  });
  await button('persist').click();
  await page.waitForFunction(() => window.__atlasLockFault.started && document.querySelector('#app').getAttribute('aria-busy') === 'true');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'profiles') {
        IDBObjectStore.prototype.getAll = original;
        throw new DOMException('Synthetic background-read failure', 'UnknownError');
      }
      return original.apply(this, args);
    };
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('.alert.error').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#app').getAttribute('aria-busy'), 'true', 'A handled background error must not release the foreground action lock.');
  await button('mode', '[data-value="serious"]').click();
  assert.equal(await page.locator('body').evaluate(element => element.classList.contains('mode-balanced')), true,
    'A second action cannot change the profile while the first action is pending.');
  await page.evaluate(() => {
    const fault = window.__atlasLockFault;
    if (fault.descriptor) Object.defineProperty(navigator.storage, 'persist', fault.descriptor);
    else delete navigator.storage.persist;
    fault.resolve(false);
    delete window.__atlasLockFault;
  });
  await ready(); await action('dismiss-error');
  assert.equal(await page.locator('body').evaluate(element => element.classList.contains('mode-balanced')), true);
  check('A background IndexedDB error preserves the foreground action lock and prevents overlapping profile changes.');

  await action('atlas');
  for (const level of levels) { await action('region', `[data-value="${level}"]`); assert.equal(await page.locator(`.region-tab[data-value="${level}"]`).getAttribute('aria-pressed'), 'true'); }
  check('All six published practice regions can be selected without changing proficiency claims.');

  let submitted = 0;
  const seenTypes = new Set();
  for (let missionIndex = 0; missionIndex < samples.length; missionIndex++) {
    const mission = samples[missionIndex]; const mode = ['balanced', 'kids', 'serious'][Math.min(missionIndex, 2)];
    await settings({ mode, language: 'en' });
    await openMission(mission, mode, { assertEntry: true });
    for (let index = 0; index < mission.activities.length; index++) {
      const activity = mission.activities[index];
      await openActivity(activity, mode);
      if(missionIndex===0&&index===0){
        await page.screenshot({path:fileURLToPath(new URL('release-story-desktop.png',directory)),fullPage:true});
        await page.setViewportSize({width:390,height:844});await noOverflow();
        await page.screenshot({path:fileURLToPath(new URL('release-story-mobile.png',directory)),fullPage:true});
        await axe('Balanced story interaction at 390px');
        assert.equal(await page.locator('.story-workspace .activity-prompt').count(),1,'The language interaction stays inside the expedition workspace.');
        assert.equal(await page.locator('.expedition-grid').count(),0);
        await page.setViewportSize({width:1440,height:1000});
      }
      if (missionIndex === 0 && index === 0) {
        assert.ok(['choice', 'gap'].includes(activity.type), 'The first mission needs a bounded response for the wrong-answer check.');
        await solve(activity, { wrong: true }); submitted++;
        assert.ok(await page.locator('.feedback .solution').count(), 'Wrong answers include useful accepted-answer feedback.');
        await action('retry');
      }
      if (missionIndex === 0 && activity.type === 'gap') {
        await action('reveal');
        const draftText = 'browser draft awaiting revision';
        await page.locator('[data-answer="gap"]').fill(draftText);
        const beforeLanguage = (await page.evaluate(readImportState)).snapshot;
        await action('guidance-language', '[data-value="vi"]');
        assert.equal(await page.locator('[data-answer="gap"]').inputValue(), draftText,
          'In-activity guidance switching must preserve the actual response workspace.');
        assert.equal(await page.locator('html').getAttribute('lang'), 'vi');
        const afterLanguage = (await page.evaluate(readImportState)).snapshot;
        assert.equal(canonical(afterLanguage.events.filter(event => event.kind !== 'draft')),
          canonical(beforeLanguage.events.filter(event => event.kind !== 'draft')),
          'Changing guidance must not submit, remove or rewrite assessed learning evidence.');
        await settings({ mode: 'serious', language: 'vi' });
        assert.equal(await page.locator('[data-setting="language"]').inputValue(), 'vi');
        await action('mode', '[data-value="balanced"]');
        assert.equal(await page.locator('[data-setting="language"]').inputValue(), 'vi', 'Mode changes must preserve the independently chosen guidance language.');
        await select('[data-setting="language"]', 'en');
        await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
        await openMission(mission, mode); await openActivity(activity, mode);
        assert.equal(await page.locator('[data-answer="gap"]').inputValue(), draftText);
        check('A supported unsubmitted draft survives navigation, mode/language changes and reload.');
      }
      await solve(activity); submitted++; seenTypes.add(activity.type);
      if (missionIndex === 0 && (index === 0 || activity.type === 'gap')) assert.match(await page.locator('.feedback').innerText(), /Supported practice/);
      await finishMoment(mode);
    }
    await button('collect-discovery').waitFor({state:'visible'});
    const beforeCollection=(await page.evaluate(readImportState)).snapshot.events.filter(e=>e.profileId===mainId);
    const beforeEvidence=evidenceFor(beforeCollection);
    assert.equal(beforeEvidence.completedMissions.has(mission.id),true);
    assert.equal(beforeEvidence.worlds.solved.has(boards.get(mission.id).id),false,'Collecting the new story must not require a route puzzle.');
    await action('collect-discovery');
    const afterCollection=(await page.evaluate(readImportState)).snapshot.events.filter(e=>e.profileId===mainId);
    assert.equal(evidenceFor(afterCollection).rewards.has(mission.id),true);
    assert.equal(evidenceFor(afterCollection).independent,beforeEvidence.independent,'Collecting a story cannot inflate learning evidence.');
    await solveWorld(mission, mode);
    const snapshot = await backup();
    const ownEvents = snapshot.events.filter(event => event.profileId === mainId);
    const evidence = evidenceFor(ownEvents);
    assert.equal(evidence.rewards.size, missionIndex + 1);
    await journal(evidence);
    check(`${mode} completes ${mission.level} through its intended flow; the journal agrees with saved evidence.`);
  }
  assert.deepEqual([...seenTypes].sort(), ['choice', 'gap', 'match', 'order', 'writing']);
  const mainBackup = await backup();
  const mainEvents = mainBackup.events.filter(event => event.profileId === mainId);
  assert.equal(mainEvents.filter(event => event.kind === 'attempt').length, submitted);
  assert.ok(mainEvents.some(event => event.kind === 'attempt' && event.payload.supported), 'Supported responses must retain their support marker after submission.');
  assert.equal(mainEvents.filter(event => event.kind === 'draft').length, 0, 'Completed submissions must remove their disposable text snapshots.');
  const expected = evidenceFor(mainEvents);
  await journal(expected);
  await page.screenshot({ path: fileURLToPath(new URL('release-journal.png', directory)), fullPage: true });
  await axe('journal');
  check('All five activity types save responses; supported retries and self-reviewed writing remain separate from independent evidence.');

  await action('profiles'); const otherId = await createProfile(otherName, { mode: 'serious' });
  const empty = evidenceFor([]); await journal(empty);
  await action('profiles'); const childId = await createProfile(childName, { kind: 'dependent', guardianId: mainId, mode: 'kids' });
  await settings(); assert.ok((await page.locator('main').innerText()).includes(mainName));
  await chooseProfile(mainId); await settings();
  assert.ok(await page.locator(`.family-list [data-action="dependent"][data-id="${childId}"]`).count());
  await action('dependent', `[data-id="${childId}"]`); await journal(empty);
  assert.ok((await page.locator('.profile-pill').innerText()).includes(childName));
  check('A second independent traveler and guardian-dependent traveler have separate journals and explicit family relationships.');

  await page.setViewportSize({ width: 390, height: 844 });
  await settings({ quality: 'eco', motion: 'reduced' }); await noOverflow();
  const keyboardMode = button('mode', '[data-value="kids"]'); await click(keyboardMode, { keyboard: true });
  assert.equal(await keyboardMode.evaluate(el => el === document.activeElement), true, 'Keyboard focus survives mode re-render.');
  await openMission(first.get('A1'), 'kids', { assertEntry: true }); await noOverflow();
  await openActivity(first.get('A1').activities[0], 'kids'); await noOverflow();
  const touchActivity = first.get('A1').activities[0];
  if (touchActivity.type === 'choice') { await button('choose', `[data-value="${touchActivity.answer}"]`).tap(); await ready(); }
  else if (touchActivity.type === 'gap') await page.locator('[data-answer="gap"]').fill(touchActivity.accepted[0]);
  else throw new Error('Expected a simple first activity for the touch-input smoke check.');
  await button('submit').tap(); await ready(); await page.locator('.feedback.success').waitFor();
  await noOverflow(); await page.screenshot({ path: fileURLToPath(new URL('release-mobile.png', directory)), fullPage: true });
  await axe('mobile activity');
  check('390px Eco layout supports touch answers, keyboard activation and preserved focus without horizontal overflow.');

  await action('review'); await action('studio');
  await page.locator('.echo-studio').waitFor({ state: 'visible' });
  const studioOptions = await page.locator('[data-studio-item] option').count();
  assert.ok(studioOptions > 0, 'Echo Studio must offer scripts from the active practice range.');
  await select('[data-studio-item]', { index: studioOptions - 1 });
  await page.locator('.echo-studio details summary').click(); await ready();
  await page.locator('.echo-studio details[open] p[lang="en"]').waitFor({ state: 'visible' });
  await noOverflow();
  await page.screenshot({ path: fileURLToPath(new URL('release-mobile-studio.png', directory)), fullPage: true });
  await axe('mobile echo studio');
  check('390px Echo Studio supports script selection and an expanded transcript without overflow; voice playback is not asserted.');

  await chooseProfile(otherId); await journal(empty);
  await chooseProfile(mainId); await journal(expected);
  const familyBackup = await backup();
  assert.equal(familyBackup.profiles.length, 3);
  assert.equal(familyBackup.profiles.find(p => p.id === childId).guardianId, mainId);
  assert.equal(familyBackup.events.filter(event => event.profileId === otherId).length, 0);
  assert.equal(familyBackup.events.filter(event => event.profileId === childId && event.kind === 'attempt').length, 1);
  assert.equal(canonical(familyBackup.events.filter(event => event.profileId === mainId)), canonical(mainEvents), 'Other travelers cannot alter the first traveler’s history.');
  await upload(familyBackup); await upload(familyBackup);
  assert.equal(canonical(savedData(await backup())), canonical(savedData(familyBackup)), 'Identical backup imports must not duplicate events or overwrite profiles.');
  for (const invalid of ['{not valid JSON', { ...familyBackup, schemaVersion: 999 }]) {
    await upload(invalid, { malformed: true }); await action('dismiss-error');
    assert.equal(canonical(savedData(await backup())), canonical(savedData(familyBackup)), 'Rejected backup must not change any stored record.');
  }
  check('Real download/upload backup UI merges idempotently and rejects malformed imports without losing records.');

  const cleanContext = await newContext(); const clean = await cleanContext.newPage(); observe(clean);
  await clean.goto(base.href); await ready(clean); await upload(familyBackup, { target: clean });
  await clean.locator(`.profile-grid [data-action="choose-profile"][data-id="${mainId}"]`).click(); await ready(clean);
  await journal(expected, clean);
  await clean.locator('.main-nav [data-action="settings"]').click(); await ready(clean);
  assert.equal(canonical(savedData(await backup(clean))), canonical(savedData(familyBackup)));
  const quotedBackup = structuredClone(familyBackup);
  const quotedProfile = quotedBackup.profiles.find(value => value.id === mainId);
  quotedProfile.name = 'River " data-injected="yes';
  quotedProfile.revision++;
  quotedProfile.updatedAt = new Date().toISOString();
  const writing = pack.missions.flatMap(mission => mission.activities).find(activity => activity.type === 'writing');
  const quotedText = 'A field note with " data-injected="yes & a quiet ending.';
  quotedBackup.events.push({ id: 'browser-quoted-writing', profileId: mainId, kind: 'attempt',
    at: new Date().toISOString(), payload: { activityId: writing.id,
      answer: { text: quotedText, checks: writing.rubric.map((_, index) => index) }, supported: true } });
  await upload(quotedBackup, { target: clean });
  assert.ok((await clean.locator('.profile-pill').innerText()).includes(quotedProfile.name));
  await journal(evidenceFor(quotedBackup.events.filter(event => event.profileId === mainId)), clean);
  await clean.locator('details').filter({ has: clean.getByText(quotedText, { exact: true }) }).locator('summary').click();
  await clean.getByText(quotedText, { exact: true }).waitFor({ state: 'visible' });
  assert.equal(await clean.locator('[data-injected]').count(), 0, 'Backup strings must remain text in profile attributes and writing entries.');
  await cleanContext.close(); contexts.splice(contexts.indexOf(cleanContext), 1);
  check('A clean browser restores exact immutable history; quote-bearing names and writing render as text without injected attributes.');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await settings({ language: 'en', mode: 'serious' });
  await axe('settings');
  await action('atlas');
  await page.screenshot({ path: fileURLToPath(new URL('release-desktop.png', directory)), fullPage: true });
  const built = await page.locator('meta[name="atlas-release"]').count();
  if (process.env.CI) assert.equal(built, 1, 'CI must check the built release, not the source preview.');
  if (built) {
    await pollAsyncResult(() => page.evaluate(async () => {
      if (!navigator.serviceWorker) return false;
      const registration = await navigator.serviceWorker.ready;
      return registration.active?.state === 'activated' && Boolean(navigator.serviceWorker.controller);
    }), { timeoutMs: 120000, intervalMs: 100, description: 'the activated release worker controlling the actual page before offline reload' });
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
    assert.equal(await activeId(), mainId);
    assert.ok((await page.locator('.profile-pill').innerText()).includes(mainName));
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('mode-serious')), true);
    await journal(expected); await context.setOffline(false); await ready();
    check('Installed public release reloads offline while IndexedDB retains the active traveler, settings and journal evidence.');
  } else report.limitations.push('Source preview has no release marker: service-worker offline reload was skipped. Use --dist for that check.');

  for (const path of ['data/staging/private.json', 'experiments/luna-trial/staging/dataset.json', 'docs/PROJECT_STATE.md', 'package.json', 'cloud/firestore.rules', 'src/%2e%2e%2fexperiments/private.json']) {
    assert.equal((await fetch(new URL(path, base))).status, 404, `Private path must be absent: ${path}`);
  }
  assert.equal((await fetch(new URL('observatory.html', base))).status, 200);
  for (const path of ['index.html', 'public-config.js', 'src/main.js', 'src/cloud.js']) {
    const text = await (await fetch(new URL(path, base))).text();
    assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|"private_key"\s*:\s*"[^"\s]+|"type"\s*:\s*"service_account"/);
  }
  if (!report.cloudSdk.configured) {
    assert.deepEqual(external, [], 'Default local play must not contact external SDK, tracking, auth or cloud services.');
  } else {
    const allowed = new Set(['https://www.gstatic.com', 'https://apis.google.com',
      'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com',
      'https://firestore.googleapis.com', 'https://www.googleapis.com',
      `https://${report.cloudSdk.authDomain}`, 'https://accounts.google.com']);
    assert.deepEqual([...new Set(external)].filter(origin => !allowed.has(origin)), [], 'Configured cloud may contact only its explicit SDK/auth/API origins.');
    report.limitations.push('Optional cloud is configured: real CDN SDK preparation and CSP were checked, but Google sign-in and live cloud data operations were not exercised.');
  }
  assert.deepEqual(report.errors, [], 'No browser console errors or uncaught exceptions.');
  check(`${report.cloudSdk.configured ? 'Optional cloud requests stay within approved origins' : 'Default play makes no external requests'}; public files contain no credential markers and private paths stay inaccessible.`);
  report.passed = true;
  console.log(`PASS: ${report.checks.length} release browser checks; ${submitted + 1} submitted test attempts. Artifacts: artifacts/release-*.png and release-browser-report.json.`);
} catch (error) {
  report.passed = false; report.failure = { message: error.message, stack: error.stack };
  const failedPage = failurePage ?? page;
  if (failedPage && !failedPage.isClosed()) {
    try {
      report.failure.url = failedPage.url();
      report.failure.ui = await failedPage.locator('#app').evaluate(element => ({ text: element.innerText,
        forms: [...element.querySelectorAll('form')].map(form => ({ name: form.dataset.form,
          fields: [...form.elements].filter(control => control.name && control.type !== 'file')
            .map(control => ({ name: control.name, value: control.value })) })) }));
      await failedPage.screenshot({ path: fileURLToPath(new URL('release-failure.png', directory)), fullPage: true });
    } catch { /* Browser launch/closure may have failed. */ }
  }
  throw error;
} finally {
  await writeFile(new URL('release-browser-report.json', directory), JSON.stringify(report, null, 2));
  for (const context of contexts) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
}
