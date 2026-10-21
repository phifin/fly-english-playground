# P0 implementation and verification

> Historical P0 report. The main application now has persistent journeys and
> accepted educational content; this sandbox remains session-only. See the
> [release report](release-report.md) and [current state](PROJECT_STATE.md).

Implementation checkpoint: 20 October 2026. The user approved The Unfolding Atlas
for P0 and one controlled Luna feasibility trial. **P0 is implemented, with browser
and family-playtest gates still outstanding.** Do not describe it as release-ready
or as validated entertainment or educational effectiveness.

## What can be played

One original SVG observatory has a lantern, mirror, shutter, wind-up guide and
moonflowers. A plan contains three reorderable instructions. Roof and garden
routes reveal different discoveries. Each has two valid setup orders. Clear and
mist conditions use different mirror targets. Runs show each command's physical
state, give an explanatory consequence, and allow revision without losing earned
discoveries. Repetition cannot duplicate a discovery.

Kids adds three guided stages; Balanced combines discovery choice and source
inspection; Serious exposes both sources, counterexample testing and an ungraded
reflection. All use the same engine. Mode/language changes preserve the current
in-memory state. Notes and core instructions remain English; Vietnamese guidance
and explicit optional translations are separate. Support history distinguishes
translation use even after it is hidden. The optional library follow-up practices
sequence in a different context and awards no proficiency or world reward.

Content is a small original synthetic mechanics fixture set. No production data,
placement, CEFR certification, accounts, permanent progress, service worker,
automatic quality classifier or cloud sync is implemented. Reload resets the visit.
The UI says this explicitly. Do not enter personal writing expecting storage.

## Technical adjustment and boundaries

The initial Node/npm download attempt failed at the configured network proxy.
A VS Code bundled Node runtime supported initial tests; native Node 24.22.0 later
became available. P0 uses dependency-free browser modules rather than delaying
the play hypothesis for package access. Original vector art avoids external asset
or font requests. The application direction remains Svelte/TypeScript; this is a
bounded prototype adjustment, reported during development.

The world rules are isolated in `src/game.js`, small synthetic text in
`src/fixtures.js`, vector rendering in `src/scene.js` and mode/event composition in
`src/app.js`. No microservices, runtime AI, installed global tools or cloud services
were introduced. The static build uses relative asset URLs suitable for a GitHub
Pages project path; it has not been deployed.

## Verification actually completed

- **9 domain tests:** valid alternatives across both routes/weather conditions,
  all command permutations, malformed plans, failure precedence, physical traces,
  immutable attempts/support snapshots, unique discoveries, independent follow-up,
  mode-neutral rules and progress-preserving weather changes.
- **43 trial-validation tests:** actual two-record submission plus malformed data,
  unsupported schema keywords, references, answer mismatches, reviewed-content
  integrity, dates/URIs, trace sanitization and observed identity evidence.
- JavaScript syntax checks and a successful static build. The generated build
  report records JavaScript sizes; it is a bundle measure, not a timing or
  responsiveness benchmark.
- HTTP checks returned the entry point, JavaScript and CSS with expected MIME
  types and refused experiment, package and traversal paths. No trial content is
  copied to `dist/` or imported by game sources.
- Static review corrected keyboard-focus restoration, animation interruption of
  source reading, source-exposure metadata, replay/preview wording, a resetting
  home link and mobile access to the motion override. These corrections are not
  a substitute for rendered-browser verification.

## Browser check limitation

The prepared optional Playwright suite covers explanatory failure and revision,
both routes, reward idempotency, mist replay, Kids progression, Serious drafts and
counterexamples, optional Vietnamese support, Escape/focus handling, reduced
motion, a 390px viewport, console errors and preview path isolation.

**It did not execute successfully.** Direct Playwright launch failed with
`spawn EPERM`. A managed review rejected a headless-browser control attempt because
sandbox approval was required and disabled by policy. A safer direct screenshot
attempt also failed on Windows browser IPC/cache access. No permissions were
changed or browser sandbox disabled to force execution. No screenshot, browser
interaction pass, responsive-layout pass or accessibility-conformance claim is made.

Run that suite later in a permitted environment with local Playwright tooling and
the preview running. Its browser launcher explicitly enables Chromium sandboxing.
The optional borrowed test module is never a game dependency.

## Short human playtest

Open the local preview and observe without explaining the solution first:

1. Let a player choose a discovery and inspect or manipulate what interests them.
2. Watch whether they understand that their instructions affect Nim's actions.
3. Notice whether English matters, or whether visual guessing replaces it.
4. Invite revision after a failed plan. Check that feedback helps without distress.
5. Offer the other discovery or misty return; observe voluntary interest.
6. Try another mode and language; check the plan, draft and journal remain intact.
7. Try the short library follow-up later, recording assistance rather than claiming mastery.

Check keyboard navigation, readable text, source-dialog close/focus, mobile layout,
touch targets and motion preferences on actual family devices. The prototype's
three flows have not yet been observed with family users. The enjoyment hypothesis
remains open until that observation; more content should not substitute for it.

## Next gate

Address browser/family findings before expanding P0. If the loop is worthwhile,
continue P1's maintained Svelte/TypeScript setup and exact production-capable
contracts. Then issue the agreed small representative Luna sample checkpoint.
The disposable orchestration trial is not that sample and is not integrated.
Automatic production delegation still needs separate approval; see
[the trial result](luna-trial-result.md).
