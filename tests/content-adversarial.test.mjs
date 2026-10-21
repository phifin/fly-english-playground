import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePack, coverage } from '../scripts/content.mjs';
import { assess } from '../src/learning.js';

// Reuse the actual bounded Luna delivery. These mutations are invalid test inputs,
// not newly generated educational records or accepted production content.
const sample = JSON.parse(await readFile(new URL('../data/staging/launch-sample/pack.json', import.meta.url), 'utf8'));
const activity = (pack, type) => pack.missions.flatMap(mission => mission.activities).find(item => item?.type === type);
function rejects(name, mutate) {
  test(name, () => {
    const input = structuredClone(sample);
    mutate(input);
    let errors;
    assert.doesNotThrow(() => { errors = validatePack(input); }, 'Malformed content needs a validation report, not an uncaught exception');
    assert.ok(Array.isArray(errors) && errors.length > 0, 'Malformed content must be rejected');
    assert.ok(errors.every(error => typeof error === 'string' && error.length > 0));
  });
}

test('actual staged sample validates before adversarial mutation', () => {
  assert.deepEqual(validatePack(sample), []);
  for (const type of ['choice', 'gap', 'order', 'match', 'writing']) assert.ok(activity(sample, type), `Missing ${type} test coverage`);
});
rejects('null activity does not crash aggregate scans', pack => { pack.missions[0].activities[0] = null; });
rejects('numeric activity does not crash aggregate scans', pack => { pack.missions[0].activities[0] = 3; });
rejects('numeric activity ID produces a report', pack => { pack.missions[0].activities[0].id = 12; });
rejects('null activity ID produces a report', pack => { pack.missions[0].activities[0].id = null; });
rejects('numeric gap prompt produces a report', pack => { activity(pack, 'gap').prompt = 12; });
rejects('object gap prompt produces a report', pack => { activity(pack, 'gap').prompt = {}; });
rejects('missing activity type produces a report', pack => { delete pack.missions[0].activities[0].type; });
for (const type of ['unknown-widget', 'constructor', '__proto__', 'toString']) {
  rejects(`unsupported dispatch type ${type} is rejected safely`, pack => { pack.missions[0].activities[0].type = type; });
}
rejects('four underscores do not count as one exact gap', pack => { const item = activity(pack, 'gap'); item.prompt = item.prompt.replace('___', '____'); });
rejects('additional underscored gap is rejected', pack => { activity(pack, 'gap').prompt += ' ___'; });
rejects('missing gap is rejected', pack => { const item = activity(pack, 'gap'); item.prompt = item.prompt.replace('___', ''); });
rejects('impossible calendar date is rejected', pack => { pack.provenance[0].accessed = '2026-02-30'; });
rejects('century non-leap date is rejected', pack => { pack.provenance[0].accessed = '1900-02-29'; });
rejects('future source date is rejected', pack => { pack.provenance[0].accessed = '9999-12-31'; });
rejects('credential-bearing source URL is rejected', pack => { pack.provenance[0].url = 'https://name:secret@example.org/'; });
rejects('non-HTTPS reference is rejected', pack => { pack.provenance[0].url = 'javascript:alert(1)'; });
rejects('missing source relationship is rejected', pack => { pack.missions[0].sources = ['missing-source']; });
rejects('null provenance entry is rejected safely', pack => { pack.provenance[0] = null; });
rejects('null mission is rejected safely', pack => { pack.missions[0] = null; });
rejects('missing activity array is rejected safely', pack => { delete pack.missions[0].activities; });
rejects('submitted approval field is rejected', pack => { pack.approved = true; });
rejects('unsupported activity field is rejected', pack => { pack.missions[0].activities[0].execute = 'arbitrary-code'; });
rejects('unsupported translation locale is rejected', pack => { pack.missions[0].title.fr = 'Unexpected locale'; });
rejects('unsupported option field is rejected', pack => { activity(pack, 'choice').options[0].onclick = 'arbitrary-code'; });
rejects('duplicate globally scoped identifiers are rejected', pack => { pack.missions[1].id = pack.missions[0].id; });
rejects('duplicate option text after normalization is rejected', pack => {
  const item = activity(pack, 'choice'); item.options[1].text = ` ${item.options[0].text.toUpperCase()} `;
});
rejects('attribute-breaking option ID is rejected', pack => {
  const item = activity(pack, 'choice'), previous = item.options[0].id;
  item.options[0].id = 'x" onfocus="x'; if (item.answer === previous) item.answer = item.options[0].id;
});
rejects('attribute-breaking token ID is rejected', pack => {
  const item = activity(pack, 'order'), previous = item.tokens[0].id;
  item.tokens[0].id = 'x" data-action="next';
  item.answer = item.answer.map(id => id === previous ? item.tokens[0].id : id);
  if (item.alternatives) item.alternatives = item.alternatives.map(order => order.map(id => id === previous ? item.tokens[0].id : id));
});
rejects('attribute-breaking matching ID is rejected', pack => { activity(pack, 'match').pairs[0].id = 'x" autofocus="x'; });
rejects('null nested option yields a report', pack => { activity(pack, 'choice').options[0] = null; });
rejects('null nested token yields a report', pack => { activity(pack, 'order').tokens[0] = null; });
rejects('null nested matching pair yields a report', pack => { activity(pack, 'match').pairs[0] = null; });
rejects('unknown author choice key is rejected', pack => { activity(pack, 'choice').answer = 'not-an-option'; });
rejects('empty accepted gap answer list is rejected', pack => { activity(pack, 'gap').accepted = []; });
rejects('non-string accepted gap answer yields a report', pack => { activity(pack, 'gap').accepted = [{}]; });
rejects('duplicate normalized gap answers are rejected', pack => {
  const item = activity(pack, 'gap'); item.accepted = [item.accepted[0], ` ${item.accepted[0].toUpperCase()} `];
});
rejects('incomplete author ordering is rejected', pack => { activity(pack, 'order').answer.pop(); });
rejects('repeated token in author ordering is rejected', pack => { const item = activity(pack, 'order'); item.answer[1] = item.answer[0]; });
rejects('invalid alternative ordering is rejected', pack => { activity(pack, 'order').alternatives = [null]; });
rejects('duplicate matching right side is rejected', pack => { const item = activity(pack, 'match'); item.pairs[1].right = item.pairs[0].right; });
rejects('writing model rejected by real runtime completion is not accepted by shape alone', pack => { activity(pack, 'writing').example = 'Short'; });
rejects('missing writing rubric translation is rejected', pack => { delete activity(pack, 'writing').rubric[0].vi; });

