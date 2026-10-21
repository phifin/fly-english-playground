import http from 'node:http';
import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, extname, sep, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contentTypes, isPublicRelative, contentSecurityPolicy } from './public-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export function normalizeBasePath(value = '/') {
  if (typeof value !== 'string' || !/^(?:\/[A-Za-z0-9_-]+)*\/$/.test(value)) {
    throw new Error('ATLAS_BASE_PATH must be a clean absolute directory path ending with /.');
  }
  return value;
}
export function publicPath(pathname, directory = root) {
  let path;
  try { path = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'; } catch { return null; }
  if (!isPublicRelative(path)) return null;
  const target = resolve(directory, path);
  return target.startsWith(resolve(directory) + sep) ? target : null;
}

export async function startServer({ directory = process.argv.includes('--dist') ? resolve(root, 'dist') : root, port = Number(process.env.PORT || 4173), host = '127.0.0.1', basePath = process.env.ATLAS_BASE_PATH || '/' } = {}) {
  basePath = normalizeBasePath(basePath);
  directory = await realpath(resolve(directory));
  const config = (await import(`${pathToFileURL(resolve(directory, 'public-config.js')).href}?serve=${Date.now()}`)).cloudConfig;
  const policy = contentSecurityPolicy(config, { header: true });
  const server = http.createServer(async (request, response) => {
    let url;
    try { url = new URL(request.url, 'http://127.0.0.1'); }
    catch { response.writeHead(400); response.end('Bad request'); return; }
    const pathname = url.pathname;
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end('Not found'); return; }
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) {
      response.writeHead(308, { Location: basePath + url.search }); response.end(); return;
    }
    if (!pathname.startsWith(basePath)) { response.writeHead(404); response.end('Not found'); return; }
    const target = publicPath(pathname.slice(basePath.length), directory);
    if (!target) { response.writeHead(404); response.end('Not found'); return; }
    try {
      const actual = await realpath(target);
      if (!actual.startsWith(directory + sep) || !isPublicRelative(relative(directory, actual).split(sep).join('/'))
          || (await lstat(target)).isSymbolicLink() || !(await lstat(actual)).isFile()) throw new Error('Not a public file');
      const body = await readFile(actual);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(target).toLowerCase()], 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': policy,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolveReady, reject) => { server.once('error', reject); server.listen(port, host, resolveReady); });
  console.log(`The Unfolding Atlas · http://${host}:${server.address().port}${basePath}${relative(root, directory) === 'dist' ? ' · built release' : ''}`);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startServer();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
