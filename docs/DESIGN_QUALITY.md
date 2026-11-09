# Design quality standard

## Player language and structure

Global destinations answer three questions: what can I do (Activities), what can I study (Study), and how am I doing (Progress). Account is the place for learners, saving, settings, backups and authorized family management. Activities remain independently available across experience modes. Never label a local learner as a signed-in Google account.

Vietnamese copy names the action and outcome before adding personality. Use “hồ sơ” for a learner record, “tài khoản” for Google identity, “tiến độ” for saved learning, and “người quản lý gia đình” for the authorized owner. Avoid adventure metaphors in authentication, permissions, recovery or assessments. “Đã lưu” needs a confirmed write; signing in does not prove cloud synchronization. Keep English learning prompts intact when translating guidance. Do not edit validated educational data as incidental copy cleanup.

Nunito is the display/brand face; ordinary lesson text and controls retain a readable system sans-serif. Three self-hosted, unmodified WOFF2 subsets include Vietnamese, extended Latin and Latin; provenance and hashes are in font-provenance.json and the complete OFL is included in assets/fonts.css. No font provider request occurs at runtime. Font loading, NFC text and screenshots are separate checks; none proves native editorial quality or universal shaping support.

## Shared interaction rules

- Show the task before decoration. Entry's field and primary action must fit representative first viewports; never let a hero illustration precede an active form on a phone.
- Keep visible focus, native controls, 44px targets, wrapping labels and clear active navigation. Test 320, 390 and 1440px, including longer Vietnamese labels and names.
- Use compact dismissible notifications for saved actions. Keep errors close to the task. A dialog is appropriate for destructive cloud removal or a meaningful game completion, with native focus containment, Escape and a visible action. Do not turn every correct answer into a modal.
- Loading communicates actual work without invented percentages or artificial waits. Respect reduced motion and Eco. Offline/error recovery must retain the learner's work.
- New games can reuse accepted words, but participation is not assessment. Memory pairs records its own saved game snapshot and never emits an attempt, placement result or vocabulary mastery score.

## Required release review

1. Inspect the real source and all changed routes, including empty, pending, success and error branches. Record fixed defects separately from unresolved findings.
2. Run domain/content/security regressions and real browser journeys. Capture original EN/VI entry, the main task, completion, account and narrow layouts. Examine the images yourself; axe is not a substitute.
3. Check first action, focus order, direct manipulation, save/reload and back navigation. Use observable state rather than a transient toast as the only success assertion.
4. Check original Vietnamese glyphs and wording; distinguish source corruption, fallback, spacing and browser translation. Keep app-authored guidance marked against automatic translation.
5. Preserve all release evidence and explicit limits. Emulator authentication is not live Google consent. Desktop Chrome is not iOS/Safari or a low-end phone. Real-child enjoyment needs family observation.

## First learning interaction and educational release gate

- A default A1 profile is not a starting-level choice. New readers must explicitly choose beginner, a plain-language range, or a completed short check. Existing valid selection and real learning history prevent repeated setup. Pre-reading readiness is separate from mode and proficiency.
- Put the recommended action before guidance. Point to the real control; complete guidance on a real interaction and remember skip/completion per learner. Keep replay available. Do not add an overlay that prevents keyboard or touch use of the target.
- Inspect beginner content for incidental vocabulary, number of relations, prerequisites, instruction burden and answer ambiguity, not merely sentence length. Review all changed keys and both-language explanations. Official descriptors guide editorial judgment; they do not validate an automatic level score.
- Give revised tasks new IDs. Preserve original keys, saved placement pools and historical achievements. A corrected task must not inherit mastery from an older definition.
- Persist assistance before revealing meanings or hints. Exclude help from placement. Reviewing help after an answer must not rewrite or visually relabel that submitted response.
- Independently accept staged educational data with pinned source/submission hashes. A submitter's approval field is not evidence. Every active A1/A2 task requires contextual vocabulary support; the main workflow enforces the accepted-edition gate.
- Check actual notification hover/focus, slow or failed writes, phone-width starting choices, saved guidance, old/new placement versions and assistance after reload. Content activation must run the browser vocabulary journey; a preview reporting pending-content-review is not completion.

## Current review scope and unresolved work

The November design branch starts from the verified production release, not the unaccepted curriculum branch. It reviews welcome, entry, account, navigation, child picture games, construction, practice, placement, journal, settings, cloud/family copy and standalone study via existing and new browser journeys. It adds memory pairs without new educational claims. The pending curriculum/exam/listening expansion remains preserved on work/learning-platform and must receive these shared UI changes when integrated.

Implemented and preview-verified: misplaced form illustration; six mixed navigation destinations; duplicated header/footer identity details; literal welcome/account/progress phrases; generic display type; undifferentiated inline success banners; placeholder boot screen; native confirmation dialog replacement; lost cloud warning during profile completion; additional picture-memory interaction. No live account permissions or server rules changed.

## 4 November release evidence

Preview run [41753781251](https://github.com/phifin/fly-english-playground/actions/runs/41753781251) passed both required jobs at commit `84c27df8bc88da9dba6915ee88112b2761b71e40`. Runtime release `05d720c00f8245acbb51`: 56 verified public files, 937739 bytes. Domain tests: 367 passes and four locally skipped emulator tests; the separate CI emulator job executes the four actual Auth/Firestore/security/synchronization checks. Browser: 36 journeys/checks, 26 axe surfaces with zero reported violations, no console errors. Screenshot evidence archive SHA-256: `0fc6c4ec7ff41a37fdb0f4a61113008a24784b3f6a19a3f4cb4e7c8229369f24`.

Visual review covered EN/VI welcome, desktop/phone guest forms, activity home, account, memory play and completion, loading and progress. New browser assertions cover fonts, 320/390/1440px task visibility, saved pairs, reload, keyboard dialog dismissal and focus recovery. Earlier runs caught real contrast, touch-size, glyph, cascade, focus-priority and inappropriate busy-indicator defects; each was fixed. One outdated navigation selector and one raw IndexedDB ordering assumption were corrected while retaining exact data-integrity assertions.

Shared UI changes are also merged into the pending curriculum workspace with 418 local test passes and four emulator-dependent skips. Its curriculum publication gate remains unchanged. Production must still pass the main workflow's deploy and verify-production jobs; consult the actual latest Actions run rather than interpreting preview success as deployment.

Outstanding: native-speaker and child observation, physical Safari/Android checks, live positive Google cross-device verification, and rejected curriculum content revision. Do not describe this as a complete editorial validation of every existing educational explanation. Source and mechanical tests can identify obvious issues, not certify all wording or enjoyment.
