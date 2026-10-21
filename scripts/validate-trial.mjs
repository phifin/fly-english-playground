// A fail-closed validator for this disposable contract's subset, not a general
// JSON Schema implementation. No external dependencies, fetching, or inference.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const supportedKeywords = Object.freeze([
  '$schema', 'title', 'type', 'additionalProperties', 'required', 'properties',
  'const', 'minItems', 'maxItems', 'items', 'uniqueItems', 'minLength',
  'maxLength', 'pattern', 'format',
]);
const keywordSet = new Set(supportedKeywords);
const root = new URL('../', import.meta.url);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);
const pointer = value => value.replaceAll('~', '~0').replaceAll('/', '~1');

export function assertSupportedSchema(schema, at = '#') {
  if (!object(schema)) throw new Error(`${at}: only object schemas are supported`);
  for (const key of Object.keys(schema)) {
    if (!keywordSet.has(key)) throw new Error(`${at}: unsupported schema keyword ${key}`);
  }
  if (own(schema, '$schema') && schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    throw new Error(`${at}: unsupported schema dialect`);
  }
  if (own(schema, 'title') && typeof schema.title !== 'string') throw new Error(`${at}: invalid title`);
  if (own(schema, 'type') && !['object', 'array', 'string'].includes(schema.type)) {
    throw new Error(`${at}: unsupported schema type`);
  }
  if (own(schema, 'additionalProperties') && schema.additionalProperties !== false) {
    throw new Error(`${at}: only additionalProperties:false is supported`);
  }
  if (own(schema, 'required') && (!Array.isArray(schema.required)
    || schema.required.some(key => typeof key !== 'string')
    || new Set(schema.required).size !== schema.required.length)) throw new Error(`${at}: invalid required`);
  if (own(schema, 'properties')) {
    if (!object(schema.properties)) throw new Error(`${at}: invalid properties`);
    for (const [key, child] of Object.entries(schema.properties)) {
      assertSupportedSchema(child, `${at}/properties/${pointer(key)}`);
    }
  }
  if (own(schema, 'items')) assertSupportedSchema(schema.items, `${at}/items`);
  for (const key of ['minItems', 'maxItems', 'minLength', 'maxLength']) {
    if (own(schema, key) && (!Number.isSafeInteger(schema[key]) || schema[key] < 0)) {
      throw new Error(`${at}: invalid ${key}`);
    }
  }
  if (own(schema, 'uniqueItems') && typeof schema.uniqueItems !== 'boolean') throw new Error(`${at}: invalid uniqueItems`);
  if (own(schema, 'pattern')) {
    if (typeof schema.pattern !== 'string') throw new Error(`${at}: invalid pattern`);
    new RegExp(schema.pattern, 'u');
  }
  if (own(schema, 'format') && !['date', 'uri'].includes(schema.format)) {
    throw new Error(`${at}: unsupported schema format ${schema.format}`);
  }
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

function validUri(value) {
  // The contract uses HTTPS source URLs. Assert absolute ASCII URI syntax and
  // reject URL-parser repairs such as whitespace, malformed escapes or slashes.
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value)
    || /[^\x21-\x7e]|[<>"{}|\\^`]/u.test(value) || /%(?![\dA-Fa-f]{2})/u.test(value)) return false;
  try {
    const url = new URL(value);
    return !['http:', 'https:'].includes(url.protocol) || /^https?:\/\/[^/]+/u.test(value) && Boolean(url.hostname);
  } catch { return false; }
}

export function validateSchema(schema, data) {
  assertSupportedSchema(schema);
  const errors = [];
  const fail = (path, rule) => errors.push({ path, rule });
  function visit(spec, value, path) {
    if (own(spec, 'const') && !isDeepStrictEqual(value, spec.const)) fail(path, 'const');
    const matchesType = !spec.type || (spec.type === 'object' ? object(value)
      : spec.type === 'array' ? Array.isArray(value) : typeof value === 'string');
    if (!matchesType) { fail(path, 'type'); return; }
    if (object(value)) {
      for (const key of spec.required ?? []) if (!own(value, key)) fail(`${path}/${pointer(key)}`, 'required');
      if (spec.additionalProperties === false) {
        for (const key of Object.keys(value)) if (!own(spec.properties ?? {}, key)) fail(`${path}/${pointer(key)}`, 'additionalProperties');
      }
      for (const [key, child] of Object.entries(spec.properties ?? {})) {
        if (own(value, key)) visit(child, value[key], `${path}/${pointer(key)}`);
      }
    }
    if (Array.isArray(value)) {
      if (own(spec, 'minItems') && value.length < spec.minItems) fail(path, 'minItems');
      if (own(spec, 'maxItems') && value.length > spec.maxItems) fail(path, 'maxItems');
      if (spec.uniqueItems && value.some((item, index) => value.slice(0, index).some(previous => isDeepStrictEqual(item, previous)))) fail(path, 'uniqueItems');
      if (spec.items) value.forEach((item, index) => visit(spec.items, item, `${path}/${index}`));
    }
    if (typeof value === 'string') {
      const length = Array.from(value).length; // JSON Schema counts Unicode code points.
      if (own(spec, 'minLength') && length < spec.minLength) fail(path, 'minLength');
      if (own(spec, 'maxLength') && length > spec.maxLength) fail(path, 'maxLength');
      if (own(spec, 'pattern') && !new RegExp(spec.pattern, 'u').test(value)) fail(path, 'pattern');
      if (spec.format === 'date' && !validDate(value)) fail(path, 'format:date');
      if (spec.format === 'uri' && !validUri(value)) fail(path, 'format:uri');
    }
  }
  visit(schema, data, '#');
  return errors;
}

// Parent review of the actual two submitted records, not a grammar inference
// engine. A changed prompt/explanation requires fresh review rather than silently
// inheriting approval. Only hashes of existing text are kept here.
const reviewed = {
  'trial-item-01': {
    answer: 'is', prompt: '3075a01494969a4c133bc2a67195746936c4489d1f3b14e2eb746824d9e7fcb5',
    en: '56220fcd74644404996c5c00804a3bd535b773b07c1388b4aa178311221586a4',
    vi: '5bd105a37192904b7c9a0d7c5dee980090afecc07a6420745ce775b41fb44820',
  },
  'trial-item-02': {
    answer: 'are', prompt: 'cb149887197baed997f330a8ea9c3963411b31675db610f58c58269727e59c28',
    en: '4a7a513f2e17b97784233eba1fa7e734f210bc039cd646ffdae8b7a2bd6c0a5f',
    vi: '68caa66fa39ccbee619fa8c45f077442f95380e290a56fdf2be46c3a78df2478',
  },
};

export function validateTrial(schema, data) {
  const errors = validateSchema(schema, data);
  if (errors.length) return { valid: false, errors, semanticReview: 'not-run-structural-errors' };
  const fail = (path, rule) => errors.push({ path, rule });
  const ids = data.records.map(record => record.id);
  if (new Set(ids).size !== 2 || !Object.keys(reviewed).every(id => ids.includes(id))) fail('#/records', 'exact-unique-record-ids');
  const sourceIds = new Set(data.sources.map(source => source.id));
  if (sourceIds.size !== data.sources.length) fail('#/sources', 'unique-source-ids');
  data.sources.forEach((source, index) => {
    if (source.accessed > '2026-10-16') fail(`#/sources/${index}/accessed`, 'after-historical-trial-date');
    const url = new URL(source.url);
    if (url.username || url.password) fail(`#/sources/${index}/url`, 'credentials-not-allowed');
  });
  const answerCounts = { is: 0, are: 0 };
  data.records.forEach((record, index) => {
    const path = `#/records/${index}`;
    if ((record.prompt.match(/___/gu) ?? []).length !== 1 || record.prompt.replace('___', '').includes('_')) fail(`${path}/prompt`, 'exactly-one-gap');
    const answers = record.acceptedAnswers.map(answer => answer.trim().toLowerCase());
    if (answers.length !== 1 || !['is', 'are'].includes(answers[0])) fail(`${path}/acceptedAnswers`, 'one-is-or-are-answer');
    if (answers.length === 1 && own(answerCounts, answers[0])) answerCounts[answers[0]]++;
    for (const source of record.sourceIds) if (!sourceIds.has(source)) fail(`${path}/sourceIds`, 'missing-source-reference');
    const review = reviewed[record.id];
    if (review) {
      if (answers.some(answer => answer !== review.answer)) fail(`${path}/acceptedAnswers`, 'reviewed-answer-mismatch');
      for (const [field, value] of [['prompt', record.prompt], ['en', record.explanation.en], ['vi', record.explanation.vi]]) {
        if (sha256(value) !== review[field]) fail(`${path}/${field === 'prompt' ? field : `explanation/${field}`}`, 'fresh-content-review-required');
      }
    }
  });
  if (answerCounts.is !== 1 || answerCounts.are !== 1) fail('#/records', 'one-is-and-one-are');
  return { valid: errors.length === 0, errors, semanticReview: 'trial-specific-reviewed-snapshot' };
}

function outputText(event) {
  const output = event?.payload?.output;
  return typeof output === 'string' ? output : Array.isArray(output)
    ? output.filter(part => typeof part.text === 'string').map(part => part.text).join('\n') : '';
}

export function extractTraceEvidence(events, sourceUrl) {
  const meta = events.find(event => event.type === 'session_meta');
  const contexts = events.filter(event => event.type === 'turn_context');
  if (!meta || !contexts.length) throw new Error('Missing runtime metadata');
  const spawn = meta.payload?.source?.subagent?.thread_spawn;
  if (meta.payload.id !== '01a14403-8886-7b13-b98b-4f59d34511cf'
    || spawn?.parent_thread_id !== '01a143d4-b0de-7f53-a090-a9b923a5a24e'
    || spawn.agent_path !== '/root/luna_e2e_trial') throw new Error('Unexpected task lineage');
  if (contexts.some(event => event.payload.model !== 'gpt-6-luna' || event.payload.effort !== 'max')) throw new Error('Unexpected effective model/effort');
  const responses = events.filter(event => event.type === 'response_item');
  const calls = responses.filter(event => event.payload.type === 'custom_tool_call');
  const outputs = responses.filter(event => event.payload.type === 'custom_tool_call_output');
  function toolEvidence(operation) {
    const call = calls.find(event => event.payload.input.includes('tools.web__run')
      && new RegExp(`\\b${operation}\\s*:`).test(event.payload.input));
    const output = outputs.find(event => event.payload.call_id === call?.payload.call_id);
    const text = outputText(output);
    const completed = text.includes('Script completed') && !/Internal Error|Script failed|isError["']?\s*:\s*true/iu.test(text);
    const success = Boolean(call && output && completed && text.includes(sourceUrl)
      && (operation !== 'open' || text.includes('Content type: text/html') && text.includes('Total lines:')));
    return { operation, callId: call?.payload.call_id ?? null, requestedAt: call?.timestamp ?? null,
      completedAt: output?.timestamp ?? null, success, sourceUrl, text };
  }
  const search = toolEvidence('search_query');
  const open = toolEvidence('open');
  if (!search.success || !open.success) throw new Error('Search/retrieval success not established by trace');
  const rawText = open.text;
  if (!rawText.includes('We use there is for singular nouns and there are for plural nouns.')) throw new Error('Retrieved reference does not establish the submitted grammar finding');
  const cleanTool = ({ text: ignored, ...safe }) => safe;
  return {
    runtime: { sessionId: meta.payload.id, parentThreadId: spawn.parent_thread_id,
      agentPath: spawn.agent_path, cliVersion: meta.payload.cli_version,
      sessionStartedAt: meta.timestamp, effectiveModel: contexts[0].payload.model,
      effectiveEffort: contexts[0].payload.effort, metadataObservedAt: contexts[0].timestamp },
    tools: [cleanTool(search), cleanTool(open)],
    retrievedSourceText: rawText, // Ephemeral: explicitly removed before evidence serialization.
  };
}

export async function inspectTrial({ tracePath, inspectionDate = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDate(inspectionDate)) throw new Error('Invalid inspection date');
  if (inspectionDate < '2026-10-16') throw new Error('Inspection cannot precede the historical trial');
  const schema = JSON.parse(await readFile(new URL('experiments/luna-trial/schema.json', root), 'utf8'));
  const data = JSON.parse(await readFile(new URL('experiments/luna-trial/staging/dataset.json', root), 'utf8'));
  const validation = validateTrial(schema, data);
  if (!tracePath) return { inspectionDate, batchId: data.batchId, validator: 'trial-subset-not-production-json-schema', ...validation };
  if (!validation.valid) throw new Error(`Trial validation failed: ${JSON.stringify(validation.errors)}`);
  const traceBytes = await readFile(tracePath);
  const events = traceBytes.toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
  const trace = extractTraceEvidence(events, data.sources[0].url);
  const normalize = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const retrieved = normalize(trace.retrievedSourceText);
  const review = data.records.map(record => ({ id: record.id, intendedAnswer: reviewed[record.id].answer,
    englishExplanation: 'reviewed-correct-for-this-bounded-task', vietnameseExplanation: 'reviewed-consistent-with-English',
    explicitNumberCue: record.id === 'trial-item-01' ? 'one; singular count noun' : 'six; plural count noun',
    completedPromptDuplicatedInRetrievedPage: retrieved.includes(normalize(record.prompt.replace('___', reviewed[record.id].answer))),
  }));
  if (review.some(record => record.completedPromptDuplicatedInRetrievedPage)) throw new Error('An exact example overlap requires further review');
  const files = [];
  for (const path of ['experiments/luna-trial/request.md', 'experiments/luna-trial/schema.json',
    'experiments/luna-trial/staging/dataset.json', 'experiments/luna-trial/staging/research-notes.md']) {
    const bytes = await readFile(new URL(path, root));
    files.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const notes = await readFile(new URL('experiments/luna-trial/staging/research-notes.md', root), 'utf8');
  return {
    evidenceVersion: 'trial-evidence-1', batchId: data.batchId, inspectionDate,
    historicalTrialDate: '2026-10-16', outcome: 'ordinary-run-pass-disposable-only',
    requestedSettings: { model: 'gpt-6-luna', reasoningEffort: 'max' },
    runtime: trace.runtime, tools: trace.tools,
    traceReference: { filename: basename(tracePath), sha256: sha256(traceBytes), rawTraceCopied: false },
    fileInventory: files,
    workerSelfReport: { runtimeIdentityNotClaimedAsProof: notes.includes('cannot verify the executing model or effort'),
      successfulResearchClaimed: notes.includes('search and page open both succeeded'),
      schemaValidationNotRunClaimed: notes.includes('Schema validation: not run') },
    independentValidation: { ...validation, schemaKeywordsChecked: supportedKeywords,
      scope: 'All keywords used by the unchanged trial schema; not full JSON Schema conformance',
      records: data.records.length, sources: data.sources.length, contentReview: review,
      originalityLimit: 'No exact completed-example overlap in the retrieved reference page; not an exhaustive originality or rights audit' },
    filesystem: { writeMechanismObserved: 'tools.exec_command; PowerShell WriteAllText',
      observedOutputPaths: files.filter(file => file.path.includes('/staging/')).map(file => file.path),
      stagingOnlyBoundary: 'worker instruction, not an isolated filesystem sandbox',
      productionIntegration: false, publicBuildCopiesTrial: false },
    untested: ['interruption recovery', 'retry/repair cycle', 'native custom-role discovery',
      'strict child filesystem isolation', 'bulk content reliability', 'production content quality', 'usage/cost projection'],
    workflow: 'One authorized trial only; manual Luna handoff remains active; no production protocol change approved',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const allowed = new Set(['--trace', '--inspection-date', '--write-evidence']);
    const options = {};
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (!allowed.has(arg)) throw new Error(`Unknown argument ${arg}`);
      if (arg === '--write-evidence') options.write = true;
      else {
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
        options[arg === '--trace' ? 'tracePath' : 'inspectionDate'] = value;
      }
    }
    if (options.write && !options.tracePath) throw new Error('--write-evidence requires --trace');
    const report = await inspectTrial(options);
    if (options.write) await writeFile(new URL('experiments/luna-trial/evidence.json', root), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(options.tracePath ? { batchId: report.batchId, outcome: report.outcome,
      records: report.independentValidation.records, evidenceWritten: Boolean(options.write) } : report, null, 2));
    if (report.valid === false) process.exitCode = 1;
  } catch (error) { console.error(`Trial validation failed: ${error.message}`); process.exitCode = 1; }
}
