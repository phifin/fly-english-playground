# Production deployment status

Verified 21 October 2026.

**Working game:** https://phifin.github.io/fly-english-playground/

**Successful deployment and verification:**
https://github.com/phifin/fly-english-playground/actions/runs/39537300956

The frontend is deployed and verified. The full family release is not yet complete:
production Firebase configuration remains blocked on the account's host connection.
The deployed app deliberately keeps cloud disabled and uses persistent local
profiles, downloaded activities and private export/import. No Firebase project or
provider has been claimed as provisioned.

## Verified access and publication

The GitHub connector authenticated as the repository owner and reported admin/push
permissions. Actual publication confirmed write access: initial commit
`07b435bdb2ddebb06beecd32425a358434d9946b`, full source commit
`d56073044ee47afc3cf3d522176e288a8a32bfd3`, then CI fix
`43fed8be52f1e820b6583df40094cd51131f124f`. All existing history was retained;
no forced update was used. The owner enabled Pages with GitHub Actions.

The build uses project-relative assets and the verified
`/fly-english-playground/` prefix. Only the public static allowlist is deployed.
The expected release is `f44aa06ace219f598cdf`: 24 missions, 120 activities,
24 boards, 24 manifest entries and 553,256 raw cached asset bytes. An independent
GET-only check confirmed every manifest hash/byte count, service-worker release
identity and five private/missing paths returning404.

## Actual automated checks

All four jobs in the linked run passed:

| Job | Actual result |
| --- | --- |
| build | Domain/content/storage tests, build, project-prefix integrity and sandboxed browser checks passed. The general suite had243 passes and2 emulator skips; the dedicated emulator job executed those two checks. |
| firestore-rules | Real Auth and Firestore emulators:2 tests passed,0 failed,0 skipped. Synthetic identities exercised admission, owner isolation, immutable events, guardian/dependent recovery, device-local drafts, offline merging, lost acknowledgements, revocation and deleted-ID protection. |
| deploy | GitHub Pages deployment succeeded. |
| verify-production | Expected release/integrity verification and the browser suite passed against the action's actual Pages URL. |

Both the prefixed preview and live site passed19 browser checks. These exercised
the three gameplay modes, all five activity types, actual browser IndexedDB,
settings and draft recovery, separate family profiles, validated backup UI,
390px touch/keyboard layouts, text escaping and installed offline reload.
The live report recorded no browser errors. Axe found no violations on the
journal, mobile activity, mobile Echo Studio and settings screens.

The first run failed before browser interactions because downloaded Chromium
lacked a usable sandbox on the runner. The fix uses preinstalled stable Chrome's
existing Ubuntu AppArmor profile, with `chromiumSandbox:true`. No AppArmor,
namespace or browser-sandbox protection was disabled. The successful report records
Chrome155.0.8059.84. Root inspected the actual desktop and mobile screenshots.

These are not full WCAG certification, educational efficacy, low-end hardware or
live Google OAuth tests. The cloud emulator uses the actual controller and local
validation through a REST test transport; it does not prove production CDN SDK/
popup behavior. Screenshots and reports are retained as private workspace
artifacts and in the run's short-lived GitHub evidence artifacts.

## Firebase authentication and remaining blocker

The official Firebase plugin and CLI15.34.0 are installed. The owner's login is
recognized by the official MCP server's environment tool. Server startup was
recovered using its supported writable development-log path; a real MCP handshake
succeeded. This verifies recognized local identity, not remote project permission.

The project-list tool currently fails through the managed SDK network path at
proxy127.0.0.1:9 with ECONNREFUSED. No project list or Spark plan could be read, so
it is unknown whether the intended project already exists. No new billing,
project, credentials, production database, OAuth provider or admission grant has
been created by the agent.

The owner confirmed both Firebase entries fail after restart. Investigation
found unavailable bare Node/npx commands and reproduced a separate Firestore
remote tool-discovery error. The corrected `scripts/firebase-mcp.mjs` starts
the installed official package with core/auth discovery and keeps development
logs in the writable workspace. Actual stdin/stdout initialize and tools/list
passed with20 tools and zero non-protocol stdout lines. The original Firestore
setting returned error-32603 and zero tools. See
[the diagnostic report](firebase-mcp-troubleshooting.md).

Registering the corrected `atlas-firebase` host connection requires one command
in a normal owner terminal, because Codex user configuration is outside the
agent's writable roots. Use the stable absolute Node executable; the restarted
environment does not resolve bare `node` or `npx`:

```powershell
codex mcp add atlas-firebase -- "C:\Users\nhuphi.vo_amaris\AppData\Roaming\fnm\node-versions\v24.22.0\installation\node.exe" "C:\Users\nhuphi.vo_amaris\Documents\my-english-learning-engine\scripts\firebase-mcp.mjs"
```

Restart/resume this project's conversation and check `/mcp` for `atlas-firebase`.
No proxy, sandbox or account permissions are weakened by the launcher. Its
actual remote connection and project-list call must still be verified.
Installing a plugin is not itself authentication. This installed server uses CLI
credentials over stdio; the applicable Google login is Firebase CLI login, not
`codex mcp login firebase`. The owner has already completed that login and does
not need to repeat it unless a supported tool explicitly requests authorization.
[Firebase MCP credential model](https://firebase.google.com/docs/ai-assistance/mcp-server),
[Firebase CLI login](https://firebase.google.com/docs/cli#log-in-test-cli).

Once remote access is operational, remaining work is to inspect existing projects,
keep/reuse a clearly matching Spark project or create a dedicated free project,
register its Web App, enable Google sign-in for `phifin.github.io`, deploy the
reviewed rules/indexes, establish approved guardian identities and verify actual
cloud isolation/synchronization. Only public client identifiers go into the site.
No private credentials or paid runtime AI are required. Keep billing disabled.

The game can currently be opened and used locally in the published origin; the
owner requested a complete cloud-backed release, so that task remains active.
