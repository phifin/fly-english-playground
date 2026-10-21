# Release runtime contracts

Native ESM, no installed runtime packages. Modules should be pure where practical. Public data is reviewed original material, never learner records or staging files. The original observatory remains a separate playable location.

## Content v1

`data/staging/<batch>/pack.json` contains `{schemaVersion:1,batchId,provenance:[],missions:[]}`. Only accepted missions are copied into `data/published/atlas.json` by Sol's acceptance tooling. Each source is `{id,title,url,accessed,usage}`; `usage` must explain reference-only original material or an explicit reusable license. Each mission is `{id,level,title:{en,vi},summary:{en,vi},objective:{en,vi},skill,topic,reward:{en,vi},sources:[sourceId],activities:[]}`. IDs are lowercase ASCII kebab case, globally unique. Level is A1/A2/B1/B2/C1/C2. Skill is reading/language/writing. Suitability is all-ages for this launch library; advanced proficiency must not imply adult content.

Each activity has `{id,type,skill,prompt,context,instruction:{en,vi},explanation:{en,vi},focus, ...typeFields}`. `prompt` and `context` are English assessed material; guidance translations must not supply the answer. Focus is a short stable English learning objective key. Type fields:

- choice: `options:[{id,text}]` (3–4), `answer` (option id).
- gap: `accepted:[string]` (1–5), one unambiguous blank `___` in prompt; accept case/space/punctuation normalization only. State an explicit restricted task if multiple natural alternatives exist.
- order: `tokens:[{id,text}]` (3–8), `answer:[tokenId]`, `alternatives:[[tokenId]]` optional. Token IDs unique, every answer a permutation. Sentence chunks should make the intended order unambiguous; list other legitimate orders.
- match: `pairs:[{id,left,right}]` (3–5). Each right side must uniquely match its left side. Display shuffles right-hand entries; submitted response maps left id to right id.
- writing: `rubric:[{en,vi}]` (2–4), `example` original English model. Reflective self-review only; no automatic correctness or CEFR credit. May include one writing activity per mission.

Mission IDs include band, e.g. `a1-lantern-harbor`. Activities use `<missionId>-01`. Missions have 5 activities with at least 3 types, include reading of a meaningful context (not isolated grammar only), and at least 4 objectively gradable activities. No artificial `approved` flags. Reports and provenance cannot substitute for Sol acceptance.

## Persistence interface (src/storage.js)

`await openStore()` returns `{listProfiles(),createProfile({name,kind,guardianId}),getProfile(id),updateProfile(id,patch),appendEvent(profileId,event),getEvents(profileId),exportAll(),importAll(payload),deleteProfile(id),close()}`. All methods except close return promises. Profile: `{id,name,kind:'independent'|'dependent',guardianId:null|string,createdAt,updatedAt,revision,settings:{mode:'kids'|'balanced'|'serious',language:'en'|'vi',quality:'auto'|'eco'|'balanced'|'ultra',motion:'system'|'reduced'|'full',sound:false},journey:{region:'A1',onboarded:false},...}`. Settings/journey patches merge rather than replace. Guardian convenience controls are not an authentication boundary. Cloud identity is separate from this local profile ID.

Events: `{id,kind,at,payload}` with unique random id and ISO timestamp; append is atomic and idempotent. Learner evidence is derived from immutable events. Kinds are attempt, mission, placement, observatory, expedition, support and draft. Immutable support receipts preserve answer disclosure across navigation and draft compaction. Draft is the transient exception: only the latest recoverable snapshot per profile/activity remains, and a submission removes older drafts atomically. IndexedDB uses schema 2 (including the compound byActivity index); exported backups retain schema 1. Storage validates limits and refuses malformed imports. Export/import merges event IDs, rejects contradictory same-ID data, and must not silently overwrite or lose learner history. No unsafe HTML or executable data is ever accepted. Store failures must reach the UI. See [storage.md](storage.md) for the full merge and compaction rules.

## Ownership

Root owns application UI, learning engine and integration. Persistence specialist owns storage.js and storage tests. Cloud/deployment specialist owns optional cloud module, cloud rules, deployment/build/offline configuration and associated tests/docs, coordinating shared changes. Luna writes only its assigned staging batch and report.

## Expedition boards v1

Separate `data/staging/launch-boards/boards.json`: `{schemaVersion:1,batchId:'launch-boards',provenance:[same source shape],boards:[]}`. Parent accepts into `data/published/boards.json` after validation/review, never directly from staging. Exactly one board per published mission, with `id:'<missionId>-board'`, `missionId`, `level`, `width:7`, `height:5`, `start:[0,4]`, `water:[[x,y],...]`, `bridges:[[x,y],...]` (every bridge also a water tile), `switches:[{id,at:[x,y]}]`, `landmarks:[{id,name,at:[x,y]}]` (3–4 distinct all-ages English landmark names), `goal` (one landmark id), `clue:{en,vi}`, `hint:{en,vi}`. All coordinates zero-based x/y. Start, switch and landmark tiles must be dry land. Water blocks movement; opening a switch makes all bridge tiles walkable. Activate a switch while on it or orthogonally adjacent. Switches toggle all bridges; otherwise movement is N/E/S/W. All landmarks must be reachable, and the destination must require at least one bridge activation. Engine path search verifies this.

The English clue uniquely identifies the destination by interpreting its meaning and the English landmark names. Vietnamese clue is optional assistance; guidance never silently translates it. Hint is explicit additional help. Clues must fit the CEFR language demand, not merely grow longer or introduce unrelated logic. Keep advanced narratives imaginative and all-ages. Landmarks are visible; the correct destination is not highlighted before discovery. English matters to choosing it; route planning and switch manipulation provide a separate spatial puzzle. World discovery is game evidence, never automatic CEFR credit.

World persistence uses immutable `expedition` events `{boardId,commands:[N|E|S|W|X,...],supported:boolean}`. X activates a switch. Each saved command path replays from the board's start, making a snapshot independently recoverable after offline merges. Never accept a submitted solved flag. Parent replays the actual commands through the engine. Keep paths bounded; reset changes the current path but never removes a previously earned discovery. Concurrent device paths use the latest complete snapshot for position and union of verified solves for accomplishments.
