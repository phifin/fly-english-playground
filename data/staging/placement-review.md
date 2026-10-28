# Placement review

**Status:** staging review of existing content; not approval of a calibrated placement test. I reviewed the 120 published Atlas activities and the current answer-scoring/recommendation rules. No new questions or runtime changes are included here.

## Candidate pool

The JSON selects 18 existing IDs: three per band, with two short choice items tagged `reading` and one constrained gap tagged `language-use`. That gives the route a reading and a language-use response at each visited band, plus one possible confirmation item. The pool avoids writing because `assess()` gives writing no automatic correctness. I also left out match/order: the current assessor scores each fully correct or incorrect, so a single wrong pair or step loses all partial evidence in a short orientation.

Most reading items have an answer supported explicitly by their short passage. That is normal for reading comprehension, but literal retrieval items may be too easy to separate neighboring bands. The JSON records a specific limitation for each selected item and several near misses rejected for exposed answers, broad gap keys, length, or open scoring. The selected IDs are candidates for independent integration review, not item-level CEFR endorsements.

## Fixed 12 versus a shorter adaptive starting point

The prior fixed flow assembled 12 items: two per band, one choice and one gap. It gives every learner the same broad sweep and is straightforward to audit. It also asks the same number of questions regardless of responses, uses only two observations at each band, and takes the first choice/gap pair from each band in published order. The recommendation requires at least two responses at each preceding band and 67% correct; with exactly two items, both must be correct to move upward. One miss in either domain blocks advancement from that band's small sample.

A shorter route that starts at A2 and moves to an adjacent band after two consistent responses can be more welcoming and avoid questions far from a learner's likely starting range. A 4–10 question cap is a reasonable interaction target for this optional **practice-start suggestion**: four can confirm an obvious lower boundary, six to eight can sample and check an adjacent boundary, and ten can reach the upper-band ceiling from A2. If responses split, an item was exposed, or a learner skips, report the result as uncertain and offer a manual starting choice. If all responses are correct through C2, call it an upper-end result; if all are wrong at the lowest sampled band, call it unresolved at the floor.

The route should not be presented as computer-adaptive testing or CEFR placement. Cambridge English describes an adaptive exam whose next reading/listening questions change with prior answers; Cambridge's validation materials also describe test specifications, trialling, empirical validation, and pretested/calibrated item banks. Those processes matter because these Atlas items have no trial data, item difficulty estimates, discrimination statistics, equating, or validated cut scores. The CEFR itself is a descriptive framework, not a test-standardisation tool. The shorter route is a content-based heuristic to choose where to practise, not evidence that adaptive delivery is more accurate here. [Cambridge English: adaptive testing](https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/the-science-behind-the-exam/), [test development and validation](https://www.cambridgeenglish.org/english-research-group/validity-and-validation/testcycle.aspx), [Council of Europe: CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4).

Fixed 12 remains useful as a comparison condition if the team later pilots the orientation: it gives all learners the same exposure. A shorter route reduces burden but changes which items are seen, so do not compare its raw result with the old 12-item rule as if they shared a validated scale. Keep the displayed conclusion modest: “A place to begin practicing,” with a confidence/uncertainty cue and a way to change the range.

## Repeated exposure and skill limits

All candidates are already in the published practice library. A learner may remember a prompt, an answer, or an explanation from earlier practice; that familiarity can make a placement response look stronger. Prefer not-yet-attempted candidates and treat known prior support or solution exposure as exposed. Absence of an attempt event does not prove that the learner never saw the text, so do not describe a result as fresh evidence when the interface cannot establish that.

The pool samples only reading and constrained language use. It does not assess writing, listening, or speaking. The 2:1 reading-to-language-use split also means a third confirmation response adds reading evidence only; do not interpret raw domain counts as a balanced skill profile. These answers are clues about a convenient starting activity, not a general proficiency score.

## Children and pre-readers

Keep the existing adult-assisted picture-play path available for a pre-reader. It is shared practice: an adult may say the cue and the child may point, tap, gesture, or listen. If an adult reads or paraphrases an Atlas passage, the resulting response is supported comprehension, not independent English reading evidence; keep it out of this reading orientation. The [family guide](../../docs/family-guide.md) already says picture collections are shared practice and not CEFR results, and the [developmental review](redesign-developmental-review.md) explains why the caregiver-assisted path is separate.

Do not map a child's age or Kids mode to A1–C2, and do not assign a CEFR level from adult-assisted picture choices. The Council of Europe's collated young-learner descriptors are grouped for ages 7–10 and 11–15; the source gives no age 4–5 mapping. Pre-A1 is a proficiency descriptor band, not an age label. [CEFR Companion Volume, young-learner development section](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4).

## Evidence needed for stronger claims

Before using this as a test or publishing CEFR-level outcomes, collect responses from the intended learner groups, examine whether each item works as intended and whether language/background effects distort results, align and review tasks against the intended constructs, and establish/validate decision thresholds. Cambridge's process is a useful public example, not a prescribed minimum sample or a claim that this pool can reach the same standard. Until such work exists, retain the product's practice-only description.
