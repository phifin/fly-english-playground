// Owner-side read-only activation receipt. Uses the installed official CLI's
// account and network clients; never exports credentials or impersonates a player.
import { createRequire } from 'node:module';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudConfig } from '../public-config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = cloudConfig.firebase.projectId;
const allowedCodes = new Set(['EACCES', 'EPERM', 'ENOENT', 'ECONNREFUSED', 'ECONNRESET',
  'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ABORT_ERR', 'UND_ERR_CONNECT_TIMEOUT',
  'PERMISSION_DENIED', 'UNAUTHENTICATED', 'UNAVAILABLE', 'DEADLINE_EXCEEDED']);

export function safeFailure(error) {
  const result = { status: 'unverified', error: 'request-failed' };
  const seen = new Set();
  let candidate = error;
  for (let depth = 0; candidate && depth < 5 && !seen.has(candidate); depth++) {
    seen.add(candidate);
    if (allowedCodes.has(candidate.code)) result.error = candidate.code;
    for (const value of [candidate.status, candidate.statusCode, candidate.context?.response?.statusCode]) {
      if (Number.isInteger(value) && value >= 400 && value <= 599) result.httpStatus = value;
    }
    candidate = candidate.original || candidate.cause;
  }
  return result;
}

export function rulesHash(source) {
  return createHash('sha256').update(source.replace(/\r\n/g, '\n').trim()).digest('hex');
}

export function ownerFlags(fields) {
  return { approved: fields?.approved?.booleanValue === true,
    familyOwner: fields?.familyOwner?.booleanValue === true };
}

async function installedCli() {
  const candidates = [];
  if (process.env.APPDATA) candidates.push(join(process.env.APPDATA, 'npm/node_modules/firebase-tools'));
  candidates.push(join(dirname(process.execPath), 'node_modules/firebase-tools'));
  if (process.env.LOCALAPPDATA) {
    const cache = join(process.env.LOCALAPPDATA, 'npm-cache/_npx');
    try {
      for (const entry of await readdir(cache, { withFileTypes: true })) {
        if (entry.isDirectory()) candidates.push(join(cache, entry.name, 'node_modules/firebase-tools'));
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  try { candidates.push(dirname(createRequire(import.meta.url).resolve('firebase-tools/package.json'))); }
  catch { /* A separately installed official CLI is also supported. */ }
  const found = [];
  for (const directory of new Set(candidates)) {
    try {
      const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (pkg.name !== 'firebase-tools' || !/^\d+\.\d+\.\d+$/.test(pkg.version) || Number(pkg.version.split('.')[0]) < 15) continue;
      await access(join(directory, 'lib/auth.js'));
      found.push({ directory, version: pkg.version });
    } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error; }
  }
  found.sort((a, b) => b.version.localeCompare(a.version, 'en', { numeric: true }));
  return found[0];
}

export async function verifyActivation(report) {
  if (project !== 'unfolding-atlas-phifin') throw new Error('Unexpected configured project.');
  report.localRulesSha256 = rulesHash(await readFile(join(root, 'cloud/firestore.rules'), 'utf8'));
  report.stage = 'locate-official-cli';
  const installed = await installedCli();
  if (!installed) { report.failure = { status: 'unverified', error: 'official-cli-unavailable' }; return; }
  report.cliVersion = installed.version;
  const vendor = createRequire(join(installed.directory, 'package.json'));
  vendor('./lib/logger.js').logger.silent = true;
  const auth = vendor('./lib/auth.js');
  const options = { cwd: join(root, 'cloud'), project, nonInteractive: true };
  report.stage = 'existing-cli-account';
  if (process.env.FIREBASE_TOKEN) {
    report.failure = { status: 'unverified', error: 'existing-cli-account-required' }; return;
  }
  const account = auth.selectAccount(undefined, options.cwd);
  if (!account?.user?.email) {
    report.failure = { status: 'unverified', error: 'existing-cli-account-unavailable' }; return;
  }
  auth.setActiveAccount(options, account);
  await vendor('./lib/requireAuth.js').requireAuth(options);
  report.cliAccountAvailable = true;
  const rules = vendor('./lib/gcp/rules.js');
  report.stage = 'production-rules-readback';
  const releaseName = `projects/${project}/releases/cloud.firestore`;
  const releases = await rules.listAllReleases(project);
  const release = releases.find(item => item.name === releaseName);
  if (!release) report.rules = { verified: false, status: 'no-default-release' };
  else {
    const files = await rules.getRulesetContent(release.rulesetName);
    const source = files?.length === 1 && typeof files[0].content === 'string' ? files[0].content : null;
    report.rules = { verified: source !== null, release: releaseName,
      sha256: source === null ? null : rulesHash(source),
      matchesLocal: source !== null && rulesHash(source) === report.localRulesSha256 };
  }
  // Bounded role-only query. No user directory, learner profiles/history,
  // ID-token minting, token exchange or mutation is performed.
  report.stage = 'owner-role-readback';
  const { Client } = vendor('./lib/apiv2.js');
  const api = vendor('./lib/api.js');
  const db = new Client({ urlPrefix: api.firestoreOrigin(), apiVersion: 'v1', auth: true });
  const response = await db.post(`projects/${project}/databases/(default)/documents:runQuery`, {
    structuredQuery: {
      select: { fields: [{ fieldPath: 'approved' }, { fieldPath: 'familyOwner' }] },
      from: [{ collectionId: 'access' }],
      where: { fieldFilter: { field: { fieldPath: 'familyOwner' }, op: 'EQUAL', value: { booleanValue: true } } },
      limit: 10,
    },
  }, { timeout: 10000, retries: 0, skipLog: { reqBody: true, resBody: true } });
  if (!Array.isArray(response.body)) throw new Error('Unexpected owner query response.');
  const records = response.body.filter(item => item.document).map(item => ownerFlags(item.document.fields));
  report.ownerRoles = { verified: true, ownerRecordCount: records.length,
    approvedOwnerRecordCount: records.filter(item => item.approved && item.familyOwner).length,
    boundedAt: 10, identitiesChecked: false };
  report.passed = report.rules?.matchesLocal === true && report.ownerRoles.approvedOwnerRecordCount > 0;
  report.stage = 'complete';
}

async function main() {
  const report = { checkedAt: new Date().toISOString(), project, passed: false,
    method: 'official-cli-read-only-admin-apis', cliAccountAvailable: false,
    liveGoogleSignInVerified: false, liveClientSyncVerified: false };
  let finished = false;
  async function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    const json = `${JSON.stringify(report, null, 2)}\n`;
    // Only this constructed allowlist report is persisted. Never vendor logs.
    await writeFile(join(root, 'artifacts/firebase-activation-verification.json'), json).catch(() => {});
    process.stdout.write(json, () => process.exit(report.passed ? 0 : 1));
  }
  const timer = setTimeout(() => {
    report.failure = { status: 'unverified', error: 'DEADLINE_EXCEEDED' };
    void finish();
  }, 30000);
  try { await verifyActivation(report); }
  catch (error) { report.failure = safeFailure(error); }
  await finish();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
