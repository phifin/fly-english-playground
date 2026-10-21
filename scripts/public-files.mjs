import { extname } from 'node:path';

export const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
const rootFiles = new Set(['index.html', 'observatory.html', 'styles.css', 'atlas.css', 'public-config.js', 'sw.js', 'offline-manifest.json', 'build-report.json']);
const assetTypes = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff2', '.mp3', '.ogg', '.wav']);

export function isPublicRelative(relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.includes('\0')
      || relative.split('/').some(segment => !segment || segment === '..' || segment.startsWith('.'))) return false;
  if (rootFiles.has(relative)) return true;
  if (relative.startsWith('src/')) return extname(relative) === '.js';
  if (relative.startsWith('assets/')) return assetTypes.has(extname(relative).toLowerCase());
  if (relative.startsWith('data/published/')) return ['.json', '.mp3', '.ogg', '.wav'].includes(extname(relative).toLowerCase());
  return false;
}

export function contentSecurityPolicy(config = null, { header = false } = {}) {
  const enabled = config?.enabled === true;
  const authDomain = config?.firebase?.authDomain || '';
  if (enabled && !/^[a-z0-9-]+\.firebaseapp\.com$/.test(authDomain)) throw new Error('Use the project’s default Firebase authDomain before enabling cloud.');
  const directives = [
    "default-src 'self'",
    `script-src 'self'${enabled ? ' https://www.gstatic.com/firebasejs/ https://apis.google.com' : ''}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'",
    `connect-src 'self'${enabled ? ' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com' : ''}`,
    `frame-src ${enabled ? `https://${authDomain} https://accounts.google.com` : "'none'"}`,
    "worker-src 'self'", "media-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
  ];
  if (header) directives.push("frame-ancestors 'none'");
  return directives.join('; ');
}
