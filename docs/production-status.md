# Production deployment status

Updated 21 October 2026. The active task remains a usable cloud-backed family release.

**Game:** https://phifin.github.io/fly-english-playground/

**Actions:** https://github.com/phifin/fly-english-playground/actions

The frontend is deployed. The dedicated Firebase service is now provisioned;
first-account enrollment and positive live synchronization verification remain.
The app retains local play, saving, exports and installed offline activities.

## Firebase provisioned

| Component | Verified state |
| --- | --- |
| Project | `unfolding-atlas-phifin`, number98369051475, newly created for this game; unrelated `phi-login` preserved. |
| Cost | Firebase reports **Billing Enabled: No**, before and after provisioning. No paid services or runtime AI enabled. |
| Web App | `1:98369051475:web:bb3e301135aae3689adfa6`; public identifiers retrieved through the authenticated MCP server. |
| Authentication | Google provider deployed. Public provider-URI requests return200 and Google Accounts URLs. No Auth users existed at the last check. |
| Firestore | Successful deployment with explicit default database, Standard edition and Singapore `asia-southeast1` configuration. Body-field index exemptions preserved. |
| Rules | Live readback matches the reviewed source after newline normalization. No client admission writes, cross-owner access or mutable learning events are allowed. |
| Live denial checks | Anonymous profile read, profile write and self-admission write each returned403 `PERMISSION_DENIED`. |

The official Firebase MCP connection now works. Project listing, creation,
selection, Web App registration, provider setup and deployment were performed
through its supported tools. Deployment job1792556405176 completed successfully.
No raw credential store, token, service-account key or proxy override was used.
The support address used for OAuth provisioning remains in ignored local artifacts.

The committed public config enables the connection for enrollment. Until admission
is granted, Google identities cannot read or write private game records. The
public Firebase API key is a client identifier, not an administrator credential.

## Required owner enrollment

These operations are absent from the installed core/auth MCP tool set. CLI15.34.0
also ignores `auth.authorizedDomains` during provider deployment; adding that field
would not fix the live setting. Do not reinstall or repeat Firebase CLI login.

1. Open [Authentication settings](https://console.firebase.google.com/project/unfolding-atlas-phifin/authentication/settings).
   In **Authorized domains**, add exactly `phifin.github.io`, without protocol or path.
2. Open the game after the cloud-enabled deployment, create/select a traveler,
   and use **Settings → Sign in with Google**. An unapproved-account message is
   expected initially; the sign-in creates the Firebase identity without granting data access.
3. In [Authentication users](https://console.firebase.google.com/project/unfolding-atlas-phifin/authentication/users),
   copy that identity's UID. In [Firestore](https://console.firebase.google.com/project/unfolding-atlas-phifin/firestore),
   create collection `access`, document **that UID**, and Boolean field `approved`
   set to **true**. Sign in again in the game, then explicitly link and sync a traveler.

Never use an email address as the admission document ID. No permissive temporary
rules or password sharing are necessary. Guardian-managed dependents use the
guardian's identity; each independent adult requires their own explicit admission.

After enrollment, verify the live popup/admission, upload and restore on a second
trusted browser, retry after disconnection, and deleted-profile protection.
Those positive production flows have not yet been claimed as passing.

## Actual quality evidence

The last fully verified local-only deployment was
[run39541377960](https://github.com/phifin/fly-english-playground/actions/runs/39541377960)
at commit `b0987b578f98a9926145bdd10136ca0d86c8c96e`. All four jobs passed:
build, real Auth/Firestore emulators, Pages deployment and live browser/integrity
verification. Both preview and live passed19 browser checks, covering all three
modes, all five activity types, IndexedDB/reload/drafts, profile isolation,
backup/import,390px touch/keyboard, text escaping and installed offline reload.
Axe found no violations on four checked screens. Root inspected desktop/mobile
screenshots. This is not WCAG certification or actual low-end-phone testing.

The cloud-enabled changes add fail-fast validation of enabled public config and
a real-browser SDK gate. The gate loads actual pinned Firebase modules, checks
successful repeated preparation, matching emitted CSP, signed-out state and no
unexpected authentication/data calls or popups. Disabled config still requires
zero external requests. It neither mocks the SDK nor supplies Google credentials.
Its actual preview/live result must be read from the new Actions run before claiming
it passed. The latest local suite passed260 tests, with two actual emulator tests
skipped locally and required separately in CI. The enabled production build passed.

CI uses preinstalled stable Chrome with its existing Ubuntu AppArmor profile and
`chromiumSandbox:true`. No browser sandbox or operating-system protection was
disabled. Private artifacts include `firebase-provisioning.json`, public Auth
configuration/provider checks, live denial checks, and release browser evidence.
They are excluded from the static build and repository publication.

## Limits

Real Google consent, approved cloud synchronization and actual family Safari/iOS
behavior still need verification after enrollment. Emulator tests use real rules
and the actual synchronization controller through a REST transport; they do not
prove the production popup or CDN adapter. Content remains a reviewed finite
foundation:24 missions,120 activities and24 boards across A1–C2, rather than a
complete course or certified assessment. No paid speech/AI scoring is claimed.
