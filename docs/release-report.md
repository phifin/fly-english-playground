# The Unfolding Atlas — family release candidate

20 October 2026 · version 0.1.0-rc.1

The locally testable application and deployment configuration are implemented.
**This is a release candidate, not a fully verified live release.** This managed
environment refuses graphical browser launch before a page opens. Required browser
and Firestore-emulator CI gates have not run, and no cloud project or Pages site
has been provisioned. Those are the remaining release gates, not successful checks.

## A. Product

Nim has found an unfinished atlas. Six illustrated regions unfold through short
English-learning expeditions, with original clues, landmarks, bridge switches and
route puzzles. Interpreting English identifies the destination; manipulating the
route provides a separate spatial challenge. The world changes as discoveries
accumulate, with a final atlas accomplishment after all 24 expeditions.

Kids uses direct movement and a guided clue → attempt → discovery trail. Balanced
combines an explorable board, selectable learning objectives and queued movement.
Serious prioritizes a study queue, evidence and text-based route planning. These
share one world engine and one learning history. A route solve alone never awards
language mastery; a world accomplishment requires both completed learning work and
a replay-verified destination. There are no timers, lives, paid rewards or punished
streaks. The original P0 mirror/shutter construction puzzle remains a separate,
session-only observatory sandbox.

## B. Delivered functionality

| Capability | Actual implementation and limits |
| --- | --- |
| Player journey | Local traveler creation, onboarding, short orientation, six regions, 24 sequential study missions, exploration, feedback, journal, review, settings and atlas finale. Every band is freely selectable. |
| Modes | Kids direct controls/guided moments; Balanced activity choice/queued route; Serious direct study/text plan. Switching modes preserves evidence, drafts and verified discoveries. |
| Guidance | English-only or Vietnamese-assisted, independent of mode. Assessed material remains English. World-clue translation is explicit assistance. |
| Activities | Choice, constrained gap, sentence construction, contextual matching and writing with a self-review rubric/model. Writing records completion without automatic correctness. |
| Personalization | Provisional 12-item orientation, item mistakes, independent versus assisted responses, scheduled retrieval, due review and transparent practice/stretch suggestions. No certified level or psychometric calibration. |
| Persistence | Real IndexedDB, atomic writes, recovered drafts, immutable evidence, profile isolation, validated export/import with conflict refusal and ID deduplication. No silent memory fallback. |
| Family | Independent and guardian-linked dependent profiles, dependent journal access, explicit deletion. No parent PIN, enforced age restriction or public child account. |
| Cloud | Optional Google sign-in and allowlisted owner-isolated Firestore, explicit linking/manual sync/restore, offline union and deletion tombstones. Implemented and adapter-tested, disabled until owner setup and live verification. |
| Offline | Built public library installs into a scoped integrity-checked service-worker cache. UI reports readiness. Private data stays in IndexedDB; authentication/sync still need a connection. First download must complete. |
| Quality | Eco/Balanced/Ultra/Auto, conservative capability signals and passive slow-frame downgrade. All educational content remains available. Motion preferences are independent and reduced motion is respected. |
| Voice | Optional browser speech synthesis, transcript and ungraded retelling studio. No microphone, recording, pronunciation score or measured listening proficiency. Voice support/network use varies by browser. |
| Access | Responsive layouts, semantic controls, visible focus, keyboard map controls, button-based ordering, live feedback, motion controls and original SVG. Browser/axe/screen-reader validation is still outstanding. |

## C. Access

The built preview was verified by HTTP at **http://127.0.0.1:4173/**. It remains
available while its preview process is running. If stopped, use Node.js 24+:

```sh
npm run build
npm run preview
```

No application package installation, login or API key is needed for local play.
Use the same URL/browser to return to saved travelers; a different origin or port
has different browser storage. P0 is at `/observatory.html`. No live deployment URL
exists. The [family guide](family-guide.md) explains play, support and backups.

