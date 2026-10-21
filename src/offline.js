/** Register only a built static release; development has no stale service worker. */
export async function registerOffline({ onUpdate = () => {}, onReady = () => {} } = {}) {
  if (!globalThis.document?.querySelector('meta[name="atlas-release"]')
      || !globalThis.navigator?.serviceWorker || !globalThis.isSecureContext) return null;
  const url = new URL('../sw.js', import.meta.url);
  const scope = new URL('../', import.meta.url);
  const registration = await navigator.serviceWorker.register(url, { scope: scope.pathname, updateViaCache: 'none' });
  navigator.serviceWorker.ready.then(active=>{if(active.scope===new URL(scope.pathname,location.origin).href)onReady();}).catch(()=>{});
  const notify = () => {
    if (registration.waiting && navigator.serviceWorker.controller) {
      onUpdate({ activate: () => registration.waiting?.postMessage({ type: 'ACTIVATE_UPDATE' }) });
    }
  };
  notify();
  registration.addEventListener('updatefound', () => {
    registration.installing?.addEventListener('statechange', notify);
  });
  return registration;
}
