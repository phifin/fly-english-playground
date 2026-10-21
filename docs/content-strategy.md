# Content architecture and Sol–Luna workflow

> Historical strategy. The owner subsequently approved native Luna orchestration
> and autonomous acceptance, replacing the manual handoff gates below. Current
> contracts are in [runtime-contract.md](runtime-contract.md), and actual accepted
> coverage/workflow status is in [PROJECT_STATE.md](PROJECT_STATE.md).

Date: 2026-10-16. Status: proposed design. No production data has been requested,
received, validated, or created. This document is not a Luna handoff prompt.

Amendment: the [Phase 1 refinement](phase-1-refinement.md) replaces the first
approximately 120-record delivery below with a small candidate contract sample
before a larger instructional pack. Its P0/P1 gates supersede the original M1
sequence. The ownership, A–I contract and manual stop-and-wait protocol remain active.

## 1. Ownership and checkpoint

Sol owns objectives, schemas, learning logic, game logic, validation tooling,
integration, and release quality. The user's separate Luna 6 conversation, with
maximum thinking effort, owns bulk educational research, source discovery, and
substantial content preparation. Internal research assistance in Phase 1 does not
replace that conversation.

The first engineering milestone can use at most about 18 small synthetic activity
fixtures, including deliberately invalid fixtures for validation. Keep them under
`tests/fixtures/content/`, label them `synthetic`, and display a persistent development
content notice. They must never be released as approved learning or placement material.
These are a mechanics fixture set, not an A1–C2 library.

Once the smallest complete game loop and its content contract are stable, STOP
before building a real instructional pilot. Announce **DATA HANDOFF CHECKPOINT**,
explain the dependency, and provide one complete copyable English prompt. Do not
continue development after issuing the handoff until the user instructs otherwise.
Do not assume Luna has filesystem access. The user transfers the files.

## 2. Separate educational and game data

Use a small set of related, versioned records rather than a universal question object.

| Record | Purpose and important fields |
|---|---|
| Skill | Stable ID, English/Vietnamese learner-facing objective, skill domain, CEFR reference and project paraphrase, prerequisites, evidence requirements |
| Activity | One bounded interaction: content version, family/variant IDs, skills, level rationale, stimulus, response type, grading policy, feedback, support options, suitability, provenance |
| Mission | Situational facts, goal, bounded state graph, activity references, explicit transitions, recoverable outcomes, world change, review links |
| Explanation | English explanation, Vietnamese assistance, misconception-specific feedback, a useful revision step |
| Media | Asset ID, local path, format, dimensions or duration, transcript/alt text, origin, license and attribution, review status |
| Provenance | Source IDs/URLs, author/publisher, access date, rights, adaptation details, references consulted, original authorship declaration |
| Review | Reviewer identity or role, checks actually completed, date, issues, disposition; distinguish Sol's review, Luna's self-check and independent human review |
| Pack manifest | Schema/content versions, record paths, counts, hashes, dependencies, coverage, review disposition, required app capabilities |

Skills, activities, missions, and media have independent IDs. Keep world props,
cosmetics, and achievements out of educational answer keys. Reuse a learning
objective across missions without reusing the same scored answer as new evidence.

## 3. Planned contract shape

This is a field-level proposal. Before Luna receives a request, Sol will implement
and test exact JSON Schema files, enums, subtype constraints, and valid/invalid
examples. Those complete schemas must appear in the standalone handoff or be
included as transferable attachments. This draft must not be mistaken for an
executable output contract.

Common fields for an activity:

```text
schemaVersion            e.g. "1.0.0"; schema compatibility, not educational quality
id                       stable namespaced ASCII identifier
contentVersion           positive integer; changes to meaning or grading increment it
familyId                 conceptual item family; used to prevent variant leakage
variantId                unique within family; not necessarily independent evidence
status                   synthetic | candidate | approved | quarantined | retired
cefr                     A1 | A2 | B1 | B2 | C1 | C2
levelRationale           original explanation of the demand and reference alignment
skillIds                 nonempty references into the skill catalog
primaryDomain            reading | listening | writing | spoken-production |
                         spoken-interaction | mediation
topicIds                 controlled topic vocabulary
suitability              reviewed content categories and literacy/cognitive demands
modeSuitability          allowed presentation modes with reasons for exclusions
stimulus                 typed English text/media blocks; no executable HTML
instruction              { en: nonempty string, vi: nonempty string }
response                 discriminated union for an implemented interaction type
grading                  deterministic | rubric-self | rubric-human | unassessed
feedback                 English/Vietnamese explanation and useful revision guidance
support                  explicit hints/transcripts/translations and what they reveal
provenanceIds            references into the provenance catalog
reviewIds                evidence of review; never an assumed approval
```

