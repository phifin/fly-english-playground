# Current execution state

## Live import fix verified; stronger state assertion — 22 October 2026

- **All four jobs actually passed** in run39707387386 at source
  `f26fff5fa318c7419738005ccd42ce8db08ec584`, tree
  `b211ed6f7cb1c792069fa131a60c170eb1f3460c`. Both preview and live passed23
  browser checks: actual pinned SDK/CSP,503 failure settling, form preservation,
  native-input notification interruption, repeated/malformed imports, fresh
  restore and the previously failing second quoted-backup import. Domain/unit
  suite260 passes; actual two-emulator checks passed separately. No sandbox bypass.
- Independent GET-only verification of live release`7fc15238b5c21029f74a` passed:
  24 manifest files/555868 cached bytes,24 missions/120 activities/24 boards,
  5 private404s. Production backend/rules unchanged, billing not enabled.
- Owner confirmed only domain action done and reported the earlier import failure.
  Verified public Auth config now includes **phifin.github.io**. Do not ask to
  add it again. First game Google identity/admission and positive sync remain
  unverified; the already consolidated checklist's remaining steps are sign-in
  and console `access/UID {approved:true}`. No CLI login/reinstall is needed.
- User explicitly requests meaningful import state assertions instead of relying
  exclusively on transient localized notice text. scripts/browser-release-check.mjs
  now reads actual IndexedDB in read-only transactions, computes expected merge
  from the pre-import snapshot, observes native input/change + foreground busy
  lifecycle, and waits for exact committed profiles/events. Malformed imports
  must explain the error and preserve the entire snapshot. Existing export,
  journal, idempotency and quote-escaping checks remain. Notices are diagnostics.
  On failure, actual/before/expected data, event delivery, notice/error text and
  the actual target UI/screenshot are retained. Syntax and56 storage/model tests
  passed; this final test update still requires actual CI/browser execution.

Next: publish scoped browser-test/documentation update with preserved history,
then inspect the latest four-job run until it is genuinely green. App assets and
release ID stay unchanged by this test/docs update. Continue only blocked account
enrollment once owner completes it; don't claim positive live sync as tested.

---

## Backup-input and CDN-outage regression — 22 October 2026, latest continuation

- Published first form fix at `8f386c8d9b1284b1a96dbfc68837d80d8697ad5a`,
  tree`ea54e2a7571aedfd1ebd2d1645276f85e44956a7`. Run39706514460 passed build,
  Auth/Firestore emulators and Pages deploy. Live browser checks confirmed actual
  SDK/CSP, successful create/rename/delete under deliberate notifications and
  mode/mobile/backup behavior. The later quoted-backup import timed out waiting
  for its merge notice; this run is **not** fully green.
- Actual second failure artifact12395312941, SHA256
  `b16b4158a84faa7169daa206429c4d4a2e5d42c173d6819b29614810d6dfa1f6`,
  is under artifacts/production-failure-39706514460/. Earlier screenshots only
  captured the main page, not the clean-context import target; the harness now
  records the actual failed target's UI/form snapshot and screenshot.
- Hidden native file input is now one persistent node **outside #app**, with a
  direct shared change handler. Background renders cannot detach it between
  native input/change events or dismiss its picker. Captured File is retained
  locally while clearing input.value, allowing same-file reimport. Deterministic
  browser regression emits an ordinary online notification between actual native
  file events and still requires the real import/validation notice and evidence.
- Cloud details now prepare only on a real closed-to-open transition. Recreating
  an already-open panel after a failed SDK load must not loop through error/render/
  toggle/retry. A separate fresh context returns503 for actual pinned CDN modules
  and checks settled UI, preserved typed name/open sections, no automatic retries,
  auth/data calls or popups. Normal offline and CSP gates stay enabled.
- Current local build`7fc15238b5c21029f74a`,26 files,75558 gzip JS bytes.
  Syntax and260 local tests passed before the final small direct-handler wiring;
  actual fresh CI/browser checks for these additional fixes are still required.
- Owner enrollment checklist was sent once through async input: add authorized
  domain phifin.github.io, first game Google sign-in, then console-managed
  access/UID Boolean approved=true. Await reply without repeating CLI login or
  asking for unrelated technical choices. Public Auth config still lacks the
  Pages domain at the last read. Continue independent verification meanwhile.