## D. Deployment and owner setup

1. Put the project source into a GitHub repository and choose **Settings → Pages
   → GitHub Actions**. This workspace has no Git executable/repository or GitHub
   authorization, so upload/push and account settings were not performed. Exclude
   private tool configuration, learner exports and ignored artifacts.
2. Run the included workflow. It builds `dist/`, tests actual Firestore rules with
   disposable emulator identities, and runs Chromium interaction/mobile/offline/axe
   checks. Both jobs must pass before deployment. Inspect actual results and fix
   any failures; the workflow file itself is not proof of a pass.
3. Local saving and export/import require no managed service. To enable Google
   identity and cross-device synchronization, follow the exact free Spark project,
   OAuth authorized-domain, Firestore rules/index and console admission steps in
   [cloud/DEPLOYMENT.md](../cloud/DEPLOYMENT.md). Public Firebase web configuration
   belongs in `public-config.js`; **Admin/service-account secrets never belong in
   the frontend**. Keep billing disabled. No paid runtime AI is used.
4. After configuration, perform the documented live sign-in, admission, two-device
   sync, interruption and deletion smoke checks before trusting cloud recovery.

Only `dist/` is the public artifact. GitHub Pages code, assets, content and answer
keys are publicly downloadable. Learner records are separate. Free cloud limits
can interrupt synchronization; manual full-history reads are intentionally simple
but consume quota. Downloaded private exports remain an independent recovery path.

## E. Educational content

| Practice band | Expeditions | Activities | Bounded automatic checks | Self-reviewed writing |
| --- | ---: | ---: | ---: | ---: |
| A1 | 4 | 20 | 16 | 4 |
| A2 | 4 | 20 | 16 | 4 |
| B1 | 4 | 20 | 16 | 4 |
| B2 | 4 | 20 | 16 | 4 |
| C1 | 4 | 20 | 16 | 4 |
| C2 | 4 | 20 | 16 | 4 |
| **Total** | **24** | **120** | **96** | **24** |

There are exactly 24 activities of each of the five types, categorized as 72
reading, 24 language and 24 writing activities. The separate 24 English world
clues support gameplay and are not additional calibrated assessment items.

Coverage moves from familiar place/preference clues through past/future accounts,
comparisons, purposes and narrative reasons to counterfactuals, reported viewpoints,
review register, hedging, formal cohesion, pragmatic force and figurative editorial
interpretation. C2 includes an original literary museum passage and qualified
evaluation tasks. Short recognition or construction exercises within an advanced
band can still be easier than sustained real-world production.

This is a **finite foundation library across six practice bands**, not a complete
CEFR course or enough evidence to certify a level. Listening and speaking are
ungraded rehearsal; writing uses self-review. Item retention is a heuristic, not
overall language mastery. Initial orientation reuses a small library sample and
is explicitly provisional, non-calibrated and vulnerable to familiarity.

Native `gpt-6-luna` at maximum reasoning prepared four bounded staging batches.
Sol inspected the actual deliverables, corrected ambiguous or over-easy answers,
bad alternatives, factual/grammar claims and inconsistent clues, then accepted
actual pack/activity/board hashes. Structural, duplication, relationship, author-key
and route replay checks pass. Submitted approval fields do not authorize publication.
The production build independently checks the accepted hashes.

Passages and exercises are original, prepared using legitimate reference knowledge;
no copied third-party quizzes, media or passages are shipped. Provenance lists
Council of Europe, British Council and Cambridge references, with access/use notes.
Some reference access was search-only or blocked; those limitations remain in
batch reports. AI review and structural checks do not replace expert educational
calibration or family feedback. See `data/staging/*/report.md`,
`data/acceptance.json` and `data/boards-acceptance.json` for the acceptance record.

## F. Quality assurance

Executed in this workspace:

