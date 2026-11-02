# Learning platform expansion — implementation checkpoint

This expansion adds an original, bounded course foundation alongside existing play. It does not claim to provide a complete A1–C2 curriculum, a multi-year course, or validated examination scores. The existing 24 missions/120 activities, 18 placement probes, 12 picture words and nine harbor requests remain intact.

## Product and evidence boundaries

- Kids retain picture/sound play and building. New text-based lessons are for readers; a low CEFR label does not establish preschool suitability. Guardians remain appropriate for pre-readers.
- Everyday learners get taught objectives, contextual vocabulary, finite daily sessions, scheduled retrieval, optional checkpoints and a factual practice history. Manual range choice and placement-derived starting range remain independent of presentation mode.
- Exam learners get original short IELTS Academic Reading, TOEIC Reading and competitive school-English format practice. These are not full mock examinations. Optional internal time budgets never convert raw correctness into an official score. TOEFL is researched separately because its January 2026 changes make inherited formats inappropriate.
- Six original short scripts support everyday listening through available browser English voices. Transcript use is recorded as support. This is not standardized exam listening; no voice-quality or accent-consistency claim is made.
- No automated essay, pronunciation, speaking or overall exam scoring is introduced.

## Persistence and recommendations

New content has its own stable identifiers. Existing immutable event kinds carry new sessions, answers, exposure and preferences; old records are neither deleted nor rewritten. Curriculum evidence is rebuilt from actual responses with the existing answer validator. Passive word exposure, game rewards, listening practice and exam results remain separate from objective recall evidence.

Session snapshots fix their item set. First complete responses determine round results; imported score/completion flags are ignored. Conflicting snapshots are quarantined. Timed rounds retain their original deadline across reloads, with late responses excluded from the round score. They cannot become official examination simulations merely through a timer.

An objective can show new, practising, independent response, or recalled evidence. Recalled requires different items on different days at least 24 hours apart. These are heuristic evidence descriptions, not permanent mastery or CEFR certification. Mistakes return sooner; spaced independent retrieval lengthens review intervals. Recommendations consider due retrieval and prerequisite gaps without locking other material. Small banks necessarily repeat; checkpoint summaries must disclose repeated items.

## Content gate

Luna writes only the two staging deliverables specified in [the contract](platform-content-contract.md). Sol reviews wording, keys, ambiguity, examples, classification and provenance before creating a pinned acceptance receipt. The deterministic validator checks shape, IDs, answer structure, normalization, prerequisite graph, references and exact published bytes. Schema validation cannot establish educational validity.

Planned batch: 24 taught objectives (four per band), 72 lexical targets, 48 practice items, 24 checkpoint items, 24 exam-format items and 12 listening questions. These are targets until files are delivered, independently reviewed and published. Count lexical targets separately from objectives; do not add repeated questions or reused passages as new knowledge.

## Reminders and infrastructure

Optional calendar export uses local wall-clock recurrence, explicit user action, and a safe Today deep link. Import and alerts are controlled by the external calendar. This does not enable push subscriptions or prove notification delivery. See [reminder research](reminders.md) for iOS Home Screen requirements, trusted sender/scheduler constraints, and why no Firebase Blaze or unreliable CI reminder backend was added.

## Remaining before release

Integrate and inspect the views; finish the independent content review; test new journeys in real hosted browsers; verify security/storage regression and offline assets; publish with a leased non-force update; confirm all production jobs and actual live release. The previously verified Product Experience 2.0 deployment remains the release baseline until those gates pass.
