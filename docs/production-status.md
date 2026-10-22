# Production deployment status

Updated22 October2026. [Play The Unfolding Atlas](https://phifin.github.io/fly-english-playground/).

The UI/UX refinement is deployed. All four jobs passed in
[run39711899094](https://github.com/phifin/fly-english-playground/actions/runs/39711899094),
source `13970271f10a2328653e47789d9fd5573d80273d`, release
`eea5e980e95ccf33ace8`. Documentation updates may create later runs; consult
[current Actions](https://github.com/phifin/fly-english-playground/actions) for them.

## Verified frontend

- Clear adventure entry, returning-player resume and visible EN/VI guidance before
  registration. Guidance persists, is inherited by new travelers, and remains
  independent of experience mode and learning progress.
- Progressive disclosure for guardian setup, cloud and recovery; simplified mode
  onboarding, native controls with consistent focus and spacing, larger targets,
  responsive headers and readable localized account states.
- 284 unit/domain passes;3 emulator-dependent checks skipped locally and all3
  executed successfully against actual Auth/Firestore emulators in CI.
- 25 browser checks passed in preview and production, including all three experience
  modes, five activity types, drafts, exact backup integrity, offline reload and
  keyboard/mobile interaction. Arrival was tested at1440/390/320px. Six checked
  interfaces had zero axe violations. Screenshots were reviewed visually.
- Actual pinned Firebase13 SDK preparation and CSP passed; deliberate CDN503 failure
  settled without render loops, automatic retries or loss of typed profile input.
- Independent live GET-only verification matched27 manifest files/602328 cached
  bytes,24 missions/120 activities/24 boards, and5 private-path404s. The browser
  retained its sandbox and Ubuntu AppArmor protections.

## Firebase and owner activation

The dedicated project is `unfolding-atlas-phifin`, number98369051475, Web App
`1:98369051475:web:bb3e301135aae3689adfa6`. It was provisioned with billing disabled,
Standard Firestore in Singapore and Google sign-in. The unrelated `phi-login`
project was preserved. The Pages domain `phifin.github.io` was independently
confirmed in public Auth configuration; no repeat domain action is needed.

Existing deployed rules isolate approved users' profiles, immutable learning events
and deletion markers. Anonymous profile reads, profile writes and self-admission
writes each returned403 in the earlier live denial check. Reviewed rules readback
at that provisioning checkpoint had SHA256
`a538d3641f630eea317ea16f2f8cb0ef7d0c6b2e490e6ee720116043ab483009`.

The new enrollment rules have SHA256
`8b447f5208f830025eb32f5ec1063849d4ffaaade02c0164d172626d97be362f`
and passed actual emulator tests for identity spoofing, role escalation, request
privacy, owner isolation and revocation. They are **not yet claimed deployed**.
This session exposes no Firebase administration operations; normal terminal owner
deployment and trusted bootstrap are the remaining account-side dependency.

See [exact owner setup](../cloud/DEPLOYMENT.md). After that one-time setup, ordinary
members sign in, ask to join and check approval inside the game. The owner approves
or revokes them in the game. No ordinary member needs Firebase Console or a copied
technical identifier. Owner authority cannot be created by a client. Owner access
management never grants access to another learner's progress.

Until activation, requests fail closed with localized setup guidance; local saving,
exports, installed offline activities and previously approved sync remain available.
Google authentication no longer signs pending users out. No traveler is uploaded
merely by signing in or asking to join. No billing, Cloud Functions or paid AI added.

## Remaining verification boundaries

Actual Google consent, approved production cloud synchronization and owner decision
UI need live verification after owner activation. Emulator results do not prove
those production operations. Real Safari/iOS, screen readers and low-end hardware
were not exhaustively tested. Automated axe checks are not WCAG certification.

The educational library remains a finite reviewed foundation across six CEFR bands,
not an entire course or certified assessment. Open writing is self-reviewed;
listening and speaking are useful practice without automated proficiency claims.
