import { createState, evaluatePlan, recordAttempt, applyTransfer, getNextWeather } from './game.js';
import { copy, notes, instruction, feedback } from './fixtures.js';
import { scene } from './scene.js';
import { readGuidance, writeGuidance } from './guidance.js';

const app = document.querySelector('#app');
let state = createState();
let plan = { route: 'roof', shutter: 'open', mirror: 'sky', order: ['shutter', 'light', 'mirror'] };
const media = matchMedia('(prefers-reduced-motion: reduce)');
const ui = {
  mode: 'balanced', lang: readGuidance(), quiet: false, kidsStep: 0, dialog: null,
  inspected: new Set(), exposedSources: new Set(), translated: new Set(), translationUsed: new Set(), hint: false, showHint: false,
  counterUsed: false, returnFocus: null,
  counterexample: null, reflection: '', transferDraft: '', running: false,
  frame: null, step: null, showResult: false, hover: null,
};
const timers = new Set();
let resumeRun = null;
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const c = () => copy[ui.lang];
const t = (en,vi) => ui.lang==='vi'?vi:en;
const quiet = () => ui.quiet || media.matches;
const noteKey = id => `${state.weather}:${id}`;
function restoreDialogFocus() {
  if (ui.returnFocus) [...app.querySelectorAll('[data-focus-key]')].find(element => element.dataset.focusKey === ui.returnFocus)?.focus({ preventScroll: true });
}
const symbols = {
  book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15"/>',
  star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  leaf: '<path d="M20 3C6 2 1 9 6 16s16 1 14-13ZM5 21 17 7M9 14h6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 2-6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  settings: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>',
  shutter: '<path d="M5 21V8a7 7 0 0 1 14 0v13ZM12 2v19M8 9h1m6 0h1M8 14h1m6 0h1"/>',
  mirror: '<ellipse cx="12" cy="9" rx="6" ry="7"/><path d="m10 16-3 6m7-6 3 6M9 7l5-3"/>',
  light: '<path d="M8 7V4q4-4 8 0v3M5 7h14l-2 14H7ZM10 9v9m4-9v9"/>',
};
const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name] || symbols.star}</svg>`;

function goalCards() {
  return `<div class="goal-options" role="group" aria-label="${c().goal}">${['roof', 'garden'].map(route => {
    const key = route === 'roof' ? 'stars' : 'flowers';
    return `<button class="goal-card ${plan.route === route ? 'selected' : ''}" data-action="route" data-value="${route}" aria-pressed="${plan.route === route}" ${ui.running ? 'disabled' : ''}>${icon(key === 'stars' ? 'star' : 'leaf')}<span><strong>${c()[key]}</strong><small>${c()[key + 'Desc']}</small></span><span class="goal-check">${state.discoveries.includes(key) ? icon('check') : plan.route === route ? '•' : ''}</span></button>`;
  }).join('')}</div>`;
}

function settingsControl(command, compact = false) {
  const options = command === 'shutter' ? ['open', 'closed'] : ['sky', 'path'];
  return `<div class="tool-control ${compact ? 'compact' : ''}"><span>${icon(command)}<strong>${c()[command]}</strong></span><div class="segmented" role="group" aria-label="${c()[command]}">${options.map(value => `<button data-action="setting" data-command="${command}" data-value="${value}" aria-pressed="${plan[command] === value}" ${ui.running ? 'disabled' : ''}>${c()[value]}</button>`).join('')}</div></div>`;
}

function instructions() {
  return `<ol class="instructions" aria-label="${c().set}">${plan.order.map((command, index) => `<li class="instruction ${ui.running && ui.step === command ? 'executing' : ''}" data-command="${command}"><span class="step-number">${index + 1}</span>${icon(command)}<span class="instruction-text" lang="en">${instruction(command, plan)}</span><span class="reorder"><button data-action="move" data-index="${index}" data-delta="-1" aria-label="${c().moveUp}: ${instruction(command, plan)}" ${index === 0 || ui.running ? 'disabled' : ''}>↑</button><button data-action="move" data-index="${index}" data-delta="1" aria-label="${c().moveDown}: ${instruction(command, plan)}" ${index === 2 || ui.running ? 'disabled' : ''}>↓</button></span></li>`).join('')}</ol>`;
}

function sources(inline = false) {
  if (inline) for (const note of notes[state.weather]) ui.exposedSources.add(noteKey(note.id));
  return `<div class="source-cards ${inline ? 'inline-sources' : ''}">${notes[state.weather].map((note, index) => `<button class="source-card" data-action="note" data-value="${note.id}"><span class="paper-icon">${index + 1}</span><span><strong lang="en">${note.title}</strong><small lang="en">${inline ? note.text : note.where}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div>`;
}

function panel() {
  let content;
  if (ui.mode === 'kids' && ui.kidsStep === 0) {
    const viewed = ui.inspected.has(noteKey(plan.route === 'roof' ? 'roof-note' : 'garden-note'));
    content = `<div class="panel-heading"><span class="eyebrow">${ui.lang === 'vi' ? 'BƯỚC 1 · KHÁM PHÁ' : 'STEP 1 · DISCOVER'}</span><h2>${c().kidsLook}</h2><p>${c().sourceHint}</p></div>${sources()}<button class="primary" data-action="kids-next" ${viewed ? '' : 'disabled'}>${c().kidsNext}${icon('arrow')}</button>`;
  } else {
    content = `<div class="panel-heading"><span class="eyebrow">${ui.mode === 'serious' ? c().seriousPlan : ui.mode === 'kids' ? (ui.lang === 'vi' ? 'BƯỚC 2 · THỬ Ý TƯỞNG' : 'STEP 2 · MAKE A PLAN') : (ui.lang === 'vi' ? 'MỘT THÍ NGHIỆM NHỎ' : 'A LITTLE EXPERIMENT')}</span><h2>${ui.mode === 'kids' ? (ui.kidsStep === 1 ? c().kidsBuild : c().kidsTry) : c().plan}</h2><p>${c().planHint}</p></div>
      ${settingsControl('shutter')}${settingsControl('mirror')}
      <div class="instruction-heading"><span>${ui.lang === 'vi' ? 'Thứ tự các bước' : 'The order matters'}</span><small>${ui.lang === 'vi' ? 'Di chuyển bằng ↑ ↓' : 'Reorder with ↑ ↓'}</small></div>${instructions()}
      ${ui.mode === 'kids' && ui.kidsStep === 1 ? `<button class="primary" data-action="kids-next">${c().kidsReady}${icon('arrow')}</button>` : `<button class="primary run-button" data-action="run" ${ui.running ? 'disabled' : ''}>${icon('light')}<span>${ui.running ? c().running : c().run}</span>${!ui.running ? icon('arrow') : ''}</button>`}
      ${ui.mode === 'kids' && ui.kidsStep === 2 ? `<button class="text-button" data-action="kids-back">← ${c().back}</button>` : ''}
      ${ui.mode === 'serious' ? `<button class="secondary counter-button" data-action="counter" ${ui.running ? 'disabled' : ''}>${icon('compass')}${c().testWeather}</button><label class="reflection-label" for="reflection">${c().justification}</label><textarea id="reflection" data-focus-key="reflection" rows="2" placeholder="${ui.lang === 'vi' ? 'Viết ý tưởng bằng tiếng Anh…' : 'Put your reasoning into words…'}" lang="en">${escape(ui.reflection)}</textarea><small class="fine-print">${c().justificationHint}</small>` : ''}
      <button class="text-button hint-button" data-action="hint">${icon('book')}${c().hint}</button>${ui.showHint ? `<div class="language-hint">${c().beforeHint}</div>` : ''}`;
  }
  return `<aside class="plan-panel" aria-label="${c().plan}">${ui.mode === 'kids' ? `<div class="kids-progress" aria-label="${ui.lang === 'vi' ? 'Tiến trình' : 'Steps'}">${[0, 1, 2].map((n) => `<span class="${n === ui.kidsStep ? 'active' : n < ui.kidsStep ? 'done' : ''}">${n < ui.kidsStep ? '✓' : n + 1}</span>`).join('<i></i>')}</div>` : ''}${content}</aside>`;
}

function resultPanel() {
  if (ui.running) return `<section class="outcome running-outcome" role="status">${icon('compass')}<div><strong>${c().running}</strong><p lang="en">${instruction(ui.step || plan.order[0], plan)}</p></div></section>`;
  if (!ui.showResult || !state.lastResult) return `<section class="nim-message"><span class="nim-avatar" aria-hidden="true">✦</span><div><strong>${ui.lang === 'vi' ? 'Nim đã sẵn sàng thử ý tưởng của bạn.' : 'Nim is ready to try your idea.'}</strong><p>${ui.lang === 'vi' ? 'Không cần vội. Ở đây, bạn có thể thay đổi suy nghĩ.' : 'Take your time. There is room here to change your mind.'}</p></div><span class="handwritten">${ui.lang === 'vi' ? 'thử, rồi khám phá' : 'try, then wonder'}</span></section>`;
  const message = feedback(state.lastResult, ui.lang);
  const replayLabel = state.weather === 'clear' ? c().more : ui.lang === 'vi' ? 'Trở lại khi trời trong' : 'Return to a clear evening';
  return `<section class="outcome ${state.lastResult.success ? 'success' : 'retry'}" aria-live="polite" data-result="${state.lastResult.code}">${icon(state.lastResult.success ? 'star' : 'compass')}<div><strong>${message.title}</strong><p>${message.body}</p>${state.lastResult.success ? `<button class="text-button" data-action="weather">${replayLabel} ${icon('arrow')}</button>` : ''}</div></section>`;
}

function transferPanel() {
  if (!state.discoveries.length) return '';
  return `<section class="transfer-panel"><div><span class="eyebrow">${ui.lang === 'vi' ? 'THỬ Ở MỘT NƠI MỚI' : 'TAKE THE IDEA SOMEWHERE NEW'}</span><h2>${c().transferTitle}</h2><p>${c().transfer}</p></div><form id="transfer-form"><label for="transfer" lang="en">${c().transferPrompt}</label><div class="transfer-input"><input id="transfer" name="answer" data-focus-key="transfer" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="${c().transferLabel}" placeholder="…" value="${escape(ui.transferDraft)}" lang="en" required maxlength="32"/><button class="secondary" type="submit">${c().transferCheck}${icon('arrow')}</button></div>${state.transfer ? `<p class="transfer-response" role="status" data-correct="${state.transfer.correct}">${state.transfer.correct ? c().transferSuccess : c().transferRetry}</p>` : ''}</form></section>`;
}

function dialog() {
  if (!ui.dialog) return '';
  if (ui.dialog === 'journal') return `<dialog aria-labelledby="dialog-title" class="journal-dialog"><button class="close-button" data-action="dismiss" aria-label="${c().close}">×</button><span class="eyebrow">${c().journal}</span><h2 id="dialog-title">${c().journalTitle}</h2><div class="journal-discoveries">${['stars', 'flowers'].map((name) => `<div class="journal-discovery ${state.discoveries.includes(name) ? 'found' : ''}">${icon(name === 'stars' ? 'star' : 'leaf')}<strong>${c()[name]}</strong><small>${state.discoveries.includes(name) ? (ui.lang === 'vi' ? 'Đã khám phá' : 'Discovered') : '—'}</small></div>`).join('')}</div>${!state.discoveries.length ? `<p>${c().noDiscovery}</p>` : ''}<p><strong data-attempt-count="${state.attempts.length}">${state.attempts.length}</strong> ${c().attempts.toLowerCase()}</p><p class="fine-print">${c().evidence}</p>${state.attempts.length ? `<ol class="attempt-list">${state.attempts.map(attempt => `<li><span>${attempt.result.success ? '✓' : '↻'} ${attempt.plan.route === 'roof' ? c().stars : c().flowers}</span><small>${attempt.weather === 'clear' ? c().clear : c().mist}${attempt.support.translation ? ' · VI help' : ''}${attempt.support.hint ? ' · Hint' : ''}${attempt.support.counterexample ? ' · Preview' : ''}</small></li>`).join('')}</ol>` : ''}<p class="fine-print">${c().emptyReset}</p><button class="text-button reset-button" data-action="reset">${c().reset}</button></dialog>`;
  const note = notes[state.weather].find(note => note.id === ui.dialog);
  if (!note) return '';
  const translated = ui.translated.has(noteKey(note.id));
  return `<dialog aria-labelledby="dialog-title" class="note-dialog"><button class="close-button" data-action="dismiss" aria-label="${c().close}">×</button><span class="paper-note-number">${note.id === 'roof-note' ? '01' : '02'}</span><span class="eyebrow">${c().field}</span><h2 id="dialog-title" lang="en">${note.title}</h2><blockquote lang="en">${note.text}</blockquote><p class="note-signature">${note.id === 'roof-note' ? '— Iris, keeper of the skies' : '— Moss, keeper of small things'}</p>${ui.lang === 'vi' ? `<button class="text-button" data-action="translate">${translated ? c().hideTranslation : c().translate}</button>${translated ? `<p class="translation" lang="vi">${note.vi}</p>` : ''}` : ''}<button class="secondary" data-action="dismiss">${ui.lang === 'vi' ? 'Mang ý tưởng này trở lại' : 'Take this idea back'}${icon('arrow')}</button></dialog>`;
}

function render() {
  const focusKey = document.activeElement?.dataset?.focusKey;
  const selection = focusKey && typeof document.activeElement?.setSelectionRange === 'function' ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  const continuingDialog = !!app.querySelector('dialog[open]') && !!ui.dialog;
  const dialogScroll = app.querySelector('dialog[open]')?.scrollTop || 0;
  const text = c();
  const preview = ui.counterexample;
  const previewMessage = preview ? feedback(preview.result, ui.lang) : null;
  document.documentElement.lang = ui.lang === 'vi' ? 'vi' : 'en';
  document.title=t('The Atlas · A little light','Atlas · Một ánh sáng nhỏ');
  document.querySelector('[data-observatory-skip]').textContent=t('Skip to play','Đến phần chơi');
  document.querySelector('[data-observatory-return]').textContent=t('← Back to the Atlas','← Về Atlas');
  document.querySelector('[data-observatory-return]').parentElement.setAttribute('aria-label',t('Return','Quay lại'));
  document.body.className = `mode-${ui.mode} ${quiet() ? 'quiet' : ''}`;
  app.innerHTML = `<header class="site-header"><a class="brand" href="#atlas-top" aria-label="${t('The Unfolding Atlas home','Trang chủ The Unfolding Atlas')}"><img src="./assets/atlas-mark.svg" alt="" width="39" height="39"/><span>The Unfolding <em>Atlas</em><small>${t('A little light, a new discovery','Ánh sáng nhỏ, khám phá mới')}</small></span></a><div class="header-actions"><button class="journal-button" data-action="journal">${icon('book')}<span>${text.journal}</span><i class="journal-count">${state.discoveries.length}</i></button><button class="icon-button motion-button" data-action="motion" aria-label="${quiet() ? text.living : text.settings}" title="${quiet() ? text.living : text.settings}" aria-pressed="${quiet()}">${icon('settings')}</button><label class="language-picker"><span class="sr-only">${t('Guidance language','Ngôn ngữ hướng dẫn')}</span><select id="language" aria-label="${t('Guidance language','Ngôn ngữ hướng dẫn')}"><option value="en" ${ui.lang === 'en' ? 'selected' : ''}>English</option><option value="vi" ${ui.lang === 'vi' ? 'selected' : ''}>Tiếng Việt</option></select></label></div></header>
    <main><div class="journey-line"><span>${icon('compass')}${text.journey}</span><span class="chapter-number">${text.chapter}</span></div>
    <section class="introduction"><div><h1>${text.title.replace('\n', '<br/>')}</h1><p>${text.subtitle}</p></div><div class="mode-picker"><span class="eyebrow">${ui.lang === 'vi' ? 'CÁCH BẠN MUỐN CHƠI' : 'YOUR WAY TO PLAY'}</span><div class="mode-tabs" role="group" aria-label="Experience mode">${Object.keys(text.modes).map(mode => `<button data-action="mode" data-value="${mode}" aria-pressed="${ui.mode === mode}">${text.modes[mode]}</button>`).join('')}</div><p>${text.modeDetails[ui.mode]}</p></div></section>
    <section class="adventure" id="play-space" tabindex="-1" aria-label="The folded observatory"><div class="world-column"><div class="world-heading"><div><span class="location-dot"></span><strong>${ui.lang === 'vi' ? 'Đài quan sát gấp giấy' : 'The folded observatory'}</strong></div><span class="weather">${icon('sun')}${state.weather === 'clear' ? text.clear : text.mist}</span></div>
      <div class="world-stage ${ui.running ? 'is-running' : ''}">${scene({ plan, frame: ui.frame, weather: state.weather, discoveries: state.discoveries, running: ui.running, step: ui.step })}
      <button class="hotspot note-hotspot roof-note" data-action="note" data-value="roof-note" aria-label="${text.note}: ${notes[state.weather][0].title}"><span>${ui.inspected.has(noteKey('roof-note')) ? '✓' : '1'}</span>${icon('book')}</button>
      <button class="hotspot note-hotspot garden-note" data-action="note" data-value="garden-note" aria-label="${text.note}: ${notes[state.weather][1].title}"><span>${ui.inspected.has(noteKey('garden-note')) ? '✓' : '2'}</span>${icon('book')}</button>
      <button class="hotspot tool-hotspot mirror-hotspot" data-action="toggle" data-command="mirror" aria-label="${text.direction}: ${text[plan.mirror]}" ${ui.running ? 'disabled' : ''}>${icon('mirror')}<span>${text.mirror}<small>${text[plan.mirror]}</small></span><i>↻</i></button>
      <button class="hotspot tool-hotspot shutter-hotspot" data-action="toggle" data-command="shutter" aria-label="${text.shutter}: ${text[plan.shutter]}" ${ui.running ? 'disabled' : ''}>${icon('shutter')}<span>${text.shutter}<small>${text[plan.shutter]}</small></span><i>↻</i></button>
      <div class="scene-caption"><span>FIG. 01</span><span>${ui.lang === 'vi' ? 'Ánh sáng có thể đi nhiều đường.' : 'There is more than one way to let the light in.'}</span></div></div>
      <div class="discovery-heading"><span class="eyebrow">${text.goal}</span><span>${state.discoveries.length} / 2 ${ui.lang === 'vi' ? 'khám phá' : 'discoveries'}</span></div>${goalCards()}
      ${ui.mode === 'serious' ? `<div class="evidence-heading">${icon('book')}<strong>${text.seriousSources}</strong></div>${sources(true)}` : `<div class="field-strip">${icon('book')}<span>${text.source}</span><small>${notes[state.weather].filter(note => ui.inspected.has(noteKey(note.id))).length}/2 ${text.heard}</small><button data-action="note" data-value="${plan.route === 'roof' ? 'roof-note' : 'garden-note'}" aria-label="${text.note}">↗</button></div>`}
      ${resultPanel()}</div>${panel()}</section>
    ${preview ? `<section class="counterexample" role="status"><strong>${ui.lang === 'vi' ? 'Xem thử' : 'Preview'}: ${preview.weather === 'clear' ? text.clear : text.mist}</strong><p>${preview.result.success ? (ui.lang === 'vi' ? 'Kế hoạch này sẽ thành công trong thời tiết được xem thử.' : 'This plan would succeed in the previewed weather.') : `${previewMessage.title} ${previewMessage.body}`}</p><small>${text.counterHint}</small></section>` : ''}
    ${transferPanel()}
    <footer><details class="visit-details"><summary>${t('About this visit','Về chuyến thăm này')}</summary><p>${t('This light puzzle starts fresh when you reload. It does not change your saved learning progress.','Câu đố ánh sáng bắt đầu lại khi tải trang. Tiến trình học đã lưu của bạn không thay đổi.')}</p></details><button class="footer-motion text-button" data-action="motion" aria-pressed="${quiet()}">${icon('settings')}${quiet() ? text.living : text.settings}</button><span>${ui.lang === 'vi' ? 'Không cần vội. Cứ tò mò.' : 'No rush. Stay curious.'} ${icon('star')}</span></footer></main>${dialog()}`;
  for (const element of app.querySelectorAll('button[data-action], select[id], input[id], textarea[id]')) {
    if (element.dataset.focusKey) continue;
    const region = element.closest('dialog') ? 'dialog' : element.closest('.world-stage') ? 'scene' : element.closest('.plan-panel') ? 'panel' : element.closest('footer') ? 'footer' : 'page';
    const identity = element.dataset.action === 'move' ? `${element.closest('.instruction').dataset.command}:${element.dataset.delta}` : `${element.dataset.command || ''}:${element.dataset.value || ''}`;
    element.dataset.focusKey = element.id || `${region}:${element.dataset.action}:${identity}`;
  }
  const restoreFocus = () => {
    if (!focusKey) return;
    let field = [...app.querySelectorAll('[data-focus-key]')].find(element => element.dataset.focusKey === focusKey);
    if (field?.disabled) field = field.closest('.instruction')?.querySelector('button:not(:disabled)');
    field?.focus({ preventScroll: true });
    if (selection && typeof field?.setSelectionRange === 'function') field.setSelectionRange(...selection);
  };
  const opened = app.querySelector('dialog');
  if (opened) {
    opened.showModal();
    if (continuingDialog) { restoreFocus(); opened.scrollTop = dialogScroll; }
    opened.addEventListener('cancel', event => { event.preventDefault(); ui.dialog = null; render(); restoreDialogFocus(); });
    opened.addEventListener('click', event => { if (event.target === opened) { const r = opened.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) { ui.dialog = null; render(); restoreDialogFocus(); } } });
  } else { restoreFocus(); if (resumeRun) { const resume = resumeRun; resumeRun = null; later(resume, quiet() ? 35 : 150); } }
}