Next: finish fresh checks, publish scoped main/browser/durable-state changes with
current remote parent, monitor all four jobs and inspect actual evidence. Preserve
the already provisioned no-billing Firebase backend and unrelated phi-login.
Do not declare approved live synchronization or complete release until verified.

---

## Profile-form production regression — 22 October 2026, latest continuation

- Source/cloud activation was published at `d289243ac16047cba044b590c36282e7a1ed7be8`,
  tree`de78432b8fc020fb8201d7d102a8db94c37bcf6b`, without replacing history.
  Run39544138986 passed build, actual Auth/Firestore emulators and deployment.
  Preview passed20 browser checks including real pinned Firebase13 SDK/CSP;
  live SDK preparation also passed. Live verification then failed at initial
  traveler creation; do not call this run fully successful.
- Verified live static release781ccc010e492f72f2b0 independently:24 manifest
  files/553933 cached bytes,24 missions/120 activities/24 boards,5 private404s.
- Downloaded actual failure artifact12320399156, SHA256
  `0aa8544e8f607516a85361b452180448adde6e4eaa04a61aac25472f62adff31`,
  under artifacts/production-failure-39544138986/. Root inspected its screenshot:
  required name field is empty and shows native validation after the test filled
  it. No app console errors. A readiness notification rebuilt/wiped the form.
- Fixed src/main.js to preserve transient named profile-form fields, enclosing
  details expansion, focus and selection on same-view/same-profile re-renders.
  Explicit navigation and create/delete/profile changes reset them. Cloud-panel
  toggle now retains its openness in UI state. No storage schema or cloud rule
  changes. Regression harness deliberately dispatches ordinary online notifications
  before actual create/rename/delete submissions, including dependent selection,
  and checks no state leaks between learners. No larger timeout/test retry.
- Syntax checks, all260 local tests (two emulator checks skipped locally), and
  production build pass. New local release`2ec03a55e03b0244586a`,26 public files,
  75370 gzip JavaScript bytes. Actual browser verification of this fix is pending
  a fresh GitHub publication/run. Preserve and inspect any new failure artifacts.

Next: publish main.js, browser regression and this durable state using fresh
remote parent/non-forced update; monitor all four jobs, fix actual failures.
Then complete the consolidated owner domain/first-Google-sign-in/admission
checkpoint already detailed below. Cloud backend remains provisioned without
billing, with reviewed deployed rules; don't recreate it or ask for CLI login.
Approved live sync is still unverified. Only finish when actual gates pass.

---

## Production Firebase provisioned — 21 October 2026, latest continuation

- Owner connected `atlas-firebase`; its20 tools are now actually exposed. Account
  project listing succeeded, showing only unrelated `phi-login`. Preserve it.
- Created dedicated `unfolding-atlas-phifin` (projectNumber98369051475), selected
  it and registered Web App `1:98369051475:web:bb3e301135aae3689adfa6`. Before and
  after provisioning Firebase explicitly reports **Billing Enabled: No**.
- Official MCP auth initialization and deployment job1792556405176 succeeded
  for `firestore,auth`. Explicit Standard default database configuration uses
  `asia-southeast1`; reviewed rules/index body exemptions were preserved.
  Readback exactly matches normalized reviewed rule source. Three actual live
  anonymous probes (profile read/write, self-admission write) returned403.
  Google provider URI requests return200 with Google Accounts URLs.
- Public config now contains real public identifiers and `enabled:true`, ready
  for account enrollment. No private credentials were read or published. The
  temporary Google support address configuration is kept only in ignored
  `artifacts/firebase-production-provisioning.json`; tracked cloud/firebase.json
  retains Firestore/emulator config. Do not deploy auth from an empty provider
  template or introduce billing, bootstrap rules or service-account keys.
- Two installed-tool gaps require owner console work: CLI15.34 auth deployment
  ignores authorizedDomains; core/auth MCP has no domain mutation or Firestore
  document write. Public Auth config currently lists only the Firebase domains,
  so **phifin.github.io must be added**. Auth users were empty at last check.
  First real Google sign-in must create an identity, then owner creates
  `access/UID {approved:true}`. Full concise checklist in production-status.md.
  Do not ask for login/reinstall/another Firebase project.
