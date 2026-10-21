# Local learner storage

`await openStore()` from `src/storage.js` opens IndexedDB database
`unfolding-atlas-learning` (database version 2). The backup schema remains version
1. Upgrading an existing version 1 database adds only the `events.byActivity`
compound index on `['profileId','payload.activityId']`; it preserves the existing
profiles, events, metadata and `byProfile` index. No record rewrite is required.
It never substitutes volatile browser
memory. Handle rejected promises in the UI and show the supplied `StorageError`
message; a failed save must not appear successful. Every method in the runtime
contract returns a promise except `close()`. `getProfile(id)` returns `null` when
missing; event reads/appends reject when their profile is missing.

Profiles use the runtime contract's defaults plus `cloudOwnerUid:null`.
`updateProfile` accepts name/kind/guardianId/cloudOwnerUid and partial settings or
journey objects. Nested patches merge. No-op updates retain the revision; changes
increment it atomically. Cloud binding changes require an explicit caller action;
the local field is convenience metadata, not proof of authentication. Guardians
must be existing independent profiles. Cycles, self-reference, and deleting a
guardian with dependents are refused. Explicit profile deletion atomically removes
that profile and its own events; other profiles' history is retained.

`appendEvent(profileId,{id,kind,at,payload})` accepts attempt, mission, placement,
observatory, expedition, support, and draft. Use a fresh cryptographic ID and `new Date().toISOString()`
for each new event; reuse the same ID for a retry. Identical retries return the
same event; different data or profile under an existing ID is refused. Events are
immutable except for explicitly transient draft snapshots. `getEvents` returns
copies sorted by UTC timestamp then ID.

Drafts retain only the latest snapshot per `(profileId,payload.activityId)`, using
timestamp then ID to resolve ordering. Use stable string activity IDs; legacy
drafts without an activity ID share one slot within their profile. A newer draft
atomically replaces the earlier snapshot, so repeated writing autosaves do not
retain a history of partial answers. An older arriving draft is ignored. A
validated attempt with a string `activityId` and an own `answer` field removes
that activity's drafts at or before its timestamp, even when random event IDs
sort differently at the same time. Later drafts remain recoverable. Storage
validates this attempt envelope, not curriculum-specific answer completeness;
the UI must assess completeness before appending an attempt. Assistance that must
survive draft compaction belongs in immutable `support` events and attempt
assistance flags. Other event kinds remain intact.

The append promise returns the submitted event receipt even when a stale draft
is ignored; that receipt does not promise permanent retention of a transient
snapshot. Conflicting IDs are rejected while the original record is retained;
pruned drafts leave no content history or ID tombstones. The UI should save on
navigation or a restrained debounce, handle rejection, and show success only
after the promise resolves. Pruning, the new record, and accounting commit in
one transaction, so any failure preserves the prior recoverable snapshot.

Backups have this exact shape:

```js
{ schemaVersion: 1, exportedAt: 'UTC ISO with milliseconds',
  profiles: [/* complete profile records, including cloudOwnerUid */],
  events: [{ profileId, id, kind, at, payload }] }
```

`exportAll()` returns an isolated object. `importAll(objectOrJSONString)` validates
then merges the entire backup in one transaction, returning counts for profiles
added/updated/unchanged and events added/unchanged. Immutable learning history
merges by set union. Transient drafts compact with the same rules as append;
exports contain the retained snapshots, never superseded partial writing.
Older backups cannot resurrect drafts cleared by newer or equal-time submissions
because those immutable attempts remain in the merge. Ignored incoming draft
snapshots count as `eventsUnchanged`; `eventsAdded` counts only retained new IDs,
so repeatedly importing a stale backup is idempotent.
Identical events deduplicate; contradictory IDs reject the whole import. Higher
profile revision wins only when modification dates agree with that ordering and
creation identity remains unchanged. Equal-revision conflicting edits or different
nonnull cloud owners reject rather than silently overwriting settings. Partial
restores may refer to profiles already present; the final graph must be complete.
`validateExport` and `mergeExports` expose the same pure validation/merge rules.

All data is bounded plain JSON. Unknown profile/settings/journey fields, reserved
pollution keys, getters, functions, nonfinite numbers, cycles, sparse arrays,
excessive nesting, and markup/JavaScript URLs are rejected, not sanitized into
different learner answers. Text values allow at most 5,000 Unicode characters;
events at most 32 KiB, 4,000 payload nodes and 12 nesting levels. The database
budget is 64 profiles, 100,000 events and 36 MiB of record data; imports allow 40 MiB
including the wrapper. A reached limit refuses the new write and preserves prior
records. A metadata counter is updated in the same transaction as data, including
the byte and record credit reclaimed when drafts are pruned. Draft and attempt
appends with string activity IDs query only that profile/activity's events through
the compound index, avoiding reads of the learner's entire history on each
autosave. Legacy drafts or attempts without string activity IDs use the profile
index as a compatibility fallback. Other kinds use direct ID lookup and counters.
These limits are exported as `STORE_LIMITS`.

Mutations wait for IndexedDB transaction completion, not only a successful request.
Strict durability is requested when supported. I/O/quota/blocked/version-change
failures surface to the UI. Local and cross-tab notifications use window event
`atlas:store-change`, detail `{operation,profileId,external}`; BroadcastChannel
carries no learning payload. Notifications are best effort; reread the database
when a tab regains focus. No automatic cloud upload is performed by this module.
Browser data can still be cleared or evicted, and device failure is possible;
downloads and optional separately authorized sync remain important recovery paths.
[IndexedDB transaction behavior](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)

`createMemoryDatabase()` / `openMemoryStore({database,clock})` exist explicitly for
Node tests. Reusing a test database permits simulated connection reopening;
serialized copy-on-write transactions support rollback and concurrency checks.
They do not demonstrate browser disk persistence. The Node suite checks recovery,
immutable retries, draft compaction and stale restore prevention, import
atomicity/conflicts, graph integrity and hostile inputs. Injected transaction and
quota errors verify rollback after draft deletion, record writes and accounting
updates through the same API implementation used by IndexedDB. Instrumented
memory queries verify the activity-specific autosave path excludes unrelated
history; mocked open requests verify the schema creation/upgrade instructions.
Real IndexedDB, quota behavior, cross-tab notifications, private mode and browser
reopen behavior still require browser execution; no browser pass is claimed here.
