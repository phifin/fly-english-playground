# Practice-content audit — Luna

Reviewed 2026-11-10. This is an editorial review of the published source, not an acceptance or calibration decision.

## Scope and method

I read all 120 original atlas activities across 24 missions: 20 items at each level A1–C2. The review checked prompts, contexts, keys and accepted forms, matching pairs, ordering alternatives, vocabulary load, syntax, inference, prerequisites and stated level. The separate audit array is [practice-support-audit.json](practice-support-audit.json); it records one decision per original activity and aligns its 22 `revise` decisions to the staged replacement IDs.

I also inspected the 18 items in `src/placement-content.js`, the placement acceptance review, and the current picture, little-word and workshop content. No `data/published/placement.json` exists in the deployment source. The current placement pool is therefore the 18 source references, not a separate published placement pack.

The CEFR references below informed broad task-demand judgments. The Council of Europe describes illustrative can-do scales across language activities; those descriptors do not make any one short exercise a CEFR measure. The British Council A1 reading material uses simple information about known topics, and its A1–A2 grammar reference supports the singular/plural distinction for `there is/there are`. I used these sources as references only; I did not copy their activities or assessment questions. [CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4), [CEFR global scale](https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale/), [British Council A1 reading](https://learnenglish.britishcouncil.org/free-resources/reading/a1), [British Council: there is/there are](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/using-there-there-are).

## Findings and decisions

The audit has 120 records: 22 `revise`, 60 `practice-only`, and 38 `retain`. The revision set is 15 A1 activities, three A2 activities, three C1 activities, and one C2 activity. The main corrections address A1 theme vocabulary and context length; A2 answer exposure and misleading explanation; and C1/C2 wording, category overlap or explanation alignment.

At A1, several opening harbor and shell-bell tasks asked learners to process multiple place relations and terms such as *boathouse*, *pier*, *tide pool* and *shell hut* before reaching a basic location or `there is/are` target. The kite tasks also carried avoidable story detail; one plural-pronoun context supplied the answer “They” before the gap, and the matching prompt mislabeled a green circle as a kite part. The two writing models relied on map facts their prompts did not provide. These are contextual-load or alignment problems, not evidence that the intended grammar or reading objective is inappropriate for A1.

At A2, the original plural gap for *flowers* repeated the answer noun in its context. The original seed/sculpture quantifier match relied on niche nouns and required a caveat that *many* and *a few* can both grammatically modify plural count nouns. The polite-request explanation treated “You can move bowls if you want” as ability, although that wording offers permission or an option in context. All three deserve revision before they are used as clean examples.

For C1, the “The earlier signal is believed …” sentence has a named grammatical subject. Reporting-passive terminology varies across teaching references, so the safer instruction describes the visible subject + `is believed` + perfect-infinitive form instead of switching to a dummy-`it` construction. The C1 `glass-choir-03` matching categories overlap: `whereas` introduces a full clause and also links two contrasting clauses, so both original labels can describe it. That item is marked for revision using explicit sentence continuations. A separate C1 rewrite changed the draft’s claims by adding “restrained” and “finely balanced”; the replacement should keep the positive evaluation while changing register. In the C2 `all but unreadable` item, side-light visibility does not establish readability under ordinary light; the explanation must keep those conditions separate. A later terminology cross-check found that the British Council groups named-subject and dummy-`it` reporting patterns under its broader “impersonal passive” label, which reinforces the need to describe the form precisely rather than claim the terminology is universal. [British Council: Advanced passives review](https://learnenglish.britishcouncil.org/free-resources/grammar/c1/advanced-passives-review).

## Placement suitability

The 18-item pool has three items per level and samples only reading and constrained language use. It has no learner-response calibration, discrimination statistics, reliability estimate or evidence that its route thresholds identify CEFR levels. Do not interpret a result as a proficiency classification. I flag eight existing references as too obvious or narrow to contribute useful evidence to even a cautious starting recommendation. This is an editorial recommendation, not a runtime exclusion: `src/placement-content.js` still contains all 18 references, and I did not change the route or its pool.

- `a1-lantern-harbor-color-teller-01` and `a1-lantern-harbor-rooftop-kites-01`: each answer is stated verbatim, with weak or absent distractors. Their versioned practice replacements shorten the context but do not add diagnostic discrimination.
- `b2-clockwork-canopy-three-voices-01`: the metaphor key is supported, but the other choices are conspicuously literal or unrelated.
- `b2-clockwork-canopy-review-or-manual-02`: one-word recall of a fixed idiom is too narrow for B2 routing.
- `c1-prism-observatory-amber-line-01`: the only cautious choice competes with overtly contradicted or overconfident distractors.
- `c1-prism-observatory-program-edit-02`: the prompt states the inversion rule and asks for one auxiliary.
- `c2-unwritten-sky-margin-marks-01`: the answer is contrasted with trivial understatement and an unsupported sole-cause claim.
- `c2-unwritten-sky-quiet-caption-02`: this is a one-word idiom completion cued as “almost”; its explanation also needed correction.

The unflagged items may offer a weak, provisional orientation signal only; they are not validated CEFR evidence. Two or three items per band cannot cover receptive and productive skill, the pool has no listening or speaking sample, and repeated exposure or a small finite pool can affect responses. Existing placement review metadata already calls the route uncalibrated; this audit does not change the meaning of any earlier result. Assistance terms and hints belong in practice and should not be exposed during placement or exams.

## Higher levels and audience limits

The B2–C2 matching and ordering items often provide the exact pairs, sequence words, rhetorical roles or requested reasoning chain in the prompt. They are useful consolidation practice, but not standalone evidence of high-level proficiency. The overlapping C1 `glass-choir-03` matcher is marked `revise`; the other narrow sorting tasks are marked `practice-only`. The C1/C2 choice and gap items also constrain a single feature; conspicuous distractors further weaken discrimination. The C2 museum passage asks for a more demanding pragmatic inference, but one literary vignette still cannot represent the range of C2 reading. `Practice-only` is audit metadata and does not itself remove an item from runtime placement.

The 12 `littleWords` entries use adult-led point/name cues and make no CEFR or developmental-validity claim. The six picture-vocabulary items are assisted, visual practice for the stated age group, not reading tests. The nine workshop briefs are described as A1–B1 reading-practice estimates, not a calibrated test. A pre-reader may point or participate with adult help, but that does not support an English proficiency inference; adult A1/A2 reading exercises presume access to the written prompt.

## Provenance and limits

The replacement wording and bilingual contextual help were authored for this review. The Council of Europe and British Council pages informed broad calibration judgments only; their exercises and official assessment questions were not reproduced. Existing source attribution should be preserved. I did not verify third-party redistribution or licensing rights, so this review is not permission to redistribute; the edition schema has no approved/rights-cleared field.

No learner pilot, item-statistics analysis, reliability study, age- or first-language subgroup study, independent CEFR standard-setting, or live mobile/accessibility review was available. Open writing remains self-review content, not machine-scored evidence. Independent acceptance and any product-use decision remain with Sol.

