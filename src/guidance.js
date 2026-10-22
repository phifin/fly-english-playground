// This arrival preference contains no learner data. A traveler's saved language
// always takes precedence after selection; blocked storage never prevents play.
export const GUIDANCE_KEY = 'atlas-guidance-language';
export function readGuidance(storage, browserLanguage = globalThis.navigator?.language) {
  try { const saved = (storage ?? globalThis.localStorage)?.getItem(GUIDANCE_KEY); if (saved === 'en' || saved === 'vi') return saved; } catch { /* Optional browser shortcut. */ }
  return /^vi(?:-|$)/i.test(browserLanguage ?? '') ? 'vi' : 'en';
}
export function writeGuidance(language, storage) {
  if (!['en', 'vi'].includes(language)) throw new RangeError('Unsupported guidance language.');
  try { (storage ?? globalThis.localStorage)?.setItem(GUIDANCE_KEY, language); } catch { /* The active preference remains usable in memory. */ }
  return language;
}
