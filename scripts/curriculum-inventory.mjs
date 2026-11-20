import { readFileSync, readdirSync, statSync } from 'node:fs';
import { academicSets } from '../src/academic-content.js';
import { courseUnits } from '../src/course-bank.js';
import { expressionUnits } from '../src/course-expressions.js';
import { listeningUnits } from '../src/course-listening.js';
import { littleWords } from '../src/little-content.js';
import { pictureItems } from '../src/picture-content.js';
import { pictureTopics, pictureWords } from '../src/picture-library.js';
import { placementItems } from '../src/placement-content.js';
import { applyPracticeEdition } from '../src/practice-edition.js';

const path = relative => new URL('../' + relative, import.meta.url);
const json = relative => JSON.parse(readFileSync(path(relative), 'utf8'));
const norm = word => word.normalize('NFC').replace(/’/g, "'").trim().toLowerCase();
const unique = strings => new Set(strings.map(norm)).size;
const sumItems = units => units.reduce((sum, unit) => sum + unit.items.length, 0);
const histogram = values => Object.fromEntries([...new Set(values)].sort().map(value =>
  [value, values.filter(item => item === value).length]));

const atlas = applyPracticeEdition(json('data/published/atlas.json'), json('data/published/practice-edition.json'));
const activities = atlas.missions.flatMap(m => m.activities);
const oldGlosses = Object.values(atlas.practiceEdition.support).flatMap(record => record.terms.map(t => t.text));
// These six preserved v1 sets are the complete previous accepted academic release.
const firstEdition = new Set(['roof-v1','labels-v1','courier-v1','training-v1','forms-v1','rewrites-v1']);
const oldExam = academicSets.filter(set => firstEdition.has(set.id));
const written = [...courseUnits, ...expressionUnits];
const words = written.flatMap(unit => unit.lexicon);
const oldChild = [...littleWords, ...pictureItems].map(item => item.word.en);
const newChild = [...pictureWords, ...pictureItems].map(item => item.word.en);
const referencePath = 'data/published/reference/';
const shards = readdirSync(path(referencePath)).filter(name => /^[a-z]\.json$/.test(name));
const entries = shards.flatMap(name => json(referencePath + name).entries);
const clips = listeningUnits.flatMap(unit => unit.items.flatMap(item => item.clip ? [item.clip] : []));
const voiceIDs = [...new Set(clips.map(clip => clip.id))];
const tasks = written.flatMap(unit => unit.items);
const trackStats = sets => Object.fromEntries(['ielts', 'toeic', 'toefl', 'school'].map(track => {
  const rows = sets.filter(set => set.track === track);
  const checks = rows.filter(set => set.checkpoint);
  return [track, {sets: rows.length, questions: sumItems(rows), heldOutSets: checks.length, heldOutQuestions: sumItems(checks)}];
}));

console.log(JSON.stringify({
  preserved: {
    adventureMissions: atlas.missions.length,
    adventureActivities: activities.length,
    adventureTypes: histogram(activities.map(a => a.type)),
    explicitAdventureFocusLabels: unique(activities.map(a => a.focus)),
    replacedHistoricalActivities: atlas.practiceEdition.retiredActivityIds.length,
    supportedAdventureActivities: Object.keys(atlas.practiceEdition.support).length,
    contextualGlossOccurrences: oldGlosses.length, uniqueContextualGlossLabels: unique(oldGlosses),
    placementDrawsFromLegacyItems: placementItems.length
  },
  previousEdition: {academic: trackStats(oldExam), childCards: littleWords.length, childScenes: pictureItems.length,
    uniqueIllustratedTargets: unique(oldChild), dedicatedWrittenUnits: 0, dedicatedListeningUnits: 0, dictionaryEntries: 0},
  currentEdition: {
    everyday: {coreUnits: courseUnits.length, coreQuestions: sumItems(courseUnits),
      extraExpressionUnits: expressionUnits.length, extraExpressionQuestions: sumItems(expressionUnits),
      instructionalKinds: histogram(written.map(unit => unit.kind)), modelExamples: written.reduce((sum, unit) => sum + unit.examples.length, 0),
      choice: tasks.filter(item => item.options).length, constrainedEntry: tasks.filter(item => !item.options).length,
      uniqueWrittenPrompts: unique(tasks.map(item => item.prompt)), prerequisiteLinks: written.filter(unit => unit.prerequisite).length,
      taughtGlosses: words.length, distinctTaughtLabels: unique(words.map(word => word.term)),
      distinctTaughtByKind: Object.fromEntries([...new Set(words.map(w => w.kind))].sort().map(kind =>
        [kind, unique(words.filter(w => w.kind === kind).map(w => w.term))])),
      glossLabelsIncludingAdventure: unique([...oldGlosses, ...words.map(w => w.term)])},
    listening: {sets: listeningUnits.length, questions: sumItems(listeningUnits), preparedSoundFiles: voiceIDs.length,
      preparedBytes: voiceIDs.reduce((n, id) => n + statSync(path('assets/listening/' + id + '.mp3')).size, 0),
      recordedSentenceQuestions: clips.length, deviceMessages: listeningUnits.filter(u => u.script).length},
    children: {pictureCards: pictureWords.length, cardThemes: pictureTopics.length, legacyPictureScenes: pictureItems.length,
      distinctIllustratedTargets: unique(newChild)},
    reference: {selectedEntries: entries.length, distinctLabels: unique(entries.map(e => e.term)),
      multiword: entries.filter(e => /\s/.test(e.term)).length, examples: entries.filter(e => e.example?.trim()).length,
      lexicalUnionByWrittenLabel: unique([...entries.map(e => e.term), ...newChild, ...oldGlosses, ...words.map(w => w.term)])},
    academic: trackStats(academicSets),
    byLevel: Object.fromEntries(['A1','A2','B1','B2','C1','C2'].map(level => {
      const writing = written.filter(unit => unit.level === level);
      const listening = listeningUnits.filter(unit => unit.level === level);
      return [level, {writtenUnits: writing.length, writtenItems: sumItems(writing), taughtGlosses: writing.flatMap(u => u.lexicon).length,
        listeningUnits: listening.length, listeningItems: sumItems(listening)}];
    }))
  }
}, null, 2));
