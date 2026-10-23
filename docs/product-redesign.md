# Product experience redesign — October 2026

## Implemented direction

The mandatory coordinate/bridge-command puzzle was separate from the actual
English tasks. The main expedition now has a single story scene: choose a stop,
read its clue, act on it, receive corrective feedback, and restore a connection.
The task remains in the scene's workspace. Five completed activities let the
player explicitly collect the discovery; no separate spatial puzzle is required.
The old puzzles remain optional, with old paths and rewards preserved.

Balanced mode offers a scene and choice of stops. Kids reading stories offer
Nim's introduction, one next stop, optional read-aloud, and discovery pauses.
Serious mode opens the response workspace directly and offers an activity strip.
Mode and CEFR range remain independent. Existing assessed content and answer
checking have not been rewritten or relabelled as easier work.

Arrival offers local play and visible Google sign-in. Play opens a short entry
with an optional nickname and play-style choice; submission immediately starts
the appropriate experience, without a second onboarding form. Guardian controls
are optional. Returning travelers resume directly. Local/shared-browser storage
and explicit cloud-save boundaries remain visible and truthful.

## Developmental boundary and content acceptance

The six-picture activity is adult-assisted shared practice, especially for
children not yet reading. It is not an independent ages-4–5 course, a placement
test, or CEFR evidence. The grown-up can read the cue when browser speech is
unavailable. Speech synthesis is optional, user-triggered, device-dependent and
may require network access. No recorded-audio or speech-assessment claim is made.

Luna staged `data/staging/age45-visual-vocabulary-sample.json` and the accompanying
developmental review. Sol inspected the six words, bilingual cues, target and
distractor identities, the existing source contexts, and original SVG artwork.
One submitted boat source (`a1-lantern-harbor-shell-bell-03`) did not substantiate
the word and was rejected. The valid existing harbor source was retained.
`scripts/accept-picture-play.mjs --check` reproduces the accepted source module
and checks references, keys, IDs and NFC strings. It does not treat the submitted
metadata as approval. Original staging is preserved for traceability.

Accepted content module SHA256:
`9dcf4a9442dd06de8741a1b6116207e0c344f9f66f02c1100679544100dd2b72`.
Artwork is original repository SVG; no copied pictures or third-party fonts.
The 24 missions/120 reviewed A1–C2 activities remain unchanged.

## Data compatibility

No profile/database schema migration or history rewrite. New receipts use the
existing `mission` event envelope. `experience: story-v1` awards a discovery only
when the learning reducer independently confirms all five activities complete.
It never creates a solved legacy route or an assessed answer.
`experience: picture-play-v1` records a known picture item only, separately from
attempts, placement, review scheduling, proficiency and story rewards.
Imports, exports, per-user storage, immutable event IDs and cloud synchronization
continue to use the existing formats. Invalid/unknown picture IDs are ignored.

## Typography and components

Source audit found NFC text, no replacement characters, no character splitting,
and no remote/variable fonts. Tight negative serif heading tracking and 1.08
line height were confirmed risks; the precise reported external browser shaping
failure could not be reconstructed from source alone. New system-font headings,
normal Vietnamese tracking and generous line height avoid these risks without
font downloads. Native selects retain keyboard behavior and a visible focus
edge. Language buttons use a single active fill without nested borders.
Authored EN/VI content opts out of browser translation using standard `translate`
metadata; browser extensions can override it. We do not claim to have tested
external browser translation services or every OS/font fallback.

## Account admission decision

Google authentication is immediately discoverable. Signing in, linking a learner
and saving to the cloud are explained separately. A completed save is described
as a past save, not a continuing guarantee after more play. Members never handle
UIDs or backend infrastructure in the ordinary in-game workflow.

The existing secure owner approval remains. Unrestricted sign-up would preserve
per-account data isolation but permit unbounded public account/storage creation
on this private Spark project. Verified-email pre-invitations are preferable to
shared invitation codes, but require newly deployed server rules and revocation
precedence. Current tools expose no Firebase administration/deployment operation;
the prior authorized CLI readback failed twice. We did not broaden rules or ship
a client-side invitation bypass. Existing owner setup is reported complete and
must not be repeated. See `data/staging/account-redesign-decision.md`.

## Verification and limits

Unit regressions cover story receipts, no fabricated learning evidence, legacy
storage round trips, picture isolation, bilingual rendering and escaped content.
Browser checks extend the existing real-interaction/import/offline suite with
short onboarding, direct Google discoverability, story integration, optional
legacy routes, six-picture play and original Vietnamese DOM typography.
CI tests real Auth/Firestore emulators separately, then verifies the deployed
static release in fresh browser contexts. Actual results belong in project state.

Automated scenarios do not establish enjoyment, child suitability, educational
efficacy, full accessibility compliance, or real low-end-device performance.
Live Google consent and positive production cloud sync still need a private
signed-in session inaccessible to the agent. No new billing or runtime AI.