function later(callback, delay) {
  const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
  timers.add(timer);
}

function run() {
  if (ui.running) return;
  const snapshot = structuredClone(plan);
  const support = { mode: ui.mode, guidanceLanguage: ui.lang, hint: ui.hint, translation: [...ui.translationUsed].some(key => key.startsWith(state.weather + ':')), counterexample: ui.counterUsed, notesViewed: notes[state.weather].filter(note => ui.inspected.has(noteKey(note.id))).map(note => note.id), sourcesExposed: notes[state.weather].filter(note => ui.exposedSources.has(noteKey(note.id))).map(note => note.id) };
  const result = evaluatePlan(snapshot, state.weather);
  ui.running = true; ui.showResult = false; ui.counterexample = null;
  let index = 0;
  const advance = () => {
    // Reading a source must not be interrupted by an animation-driven re-render.
    if (ui.dialog) { resumeRun = advance; return; }
    if (index < result.steps.length) {
      ui.frame = result.steps[index]; ui.step = result.steps[index].command; index++;
      render(); later(advance, quiet() ? 35 : 650);
    } else {
      state = recordAttempt(state, snapshot, support);
      ui.running = false; ui.frame = null; ui.step = null; ui.showResult = true; render();
    }
  };
  advance();
}

app.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const { action, value, command } = button.dataset;
  if (ui.running && !['mode', 'note', 'journal', 'dismiss', 'motion', 'translate'].includes(action)) return;
  if (action === 'mode') { ui.mode = value; }
  else if (action === 'route') { plan = { ...plan, route: value }; ui.showResult = false; ui.counterexample = null; }
  else if (action === 'setting' || action === 'toggle') {
    const next = action === 'setting' ? value : command === 'shutter' ? (plan.shutter === 'open' ? 'closed' : 'open') : (plan.mirror === 'sky' ? 'path' : 'sky');
    plan = { ...plan, [command]: next }; ui.showResult = false; ui.counterexample = null;
  } else if (action === 'move') {
    const index = Number(button.dataset.index); const next = index + Number(button.dataset.delta);
    if (next < 0 || next >= plan.order.length) return;
    const order = [...plan.order]; [order[index], order[next]] = [order[next], order[index]];
    plan = { ...plan, order }; ui.showResult = false; ui.counterexample = null;
  } else if (action === 'note') { ui.dialog = value; ui.returnFocus = button.dataset.focusKey; ui.inspected.add(noteKey(value)); ui.exposedSources.add(noteKey(value)); }
  else if (action === 'dismiss') { ui.dialog = null; }
  else if (action === 'translate') { const key = noteKey(ui.dialog); if (ui.translated.has(key)) ui.translated.delete(key); else { ui.translated.add(key); ui.translationUsed.add(key); } }
  else if (action === 'journal') { ui.dialog = 'journal'; ui.returnFocus = button.dataset.focusKey; }
  else if (action === 'hint') { ui.hint = true; ui.showHint = !ui.showHint; }
  else if (action === 'kids-next') { ui.kidsStep = Math.min(2, ui.kidsStep + 1); }
  else if (action === 'kids-back') { ui.kidsStep = 1; }
  else if (action === 'motion') { ui.quiet = !ui.quiet; }
  else if (action === 'counter') { const weather = getNextWeather(state); ui.counterexample = { weather, result: evaluatePlan(plan, weather) }; ui.counterUsed = true; }
  else if (action === 'weather') {
    state = { ...state, weather: getNextWeather(state), lastResult: null };
    ui.showResult = false; ui.hint = false; ui.showHint = false; ui.counterexample = null; ui.counterUsed = false; ui.kidsStep = 0;
  } else if (action === 'reset') {
    state = createState(); plan = { route: 'roof', shutter: 'open', mirror: 'sky', order: ['shutter', 'light', 'mirror'] };
    ui.dialog = null; ui.inspected.clear(); ui.exposedSources.clear(); ui.translated.clear(); ui.translationUsed.clear(); ui.kidsStep = 0; ui.showResult = false; ui.hint = false; ui.showHint = false; ui.counterexample = null; ui.counterUsed = false; ui.reflection = ''; ui.transferDraft = '';
  } else if (action === 'run') { run(); return; }
  render();
  if (action === 'dismiss') restoreDialogFocus();
});
app.addEventListener('change', event => { if (event.target.id === 'language') { ui.lang = writeGuidance(event.target.value); render(); } });
app.addEventListener('input', event => { if (event.target.id === 'reflection') ui.reflection = event.target.value; if (event.target.id === 'transfer') ui.transferDraft = event.target.value; });
app.addEventListener('submit', event => { if (event.target.id === 'transfer-form') { event.preventDefault(); state = applyTransfer(state, ui.transferDraft.trim().toLowerCase()); render(); } });
media.addEventListener('change', render);
addEventListener('pagehide', event => { if (!event.persisted) for (const timer of timers) clearTimeout(timer); });
render();