Release disposition and educational review evidence must remain independent:
`approved` means accepted for the declared release scope, not independently
validated teaching or CEFR assessment. The final schema must record review scope
and unresolved limitations explicitly.

An activity's `response.type` selects a closed subtype. Initial candidates:

- `evidence-map`: stable source IDs, response options or target slots, admissible mappings.
- `sequence`: stable element IDs, permitted orders or explicit precedence constraints.
- `short-response`: bounded prompt, curated accepted answers, per-item normalization,
  optional known-error feedback; no arbitrary regex or executable predicate from content.
- `dialogue-repair`: authored choices or constrained utterances, explicit communicative
  intent and recoverable state transitions. A wrong choice may reveal useful context.

Later additions can include structured revision, audio information gaps, and
rubric-based composition. Unknown types are rejected rather than improvised by a
generic renderer. Essential listening activities require reviewed audio and a
transcript. Text fallback remains available but changes the recorded evidence
domain; it does not count as independent listening.

Store assessed English separately from localized instructions. A translation that
reveals task content is an explicit support action, not an invisible UI preference.
English-only release paths require complete English text; Vietnamese-assisted
paths require reviewed Vietnamese guidance. Do not translate stimuli automatically.

The mission contract must distinguish practical success from learning evidence:

```text
id, contentVersion, title{en,vi}, projectId, situation, goal,
entryState, states[], transitions[], activityRefs[], completionConditions[],
recoverableOutcomes[], worldEffects[], followupSkillIds[], provenanceIds[], reviewIds[]
```

Transitions use allowlisted conditions and effects interpreted by application
code. Content cannot contain JavaScript, arbitrary SQL, or embedded scripts. Each
mission has bounded branching and at least one reachable completion path.

## 4. Proposed destinations

These directories are a plan; they are not evidence of existing data.

```text
data/
  contracts/v1/                 Sol-owned JSON Schemas and enum catalogs
  incoming/<batch-id>/          exact transferable Luna submission; never deployed
    manifest.json
    skills.json
    activities.jsonl
    missions.json
    explanations.json
    media/                     assets actually delivered, not promised downloads
    media-manifest.json
    provenance.json
    coverage.json
    validation-report.json
    README.md
  quarantine/<batch-id>/        rejected records and issue report; never deployed
  approved/<pack-id>/           reviewed source records and accepted assets
  releases/<release-id>/        generated public packs and manifest only
```

Source JSONL is useful for review and transfers; the release builder creates
bounded JSON packs by level/topic/mission with a lightweight catalog. Do not fetch
or parse an entire A1–C2 corpus at startup. Pack hashes detect transfer corruption
and version mismatch; they do not establish source trust or educational correctness.
The site build allowlists only `releases/`; an incoming or quarantined file must
never become an asset merely because it sits inside the repository.

## 5. Acquisition order

| Batch | Proposed scope | Why this order |
|---|---|---|
| Engineering fixtures | Up to about 18 synthetic records, valid and invalid; a few illustrative language routes | Stabilize interfaces without manufacturing a production library |
| First Luna pilot | A1–A2: six coherent missions, three per level; approximately 48 mission activities, 24 transfer/review activities, 24 intake probes, and 24 carefully chosen variants | Enough repeated coverage to test learning loops; approximately 120 records is a ceiling-oriented planning target, not a quantity quota |
| Second Luna expansion | B1–B2 mission packs and aligned diagnostic extension, sized from pilot gaps | Validate inference, connected discourse, register, and multi-source tasks |
| Third Luna expansion | C1–C2 mission packs, nuanced rubrics, age-suitability review and specialist review | Higher ambiguity and evaluation risk justify a stricter gate |
| Later targeted batches | Coverage repairs, additional genres/topics, accessible audio, equivalent task variants | Follow demonstrated weaknesses, not an uncontrolled question count |

For the first pilot, propose everyday coordination, home/community projects,
messages, directions, and practical planning. Exclude sensitive adult topics.
Include at least four interaction families and clear independent recall plus
transfer evidence. Exact proportions and audio counts are fixed after the
engineering mission reveals what is usable. Return fewer items with documented
gaps if quality cannot be achieved. An A1–A2 pilot must not claim to place or teach
the whole CEFR range; advanced learners may test the interface but need later packs
for meaningful instructional coverage.

The first request should require rights-cleared recorded audio where feasible,
with transcripts and speaker consent. Luna must report missing media. It must not
substitute an unlicensed recording, a link alone, or an unreviewed device TTS voice
and call listening coverage complete. Public redistribution is required for shipped
media, including any identifiable voices. Sol will verify assets and their rights.