test('all delivered author keys and listed order alternatives work in the actual learning engine', () => {
  for (const item of sample.missions.flatMap(mission => mission.activities)) {
    const answer = item.type === 'choice' ? item.answer : item.type === 'gap' ? item.accepted[0]
      : item.type === 'order' ? item.answer : item.type === 'match' ? Object.fromEntries(item.pairs.map(pair => [pair.id, pair.id]))
        : { text: item.example, checks: item.rubric.map((_, index) => index) };
    const result = assess(item, answer);
    assert.equal(result.complete, true, item.id);
    assert.equal(result.correct, item.type === 'writing' ? null : true, item.id);
    for (const alternative of item.type === 'order' ? item.alternatives ?? [] : []) assert.equal(assess(item, alternative).correct, true, item.id);
  }
});
test('coverage can accompany an invalid report without crashing on missing/nested data', () => {
  for (const pack of [null, {}, { missions: null }, { missions: [null, { activities: null }, { activities: [null] }] }]) {
    assert.doesNotThrow(() => coverage(pack));
  }
});
test('coverage dictionaries cannot pollute prototypes through malformed category names', () => {
  const before = Object.getOwnPropertyDescriptors(Object.prototype);
  const report = coverage({ missions: [{ level: '__proto__', activities: [{ type: 'constructor', skill: '__proto__' }] }] });
  assert.equal(Object.getPrototypeOf(report.levels), null);
  assert.equal(Object.getPrototypeOf(report.types), null);
  assert.equal(Object.getPrototypeOf(report.skills), null);
  assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before);
});
