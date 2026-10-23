# Account entry and private family admission — 2026-10-23

Status: account presentation implemented; production admission rules unchanged.

## Delivered entry improvements

- `cloudView({ presentation: 'inline' })` exposes Google sign-in without an expandable container. The default disclosure remains for settings and older callers.
- Short English/Vietnamese guidance adapts to no traveler, local traveler, linked traveler, another account, and waiting family access.
- Local play needs neither Google sign-in nor family approval. Sign-in and linking are explicitly distinguished from saving a cloud copy.
- A successful sync is described as a completed past save, not an ongoing guarantee that every traveler or subsequent activity is backed up.
- Account names/emails remain escaped and are marked `translate="no"`. Existing action names, controller behavior, permission enforcement and stored records are unchanged.
- View and lifecycle regression suite: 21 passed, zero failures/skips, using `node --test --test-isolation=none tests/cloud-view.test.mjs tests/cloud-lifecycle.test.mjs`.

## Admission alternatives

1. **Unrestricted Google registration:** simpler arrival and per-UID rules can still isolate data, but any Google user could create cloud profiles/events and consume the project's shared free quota. Not recommended for this private ten-person service without a separate abuse-control design.
2. **Shared invitation code in the frontend:** a public client cannot securely grant admission by itself. A reusable code leaks easily and needs server-enforced redemption/revocation. It is not a shortcut around the current rules.
3. **Verified-email pre-invitations:** preferred next improvement when production rules deployment is available. The owner enters a known Google email ahead of time. Rules require verified Google identity matching an owner-created invitation and grant only ordinary membership; no administrative promotion. A revoked UID must override any existing invitation so sign-in cannot undo revocation. Keep invitation records readable only by the intended verified identity and owner, bounded owner queries, and existing per-UID learner-data isolation. Preserve current grants and the explicit request path for non-invited relatives.
4. **Current explicit request:** secure, already tested and owner-activated; it remains the available production fallback. The owner makes the approval inside the game, and the learner can keep playing locally and refresh access without another Google popup.

Pre-invitations remove waiting at arrival for anticipated family members, not the need for the owner to decide who belongs to the private family. They require controller, rules, emulator attack cases and production deployment as one coherent change. An unverified frontend feature flag cannot replace server enforcement.

## Actual deployment capability audit

- Current `ALL_TOOLS` has no Firebase/Firestore/admin MCP methods. The broad textual match for rulesets is GitHub, not Firebase.
- Plugin discovery confirms official **Firebase** is installed and enabled (`plugins_6a8ddf314ab88191864c208fda197798`). Installed does not mean an MCP tool is callable in this session. No reinstall or login was requested.
- `scripts/firebase-mcp.mjs` loads the installed official CLI 15.34.0 in process, using existing authentication and `mcp --dir cloud --only core,auth`. It changes neither proxy nor security policy. Its omission of the separate Firestore remote-discovery feature does **not** omit core rules/deploy capabilities.
- Installed official source `lib/mcp/tools/core/index.js` includes `get_security_rules`, `validate_security_rules`, `deploy`, and `deploy_status`. `deploy.js` calls official deployment with the authenticated host project/config. Thus the local launcher is not missing a deploy implementation; those tools simply are not exposed here. Do not replace it with a custom credential proxy.
- The existing safe receipt `artifacts/firebase-activation-verification.json` records an existing CLI account and HTTP 500 at production rules readback. This path was tried twice previously. No identical third retry, credential export, network-policy change, account impersonation or speculative deploy was performed.
- `.github/workflows/pages.yml` runs isolated demo-project Auth/Firestore emulators and GitHub Pages deployment. It contains no configured production Firebase deployment identity. Emulator success cannot publish or prove deployed production rules.
- The owner already confirmed the current rules deployment and owner bootstrap. This audit does not ask for either step again or infer that authentication failed.

Conclusion: no verified usable production rules-deployment path is currently available to this agent. Preserve existing admission while improving visible entry and messages. To ship pre-invitations later, use an exposed authenticated official Firebase tool or an authorized owner-side rules deployment **after** new rules/controller/emulator tests are prepared. Do not advertise invitations as active before verified deployment.

## References

- [Firebase rules and authentication claims](https://firebase.google.com/docs/rules/rules-and-auth) — verified email and Google identity conditions.
- [Firestore rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions) — authorization through authenticated identity and document access.
- [Firestore quotas](https://firebase.google.com/docs/firestore/quotas) — shared usage and bounded rules evaluation; rules do not make arbitrary account growth free.

The invitation recommendation is a design inference using these capabilities, not a claim that Firebase provides a built-in family invitation feature.
