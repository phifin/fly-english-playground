import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { deriveProgress } from '../src/learning.js';
import { deriveExpeditions, findRoute, validateBoard } from '../src/expedition.js';
import { deploymentUrl } from './verify-deployment.mjs';
import { verifyCloudSdk } from './cloud-sdk-check.mjs';

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

let browser;
let page;
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
    const learning = deriveProgress(events, pack);
    const world = deriveExpeditions(events, boardPack.boards);
    return { ...learning, rewards: new Set([...learning.rewards].filter(id => world.solved.has(`${id}-board`))) };
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
  async function newContext() {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true,
      reducedMotion: 'reduce', acceptDownloads: true });
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
  async function createProfile(name, { kind = 'independent', guardianId = '', mode = 'balanced', language = 'en' } = {}) {
    if (!(await page.locator('[data-form="create-profile"]').count())) await action('profiles');
    const form = page.locator('[data-form="create-profile"]');
    if (!(await form.isVisible())) await page.locator('details').filter({ has: form }).first().locator('summary').first().click();
    await form.locator('[name="name"]').fill(name);
    await form.locator('[name="kind"]').selectOption(kind);
    if (guardianId) await form.locator('[name="guardianId"]').selectOption(guardianId);
    await click(form.locator('button[type="submit"]'));
    await button('finish-onboard').waitFor({ state: 'visible' });
    const id = await activeId();
    await action('mode', `[data-value="${mode}"]`);
    await select('[data-setting="language"]', language);
    await action('finish-onboard');
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
    await target.locator('#import-file').setInputFiles({ name: 'browser-test-backup.json', mimeType: 'application/json',
      buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
    await ready(target);
    if (malformed) { await target.locator('.alert.error').waitFor({ state: 'visible' }); return; }
    await noError(target);
    await target.locator('.alert.notice').filter({ hasText: /validated and merged|kiểm tra và gộp/i }).waitFor({ state: 'visible' });
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
      assert.ok(await button('ready').count() || await button('world-move').count() || await button('activity').count(), 'Kids investigation opens a discovery board or a clue scene.');
      assert.equal(await button('submit').count(), 0, 'Kids investigates before entering the response workspace.');
    } else if (assertEntry && mode === 'balanced') {
      assert.equal(await button('submit').count(), 0, 'Balanced begins with a mission board.');
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
  async function axe(label) {
    if (!axePath) return;
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
    report.axe ??= []; report.axe.push({ page: label, violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) })) });
    assert.deepEqual(result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id), [], `Serious accessibility violations on ${label}`);
  }

  await page.goto(base.href); await ready();
  if (expectedRelease) {
    assert.equal(await page.locator('meta[name="atlas-release"]').getAttribute('content'), expectedRelease,
      'The actual browser must load the expected deployed release, not an older cached shell.');
    check('The browser loaded the expected release at its configured project URL.');
  }
  const cloudContext = await newContext(); const cloudPage = await cloudContext.newPage(); observe(cloudPage);
  try {
    await cloudPage.goto(base.href); await ready(cloudPage);
    report.cloudSdk = await verifyCloudSdk(cloudPage, { requireCsp: Boolean(process.env.CI || expectedRelease) });
  } finally { await cloudContext.close(); contexts.splice(contexts.indexOf(cloudContext), 1); }
  check(report.cloudSdk.configured
    ? 'The deployed Firebase SDK prepares under its actual CSP using pinned CDN modules, without sign-in, popups or cloud data requests.'
    : 'The deployed disabled cloud prepares without external SDK or service requests.');
  const mainName = 'River CI', otherName = 'Sky CI', childName = 'Moss CI';
  const mainId = await createProfile(mainName, { mode: 'balanced', language: 'vi' });
  await settings({ quality: 'eco', motion: 'reduced' });
  await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
  assert.equal(await activeId(), mainId);
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('mode-balanced')), true);
  assert.equal(await page.locator('html').getAttribute('lang'), 'vi');
  assert.equal(await page.locator('html').getAttribute('data-quality'), 'eco');
  assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
  await settings({ language: 'en' });
  check('Profile creation, onboarding, language, mode, quality and motion persist through reload.');

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
  await clean.locator(`[data-action="choose-profile"][data-id="${mainId}"]`).click(); await ready(clean);
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
    await page.waitForFunction(async () => {
      if (!navigator.serviceWorker) return false;
      const registration = await navigator.serviceWorker.ready;
      return registration.active?.state === 'activated' && Boolean(navigator.serviceWorker.controller);
    }, null, { timeout: 120000 });
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
  if (page && !page.isClosed()) {
    try { await page.screenshot({ path: fileURLToPath(new URL('release-failure.png', directory)), fullPage: true }); } catch { /* Browser launch/closure may have failed. */ }
  }
  throw error;
} finally {
  await writeFile(new URL('release-browser-report.json', directory), JSON.stringify(report, null, 2));
  for (const context of contexts) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
}
