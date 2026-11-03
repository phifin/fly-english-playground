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

## Current review scope and unresolved work

The November design branch starts from the verified production release, not the unaccepted curriculum branch. It reviews welcome, entry, account, navigation, child picture games, construction, practice, placement, journal, settings, cloud/family copy and standalone study via existing and new browser journeys. It adds memory pairs without new educational claims. The pending curriculum/exam/listening expansion remains preserved on work/learning-platform and must receive these shared UI changes when integrated.

Fixed in source, awaiting browser/production verification: misplaced form illustration; six mixed navigation destinations; duplicated header/footer identity details; literal welcome/account phrases; generic display type; undifferentiated inline success banners; placeholder boot screen; native confirmation dialog replacement; lost cloud warning during profile completion; additional picture-memory interaction. No live account permissions or server rules changed.

Outstanding: native-speaker and child observation, physical Safari/Android checks, live positive Google cross-device verification, and rejected curriculum content revision. Do not describe this as a complete editorial validation of every existing educational explanation. Source and mechanical tests can identify obvious issues, not certify all wording or enjoyment.
