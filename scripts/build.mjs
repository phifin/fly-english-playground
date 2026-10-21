import { mkdir, readdir, readFile, writeFile, lstat, rm } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve, join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isPublicRelative, contentSecurityPolicy } from './public-files.mjs';
import {acceptedContent} from './publish-content.mjs';
import {acceptedBoards} from './boards.mjs';
import {contentHash} from './content.mjs';
import { validCloudConfig } from '../src/cloud.js';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const hash = body => createHash('sha256').update(body).digest('hex');

async function inventory(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not public build inputs: ${prefix}${entry.name}`);
    if (entry.isDirectory()) result.push(...await inventory(path, `${prefix}${entry.name}/`));
    else if (entry.isFile()) result.push(`${prefix}${entry.name}`);
    else throw new Error(`Unsupported public build input: ${prefix}${entry.name}`);
  }
  return result;
}

export async function build({ sourceRoot = defaultRoot, config = null } = {}) {
  sourceRoot = resolve(sourceRoot);
  if(sourceRoot===resolve(defaultRoot)){
    const accepted=await acceptedContent(),actual=JSON.parse(await readFile(join(sourceRoot,'data/published/atlas.json'),'utf8'));
    if(contentHash(accepted)!==contentHash(actual))throw new Error('Published learning data is not the reviewed library.');
    const worlds=await acceptedBoards(actual.missions),published=JSON.parse(await readFile(join(sourceRoot,'data/published/boards.json'),'utf8'));
    if(contentHash(worlds)!==contentHash(published))throw new Error('Published boards are not reviewed.');
  }
  const destination = resolve(sourceRoot, 'dist');
  if (dirname(destination) !== sourceRoot || relative(sourceRoot, destination) !== 'dist') throw new Error('Unsafe build destination.');
  try { if ((await lstat(destination)).isSymbolicLink()) throw new Error('dist must not be a symbolic link.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!config) config = (await import(`${pathToFileURL(join(sourceRoot, 'public-config.js')).href}?build=${Date.now()}`)).cloudConfig;
  if (config?.enabled === true && !validCloudConfig(config)) throw new Error('Enabled cloud configuration must be complete and internally consistent before publishing.');
  const paths = [];
  for (const rootFile of ['index.html', 'observatory.html', 'styles.css', 'atlas.css', 'public-config.js', 'sw.js']) {
    try {
      const info = await lstat(join(sourceRoot, rootFile));
      if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Public root must be a regular file: ${rootFile}`);
      paths.push(rootFile);
    } catch (error) { if (error.code !== 'ENOENT' || ['index.html', 'styles.css', 'public-config.js', 'sw.js'].includes(rootFile)) throw error; }
  }
  for (const directory of ['src', 'assets', 'data/published']) {
    try {
      const parts = directory.split('/');
      for (let index = 1; index <= parts.length; index++) {
        if ((await lstat(join(sourceRoot, ...parts.slice(0, index)))).isSymbolicLink()) throw new Error(`Public parent must not be a symlink: ${directory}`);
      }
      const info = await lstat(join(sourceRoot, directory));
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Public directory must not be a symlink: ${directory}`);
      paths.push(...await inventory(join(sourceRoot, directory), `${directory}/`));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const files = new Map();
  for (const path of paths.sort()) {
    if (!isPublicRelative(path)) throw new Error(`Unexpected file in a public input directory: ${path}`);
    const body = await readFile(join(sourceRoot, path));
    if (path.endsWith('.json')) JSON.parse(body.toString('utf8'));
    files.set(path, body);
  }
  const releaseId = hash([...files].map(([path, body]) => `${path}:${hash(body)}`).join('\n')).slice(0, 20);
  for (const path of ['index.html', 'observatory.html'].filter(path => files.has(path))) {
    let html = files.get(path).toString('utf8');
    html = html.replace(/<meta\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
    const policy = contentSecurityPolicy(config).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    html = html.replace('</head>', `    <meta name="atlas-release" content="${releaseId}" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`);
    files.set(path, Buffer.from(html));
  }
  files.set('sw.js', Buffer.from(files.get('sw.js').toString('utf8').replaceAll('__ATLAS_RELEASE_ID__', releaseId)));
  const js = [...files].filter(([path]) => path.endsWith('.js'));
  const report = {
    format: 'atlas-static-esm-v1', releaseId,
    javascriptBytes: js.reduce((total, [, body]) => total + body.length, 0),
    javascriptGzipBytes: js.reduce((total, [, body]) => total + gzipSync(body).length, 0),
    publishedPacks: [...files.keys()].filter(path => path.startsWith('data/published/') && path.endsWith('.json')).length,
    publicDirectories: ['src', 'assets', 'data/published'], stagingIncluded: false, cloudConfigured: config?.enabled === true,
  };
  files.set('build-report.json', Buffer.from(JSON.stringify(report, null, 2)));
  const cached = [...files].filter(([path]) => path !== 'sw.js').map(([path, body]) => ({ path, bytes: body.length, sha256: hash(body) }));
  if (cached.reduce((total, entry) => total + entry.bytes, 0) > 50 * 1024 * 1024) throw new Error('Offline release exceeds the 50 MiB cache budget. Split optional media before publishing.');
  files.set('offline-manifest.json', Buffer.from(JSON.stringify({ schemaVersion: 1, releaseId, files: cached }, null, 2)));

  let previous = [];
  try { previous = await inventory(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const path of previous) if (!isPublicRelative(path)) throw new Error(`Unexpected file in dist: ${path}. Inspect it before building.`);
  await mkdir(destination, { recursive: true });
  for (const path of previous.filter(path => !files.has(path))) {
    const target = resolve(destination, path);
    if (!target.startsWith(destination + sep)) throw new Error('Unsafe stale output path.');
    await rm(target); // Individual verified generated files only; never recursive.
  }
  for (const [path, body] of files) {
    await mkdir(dirname(join(destination, path)), { recursive: true });
    await writeFile(join(destination, path), body);
  }
  console.log(`Static release ${releaseId}: ${files.size} files, ${report.javascriptGzipBytes} gzip JavaScript bytes. Staging/private files excluded.`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
