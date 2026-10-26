// Static public files only. Private records live in IndexedDB, outside this cache.
const RELEASE_ID = '__ATLAS_RELEASE_ID__';
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `atlas-static:${encodeURIComponent(SCOPE.pathname)}:`;
const CACHE_NAME = `${CACHE_PREFIX}${RELEASE_ID}`;
const MANIFEST_URL = new URL('offline-manifest.json', SCOPE).href;
let manifestPromise;

function safePublicPath(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.includes('?') || path.includes('#')
      || path.split('/').some(part => !part || part.startsWith('.'))) return false;
  return /^(index\.html|observatory\.html|styles\.css|atlas\.css|public-config\.js|build-report\.json)$/.test(path)
    || /^src\/[A-Za-z0-9_./-]+\.js$/.test(path)
    || /^assets\/[A-Za-z0-9_./-]+\.(css|svg|png|jpe?g|webp|avif|gif|ico|woff2|mp3|ogg|wav)$/.test(path)
    || /^data\/published\/[A-Za-z0-9_./-]+\.(json|mp3|ogg|wav)$/.test(path);
}

function validateManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || manifest.releaseId !== RELEASE_ID
      || !Array.isArray(manifest.files) || manifest.files.length > 2000) throw new Error('Invalid offline manifest.');
  const seen = new Set();
  let bytes = 0;
  for (const entry of manifest.files) {
    if (!safePublicPath(entry.path) || seen.has(entry.path) || !/^[a-f0-9]{64}$/.test(entry.sha256)
        || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0) throw new Error('Invalid offline file.');
    seen.add(entry.path); bytes += entry.bytes;
  }
  if (!seen.has('index.html') || bytes > 50 * 1024 * 1024) throw new Error('Offline shell is missing or exceeds its cache budget.');
  return manifest;
}

async function matchesResource(response, entry) {
  if (!response.ok || response.type === 'opaque') return false;
  const buffer = await response.clone().arrayBuffer();
  if (buffer.byteLength !== entry.bytes) return false;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('') === entry.sha256;
}

function unavailable() {
  return new Response('This saved atlas release is temporarily unavailable. Close every atlas tab, then reopen while connected to install a complete update. Your learner progress is still stored separately.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store', credentials: 'omit', redirect: 'error' });
    if (!response.ok) throw new Error('Offline manifest unavailable.');
    const manifest = validateManifest(await response.clone().json());
    const cache = await caches.open(CACHE_NAME);
    try {
      // Sequential downloads bound peak decoded-memory use on older devices.
      for (const entry of manifest.files) {
        const url = new URL(entry.path, SCOPE).href;
        const resource = await fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'error' });
        if (!await matchesResource(resource, entry)) throw new Error(`Offline file failed integrity check: ${entry.path}`);
        await cache.put(url, resource);
      }
      await cache.put(MANIFEST_URL, response);
    } catch (error) { await caches.delete(CACHE_NAME); throw error; }
    // No automatic skipWaiting: an update must not replace an active lesson.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  // The UI may send this only after saving and an explicit update action.
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});

async function cachedManifest() {
  if (!manifestPromise) manifestPromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(MANIFEST_URL);
    if (!response) throw new Error('Offline manifest is not cached.');
    return validateManifest(await response.json());
  })().catch(error => { manifestPromise = null; throw error; });
  return manifestPromise;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.headers.has('authorization') || url.origin !== SCOPE.origin
      || !url.pathname.startsWith(SCOPE.pathname) || url.search) return;
  const path = url.pathname.slice(SCOPE.pathname.length) || 'index.html';
  if (!safePublicPath(path)) return;
  event.respondWith((async () => {
    try {
      const manifest = await cachedManifest();
      const entry = manifest.files.find(entry => entry.path === path);
      if (!entry) return fetch(request);
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(new URL(path, SCOPE).href);
      if (cached) return cached;
      // A partial cache loss must never combine this release's shell with a
      // newer deployment's modules or content. Recover only the exact file.
      const resource = await fetch(new URL(path, SCOPE).href, { cache: 'no-store', credentials: 'omit', redirect: 'error' });
      if (!await matchesResource(resource, entry)) return unavailable();
      try { await cache.put(new URL(path, SCOPE).href, resource.clone()); } catch { /* A verified response still works when device caching is full. */ }
      return resource;
    } catch { return unavailable(); }
    // There is deliberately no HTML fallback for missing JSON, JS, auth, or URLs.
  })());
});
