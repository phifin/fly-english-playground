import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assertSupportedSchema, validateSchema, validateTrial, validDate, extractTraceEvidence } from '../scripts/validate-trial.mjs';

const schema = JSON.parse(await readFile(new URL('../experiments/luna-trial/schema.json', import.meta.url), 'utf8'));
const submitted = JSON.parse(await readFile(new URL('../experiments/luna-trial/staging/dataset.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);
const rejects = (name, mutate, rule) => test(name, () => {
  const data = clone(submitted);
  mutate(data);
  const result = validateTrial(schema, data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.rule === rule), JSON.stringify(result.errors));
});

test('actual disposable submission satisfies structure and independently reviewed snapshot', () => {
  assertSupportedSchema(schema);
  assert.deepEqual(validateTrial(schema, submitted).errors, []);
});
rejects('missing root field', data => { delete data.batchId; }, 'required');
rejects('missing nested Vietnamese explanation', data => { delete data.records[0].explanation.vi; }, 'required');
rejects('extra root field', data => { data.unexpected = true; }, 'additionalProperties');
rejects('extra nested field', data => { data.records[0].explanation.html = '<script>'; }, 'additionalProperties');
rejects('wrong constant', data => { data.status = 'production'; }, 'const');
rejects('null source object', data => { data.sources[0] = null; }, 'type');
rejects('wrong field type', data => { data.records[0].prompt = 5; }, 'type');
rejects('wrong item type', data => { data.records[0].acceptedAnswers[0] = false; }, 'type');
rejects('too few records', data => { data.records.pop(); }, 'minItems');
rejects('too many records', data => { data.records.push(clone(data.records[0])); }, 'maxItems');
rejects('no sources', data => { data.sources = []; }, 'minItems');
rejects('too many sources', data => { data.sources.push(clone(data.sources[0]), clone(data.sources[0])); }, 'maxItems');
rejects('string below minimum length', data => { data.sources[0].finding = 'short'; }, 'minLength');
rejects('string above maximum length', data => { data.records[0].prompt = 'x'.repeat(161); }, 'maxLength');
rejects('invalid ID pattern', data => { data.records[0].id = 'other-item'; }, 'pattern');
rejects('duplicate accepted answers', data => { data.records[0].acceptedAnswers.push('is'); }, 'uniqueItems');
rejects('duplicate source references', data => { data.records[0].sourceIds.push('source-1'); }, 'uniqueItems');
rejects('missing referenced source', data => { data.records[0].sourceIds = ['source-2']; }, 'missing-source-reference');
rejects('duplicate record IDs', data => { data.records[1].id = data.records[0].id; }, 'exact-unique-record-ids');
rejects('duplicate source IDs', data => { data.sources.push(clone(data.sources[0])); }, 'unique-source-ids');
rejects('swapped answers despite valid JSON structure', data => {
  [data.records[0].acceptedAnswers, data.records[1].acceptedAnswers] = [data.records[1].acceptedAnswers, data.records[0].acceptedAnswers];
}, 'reviewed-answer-mismatch');
rejects('both forms in an answer set', data => { data.records[0].acceptedAnswers.push('are'); }, 'one-is-or-are-answer');
rejects('same form for both records', data => { data.records[1].acceptedAnswers = ['is']; }, 'one-is-and-one-are');
rejects('no gap', data => { data.records[0].prompt = data.records[0].prompt.replace('___', 'is'); }, 'exactly-one-gap');
rejects('two gaps', data => { data.records[0].prompt += ' ___'; }, 'exactly-one-gap');
rejects('four underscores do not form an exact gap', data => { data.records[0].prompt = data.records[0].prompt.replace('___', '____'); }, 'exactly-one-gap');
rejects('changed explanation requires new review', data => { data.records[0].explanation.vi += ' changed'; }, 'fresh-content-review-required');
rejects('non-leap calendar date', data => { data.sources[0].accessed = '2026-02-29'; }, 'format:date');
rejects('impossible day', data => { data.sources[0].accessed = '2026-04-31'; }, 'format:date');
rejects('date-time is not date', data => { data.sources[0].accessed = '2026-10-16T00:00:00Z'; }, 'format:date');
rejects('future date relative to historical trial', data => { data.sources[0].accessed = '2026-10-20'; }, 'after-historical-trial-date');
rejects('HTTP violates source URL pattern', data => { data.sources[0].url = 'http://example.org'; }, 'pattern');
rejects('malformed HTTPS URI', data => { data.sources[0].url = 'https://'; }, 'format:uri');
rejects('whitespace in URI', data => { data.sources[0].url = 'https://example.org/a b'; }, 'format:uri');
rejects('malformed percent escape', data => { data.sources[0].url = 'https://example.org/%GG'; }, 'format:uri');
rejects('credentials in source URL', data => { data.sources[0].url = 'https://name:secret@example.org/'; }, 'credentials-not-allowed');

test('unsupported keywords and formats fail closed rather than passing silently', () => {
  assert.throws(() => validateSchema({ type: 'string', enum: ['is'] }, 'is'), /unsupported schema keyword enum/u);
  assert.throws(() => validateSchema({ type: 'string', format: 'email' }, 'a@b'), /unsupported schema format/u);
  const changed = clone(schema);
  changed.properties.records.items.properties.prompt.description = 'new unsupported annotation';
  assert.throws(() => assertSupportedSchema(changed), /unsupported schema keyword description/u);
});
test('dialect, schema types and malformed constraints are checked', () => {
  assert.throws(() => assertSupportedSchema({ $schema: 'https://example.org/schema' }), /dialect/u);
  assert.throws(() => assertSupportedSchema({ type: 'number' }), /schema type/u);
  assert.throws(() => assertSupportedSchema({ type: 'string', minLength: -1 }), /minLength/u);
  assert.throws(() => assertSupportedSchema({ type: 'string', pattern: '[' }), SyntaxError);
});
test('formats handle leap-year century boundaries', () => {
  for (const date of ['2024-02-29', '2000-02-29', '2026-10-16']) assert.equal(validDate(date), true);
  for (const date of ['1900-02-29', '2026-00-01', '2026-13-01', '2026-10-00', '2026-1-01']) assert.equal(validDate(date), false);
});
test('string lengths count Unicode code points', () => {
  assert.deepEqual(validateSchema({ type: 'string', minLength: 1, maxLength: 1 }, '😀'), []);
});

test('trace projection preserves evidence but strips unrelated conversation/config values', () => {
  const url = submitted.sources[0].url;
  const events = [
    { type: 'session_meta', timestamp: '2026-10-16T09:20:44.878Z', payload: {
      id: '01a14403-8886-7b13-b98b-4f59d34511cf', cli_version: '0.163.0', secret: 'DO_NOT_EXPORT',
      source: { subagent: { thread_spawn: { parent_thread_id: '01a143d4-b0de-7f53-a090-a9b923a5a24e', agent_path: '/root/luna_e2e_trial' } } },
    } },
    { type: 'turn_context', payload: { model: 'gpt-6-luna', effort: 'max', privateConfig: 'DO_NOT_EXPORT' } },
    ...['search_query', 'open'].flatMap((operation, index) => [
      { type: 'response_item', payload: { type: 'custom_tool_call', call_id: `call-${index}`, input: `tools.web__run({${operation}:[]})` } },
      { type: 'response_item', payload: { type: 'custom_tool_call_output', call_id: `call-${index}`, output: [
        { text: `Script completed\n${url}\nContent type: text/html; Total lines: 144\nWe use there is for singular nouns and there are for plural nouns.` },
      ] } },
    ]),
  ];
  const projected = extractTraceEvidence(events, url);
  delete projected.retrievedSourceText;
  assert.equal(projected.runtime.effectiveModel, 'gpt-6-luna');
  assert.equal(projected.runtime.effectiveEffort, 'max');
  assert.equal(projected.tools.every(tool => tool.success), true);
  assert.equal(JSON.stringify(projected).includes('DO_NOT_EXPORT'), false);
  const wrongModel = clone(events);
  wrongModel[1].payload.model = 'other-model';
  assert.throws(() => extractTraceEvidence(wrongModel, url), /effective model/u);
  const failedRetrieval = clone(events);
  failedRetrieval.at(-1).payload.output = [{ text: 'Script completed\nInternal Error' }];
  assert.throws(() => extractTraceEvidence(failedRetrieval, url), /success not established/u);
  assert.throws(() => extractTraceEvidence([], url), /Missing runtime metadata/u);
  const wrongLineage = clone(events);
  wrongLineage[0].payload.source.subagent.thread_spawn.parent_thread_id = 'unrelated-parent';
  assert.throws(() => extractTraceEvidence(wrongLineage, url), /Unexpected task lineage/u);
});

test('saved evidence pins the actual contract and output files without changing historical dates', async () => {
  const evidence = JSON.parse(await readFile(new URL('../experiments/luna-trial/evidence.json', import.meta.url), 'utf8'));
  assert.equal(evidence.historicalTrialDate, '2026-10-16');
  assert.equal(evidence.inspectionDate, '2026-10-20');
  assert.equal(submitted.sources[0].accessed, '2026-10-16');
  assert.equal(evidence.runtime.effectiveModel, 'gpt-6-luna');
  assert.equal(evidence.runtime.effectiveEffort, 'max');
  assert.equal(evidence.traceReference.rawTraceCopied, false);
  assert.equal(evidence.filesystem.productionIntegration, false);
  assert.equal(evidence.tools.every(tool => tool.success), true);
  assert.equal(evidence.fileInventory.length, 4);
  for (const file of evidence.fileInventory) {
    assert.ok(file.path.startsWith('experiments/luna-trial/'));
    const bytes = await readFile(new URL(`../${file.path}`, import.meta.url));
    assert.equal(file.bytes, bytes.length);
    assert.equal(file.sha256, createHash('sha256').update(bytes).digest('hex'));
  }
});
