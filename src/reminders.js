// Calendar export only: this module never requests notification permission or sends push.
export const REMINDER_APP_URL = 'https://phifin.github.io/fly-english-playground/';
export const REMINDER_DEFAULTS = Object.freeze({ time: '18:00', days: Object.freeze([1, 3, 5]) });
const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function localCalendarDate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new RangeError('Invalid date.');
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function validateReminder(value) {
  if (!value || typeof value !== 'object' || typeof value.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) throw new RangeError('Choose a valid reminder time.');
  if (!Array.isArray(value.days) || value.days.length < 1 || value.days.length > 7 || value.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(value.days).size !== value.days.length) throw new RangeError('Choose one or more distinct weekdays.');
  return { time: value.time, days: [...value.days].sort((a, b) => a - b) };
}

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Use a calendar date.');
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 9998) throw new RangeError('Invalid calendar date.');
  return date;
}

function safeAppUrl(value) {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f]/.test(value)) throw new RangeError('Invalid app link.');
  const url = new URL(value);
  const trusted = new URL(REMINDER_APP_URL);
  if (url.origin !== trusted.origin || url.pathname !== trusted.pathname || url.username || url.password || url.hash || (url.search && url.search !== '?learn=today')) throw new RangeError('Use the Atlas learning link.');
  return url.href;
}

function calendarText(value) {
  return value.normalize('NFC').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC 5545 folds by UTF-8 octets, never inside a Vietnamese Unicode character.
function fold(line) {
  const encoder = new TextEncoder();
  let segment = '', bytes = 0;
  const segments = [];
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { segments.push(segment); segment = ' '; bytes = 1; }
    segment += character; bytes += size;
  }
  segments.push(segment);
  return segments.join('\r\n');
}

/** days: Sunday=0..Saturday=6. startDate: YYYY-MM-DD, interpreted as local wall time.
 * id is an opaque stable reminder ID, never a learner name/email. Downloading is not subscribing.
 */
export function calendarReminder({ id, days, time, startDate, language = 'en', appUrl = REMINDER_APP_URL, now = new Date(), sequence = 0 } = {}) {
  const settings = validateReminder({ days, time });
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new RangeError('Invalid reminder identifier.');
  if (!['en', 'vi'].includes(language)) throw new RangeError('Unsupported language.');
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 2147483647) throw new RangeError('Invalid revision.');
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new RangeError('Invalid creation time.');
  const url = safeAppUrl(appUrl);
  const first = dateOnly(startDate);
  while (!settings.days.includes(first.getUTCDay())) first.setUTCDate(first.getUTCDate() + 1);
  const title = language === 'vi' ? 'Một chút tiếng Anh · The Unfolding Atlas' : 'A little English · The Unfolding Atlas';
  const description = language === 'vi'
    ? `Học hoặc ôn tập vài phút khi thuận tiện. Bạn có thể đổi giờ hoặc xóa lời nhắc trong ứng dụng lịch.\n${url}`
    : `Learn or review for a few minutes when it suits you. Change or remove this reminder in your calendar app.\n${url}`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Unfolding Atlas//Study reminder//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:atlas-study-${id}@phifin.github.io`, `SEQUENCE:${sequence}`,
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART:${first.toISOString().slice(0, 10).replace(/-/g, '')}T${time.replace(':', '')}00`,
    'DURATION:PT10M', `RRULE:FREQ=WEEKLY;BYDAY=${settings.days.map(day => weekdays[day]).join(',')}`,
    `SUMMARY:${calendarText(title)}`, `DESCRIPTION:${calendarText(description)}`, `URL:${url}`, 'TRANSP:TRANSPARENT',
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${calendarText(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return { filename: 'atlas-study-reminder.ics', type: 'text/calendar;charset=utf-8', text: `${lines.map(fold).join('\r\n')}\r\n`, firstDate: first.toISOString().slice(0, 10) };
}
