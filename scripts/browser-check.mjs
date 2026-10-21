import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Optional test tooling only. The game itself has no package/runtime dependency.
// The sibling path reuses a pre-existing local test installation without changing it.
let playwright;
let tooling;
for (const candidate of [process.env.P0_PLAYWRIGHT_MODULE && pathToFileURL(process.env.P0_PLAYWRIGHT_MODULE).href, 'playwright', new URL('../../my-toolings/node_modules/@playwright/test/index.mjs', import.meta.url).href].filter(Boolean)) {
  try { playwright = await import(candidate); tooling = candidate; break; } catch { /* try the next locally available module */ }
}
if (!playwright) throw new Error('Browser checks need optional Playwright tooling. Set P0_PLAYWRIGHT_MODULE to an installed module; no package is downloaded by this script.');
const base = process.env.P0_URL || 'http://127.0.0.1:4173';
assert.equal((await fetch(base)).status, 200, 'Start the local preview before browser checks.');
const directory = new URL('../artifacts/', import.meta.url);
await mkdir(directory, { recursive: true });
const checks = [];
const errors = [];
const browser = process.env.P0_CDP_URL
  ? await playwright.chromium.connectOverCDP(process.env.P0_CDP_URL)
  : await playwright.chromium.launch({ channel: 'msedge', headless: true, chromiumSandbox: true, args: ['--disable-gpu'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const click = (action, extra = '') => page.locator(`button[data-action="${action}"]${extra}`).first().click();
  const setting = (command, value) => click('setting', `[data-command="${command}"][data-value="${value}"]`);
  const result = async code => { await page.locator(`[data-result="${code}"]`).waitFor(); assert.equal(await page.locator(`[data-result="${code}"]`).count(), 1); };
  const journal = async count => {
    await click('journal');
    assert.equal(await page.locator('[data-attempt-count]').getAttribute('data-attempt-count'), String(count));
    await click('dismiss');
  };
  await page.goto(new URL('observatory.html',base.replace(/\/?$/, '/')).href);
  await page.locator('h1').waitFor();
  await page.screenshot({ path: new URL('p0-desktop.png', directory).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  assert.equal(await page.locator('.mode-tabs [aria-pressed="true"]').getAttribute('data-value'), 'balanced');
  await click('run'); await result('order'); checks.push('An early lantern produces a recoverable, explanatory order consequence.');
  await click('note', '[data-value="roof-note"]');
  assert.match(await page.locator('dialog blockquote').textContent(), /before/i);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').count(), 0);
  assert.equal(await page.locator('[data-action="note"][data-value="roof-note"]').first().evaluate(element => element === document.activeElement), true);
  checks.push('Field-note dialog opens, Escape closes it, and keyboard focus returns.');
  await setting('shutter', 'closed');
  await click('move', '[data-index="2"][data-delta="-1"]');
  await click('run'); await result('success');
  assert.match(await page.locator('.outcome strong').textContent(), /star atlas/i);
  await journal(2); checks.push('Roof discovery can be solved by changing a tool and revising the instruction order.');
  await page.locator('#transfer').fill('before'); await page.locator('#transfer-form button').click();
  assert.equal(await page.locator('[data-correct="true"]').count(), 1);
  await click('mode', '[data-value="serious"]');
  assert.equal(await page.locator('.inline-sources .source-card').count(), 2);
  await page.locator('#reflection').fill('I set both tools before lighting the lantern.');
  await click('counter'); assert.equal(await page.locator('.counterexample').count(), 1);
  await click('mode', '[data-value="balanced"]');
  await click('mode', '[data-value="serious"]');
  assert.equal(await page.locator('#reflection').inputValue(), 'I set both tools before lighting the lantern.');
  await journal(2); checks.push('Serious Mode exposes two sources and a counterexample; mode switching retains reflection, plan and attempts.');
  await click('route', '[data-value="garden"]');
  await setting('shutter', 'open'); await setting('mirror', 'path');
  await click('run'); await result('success');
  assert.match(await page.locator('.outcome strong').textContent(), /moonflowers/i);
  assert.equal((await page.locator('.journal-count').textContent()).trim(), '2');
  await click('run'); await result('success');
  assert.equal((await page.locator('.journal-count').textContent()).trim(), '2');
  await journal(4); checks.push('Garden is a second valid solution; repeated success does not duplicate discoveries.');
  await click('weather');
  assert.match(await page.locator('.weather').textContent(), /Misty/);
  await click('run'); await result('mirror');
  await setting('mirror', 'sky'); await click('run'); await result('success');
  await journal(6); checks.push('The misty return changes the language-dependent rule and preserves prior discoveries.');
  await click('mode', '[data-value="kids"]');
  assert.equal(await page.locator('.kids-progress').count(), 1);
  await click('note', '[data-value="garden-note"]'); await click('dismiss');
  await click('kids-next'); await click('kids-next');
  await click('run'); await result('success'); await journal(7);
  checks.push('Kids uses guided discovery/build/try steps against the same simulation.');
  await page.locator('#language').selectOption('vi');
  await click('note', '[data-value="garden-note"]'); await click('translate');
  assert.equal(await page.locator('dialog [lang="vi"]').count(), 1);
  await click('translate'); await click('dismiss');
  await click('run'); await result('success');
  await click('journal'); assert.match(await page.locator('.attempt-list li').last().textContent(), /VI help/); await click('dismiss');
  await page.locator('#language').selectOption('en');
  await click('note', '[data-value="garden-note"]');
  assert.equal(await page.locator('dialog [lang="vi"]').count(), 0);
  await click('dismiss'); checks.push('Vietnamese assistance is optional, recorded after hiding it, and absent from English-only notes.');
  await click('mode', '[data-value="serious"]');
  await page.screenshot({ path: new URL('p0-serious.png', directory).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await click('mode', '[data-value="kids"]');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: new URL('p0-mobile.png', directory).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  checks.push('390px mobile layout has no horizontal overflow; reduced-motion mode remains playable.');
  for (const path of ['/experiments/luna-trial/staging/dataset.json', '/docs/luna-trial-result.md', '/package.json', '/src/%2e%2e%2fexperiments/luna-trial/staging/dataset.json']) assert.equal((await fetch(base + path)).status, 404, `private preview path ${path}`);
  checks.push('The local preview refuses experiment, documentation and traversal requests.');
  assert.deepEqual(errors, [], 'No browser console errors or uncaught exceptions.');
  const navigation = await page.evaluate(() => performance.getEntriesByType('navigation').map(({ domContentLoadedEventEnd, loadEventEnd, transferSize }) => ({ domContentLoadedEventEnd, loadEventEnd, transferSize })));
  await writeFile(new URL('browser-report.json', directory), JSON.stringify({ browser: await browser.version(), tooling, date: new Date().toISOString(), checks, errors, navigation, limitations: ['Local desktop browser with mobile viewport; not a real low-end phone.', 'No family enjoyment observation or educational efficacy claim.', 'No full WCAG audit or calibrated performance benchmark.'] }, null, 2));
  console.log(`PASS: ${checks.length} browser checks. Screenshots and report: artifacts/.`);
} finally { await browser.close(); }
