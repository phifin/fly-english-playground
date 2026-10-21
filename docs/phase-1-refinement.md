# Phase 1 refinement — gameplay before expansion

> Historical refinement. The Unfolding Atlas was approved and implemented beyond
> P0. Ordinary milestone approvals no longer apply; see [current state](PROJECT_STATE.md).

Update, 20 October 2026: the user approved this Atlas direction for P0 and one
controlled Luna trial. P0 is now implemented; see [current status](p0-status.md)
and [trial evidence](luna-trial-result.md). The proposal text below is retained
as the decision record. Browser/family playtest and production-data gates remain open.

Status: proposal awaiting game-direction approval. No major implementation,
production content generation, or agent configuration has begun.

This is a focused amendment to [Phase 1](phase-1-proposal.md), not a replacement
for its learning, security, persistence, accessibility, or technical work. It
supersedes the original concept recommendation, mode gameplay description,
first-playable sequencing, and first data-batch proposal. The CLI assessment is
in [Native Codex–Luna feasibility](codex-luna-feasibility.md). The manual Luna
checkpoint remains in force.

## 1. Where the original proposal was weak

Common Ground provided plausible reasons to practise English, but too few reasons
to play. Choosing an errand, reading information and preparing a response could
still feel like assigned work. Visible project changes alone do not fix that.
The other candidates shared too much of its document-and-response interaction.
It was premature to call it the strongest game direction on that comparison.

The revised test is whether the player wants to discover something, try an idea,
see the consequence and return with a better idea. English must be part of that
interaction, not a toll paid between entertaining moments. Rewards cannot rescue
a core activity the player dislikes.

