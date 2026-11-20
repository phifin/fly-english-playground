import test from 'node:test';
import assert from 'node:assert/strict';
import { courseUnits } from '../src/course-bank.js';

const normalize = value => value.normalize('NFC').replace(/[’‘]/g, "'").trim().toLowerCase();
const bilingual = pair => Array.isArray(pair) && pair.length === 2 && pair.every(value =>
  typeof value === 'string' && value.length > 3 && !value.includes('\uFFFD')) && pair[0] !== pair[1];

test('published grammar and everyday units have distinct prompts, bounded responses and valid prerequisite links', () => {
  const ids = new Set();
  const prompts = new Set();
  const positions = new Set();
  for (const unit of courseUnits) {
    assert.match(unit.id, new RegExp('^course-' + unit.level.toLowerCase() + '-[a-z-]+-v[1-9][0-9]*$'));
    if (unit.prerequisite) assert.ok(ids.has(unit.prerequisite), unit.id);
    assert.ok(!ids.has(unit.id));
    ids.add(unit.id);
    assert.ok(bilingual(unit.objective) && bilingual(unit.title));
    assert.ok(unit.examples.length >= 2);
    for (const entry of unit.lexicon) {
      assert.ok(['word','collocation','expression','phrasal-verb','idiom'].includes(entry.kind), entry.term);
      for (const field of ['term','en','vi','example']) assert.ok(entry[field]?.trim(), entry.term);
    }
    for (const item of unit.items) {
      assert.ok(!prompts.has(normalize(item.prompt)), item.prompt);
      prompts.add(normalize(item.prompt));
      assert.ok(bilingual(item.why), item.prompt);
      assert.ok(item.keys?.length && item.keys.every(answer => answer.trim()), item.prompt);
      if (item.options) {
        assert.ok(item.keys.every(answer => item.options.includes(answer)), item.prompt);
        assert.equal(new Set(item.options.map(normalize)).size, item.options.length);
        positions.add(item.options.indexOf(item.keys[0]));
      }
    }
  }
  assert.ok(positions.size >= 3);
});

// An editorial pass solved the final task of each unit with keys and explanations hidden.
// Letter answers refer to the option order in these preserved editions.
const anchorSheets = {
  A1: ['C','A','C','B','C','B'],
  A2: ['A','A','A','A','B','A'],
  B1: ['A','B','B','B','C','A'],
  B2: ['refunded','B','C','C','account','A'],
  C1: ['C','exclude','delay','exempt','compared','much'],
  C2: ['warrant','B','C','necessary','concede','compatible']
};

for (const [level, solutions] of Object.entries(anchorSheets)) {
  test('reviewed ' + level + ' decisions still match the first course editions', () => {
    const units = courseUnits.filter(unit => unit.level === level && unit.id.endsWith('-v1')).slice(0, 6);
    assert.equal(units.length, solutions.length);
    units.forEach((unit, ix) => {
      const item = unit.items[4];
      const solved = solutions[ix];
      const answer = item.options ? item.options['ABC'.indexOf(solved)] : solved;
      assert.ok(item.keys.map(normalize).includes(normalize(answer)), unit.id);
    });
  });
}