- SDK/browser review added `scripts/cloud-sdk-check.mjs`, validator regressions,
  build fail-fast for malformed enabled config, and integration in both existing
  browser gates. Real pinned CDN modules, CSP, successful prepare and signed-out
  state are required; no Google credentials or private data calls. Changes still
  need actual GitHub CI/browser execution; do not call that new gate passed yet.
- Latest full local suite:262 tests,260 passed, two actual-emulator tests skipped,
  no failures. Enabled production build `781ccc010e492f72f2b0`,26 public files,
  74834 gzip JavaScript bytes. Latest previously verified deployment run39541377960
  is the prior local-only release. Preserve source/history on the next publication.
- Sanitized evidence is in artifacts/firebase-provisioning.json,
  firebase-auth-public-config.json, firebase-google-provider-check.json,
  firebase-live-anonymous-rules.json. Never publish raw Firebase logs/auth stores.

Next: publish these scoped changes through the GitHub connector with a fresh
parent and non-forced update, run/inspect actual CI, fix SDK/browser failures.
Then consolidate owner domain/enrollment/admission actions while continuing all
independent work. Positive live OAuth and approved two-browser synchronization
remain unverified; do not claim the full cloud-backed family release complete.

---

## Firebase MCP startup diagnosed — 21 October 2026, latest continuation

- Frontend remains live at https://phifin.github.io/fly-english-playground/.
  Latest verified Actions run39538430213 passed all four jobs at commit
  `11db0dce872f82dda0e67d493bf643a1a2a67805`. Cloud remains disabled pending
  real project/provider/rules setup; do not claim cloud deployment is finished.
- Owner reports both local MCP entries failed after restart, with only
  `Auth: Unsupported`. This is not evidence of a Google login failure.
- Actual non-login environment resolves neither `node` nor `npx`. The custom
  entry is still configured with bare `command = "node"`. A stable installed
  runtime exists at `C:/Users/nhuphi.vo_amaris/AppData/Roaming/fnm/node-versions/v24.22.0/installation/node.exe`.
  Register that absolute executable, avoiding ephemeral fnm shell PATH entries.
- A second failure was reproduced: CLI15.34.0 `--only core,auth,firestore`
  initializes, then `tools/list` returns error-32603 and zero tools because remote
  Firestore OneMCP definitions cannot be fetched. The launcher now defaults to
  `core,auth`, which includes project/app/init/rules/deployment operations and
  avoids that remote discovery dependency. It also handles missing Windows
  APPDATA variables and has opt-in stderr-only startup milestones.
- **Actual stdin/stdout pipe verification passed:** protocol2025-06-18,
  official server `firebase`0.3.0, initialize6843ms, tools/list7315ms,
  **20 tools**, zero non-protocol stdout lines. Sanitized evidence:
  `artifacts/firebase-mcp-stdio.json`; original-setting failure evidence:
  `artifacts/firebase-mcp-firestore-discovery.json`. No explicit account/project
  tool calls or mutations in these probes. Server discovery uses existing CLI
  credentials internally; no credentials were printed or copied.
- `scripts/check-firebase-mcp.mjs` is an optional repeatable MCP client probe
  using the executing Node binary, with sanitized results under artifacts.
  Its Node child-process launch hits managed EPERM here. The separate direct
  PowerShell pipeline above succeeded without weakening any restriction.
- Syntax checks and all15 targeted deployment/security tests passed. These are
  development-tool changes; no application/cloud credentials or policy changed.
- The remaining unavoidable owner action is to replace the custom MCP command
  in the read-only-to-agent user configuration, then restart/resume Codex:
  `codex mcp add atlas-firebase -- "C:/Users/nhuphi.vo_amaris/AppData/Roaming/fnm/node-versions/v24.22.0/installation/node.exe" "C:/Users/nhuphi.vo_amaris/Documents/my-english-learning-engine/scripts/firebase-mcp.mjs"`.
  The host connection has not yet been retested with that registration. Do not
  ask for reinstall/login again. See `docs/firebase-mcp-troubleshooting.md`.

Next: verify the corrected host connection actually exposes tools, then list
projects through it. Remote project authorization and Spark plan remain unknown.
Continue existing production cloud work once connected; do not restart frontend
development or bypass the managed proxy. Earlier registration instructions using
bare `node` below are superseded by this diagnosis.

---

## Live deployment verified — latest state, 21 October 2026

