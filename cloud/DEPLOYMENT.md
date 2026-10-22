# Static release and optional family cloud

Local play, profiles, saving, exports and reviewed public content do not require
Firebase. The game is deployed at https://phifin.github.io/fly-english-playground/.
Production project `unfolding-atlas-phifin` and its Web App have been created;
billing is disabled. Google sign-in and Standard Firestore rules/indexes were
deployed successfully through the authenticated official MCP server. Reviewed
rules match live readback; anonymous reads, writes and self-admission are denied.
`public-config.js` contains only the actual public Web App identifiers and enables
the connection for account enrollment. See [current status](../docs/production-status.md)
for the remaining Pages-domain and initial admission actions. Actual approved
Google sign-in and live synchronization still require verification.

## GitHub Pages

Use Node 24 or newer and run:

```sh
node --test --test-isolation=none tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs --dist
```

The preview prints its loopback URL (default port 4173). Development preview omits
`--dist`. Build output is `dist/`; publish this artifact alone. The builder copies
only explicit HTML/CSS/config/worker files, browser modules, approved asset formats,
and `data/published/`. Staging, experiments, docs, tests, cloud rules, credentials,
and package/tooling files are excluded. Unexpected public inputs or output files
cause a failure. Symlinks are refused. Stale verified public files are removed
individually; no recursive deletion is used by the build script.

Both the atlas and `observatory.html` use relative paths, so a Pages repository URL
such as `https://OWNER.github.io/REPOSITORY/` works without a root-path rewrite.
There is no SPA fallback that returns HTML for absent data or scripts. GitHub Pages
serves the frontend publicly: app code, content and deterministic answer keys are
downloadable. Keep learner data and exports out of the repository.

