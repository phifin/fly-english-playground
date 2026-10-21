# Current execution state

## Production deployment continuation — 21 October 2026

The owner created `phifin/fly-english-playground` and authorized publication,
Pages deployment, free Firebase setup and production verification. This is the
active task; the older local-release snapshot below is historical evidence.

- GitHub plugin authentication actually succeeded as `phifin`. Repository and
  collaborator checks report admin/push. Initial README commit actually exists:
  `07b435bdb2ddebb06beecd32425a358434d9946b`. The previously empty repository's
  history is preserved; publication uses normal parent commits and non-forced refs.
- MinGit 2.56.0.2 is checksummed under ignored `.tools/`; an isolated checkout at
  `artifacts/deployment-checkout` has the requested origin. Root `.git` is protected
  by managed permissions. Normal CLI remote access fails at managed proxy
  `127.0.0.1:9`; the authenticated GitHub connector is the permitted publication path.
- Both plugins are installed. Firebase's stdio tools are not exposed/operational
  here: `npx -y firebase-tools@latest --version` fails ENOTCACHED before startup;
  the official checksummed standalone v15.34.0 fallback fails with spawn EPERM.
  No Google identity, project list, Spark project or Firebase authorization has
  been verified. Do not confuse this with proof that the account has no projects.
- Owner-side requests are pending: enable Pages Source = GitHub Actions at the
  repository settings, and run Firebase CLI login in normal owner PowerShell,
  then resume/restart Codex with the Firebase MCP server active. No secrets are
  requested in chat. This installed stdio plugin uses Firebase CLI login rather
  than `codex mcp login firebase`.
- Latest local suite: 245 tests, 243 passed, two actual-emulator checks skipped.
  Auth+Firestore CI checks require both loopback emulators and fail if absent.
  Cloud adapter fixes cover dotted/colon IDs, history limits/preflight and pending
  sign-in cancellation. Real cloud controller integration harness is ready for CI.
- Pages prefix preview/regressions and GET-only deployed-file integrity verifier
  are implemented. The workflow tests the actual repository prefix, then deploys
  and verifies the action's actual Pages URL using the expected release ID, fresh
  browser profiles and axe. No Actions/browser/live cloud pass is yet claimed.
- Current built release: `f44aa06ace219f598cdf`. Source snapshot helpers/manifests
  remain under ignored `artifacts/` and exclude credentials, logs and learner data.

Next: finish source publication via connector, inspect actual workflow runs and
fix failures; wait only on the two account prerequisites. Once Firebase tools
are operational, list authorized projects and reuse an unambiguous project for
this game or create a dedicated Spark project without billing. Do not restart
the game, discard the accepted library or weaken required verification gates.

---

Updated 20 October 2026. This is the continuation entry point. The owner's latest
master continuation authorizes autonomous development toward a family release;
old milestone approval gates and manual Luna handoffs no longer apply. No paid
runtime AI, billing activation, conventional backend, or invented cloud/deploy
claims are authorized.

## Actual implementation

- Preserve the functioning dependency-free native ESM application. The owner made
  frameworks optional. Main atlas: `index.html`, `atlas.css`, `src/main.js`.
  Original P0: `observatory.html`, `styles.css`, `src/app.js` (session-only bonus).
- Full local player flow: profiles, onboarding, provisional orientation, six
  regions, missions, feedback, discoveries, journal, targeted review, settings,
  backup/recovery, offline installation status and final world completion.
- Real shared expedition engine with bridge toggles and persisted replayable
  routes. Kids moves directly, Balanced queues commands, Serious writes plans.
  Study progression uses completed objectives; discoveries additionally require
  a verified route. Resets and merged offline branches preserve discoveries.
- Learning: five activity types; independent/assisted evidence, immutable answer
  disclosure receipts, mistakes, due-time-gated retrieval and honest self-review
  for writing. No fabricated CEFR certification, speaking or listening scores.
- EN/VI guidance and Eco/Balanced/Ultra/Auto independent of experience/proficiency.
  Original responsive SVG/CSS artwork; no third-party image/font downloads.
- IndexedDB schema 2 with atomic profile/event writes, accounting and query index;
  export schema 1. Drafts compact to the current response per activity. Real-browser
  IndexedDB behavior remains part of the unexecuted browser gate.
- Optional pinned Firebase 13 adapter, Google auth in memory, admission/owner rules,
  manual event-set sync, dependency restoration, deletion tombstones. Disabled by
  default. No Firebase project, credentials or live cloud execution exists.
- Static allowlisted build, integrity-checked project-scoped offline cache, relative
  Pages paths. CI requires browser/axe and Firestore emulator jobs before deploy.

## Accepted educational data

Native `gpt-6-luna` at `max` prepared staging batches; Sol inspected and corrected
them before acceptance. Production files actually exist:

- `data/published/atlas.json`: 24 missions / 120 activities, four missions and
  20 activities per band. Exactly 24 each choice, gap, match, order and writing.
- `data/published/boards.json`: 24 validated boards; longest verified route 15
  commands, within the 40-command planner. All require a bridge switch.
- Source batches: launch-sample (2/10), launch-core (10/50), launch-variety (12/60),
  launch-boards (24). Their reports describe provenance and limitations.
- `data/acceptance.json` and `data/boards-acceptance.json` bind the actual accepted
  material. Do not rerun private curation scripts or change reviewed files without
  renewed review and acceptance. The build fails if published content differs.
- This is a finite, non-calibrated foundation library, not complete CEFR coverage
  of every descriptor. Writing/echo/world clues have separately declared limits.

## Verification evidence

- Latest full Node run: **223 tests, 222 passed, 1 skipped, 0 failed**. The skipped
  test requires a real Firestore emulator. JUnit: `artifacts/node-tests.xml`.
- Both publication acceptance checks and production build pass. Last release ID
  and sizes are in `dist/build-report.json`; actual performance measurements are
  in `artifacts/performance.json` (desktop Node only, no device claim).
- Built release `25ea898b6f82100ba7e1`: 26 public files verified over HTTP,
  including every manifest hash/byte count; ten private/missing paths return 404.
  Preview at `http://127.0.0.1:4173/` was verified while its process was running.
  `artifacts/http-verification.json` records the actual check. README, architecture,
  family guide and `docs/release-report.md` are current; old plans are annotated.
- Browser launch returns managed `spawn EPERM` before any page; no graphical
  interaction, screenshot, axe or real browser persistence pass is claimed.
  Evidence: `artifacts/release-browser-report.json`. Do not repeat identical
  launch attempts or bypass sandbox policy. The complete harness is ready for CI.
- No Git executable/repository, GitHub credentials/connector, Pages deployment,
  emulator execution, Firebase provisioning or live OAuth verification exists.

## Next steps and remaining release gates

1. With owner repository access, publish source to a GitHub repository and choose
   Settings → Pages → GitHub Actions. Run the included workflow; inspect actual
   browser screenshots/report, axe and emulator results and fix any failures.
   Do not declare production verification merely from the workflow file.
2. Optional cross-device cloud requires the small Spark/OAuth/allowlist setup in
   `cloud/DEPLOYMENT.md`, followed by live two-device smoke checks. Keep billing
   disabled. Local play and private export/import need no cloud setup.
3. Check actual family phones/keyboards/screen readers and learning enjoyment when
   access becomes available. No user approval is required to fix ordinary defects.

The release candidate is locally testable. Final live deployment and full browser
verification remain incomplete for external/environment reasons. Preserve this
state and the accepted data; do not restart implementation or bulk generation.
