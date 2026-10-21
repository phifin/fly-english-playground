# Architecture

The Unfolding Atlas is a static browser application built from native JavaScript
ES modules, HTML, CSS and code-generated SVG. The core has no installed runtime
packages or application server. Preserve this structure: browser APIs provide
storage, rendering and offline delivery, while pure learning and world rules stay
easy to inspect and exercise with Node's built-in test runner. Optional Firebase
modules load separately when the user opens the cloud connection workflow.

| Area | Current modules and responsibility |
|---|---|
| Application | [index.html](../index.html) loads [main.js](../src/main.js), which coordinates profiles, navigation, activity forms, saved events and errors. [exploration-view.js](../src/exploration-view.js) renders expedition controls; [studio-view.js](../src/studio-view.js) renders optional voice rehearsal. |
| Learning | [learning.js](../src/learning.js) assesses choice, gap, order and match responses, checks writing self-review completion, and derives item practice records, review dates and provisional recommendations. |
| World | [expedition.js](../src/expedition.js) validates boards and replays movement/switch commands. [journey.js](../src/journey.js) combines learning completion with verified world discoveries. [world.js](../src/world.js) supplies SVG illustrations. |
| Persistence | [storage.js](../src/storage.js) owns profile validation, atomic IndexedDB writes, bounded drafts, backup merging and change notifications. [cloud.js](../src/cloud.js) adds explicitly requested account linking and synchronization. |
| Presentation | [quality.js](../src/quality.js), [atlas.css](../atlas.css) and [styles.css](../styles.css) control device-sensitive decoration, motion and layouts independently of assessment rules. |
| Separate sandbox | [observatory.html](../observatory.html) loads [app.js](../src/app.js), [game.js](../src/game.js), [scene.js](../src/scene.js) and synthetic [fixtures.js](../src/fixtures.js). Its construction puzzle is session-only and separate from saved learning evidence. |

Learning evidence, world accomplishments and proficiency claims have different
meanings. Automatic correctness comes from the delivered activity rules, never
from submitted score flags. Writing records self-reviewed completion without
automatic correctness. Review intervals and independent responses describe
practice on these particular items; orientation and practice suggestions are
heuristics, not calibrated CEFR placement or certification. The Echo Studio uses
optional browser speech synthesis for ungraded rehearsal and collects no audio.
World paths replay from each board's start; the latest valid path restores
position, while verified past solves survive route resets. A restored mission
discovery requires both its learning activities and its world destination.

Local storage is authoritative for device progress. IndexedDB database
`unfolding-atlas-learning` uses schema version **2**, with `profiles`, `events` and
`meta` stores; backup JSON retains schema version **1**. The compound
`events.byActivity` index narrows ordinary draft and attempt writes to one
profile/activity. Actual learning events, including immutable `support` records
for revealed assistance, merge by event ID; conflicting retained IDs reject.
Drafts are the explicit transient exception: only the latest snapshot per
profile/activity survives, and an equal-time or newer submission removes it.
An older restore cannot resurrect a draft cleared by a retained submission.
Pruning, record writes and byte/count accounting share one transaction. The UI
debounces draft writes and surfaces save errors. Local profiles and guardian
relationships are convenience controls, not password protection. See the
[storage contract](storage.md) and [runtime contracts](runtime-contract.md).

The optional cloud connection is disabled in committed
[public-config.js](../public-config.js). It uses Google sign-in, a server-managed
approved-UID grant and owner-isolated Firestore paths enforced by
[firestore.rules](../cloud/firestore.rules). Linking and synchronization are
explicit; sign-out retains local work. Dependent profiles use their guardian's
cloud identity. Immutable events can contain submitted response text; draft
events remain device-local and appear in local backups. Firebase is an optional
external dependency, not a required backend for local learning. Keep billing
disabled and private records, exports and service credentials out of the public
artifact. Configuration, deployment and verification requirements live in
[DEPLOYMENT.md](../cloud/DEPLOYMENT.md).

The `kids`, `balanced` and `serious` settings change pacing and controls: immediate
exploration, queued route planning, or a direct study workspace. They share
assessment rules and profile history. Guidance language (`en`/`vi`) is independent
of mode and quality; assessed English remains English, and answer-revealing help
is an explicit assistance action. Auto quality starts conservatively from device
and preference signals and can lower decoration after a passive frame sample.
Explicit quality and motion settings change presentation rather than evidence.

Content creation happens during development, with no runtime model calls. The
owner-approved native Luna workflow assigns bounded `gpt-6-luna` / `max` batches
to staging; Sol reviews the actual files and accepts or requests repairs. A
worker's completion message or self-declared approval cannot publish content.
[content.mjs](../scripts/content.mjs) validates activity data;
[publish-content.mjs](../scripts/publish-content.mjs) requires the reviewed pack
and activity hashes in [acceptance.json](../data/acceptance.json).
[boards.mjs](../scripts/boards.mjs) checks board geometry, real solvable routes and
the hashes in [boards-acceptance.json](../data/boards-acceptance.json). Published
activity and board identities must preserve historical meaning. Only accepted
files under `data/published/` reach the browser. See the
[current project state](PROJECT_STATE.md) for workflow authority and the
[runtime contracts](runtime-contract.md) for data shapes.

[build.mjs](../scripts/build.mjs) verifies accepted published hashes and creates
`dist/` from the explicit public allowlist in
[public-files.mjs](../scripts/public-files.mjs). It excludes staging and private
files, adds a release identifier and writes an integrity manifest.
[offline.js](../src/offline.js) registers [sw.js](../sw.js) only for a built release
in a supported secure context. The worker caches verified public assets within
the site scope, excludes private/authentication traffic and avoids replacing an
active session automatically. Initial installation needs a connection; browser
storage remains evictable, so offline availability does not replace backups.
Publish `dist/` alone as described in [deployment](../cloud/DEPLOYMENT.md) and
[CI verification](ci-verification.md).
