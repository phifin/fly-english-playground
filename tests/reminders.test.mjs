import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calendarReminder, localCalendarDate, validateReminder, REMINDER_APP_URL } from '../src/reminders.js';
const base = { id: 'test-opaque-123', days: [1, 3, 5], time: '18:00', startDate: '2026-10-31', now: new Date('2026-10-30T09:12:30Z') };
const unfold = text => text.replace(/\r\n /g, '');

test('calendar starts on the first selected weekday and preserves local wall-clock recurrence', () => {
  const result = calendarReminder(base), text = unfold(result.text);
  assert.equal(result.firstDate, '2026-11-02');
  assert.match(text, /DTSTART:20261102T180000\r\n/);
  assert.match(text, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\r\n/);
  assert.match(text, /DTSTAMP:20261030T091230Z/);
  assert.match(text, /TRIGGER:PT0M\r\nACTION:DISPLAY/);
  assert.equal(text.includes('TZID'), false);
  assert.equal(text.includes('ATTENDEE'), false);
  assert.equal(result.type, 'text/calendar;charset=utf-8');
});

test('local calendar helper uses local calendar fields rather than UTC day', () => {
  const now = new Date(2026, 0, 2, 0, 30);
  assert.equal(localCalendarDate(now), '2026-01-02');
  assert.throws(() => localCalendarDate(new Date('invalid')), RangeError);
});

test('weekday validation rejects duplicates, missing days, coercion and bad times', () => {
  for (const days of [[], [1, 1], [7], [-1], ['1'], [1.5], null]) assert.throws(() => validateReminder({ days, time: '18:00' }), RangeError);
  for (const time of ['24:00', '12:60', '9:00', '12:00\r\nACTION:EMAIL', '', null]) assert.throws(() => validateReminder({ days: [1], time }), RangeError);
  assert.deepEqual(validateReminder({ days: [5, 0, 2], time: '00:00' }), { days: [0, 2, 5], time: '00:00' });
});

test('invalid calendar dates, revisions, language and identifiers cannot enter the calendar', () => {
  for (const startDate of ['2026-02-29', '2026-04-31', '2026-13-01', '1900-01-01', '2026-1-01', 'no']) assert.throws(() => calendarReminder({ ...base, startDate }), RangeError);
  for (const id of ['', 'name@example.com', 'x\r\nEND:VEVENT', 'x'.repeat(81), null]) assert.throws(() => calendarReminder({ ...base, id }), RangeError);
  for (const sequence of [-1, 0.5, '1', 2147483648]) assert.throws(() => calendarReminder({ ...base, sequence }), RangeError);
  assert.throws(() => calendarReminder({ ...base, language: 'fr' }), RangeError);
  assert.throws(() => calendarReminder({ ...base, now: new Date('bad') }), RangeError);
  assert.equal(calendarReminder({ ...base, startDate: '2028-02-29', days: [2] }).firstDate, '2028-02-29');
});

test('safe deep links cannot leak credentials, redirect or inject calendar properties', () => {
  for (const appUrl of ['http://phifin.github.io/fly-english-playground/', 'https://evil.example/', `${REMINDER_APP_URL}?token=private`, `${REMINDER_APP_URL}#private`, `${REMINDER_APP_URL}\r\nACTION:EMAIL`, 'https://user:pass@phifin.github.io/fly-english-playground/']) assert.throws(() => calendarReminder({ ...base, appUrl }));
  assert.match(unfold(calendarReminder({ ...base, appUrl: `${REMINDER_APP_URL}?learn=today` }).text), /URL:https:\/\/phifin.github.io\/fly-english-playground\/\?learn=today/);
});

test('Vietnamese calendar text remains NFC and UTF-8-safe within RFC folding limits', () => {
  const result = calendarReminder({ ...base, language: 'vi' });
  for (const line of result.text.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.equal(result.text.replace(/\r\n/g, '').includes('\n'), false);
  assert.equal(result.text.normalize('NFC'), result.text);
  assert.match(unfold(result.text), /Một chút tiếng Anh/);
  assert.match(unfold(result.text), /thuận tiện/);
  assert.match(unfold(result.text), /\\nhttps:/);
  assert.equal(result.text.includes('\ufffd'), false);
});

test('stable reminders keep their UID on edits and update only the explicit sequence', () => {
  const first = calendarReminder(base).text, next = calendarReminder({ ...base, time: '19:00', sequence: 2 }).text;
  assert.equal(first.match(/UID:([^\r]+)/)[1], next.match(/UID:([^\r]+)/)[1]);
  assert.match(next, /SEQUENCE:2/);
});

test('manifest stays inside the GitHub Pages project and references an existing local icon', async () => {
  const manifest = JSON.parse(await readFile(new URL('../assets/atlas.webmanifest', import.meta.url), 'utf8'));
  const manifestUrl = `${REMINDER_APP_URL}assets/atlas.webmanifest`;
  for (const field of ['id', 'scope', 'start_url']) assert.equal(new URL(manifest[field], manifestUrl).href, REMINDER_APP_URL);
  assert.equal(manifest.display, 'standalone');
  assert.match(await readFile(new URL('../assets/atlas-mark.svg', import.meta.url), 'utf8'), /<svg/);
});
