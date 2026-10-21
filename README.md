# The Unfolding Atlas

A family English-learning game about restoring an unfinished world. Read a clue,
guide Nim across bridges, recover discoveries, and revisit language over time.
Kids uses direct movement and guided moments; Balanced uses route planning and
exploration; Serious offers a study queue and text commands. Learning evidence
and world accomplishments are tracked separately.

**Status: locally testable release candidate.** The complete local journey and
deployment configuration are implemented. Managed Windows restrictions prevent
graphical browser execution here; the required browser and Firestore emulator CI
gates have not run. No live site or cloud project has been provisioned. See the
[release report](docs/release-report.md) for actual checks and remaining gates.

## Play locally

Use Node.js 24 or newer. There are no application packages to install.

```sh
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/** while the preview process is running. Create a
traveler, choose your experience and guidance language, then start exploring.
The optional short orientation suggests a practice range; every band is available.
Use `npm run dev` for a source preview without the installed offline release.
The preserved P0 light-and-mirror sandbox is at `/observatory.html`.

## Included

- Six regions, **24 expeditions, 120 activities and 24 exploration boards**:
  four expeditions and 20 activities in each A1–C2 practice band.
- Choice, constrained gaps, sentence construction, contextual matching, and
  rubric-based writing. Writing is self-reviewed; it is not automatically scored.
- Explanations, mistake repair, scheduled retrieval, a field journal, provisional
  placement and personalized practice suggestions. No certified CEFR scores.
- Independent Kids/Balanced/Serious, English/Vietnamese-assisted, quality and
  motion preferences. Changing them preserves evidence and accomplishments.
- IndexedDB profiles, guardian/dependent links, recoverable drafts, validated
  export/import and scoped offline assets after successful installation.
- Optional allowlisted Google/Firebase synchronization, disabled by default.
  A guardian manages dependent profiles under one cloud identity. Local profile
  selection is a convenience on a trusted browser, not a password boundary.
- Ungraded synthesized listening/retelling studio; no recording or paid AI API.

This is a finite foundation library, not an entire A1–C2 course. Listening,
speaking and open writing do not contribute automatically scored proficiency.

## Verify and deploy

```sh
npm test
npm run validate:content
npm run build
npm run measure
```

`npm run test:browser` uses separately installed Playwright tooling against a
running built preview. It downloads nothing. The included GitHub Actions workflow
installs test-only tools and requires browser/axe and actual Firestore rules checks
before deploying `dist/` to GitHub Pages. Repository creation and Pages settings
still require owner access; no deployment URL is assumed.

Publish **only `dist/`**. Staging, docs, experiments, tests and learner exports
must not be published. Public game content includes answer keys. Learner data
stays in browser storage unless explicitly exported or synchronized.

- [Family guide](docs/family-guide.md)
- [Release report and remaining setup](docs/release-report.md)
- [Static deployment and optional cloud setup](cloud/DEPLOYMENT.md)
- [Architecture](docs/architecture.md), [storage](docs/storage.md),
  [content and world contracts](docs/runtime-contract.md)
- [Current state and continuation instructions](docs/PROJECT_STATE.md)
- [CI verification](docs/ci-verification.md)

Native Luna prepares bounded educational batches in `data/staging/`. Sol reviews
the actual files and records accepted hashes before publication. Submitted
approval flags never authorize content. This autonomous workflow supersedes the
historical manual-handoff and milestone approval gates in Phase 1/P0 documents.
