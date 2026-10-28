# Account entry and family enrollment

The game has two separate identities: a device-local learner and an optional
Google account used for private cross-device saving. Signing in never silently
links, uploads, merges, or deletes a guest learner. Existing access grants and
profile ownership remain unchanged by this update.

## Returning sign-in

The pinned Firebase browser adapter uses IndexedDB auth persistence, with the
SDK's local-storage persistence fallback. `restoreSession()` waits for auth
initialization and then checks admission without opening a popup. `prepare()`
only loads the adapter and remains available to the credential-free CDN/CSP
verification. Cross-tab auth observations invalidate old operations before
publishing another account's status. Sign-out immediately clears the app's
private account presentation and prevents pending work from restoring access.

The browser retains local learner records for recovery. UI filtering is not
encryption or protection from someone who controls the browser profile. Family
members should sign out on shared devices. A provider sign-out failure must be
resolved before treating that browser as safely disconnected from Google.
The controller publishes `signout-failed` / `cloud/signout-failed` with no active
UID and localized retry guidance. Auth observations, sign-in, and restoration
remain suppressed until an explicit retry succeeds. A non-secret pending-signout
marker survives reload when local storage is available; retry initializes the
provider if necessary and clears its persisted session. If browser storage is
unavailable, the guard still applies during the current page session.

## Invitation model

A bootstrapped family owner enters an intended member's Google email in the
game. This writes a bounded `familyInvitations/{lowercaseEmail}` document:

```json
{"email":"member@example.test","enabled":true,"claimedBy":""}
```

No email is sent. The owner shares the normal game URL directly. When the
matching verified Google identity first signs in, a Firestore transaction
claims that invitation, creates only `access/{uid}: {approved:true}`, and
records their Google name/email in `joinRequests/{uid}` for owner management.
The access grant and invitation claim must both succeed atomically. There is
no administrative role in the self-enrollment path.

Only the family owner can create, disable, or list invitations. A member can
read only the invitation matching their verified Google email. There is no
public email-directory query. Owner list queries require a maximum of 100
records. Invitations cannot be transferred, reused, or reset after claiming.
An existing blocked account cannot regain access by claiming any invitation;
the owner must explicitly restore its access through member management.

Revoking an unused invitation prevents enrollment. It does not revoke an
already admitted account. Use member access controls for that. Existing approved
members do not need invitations. Uninvited members can play locally or use the
existing explicit request flow. This keeps a private family boundary without
requiring each invited family member to wait for approval after signing in.
Unlimited public self-registration is deliberately not enabled.

New rules must be deployed before invitations function. Older rules deny this
optional collection; the controller keeps successful Google authentication and
falls back to the existing pending/request path. It never weakens authorization
or repeatedly opens consent when admission encounters a network error.

## Controller contract

- `restoreSession()` restores the provider identity and admission status.
- `signOut()` also retries an incomplete sign-out with no active UID; successful
  completion clears the pending-signout marker. Failure leaves local learner
  records intact and rejects with `cloud/signout-failed`.
- `inviteFamilyMember(email)` normalizes and creates/enables an invitation.
- `revokeFamilyInvitation(email)` disables an invitation without changing grants.
- `listFamilyInvitations()` returns the updated controller status.
- `familyInvitations` contains `{email, enabled, claimedBy, state}` entries.
  State is `invited`, `revoked`, `approved`, or `blocked`.
- `invitationAvailable` is unknown (`null`), supported (`true`), or unavailable
  under the active server rules (`false`).
- `authReady`, `uid`, `email`, `displayName`, `approved`, `familyOwner` describe
  authentication and admission separately. No tokens are returned to the UI.
- `syncedProfileId` and `syncedAt` identify the last successful profile sync.
  `syncedAt` is a conservative operation-start watermark, not a claim that work
  added during an upload was included. `syncingProfileId` names the active sync.

## Verification and deployment boundary

Controller tests cover persistent-session restoration, absent SDK recovery,
late auth/admission responses, cross-tab identity changes, invitation fallback,
blocked access, owner authorization, immediate sign-out presentation, stale
invitation responses, and progress created during synchronization.

The mandatory GitHub-hosted Auth/Firestore emulator job includes actual rules
checks for atomic invitation claims, verified-provider/email matching, role
injection, independent admission/claim writes, invitation reuse and revocation,
blocked-account re-enrollment, privacy, bounded queries, and existing data
isolation/immutable history. Local unit execution skips emulator scenarios when
the emulators are absent; that is not evidence those rules checks passed.

These new Security Rules are a prototype designed to preserve per-account data
isolation and restrict invitation claims to one verified identity with no owner
privileges. Independent review and actual emulator verification are required
before broad sharing or production deployment. No claim of production rules
activation or private Google consent verification follows from a unit test.

The app uses the existing Spark project and requires no billing, server,
runtime AI, or additional provider. Rule deployment and a positive real Google
sign-in remain separate from credential-free SDK checks and emulator evidence.
