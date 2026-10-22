# Family welcome and account refinement

Implemented and deployed 22 October 2026. All four jobs passed in
[run39711899094](https://github.com/phifin/fly-english-playground/actions/runs/39711899094)
at source `13970271f10a2328653e47789d9fd5573d80273d`, release
`eea5e980e95ccf33ace8`. Any later documentation publication must be checked in
its own Actions run. Production activation of the new admission rules is separate.

## Arrival and onboarding

The welcome now explains the game in one short invitation and offers an immediate
adventure action. It opens traveler creation and focuses the nickname field.
Existing travelers have a direct resume action; a recognized active traveler still
resumes automatically on a later visit. The illustrated island stays part of the
entry screen, with a concrete discovery invitation rather than more setup text.

Written English and Tiếng Việt controls are visible in the header before a
traveler exists. An explicit choice is saved as a non-sensitive browser shortcut;
new travelers inherit it in their initial validated storage transaction. Selected
travelers retain their own language. Switching language saves any draft, keeps the
current activity and answer, and does not change English proficiency or play mode.

Creation asks for a nickname first. Optional guardian setup sits in a disclosure;
cloud and recovery tools have a separate labeled disclosure. Brief device-saving
and shared-browser privacy explanations remain visible. The second step offers
three genuinely different play flows and an obvious exploration action. Starting
range and reading orientation are optional, clearly distinguished from certification.

## Shared visual and accessibility changes

Native selects retain platform menus and keyboard/screen-reader behavior. Their
closed controls have a spaced chevron, comfortable text padding and one clear
focus edge. Menus intentionally follow the operating system; replacing them with
custom popup widgets would add interaction and maintenance risks.

Shared controls, header language choices, ordering buttons and navigation now have
comfortable targets. Focus, disabled states, multiline alerts, narrow layout,
long account labels and forced-colors fallback are handled consistently. Motion
preferences and Eco equivalence remain intact. These changes do not certify
accessibility or establish subjective enjoyment without family feedback.

## Private family cloud

Local travelers, Google authentication and family admission are separate. A
successful sign-in can be pending, blocked or approved. Pending identities stay
signed in, can explicitly ask to join, and can check access without another popup.
Status/error explanations are localized and never depend on raw vendor messages.
No traveler or learning history is uploaded merely by signing in or asking to join.

Requests share only the verified Google email and display name with the family
owner. A server-provisioned owner can review, approve, decline and revoke access
inside the game. This role grants no access to another learner's progress and
cannot be created or changed by a client. Every data action checks admission again.
Existing profile identities, immutable events and deletion protections are retained.

Production activation requires the reviewed Firestore rules plus a one-time trusted
owner record. If those rules are not yet deployed, requests fail closed with a setup
explanation; normal local play and existing approved synchronization continue.
See [family cloud setup](../cloud/DEPLOYMENT.md) for the exact owner-only step.

## Verification

Coverage includes arrival at1440/390/320px, EN/VI before creation, inheritance,
typed form preservation, resume without invented learning events, select focus and
spacing, and language switching during a draft. Existing mission, all-mode, backup,
offline and account-isolation checks remain. Additional domain tests cover account
lifecycle, owner UI gating, new-profile defaults and request authorization. Actual
Auth/Firestore emulator tests cover spoofing, escalation and revocation. Google
consent and an approved production account remain a separate verification boundary.

Actual results:284 domain/unit passes,3 local emulator-dependent skips; all3 real
Auth/Firestore emulator tests passed in CI. Preview and live each passed25 browser
checks. Six checked interfaces had zero axe violations. Screenshots were visually
reviewed for desktop welcome, Vietnamese mobile welcome and mobile activity.
Live GET-only verification matched all27 manifest files/602328 cached bytes and
confirmed5 private paths unavailable. No browser sandbox was disabled. Native
select rendering measured50px high with44.8px trailing padding and a visible focus
outline; its open menu remains intentionally controlled by the operating system.