In repository Settings → Pages, choose GitHub Actions. The included workflow runs
Node tests, a static build and Chromium release checks before uploading `dist/`.
Its browser dependency is pinned test-only tooling installed in the runner's temp
directory; application runtime dependencies remain zero. Pull requests cannot
deploy. A push to `main` or manual workflow run deploys the tested artifact using
the Pages environment. Configure branch/environment protection as appropriate.
Actual CI and deployment results must be inspected; writing this workflow is not a
successful deployment. Action major tags should be reviewed with dependency updates.
[GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Offline behavior and updates

The build creates a content-derived release ID and `offline-manifest.json` with
hashes. `src/offline.js` registers `sw.js` only when the built page contains the
release marker and the browser supports a secure service-worker context. The
worker installs the public release after checking file hashes, within a 50 MiB
budget. First use requires a network; a completed installation makes those public
files available offline. Installation failure never pretends the cache is complete.
Browser caches and IndexedDB can be evicted and are not backups.

Caches are scoped to the Pages project path. Cross-origin traffic, authentication,
cloud APIs, requests carrying Authorization headers, query-string callbacks and
non-GET requests are never cached or intercepted. Missing JSON remains missing;
the worker never substitutes the app shell. No learner record or access token is
stored in Cache Storage. Static Firebase web configuration is public and is cached
as part of the public release, not as a credential.

New workers wait while the current application is open. There is no automatic
`skipWaiting` or reload during a session. The optional `onUpdate({activate})`
callback may offer an explicit update after saving. Otherwise closing all app tabs
allows the new version to activate. Rollback means redeploying a previous validated
artifact and letting its worker follow the same update path. Export before clearing
site storage; clearing it removes local learner records as well as offline assets.

## Reproducing Firebase setup

The following records the setup process; do not create another project or repeat
login for this release. The existing project is on Spark with default Standard
database in `asia-southeast1`. Its reviewed rules and body index exemptions were
deployed with job1792556405176. The owner support address used for Google provider
provisioning is retained only in ignored local provisioning artifacts.

CLI15.34.0's auth deployment enables the Google provider but does **not** apply an
`auth.authorizedDomains` field. Source inspection and the public Auth configuration
confirmed this limitation. Set the exact Pages hostname through Authentication
Settings; do not assume adding an ignored JSON field deployed it. Current core/auth
MCP tools also lack Firestore document writes, so the initial server-managed grant
uses the owner's Firestore console. No permissive bootstrap rules are needed.

1. Create a Firebase project on **Spark**, with no linked billing account. Do not
   enable paid Cloud Functions, Cloud Storage uploads, runtime AI or paid backups.
2. Register a Web App; copy its public configuration into `public-config.js`.
   Keep `enabled:false` until rules and admission are ready. Use the default
   `PROJECT_ID.firebaseapp.com` auth domain. Never place Admin SDK/service-account
   credentials in any frontend file.
3. Enable Google in Authentication → Sign-in method. Add the precise Pages hostname
   and any local development hostname you actually use to authorized domains.
4. Identify the target database's edition and location before changing it. This
   client uses Firestore document Core APIs, document-path Security Rules and the
   default database. Keep the project on Spark without billing; do not provision
   a paid database or substitute an Enterprise/Pipeline SDK. Create the default
   database in a deliberate region, in production mode, if it does not exist.
   Publish `firestore.rules` and the supplied index exemptions. Console rule
   editing needs no deployed server. With separately installed Firebase CLI, run
   from this `cloud/` directory:

   ```sh
   firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes
   ```

5. Sign in once to create the approved person's Firebase Auth identity, then copy
   its UID from Authentication → Users. Through the owner's Firestore console,
   create `access/UID` with Boolean field `approved:true`. The app itself can never
   create or edit this grant. Repeat only for approved independent adults/guardians.
   Unapproved OAuth identities receive no private app access.
6. Run the emulator rules suite below and perform the live smoke checks before
   relying on cloud. Set `enabled:true`, rebuild and deploy. A disabled or incomplete
   config keeps all local features available and reports cloud as unavailable.

Spark needs no payment method. Free Firestore quotas currently include 50,000
document reads/day, 20,000 writes/day and 1 GiB stored data. This app uses manual
event-set synchronization, not history listeners or polling; a large history still
consumes reads. Keep billing disabled, watch usage and maintain downloaded exports.
The service's free terms may change, and quota/network failure preserves local
progress rather than promising uninterrupted cloud service.
[Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans),
[Firestore quotas](https://firebase.google.com/docs/firestore/quotas)

## Cloud API and privacy model

`createCloud({store,onStatus})` returns `configured`, `status()`, `prepare()`,
`signIn()`, `signOut()`, `linkProfile(id)`, `sync(id)`, `restoreProfiles()` and
`deleteRemoteProfile(id)`. Status snapshots have `configured,state,uid,
boundProfileIds,message`. No status callback runs during construction. Only an
explicit `prepare()`/sign-in loads optional Firebase browser modules; preparation
in the cloud panel can avoid loading delays before the popup gesture. Popup
restrictions and actual Safari/mobile behavior must be checked on family devices.

The pinned SDK version 13.0.0 follows the current official browser-module setup.
Auth uses memory persistence and Firestore Lite uses network requests without an
additional persistent Firestore cache. The app requests Google identity only, not
Drive, email or contacts scopes. SDK/CDN/proxy restrictions can still prevent
sign-in. No credential or private API response enters the service-worker cache.
The release browser harness now includes a credential-free check of real pinned
CDN modules, preparation, emitted CSP and signed-out state. Consult actual Actions
evidence for its result; it does not establish live Google consent or approved sync.
[Firebase web setup](https://firebase.google.com/docs/web/setup),
[CDN setup](https://firebase.google.com/docs/web/alt-setup),
[Firestore Lite CDN example](https://firebase.blog/posts/2023/03/trim-javascript-bundles-firestore-lite),
[Google sign-in](https://firebase.google.com/docs/auth/web/google-signin),
[Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)

The server-managed allowlist and `request.auth.uid` decide access. Cloud paths are
`users/UID/profiles/PROFILE_ID`, with child `events/EVENT_ID`; no client-supplied
guardian/mode/owner field grants access to another UID. Dependent profiles share
the guardian's identity. They have no separate password, public account, or
enforceable parent-only settings against someone using that authenticated session.
Independent accounts cannot read another family's profiles. Trusted local profile
selection is convenience, not protection against someone controlling the browser.

Profile binding is explicit and remains on the profile after sign-out. Sync refuses
an unlinked or differently owned profile. Link the independent guardian first,
then dependent profiles; syncing a dependent also synchronizes its guardian metadata.
Restoring imports only the signed-in owner's profile graph through strict local
validation. Signing out does not erase local history. Use a trusted browser, or
export and delete local profiles when leaving a shared device.

Signing out also invalidates pending SDK loading, popup and approval-check results;
a late completion cannot silently reconnect the account. Successful preparation
does not itself sign in or upload. Valid local record IDs containing periods or
colons retain the same identities when synchronized; cloud path validation and
rules accept that bounded local identifier format.

Sync includes profile metadata and immutable assessment/completion events, including
assessed response text that those events contain. **Draft events remain device-local**;
full local exports retain them. No recordings or arbitrary uploads are supported.
Cloud profile/event bodies are bounded JSON strings; the client validates their full
schema on import. Rules enforce identity, admission, allowed envelope fields,
bounded document sizes and event immutability. This is private household progress,
not tamper-proof exam certification.

Every event ID is unioned and compared, not incremented into a mutable score.
Retries compare an existing event before writing. Interrupted or failed sync leaves
all events locally available for the next explicit retry. Equal-revision divergent
profile settings or contradictory event IDs are rejected; export both device
copies before owner-assisted resolution. A simultaneously created event may arrive
on the next sync. The client checks the merged event count and record sizes before
upload, then rechecks its final local snapshot before writing events. A merged
history above 20,000 events/profile is refused without truncating learning data;
an oversized record also fails before event uploads begin. Existing cloud histories
above that bound require an owner-led export/migration. This is a client guard,
not an atomic server-wide count across simultaneous devices. Full exports remain the independent
recovery path; free app exports are not Firebase managed backups.

Cloud deletion first writes an immutable `users/UID/deletions/PROFILE_ID` marker,
then deletes events and metadata. Rules prevent an older offline client from
recreating a deleted ID. A guardian cannot be deleted while active dependent cloud
profiles remain. Explicitly delete each dependent cloud copy first, then the
guardian; a guardian deletion request never silently removes other profiles.
The local copies remain for export or separate explicit deletion. If interrupted,
retry cleanup; the tombstone already prevents resurrection. Tombstones contain
only IDs. Full account removal/revocation and Auth identity deletion use the owner
console; deleting a Firestore parent alone does not remove child collections.

## Verification before enabling cloud

Normal tests exercise synchronization using the real local validation/merge code
and an injected transport. They do not prove that deployed Firebase rules work.
`tests/cloud-rules.test.mjs` is an actual REST rules-engine suite, skipped unless
`FIRESTORE_EMULATOR_HOST` is supplied. With Firebase CLI and a suitable Java runtime
installed separately, run from the repository root:

```sh
firebase emulators:exec --project demo-atlas-rules --config cloud/firebase.json --only firestore "node --test --test-isolation=none tests/cloud-rules.test.mjs"
```

For the combined Auth and Firestore integration, run both emulators with the same
disposable demo project:

```sh
firebase emulators:exec --project demo-atlas-rules --config cloud/firebase.json --only auth,firestore "node --test --test-isolation=none tests/cloud-rules.test.mjs tests/cloud-emulator.test.mjs"
```

The CLI supplies `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`.
Set `ATLAS_REQUIRE_FIRESTORE_EMULATOR=true` and
`ATLAS_REQUIRE_CLOUD_EMULATORS=true` in required verification jobs so an absent
emulator fails rather than skips. Both test modules reject nonloopback endpoints;
the project ID is fixed to `demo-atlas-rules`. No production configuration or
credentials are needed. The combined test uses synthetic Google-provider
credentials accepted only by the Auth emulator and real Auth-issued emulator
tokens for Firestore requests. It exercises the real synchronization controller
and local validation through a REST test transport: family profile restoration,
owner isolation, unapproved denial, device-local drafts, immutable learning events,
offline merges, lost acknowledgements, revoked admission and deleted-ID protection.
It does not exercise the production CDN SDK, a browser popup or live Google OAuth.
[Auth emulator identity-provider testing](https://firebase.google.com/docs/emulator-suite/connect_auth),
[Auth REST OAuth sign-in](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-with-oauth-credential)

It uses only a loopback emulator with synthetic identities and tests anonymous and
unapproved denial, forged owner/grant denial, cross-owner reads, immutable events,
deleted-profile resurrection and revocation. No real cloud credentials are used.
After rules deployment, test approved versus unapproved Google accounts, two-device
offline merging, lost connectivity, export/restore and profile deletion on actual
family browsers. No live-cloud or emulator pass is claimed until those checks run.
The Pages workflow also prepares a required, credential-free Firestore emulator
job. Its explicit CI flag fails if the emulator is missing rather than skipping
the rules test. The combined emulator job passed in GitHub-hosted CI; see
[CI verification](../docs/ci-verification.md) for tool pins and gates. Those results
do not establish positive production authentication or data synchronization.
[Firestore rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions),
[Rule field validation](https://firebase.google.com/docs/firestore/security/rules-fields)
# In-game family approval (22 October 2026)

The game now separates local travelers, Google sign-in and admission. Ordinary
family members sign in, explicitly **Ask to join the family**, then use **Check
family access** after approval. They never need to copy an identifier or use the
Firebase console. Requests share only Google display name and verified email.

The owner has one trusted setup step before managing future requests in the game:

1. Deploy the reviewed rules from a regular authorized terminal in this repository:
   `npx -y firebase-tools@15.34.0 deploy --project unfolding-atlas-phifin --config cloud/firebase.json --only firestore:rules`.
2. Find your own game sign-in in Firebase Authentication users. In Firestore, set
   `access/{your UID}` to Boolean `approved: true` and Boolean `familyOwner: true`.
   Keep this owner role restricted to the account that actually manages the family.
3. Choose **Check family access** in the game. Open **Welcome your family** to
   review requests and allow or turn off each person's cloud access.

This is a one-time project-owner bootstrap, not an ordinary family-member flow.
Clients cannot promote owners, change owner records or access another learner's
private progress. Requests are immutable, identity-bound and limited to one document
per Google identity. The owner list is bounded to100 records. No public invitations,
automatic approvals, Cloud Functions, billing or runtime AI are introduced.

Until the reviewed rules are actually deployed, request submission deliberately
fails closed with a readable setup message. Do not claim in-game approvals are live
based only on the frontend deployment or emulator success.