## 6. Source, licensing, and review standards

Prefer original examples and scripts informed by credible reference material,
public-domain material, or assets with explicit reusable terms compatible with a
public static site. Preserve attribution and any share-alike obligations. Treat
reference sources and copied/adapted sources differently. A citation to a grammar
reference is not permission to copy its exercises. Do not assume AI-generated
material is correct, original, or free of third-party restrictions.

For every record require an authorship/derivation declaration, source references,
rights classification, and a review trail. Unknown rights, copied test banks,
unclear attribution, answer ambiguity, broken media, or unsupported level claims
cause quarantine. Do not bundle CEFR descriptor tables or third-party assessment
items without checking redistribution terms; use references and original objectives.

Sol checks every stimulus, answer key, accepted alternative, explanation and
translation in the small first pack against credible references. Seek competent
bilingual human review of a representative sample, intake probes, sensitive
material and identified uncertainties. Quarantine unresolved ambiguity or rewrite
it into a reliably checkable form. The family pilot can proceed with provisional
content status, correction reporting and observation; record exactly which checks
were completed without inventing independent sign-off. Require competent specialist
review before ambiguous C1–C2 grading or rubrics support proficiency conclusions;
otherwise present these as practice with self-review and explicit assessment limits.

## 7. Validation and integration pipeline

1. Inventory the actual transferred files. Reject missing manifest entries, path
   traversal, oversized records, unexpected executable assets, and hash mismatch.
2. Run strict schema validation without type coercion; report record ID, field
   path, rule, and severity. Check references, unique IDs, supported capabilities,
   positive versions, and paired guidance strings.
3. Check answer solvability, source references, valid option IDs, complete feedback,
   reachable mission states, no accidental dead ends, and media/transcript presence.
4. Detect exact and normalized text duplicates. Flag near-duplicates for review;
   variants remain in the same family. Separate diagnostic and practice families.
5. Produce coverage by level, domain, communicative objective, topic, response
   type, mode suitability, support condition, and media availability. Counts alone
   do not establish balance.
6. Review educational naturalness, answer correctness, alternatives, translation,
   age suitability, and rights. Record unresolved ambiguity. Quarantine rejected
   records and their dependent missions; integrate valid independent subsets only
   if the manifest and coverage claims are revised explicitly.
7. Play each approved mission in all eligible mode/language combinations. Check
   for answer leakage through UI, hints, images, or reused diagnostic variants.
8. Build versioned release packs. Only Sol's reviewed approval ledger controls
   promotion; a submitted `approved` value cannot bypass this decision.
9. Regression test old progress against content updates, preserve referenced
   versions for in-progress sessions, and record migrations/retirements.

Automated checks cannot establish a CEFR level, naturalness, licensing validity,
or pedagogical efficacy. Reports must distinguish programmatic passes from actual
human checks. If a released answer key is wrong, retire the version, explain the
correction, and replay or invalidate affected evidence without removing earned
game contributions arbitrarily.

## 8. Required standalone handoff structure

Every future prompt contains these explicit sections, fully populated for that batch:

**A. Mission:** the coherent educational deliverable and why it is needed now.

**B. Project context:** audience, game loop, CEFR ambition, applicable modes,
language assistance, age/content separation, and public static distribution.

**C. Data scope:** exact levels, objectives, domains, topics, implemented activity
types, coverage targets, media needs, and acceptable shortfalls.

**D. Output contract:** complete machine-readable schemas, enums, IDs, foreign
keys, file encoding and conventions, versioning, and valid examples. Do not rely
on links to a repository Luna may not access.

**E. Destination:** exact paths under `data/incoming/<batch-id>/`, with a complete
transferable directory tree and instructions if the other workspace cannot create files.

**F. Sources and licensing:** acceptable origins, reuse permissions, attribution,
authorship declarations, media rights, and treatment of unknown rights.

**G. Validation:** correctness, variants, duplicates, level rationale, translation,
suitability, consistency, references, and a clear distinction between self-check
and independent approval.

**H. Deliverables:** all manifests, record files, media, coverage and validation
reports, issue log, and transfer instructions.

**I. Completion criteria:** parseable files, verified references and assets,
required coverage or explicit gaps, no concealed rights problems, and an honest
review report. Delivery is not automatic acceptance.

After presenting the prompt, Sol stops and waits. When the user says it is ready,
Sol inspects actual files, reports meaningful issues, quarantines unsuitable
material, validates and integrates usable data, then resumes from that checkpoint.