Two research findings inform that test. Habgood and Ainsworth compared integrated
and extrinsic learning variants of a mathematics game for children; their findings
support investigating integration into the game's activity. That result does not
prove an English adventure will work. Ryan and colleagues found associations
between perceived autonomy/competence and game enjoyment; their studies do not
establish preferences for this family. The following mechanics are design
hypotheses to test. [Habgood and Ainsworth, 2011](https://shura.shu.ac.uk/3556/),
[Ryan, Rigby and Przybylski, 2006](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf)

## 2. A broader entertainment comparison

| Direction | What the player actually does | Reason to return | English integration | Main weakness and engineering cost |
|---|---|---|---|---|
| **The Unfolding Atlas** — exploration and construction | Explore compact illustrated places, discover unusual behavior, arrange objects/routes/signals, test an idea and open a new possibility | Secrets, useful new tools, surprising reactions, personal discoveries and a workshop that records creations | Understand accounts/rules, give meaningful instructions, resolve uncertainty and adapt information to make a plan work | More scene/interaction authoring than Common Ground; exploration can distract from language. Moderate cost with bounded graph puzzles and DOM/SVG |
| **Lantern Tactics** — turn-based tactical expedition | Choose a small team and combine command cards to solve encounters with several valid plans | Synergies, improving strategy, alternate team combinations and optional challenge conditions | Interpret conditional effects, predict outcomes, repair ambiguous orders and explain a plan | Card icons and memorized effects can bypass English; balance work and strategy complexity can overwhelm beginners. Moderate engine plus sustained balancing cost |
| **Clockwork Workshop** — playful systems puzzler | Build and reroute a tiny machine, simulate its behavior, diagnose a problem, improve the design | Experimentation, satisfying mechanisms, elegant solutions and inventive combinations | Interpret instructions, order processes, describe causes, compare predictions and explain failures | Spatial reasoning may dominate; advanced discourse can feel artificially attached. Moderate cost if discrete simulation; high with general physics |
| **Story Loom** — creative stage and story construction | Arrange characters/props/scenes, author choices and dialogue, perform or replay a short creation | Ownership, expression, humor, alternate stories and an expanding personal collection | Audience, narrative sequence, viewpoint, tone, dialogue and revision directly shape the artifact | Open-ended evaluation is weak without human review; an editor can become the whole project. Moderate-to-high interface/content cost |
| **Common Ground** — community communication simulation | Gather information and communicate to advance practical projects | Relationships, contribution and changing surroundings | Naturally supports practical communication across levels | Cheapest baseline, but the least convincing independent play loop; repeated errands are a substantial risk |

These are different foundations: exploration, tactics, systems construction,
creative authorship and social coordination. None has demonstrated engagement
yet. The Atlas is the best candidate for the first experiment because it offers
visible agency and discovery without requiring reflexes, deep combat balancing,
a general-purpose editor or unrestricted automated dialogue. Clockwork Workshop
is the strongest fallback if the small machine interaction proves more enjoyable
than exploration. That fallback is a later direction decision, not authorization
to change the approved concept silently.

## 3. Revised recommendation: The Unfolding Atlas

Working premise: a travelling workshop visits an illustrated atlas of unusual
places. Players investigate how each place works and leave behind something they
made, repaired, clarified or discovered. The atlas unfolds as their expedition
history grows. Common Ground's recurring characters and useful consequences can
survive as the home base and relationships, rather than defining every mission.

The core loop is **explore → form a plan → arrange or communicate → try it →
inspect the consequence → revise or discover a new possibility**.

The core game verbs are deliberately small: inspect, connect/arrange, and
try/revise. Object-routing, signaling, scheduling and authored character reactions
reuse those verbs and one logical world state. This is not a collection of
independent arcade minigames. Point-and-select traversal and discrete simulation
are sufficient; no free-roaming 3D world or general physics system is proposed.

An illustrative encounter, not production educational data: the player discovers
a folded observatory whose drawings appear only when lantern light reaches them.
A wind-up guide follows the signal instructions the player prepares. Mirrors,
shutters and curious night plants react to a small set of rules explained by two
English accounts. The player can redirect light through the roof or arrange a
path through the garden; each reveals a different view. Repositioning a mirror
and revising the guide's instructions changes what happens. There is something
to discover before anyone assigns an errand. Errors produce recoverable,
understandable results; experimentation can reveal a funny authored reaction.

English must convey information the graphics do not already reveal. If a player
can solve the entire encounter by matching colors or brute-force clicks, success
cannot count as independent English evidence. Physical experimentation can still
be fun; label the language support and request a fresh transfer task to learn what
the player understood. An accurate plan also does not prove high-quality writing.

Use natural English in field notes, instructions, dialogue and accounts. Include
fresh everyday transfer situations so success does not depend only on mastering
the invented world's rules. Fantasy is the setting, not a substitute for useful
communication.

The intended return motives are hypotheses, not assumptions about age:

- Some younger players may return to discover a creature's reaction, try a new
  tool, personalize the workshop or open an unexplored area.
- Older children and teens may prefer hidden connections, alternative solutions,
  increasing agency and creations that express their choices.
- Adults may enjoy compact planning puzzles, discoveries, useful accomplishments
  and increasingly demanding language. Serious Mode gives direct access to these
  challenges without compulsory traversal or lengthy character scenes.

Players can stop at a completed contribution. Nothing decays during an absence.
No energy meters, compulsory daily rewards, randomized purchases or streak loss
are needed. Collect discoveries and creations with understandable origins, rather
than relying on a random prize schedule.

The cost tradeoff is explicit: this direction needs better interaction design and
more reusable visual assets than Common Ground. Bound the first experiment to
one scene and one toy-like mechanism. Do not approve an archipelago-sized content
commitment on the strength of this premise alone.

## 4. Three gameplay experiences from one objective

Use this illustrative objective: **combine two conditional pieces of English
information, choose a workable route, and communicate why the plan satisfies
the conditions**. Its B1-like demand is a design reference, not a validated CEFR
classification or an actual lesson.

| | Kids: hands-on discovery | Balanced: expedition planning | Serious: scenario challenge |
|---|---|---|---|
| Immediate purpose | Help a wind-up guide reveal a hidden drawing | Choose how to explore the observatory and which view to reveal | Develop and defend a feasible signal/route plan under explicit constraints |
| Primary interaction | Inspect, place a mirror or signal, send the guide, observe and repair | Explore sources, select equipment and route, commit a plan, inspect consequences | Use a compact planning board, compare alternatives, predict a counterexample and revise the plan |
| Decisions | Which experiment to try and how to repair it | Which information to investigate and which valid route/outcome to choose | Which solution best meets the chosen criterion and why another fails |
| English application | Obtain the necessary information and assemble/enter a meaningful guide instruction | Combine information and leave a usable expedition briefing | Link the plan to textual evidence and produce or revise a concise justification |
| Feedback | The guide acts on the message; specific repair is demonstrated | World outcome and newly available route reveal how the plan worked | A simulation/counterexample tests the reasoning; feedback explains language and evidence |
| Accomplishment | A discovered reaction, functioning route and workshop addition | An explored branch, completed expedition and chosen persistent outcome | A solved constraint challenge, alternative solution record and visible skill evidence |

The distinctions change the player's decision space and interaction, not simply
the amount of explanation. Kids emphasizes embodied experimentation, Balanced
adds exploration and strategic choice, Serious emphasizes compact analysis and
testing. Serious still has a manipulable problem and visible consequences; it
does not have to become a worksheet.

All modes share the situational facts, supported logical actions, feasible
solutions and learning objective. They produce evidence through common fields:
content/family/version, interpreted constraint, chosen action, constructed
instruction or justification, support used, first attempt, retries and grading method.
Different scaffolds can produce different evidence strength. Selecting a supplied
phrase is supported construction, not equivalent to independently recalling it.
Open explanations remain unassessed or rubric-reviewed where automatic checks
cannot establish correctness. There is no claim of psychometric equivalence
between presentations.

Architecture: one world/mission state reducer, one evidence recorder, reusable
activity renderers, and small mode-specific controllers that expose and sequence
actions. A controller can combine or split steps and offer different decisions;
it cannot rewrite proficiency or invent an answer key. Essential interaction
alternatives work with keyboard and touch in every mode.

Author facts, logical objects/actions, valid outcomes and evidence criteria once.
Map those affordances through reusable mode controllers rather than writing three
bespoke scenes per activity. If a new objective requires substantial custom code
in all three modes, reduce its scope or defer the mechanic.

Switching mode saves the semantic state, submitted evidence and draft. Resume at
a stable boundary. If Serious practice solves only one part of an expedition,
award that contribution once; do not invent exploration accomplishments. The
player can later continue the unexplored portion. Learning progress remains
shared while optional discoveries reflect actions actually performed.

## 5. Progression, novelty and A1–C2

Separate world progression from proficiency. A new learner can visit an
interesting advanced-looking location with suitable language; an advanced learner
does not have to complete beginner tasks to earn meaningful agency. Content
suitability remains separate from mode and CEFR.

| Progression dimension | How it develops | Source of novelty |
|---|---|---|
| Places | A few authored locations reveal shortcuts, changed states and connections | Discovery and reinterpretation of familiar spaces |
| Tools and verbs | Introduce a signaling tool, a connector, a recording/journal tool; combine a bounded set | New ways to act and solve earlier situations |
| Challenge structure | One clear constraint becomes competing constraints, incomplete information or different audiences | New reasoning and communication demands |
| Agency | Guided repair becomes route choice, project choice, solution design and interpretation | More ownership, not simply more screens |
| Creations | Functional signs, route plans, small mechanisms and later multi-source artifacts remain in the atlas/workshop | Visible personal history and editable work |
| Language | Greater independence, discourse complexity, precision and transfer | Richer meanings and communicative purposes |

Examples of evolving linguistic demands, without locking world chapters to levels:

| Range | How the same game systems can ask for different English use |
|---|---|
| A1 | Identify an object/place, follow a simple instruction, give essential information |
| A2 | Combine a short sequence, handle routine restrictions, compose a practical message |
| B1 | Resolve two sources, interpret conditions, explain and revise a workable plan |
| B2 | Weigh accounts, infer consequences, justify a tradeoff and adjust register |
| C1 | Synthesize incomplete sources, manage stance/uncertainty and adapt complex information |
| C2 | Preserve subtle distinctions, critique competing interpretations and mediate precisely for different audiences |

Higher levels must also broaden genres: personal accounts, field notes, humorous
stories, dialogue, proposals, reviews and arguments can describe the same world
without every activity becoming a delivery. Some artifacts and interpretations
will use self-review or human review; the game must disclose that boundary.

Novelty comes from a small set of interacting rules plus new authored situations,
not an indefinitely larger errand list. Return encounters change goals, evidence
or audience so the earlier answer no longer suffices. Previously learned language
becomes useful with a different tool or context. Serious Mode exposes these as
new scenario combinations; Kids and Balanced expose them through the place.

This is a finite authored game with expandable packs, not an infinite content
promise. Parameterized layouts or rule combinations may later extend replay, but
only within verified templates with solvability checks. Do not procedurally
generate unreviewed English, contradictions or answer keys at runtime. A single
new mechanic needs several meaningful uses before adding another. If novelty
requires a fresh engine for every chapter, the design has failed its scope test.

## 6. Replace the overloaded M1 with earlier gates

The previous M1 combined too much infrastructure with an unproven core. Preserve
its reliability goals, but move them after the smallest enjoyment experiment.
All development below still waits for foundational approval.

| Gate | Scope | Explicitly deferred | Evidence required |
|---|---|---|---|
| **P0 — Play hypothesis** | One attractive-enough interactive scene, one mechanism, two valid solutions, one consequence/revision loop, one changed replay; roughly 6–9 synthetic fixtures; simple keyboard/touch controls | Accounts, cloud, outbox, service worker, full settings/localization, placement, complete content pipeline | Players understand and influence the outcome, try ideas willingly and show interest in another attempt; language contributes to the solution |
| **P1 — Shared learning and mode proof** | Implement the same objective across the three controllers, both guidance languages for this small slice, support/evidence recording, simple versioned local checkpoint, static Eco/richer presentation; finish exact v1 schemas/validator/examples for supported interactions | Full cloud reliability, broad content, comprehensive analytics, full-range placement | Modes feel different; changing mode preserves draft/progress; no duplicate contribution; actual renderers consume contract examples |
| **L0 — Luna contract sample** | STOP; request a small representative candidate sample using the manual A–I prompt. Inspect and integrate it after transfer | Full initial pack | Contract, grading, feedback, bilingual rendering and edge cases work with another author's real output |
| **P2 — Instructional pilot** | Repair contract if needed; STOP for a coherent first learning pack, sized from sample/play findings; then review and integrate | Full A1–C2 claims | Useful delayed transfer and honest advertised coverage; no unresolved critical answer/rights issues |
| **P3 — Family reliability** | Existing approved-membership, OAuth, permissions, sync/outbox, export/recovery/deletion, trusted/shared-device policy and cross-device tests | Advanced coverage and optional social systems | Original security and data-integrity gates pass before cloud family use |
| **P4 onward — Range and release** | B1–B2 then C1–C2 packs, accessible offline downloads, measured quality policy and release readiness | Unjustified infrastructure | Original coverage/assessment/performance gates, amended for the chosen game |

P0 has no real accounts, personal writing collection or security-sensitive service.
Development content/state is explicitly disposable and makes no saved-learning
promise. A local checkpoint added in P1 uses an atomic write and a version tag;
cloud sync and migration machinery wait for P3. These are reductions in prototype
scope, not permission to ship fragile saving to the family.

The actual-device sign-in spike moves after the first play gate, before any cloud
commitment or extensive sync implementation. The architecture's main browser risk
still gets an early test without standing ahead of the gameplay experiment.

Observe willing family participants with different preferences, including younger
learners where available. Watch first unprompted actions, meaningful decisions,
help required, frustration, repair and voluntary replay. Ask what they would try
next. Do not infer enjoyment from finishing a task or earning a reward. Compare
the world interaction with a compact challenge presentation if preference is unclear.

Use a short delayed, unseen language variant to check what transferred, recording
support. A small family test is qualitative evidence, not a statistical efficacy
trial. If players enjoy only the animation, ignore the English, or prefer every
non-language shortcut, revise the integration. If the interaction itself is dull,
revisit the concept before buying more content or adding infrastructure.

## 7. First Luna delivery: sample, then pack

Withdraw the roughly 120-record pack as the first delivery. After P1 freezes the
implemented v1 contract, request approximately **12 candidate activities**, with
two per CEFR band and a spread across the interaction types that actually exist.
Include bilingual instructions/feedback, curated alternatives, support metadata,
provenance and explicit grading limits. Exercise advanced rubric/unassessed cases
only if those paths are implemented; otherwise document their deferral rather
than inventing a renderer. The sample tests interoperability and range handling,
not adequate teaching or placement coverage at any level.

Require the sample to attach to small supplied encounter contexts or a clearly
defined test harness, so it exercises game integration rather than JSON parsing
alone. Check construction, interpretation and revision, variant handling,
localization growth and answer ambiguity. Sol supplies malformed negative fixtures;
Luna need not intentionally create bad production items.

Use text-first material unless reviewed audio assets can actually be delivered.
Scripts alone do not complete listening coverage. This also matters because the
requested Luna model does not itself provide native audio output; media sourcing
and rights remain separate work.

Sol reviews every sample record and runs it through the actual engine. Record
schema fixes and content issues before requesting more. A schema change returns
the affected sample through validation before the full pack. The first coherent
instructional pack is sized from the accepted encounter design and coverage gaps;
the earlier six-mission/120-record target is not a commitment.

Keep the full A–I handoff and stop-and-wait behavior at both deliberate boundaries.
No Luna prompt is issued now: neither implementation nor the data dependency has
been reached. Automatic delegation is an assessed future option, not an active
change to the protocol.

## 8. Decisions retained and decisions requested

Retain the static frontend, Svelte/TypeScript/DOM/SVG direction, separate learning
engine, bounded grading, honest placement, staged CEFR coverage, independent
settings, strict ingestion, privacy model and local-first/cloud-sync architecture.
They remain subject to final direction approval and their documented validation.

Request approval of **The Unfolding Atlas as the candidate to test**, with P0's
enjoyment-and-integration gate before broader implementation. Its world theme can
change without changing the proposed mechanics. Do not approve a large world or
claim the entertainment hypothesis has already passed.

Recommend native Luna orchestration as a future workflow candidate, but keep the
manual process until an explicitly authorized small feasibility run proves the
actual model, effort, tools, file output and recovery path. No configuration was
created and no agent was launched for this refinement.