- **223 Node tests: 222 passed, 1 skipped, 0 failures.** The skipped test needs the
  real Firestore emulator. Tests cover learning integrity, same-day support, due
  retention, journey progression, profile isolation, transaction failures, draft
  compaction, backup conflicts, cloud adapter concurrency/retries, malicious data,
  world replay, static boundaries and offline integrity. Mock adapter tests do not
  prove real Firebase/IndexedDB/browser behavior. JUnit: `artifacts/node-tests.xml`.
- Both acceptance commands pass for actual 24/120 content and all 24 boards. Every
  board requires a switch and has a replay-verified solution within 15 commands,
  below the 40-command planning limit. Reset/offline-branch tests preserve solves.
- Syntax checks pass for 25 application/tooling modules. The production build has
  26 public files, two published data packs and cloud disabled. HTTP verification
  fetched every public file, checked manifest hashes/bytes and security headers,
  and confirmed ten private/missing paths return 404. Report:
  `artifacts/http-verification.json`.
- Build `25ea898b6f82100ba7e1`: 216,347 raw JavaScript bytes, 74,385 bytes as the sum
  of individually gzipped JS files, including the bonus sandbox and optional
  modules. This is a build-size measure, not observed initial transfer. The full
  offline manifest contains 551,678 raw asset bytes.
- Seven-sample desktop Node measurements: learning derivation median **1.347 ms**
  for 1,000 synthetic attempts and **13.930 ms** for 10,000; expedition derivation
  **0.827 ms / 2.021 ms** for 1,000 / 10,000 snapshots. Published learning JSON is
  229,591 raw bytes / 50,652 gzip bytes. See `artifacts/performance.json` for CPU,
  samples and uncontrolled-memory caveats. No browser frame rate, startup latency
  or low-end hardware result is implied.
- Final source review fixed background errors releasing active-action locks,
  stale-refresh preference regression, voice failure feedback/context switching,
  narrow-layout wrapping, offline cache-miss integrity and deletion safety.

**Not executed successfully here:** graphical browser interaction, real browser
IndexedDB upgrades, service-worker/offline reload, mobile layout, axe, screen-reader
review, actual Firestore rules engine, live Google sign-in or Pages deployment.
Browser launch failed with managed `spawn EPERM` before any checks; the saved
report has zero passed UI checks. Repeated blocked launch attempts were stopped.
The CI harness covers these browser flows, including async-lock regression and
mobile Echo Studio, but its future execution must be inspected. The environment's
approval policy does not permit escalating a browser launch.

## G. Remaining limitations

- Full production verification and live cloud/deployment require the external
  steps above. No screenshots or family enjoyment findings exist from this run.
- The world has 24 finite puzzles using one movement/bridge ruleset. It has no
  real-time multiplayer, procedural unlimited content or complex economy.
- Guardian settings on a trusted browser are convenience controls. Private cloud
  access is enforced by identity/admission rules; local shared-browser access is
  not equivalent to separate authenticated sessions.
- Browser eviction, storage denial and unsaved edits at forced termination remain
  possible. Errors surface; exports are the recovery mechanism. Cloud sync is
  explicit, bounded to 20,000 events/profile and can reject genuine conflicts.
- Automated scoring is intentionally bounded. Natural answers outside a restricted
  task can be legitimate; writing/voice quality needs self or human review.
- Accessibility and performance require actual browser/device verification before
  making compliance or low-end responsiveness claims.

## H. Optional improvements after verification

Use actual family play to identify repetitive boards and weak explanations before
adding more content. Then request narrow Luna batches for underrepresented topics,
new world mechanics and parallel retrieval variants with fresh IDs. Expert review
and properly licensed human listening recordings would improve assessment breadth.
Additional languages or exam formats can remain extensions. None requires paid
runtime AI, a conventional server or a framework rewrite.

The concrete continuation path and execution policy are in
[PROJECT_STATE.md](PROJECT_STATE.md); no new ordinary milestone approval is needed.
