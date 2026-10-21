# Firebase MCP startup diagnosis

Verified 21 October 2026 against the installed official Firebase CLI15.34.0.
This is development tooling, separate from the deployed game's runtime.

## Findings

1. Restarted Codex's non-login environment cannot resolve `node` or `npx`.
   The official plugin invokes `npx`; the original custom registration invokes
   bare `node`. Node itself is installed in fnm's stable version directory.
   A shell-specific fnm PATH entry is insufficient for reliable host startup.
2. The custom launcher's previous `--only core,auth,firestore` has an independent
   failure. This CLI version combines local Firestore tools with remote tool
   definitions from `https://firestore.googleapis.com/mcp`. If that fetch fails,
   the entire `tools/list` request fails instead of returning the local tools.
   A real stdin/stdout test reproduced RPC error `-32603` and zero tools.
3. `Auth: Unsupported` is not the startup exception. The local stdio server uses
   existing Firebase CLI credentials; it does not require MCP OAuth login.
   The owner's CLI Google login was already recognized in a previous test.

The installed source supporting finding2 is `lib/mcp/tools/index.js`
(`getToolsByFeature`, `getRemoteToolsByFeature`) and
`lib/mcp/onemcp/onemcp_server.js` (`listTools`). No installed vendor files were
modified. No network, proxy, sandbox or authentication policy was weakened.

## Fix and actual verification

`scripts/firebase-mcp.mjs` loads the already installed official CLI, uses a
writable ignored development-log path, and now defaults to `core,auth`. Core
includes project/app management, Firestore initialization with supplied rules,
rule validation/readback and deployment. This does not remove application data
isolation or require permissive rules. Optional remote Firestore data tools can
be reconsidered after the host connection and endpoint are reachable.

The launcher also resolves Windows cache directories when APPDATA variables are
absent. `ATLAS_FIREBASE_MCP_DIAGNOSTICS=1` adds fixed startup milestones to stderr;
stdout remains JSON-RPC. No credential values are included in these milestones.

A real PowerShell stdin/stdout pipe test of the corrected launcher returned:

- Protocol `2025-06-18`, server `firebase` version `0.3.0`.
- Successful initialize at6843ms and tools/list at7315ms.
- 20 tools, including `firebase_list_projects`, `firebase_get_environment`,
  `firebase_init` and `firebase_deploy`.
- Zero non-protocol stdout lines; no explicit account/project tool invocations.

Sanitized results are in ignored `artifacts/firebase-mcp-stdio.json` and
`artifacts/firebase-mcp-firestore-discovery.json`. Tool discovery itself uses
existing cached CLI credentials and may perform internal API/telemetry calls.
These results prove local protocol startup, not remote project authorization.

## Required host registration

Codex user configuration is outside this agent's writable roots. Run this one
command from normal owner PowerShell to replace the custom server's bare Node
command with the verified stable executable, then restart/resume Codex:

```powershell
codex mcp add atlas-firebase -- "C:\Users\nhuphi.vo_amaris\AppData\Roaming\fnm\node-versions\v24.22.0\installation\node.exe" "C:\Users\nhuphi.vo_amaris\Documents\my-english-learning-engine\scripts\firebase-mcp.mjs"
```

Check `atlas-firebase` in `/mcp`; expected discovery is20 tools. The duplicate
official plugin entry still uses its original npx command; the custom entry is
sufficient for continued work. No reinstall, Google re-login or MCP OAuth login
is indicated by this diagnosis. If the pinned Node installation is removed in
the future, update the command to the replacement stable executable.

For a future independent pipe check, `scripts/check-firebase-mcp.mjs` uses the
Node binary executing it and saves sanitized initialization/tool-list evidence
in `artifacts/firebase-mcp-check.json`. Child-process creation in this managed
agent returns EPERM before Firebase runs, so that probe must run in a permitted
owner environment. It does not alter Codex configuration or call a listed tool.

## Remaining production work

The owner reconnected successfully. All20 core/auth tools are exposed; actual
remote project listing, project/Web App creation, Google provider provisioning
and Firestore deployment succeeded without billing. The previous managed-shell
network failure did not prevent the corrected host connection from operating.
No proxy or credential-policy workaround was used.

See [production status](production-status.md) for remaining Pages-domain and
first-account admission actions. These are distinct from MCP connection/login;
do not repeat installation or CLI authentication.

References: [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[Firebase MCP credential model](https://firebase.google.com/docs/ai-assistance/mcp-server).