- Live URL **https://phifin.github.io/fly-english-playground/** returns the expected
  release `f44aa06ace219f598cdf`; direct GET-only verification passed all public
  hashes/byte counts and private404s. User enabled Pages and completed Firebase login.
- Published full source (90 files) as `d56073044ee47afc3cf3d522176e288a8a32bfd3`,
  then sandboxed-system-Chrome CI fix `43fed8be52f1e820b6583df40094cd51131f124f`.
  Current remote tree `2610869ce65d6e2a168fc94dad6ed7c100882f37`. Never force-push.
- **Actual successful run**: https://github.com/phifin/fly-english-playground/actions/runs/39537300956
  All four jobs passed: build, firestore-rules, deploy, verify-production. Local/
  hosted domain suite: 243 passes, two emulator checks separately executed. Actual
  Auth+Firestore emulator job: two passes, zero skips, including real rules and
  admission/owner isolation/immutable evidence/family sync and recovery.
- Pre-deploy and live browser suites each passed all19 release checks: three modes,
  five activity types, real IndexedDB/reload/drafts/backups, families, 390px touch/
  keyboard, offline reload and no external requests with default configuration.
  Axe reported no violations on journal, mobile activity, studio and settings.
  Chrome155.0.8059.84 ran with `chromiumSandbox:true`, using the preinstalled stable
  channel's existing Ubuntu24 AppArmor profile. No sandbox/security policy was
  disabled. Root inspected actual desktop/mobile screenshots.
- Verified production artifact12318466691 downloaded/checksummed, extracted privately
  to `artifacts/production-39537300956/`. Reports/screenshots stay outside published
  data. Current CLI integrity report is `artifacts/deployment-report.json`.
- **Only remaining release blocker: production Firebase connection/configuration.**
  Installed CLI15.34.0 is now present at
  `C:/Users/nhuphi.vo_amaris/AppData/Local/npm-cache/_npx/ba4f1959e38407b5/node_modules/firebase-tools/lib/bin/firebase.js`.
  `npx ...@latest` still hits managed ENOTCACHED; invoke the existing Node entry
  if needed. Its MCP startup initially failed writing ~/.cache. Supported
  `FIREBASE_DEBUG_PATH=<workspace>/artifacts/firebase-mcp.log` permits startup without
  changing protected directories. A real official MCP handshake and
  `firebase_get_environment` succeeded and recognized the logged-in Google identity.
  Do not read raw auth stores, print tokens or publish logs.
- `firebase_list_projects` on that server failed because its normal SDK request
  hits managed proxy127.0.0.1:9 (ECONNREFUSED). No Firebase project list, project ID,
  billing plan, production provider or rules deployment has been verified. Do not
  claim the user lacks projects. Public config remains disabled/blank. Never
  override the managed proxy, disable sandboxing or copy credentials into source.
- An async question is pending asking the owner what `/mcp` shows for Firebase
  status; the owner answered **startup error**. A concrete launcher now exists at
  `scripts/firebase-mcp.mjs`: it loads the installed official CLI package directly,
  uses the supported workspace debug-log path, preserves credentials/network/
  security settings and enables only core/auth/firestore development tools. Syntax
  and the official server's `--help` pass. The remaining async request asks the
  owner to register `atlas-firebase` from a normal terminal and resume this chat:
  `codex mcp add atlas-firebase -- node "C:/Users/nhuphi.vo_amaris/Documents/my-english-learning-engine/scripts/firebase-mcp.mjs"`,
  then `codex -c mcp_servers.atlas-firebase.startup_timeout_sec=120 resume`.
  Codex user config is outside this agent's writable roots; do not edit it or
  override the managed proxy. Verify the host tool actually connects and can list
  projects before provisioning. The owner already completed login and Pages
  enablement; do not repeatedly request those completed actions.

Next: resolve only the Firebase host connection, list projects via official MCP,
reuse an unambiguous game-specific Spark project or create a dedicated free one,
configure Google provider/exact `phifin.github.io` domain, default-deny owner rules,
public Web App identifiers and console-managed admission. Publish enabled public
configuration only after rules/admission are ready, rerun actual CI and verify
live cloud flows where feasible. Frontend deployment is done; do not restart it
or weaken checks. The longer entries below preserve the earlier audit trail.

---

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
