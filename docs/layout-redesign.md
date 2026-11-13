# Layout and interaction redesign — 13 November 2026

## Root causes and implemented changes

- The Study route reused the adventure catalog. It now opens direct lessons, five-question practice, review and listening. Activities offers stories, construction and picture games. Lesson presentation does not mutate the learner's Kids/Balanced/Serious preference.
- The learning journal placed creations before learning metrics and promoted game discoveries alongside assessment. Learning evidence and due review now lead; creations and story collections are available in an expandable section.
- Large introductory headings, illustrations and panels displaced the task. Screen-specific composition makes guest entry, learning, progress, story entry and practice more compact while preserving readable exercise text and touch targets.
- First guest entry exposed guardian configuration. It now asks for an optional name and experience preference; family controls remain available when adding another learner. Starting-level selection remains explicit and blocking for assessed learning.
- Help appeared as a large inline block. It now follows a real highlighted control with a dim surround, short bilingual prompt, Escape dismissal and replay. Completion/skip receipts remain per learner, separate from learning evidence.
- Review promoted listening before actual review; its due items and recovery action now come first. A wrong Kids answer no longer exits the story into the construction toy. The older picture-clue collection remains available through picture games.
- Visual iteration found a phone-specific cascade keeping story stops vertical, a tagline wrapping into a narrow column at enlarged text size, an offscreen skip link leaking into view, and guide bubbles obstructing neighboring toys/cards. Story stops now fit one row, the header wraps coherently, the skip link uses its own size, construction guidance yields during a pointer gesture, and memory guidance retires after the first real card flip.
- Background feedback could pull a reader back to a guide or lose focus. Guidance now scrolls only once per actual target and preserves deliberate scrolling, keyboard focus, Escape dismissal and replay across re-renders.

## Verification status

Local domain suite: 409 passes, zero failures; four emulator-dependent checks run separately in GitHub CI. Build succeeds: candidate runtime `b58c8328ce0fe4bbbf73`, 153495 gzip JavaScript bytes. No added runtime dependencies.

Final preview [43357901746](https://github.com/phifin/fly-english-playground/actions/runs/43357901746), commit `4b0f8a48aaf23f9d6a5085a15e18175b9a5a276f`, passed build and all four actual Auth/Firestore emulator tests. The 38 browser checks and 36 axe surfaces passed with zero detected violations or unexpected browser errors. All 94 screenshots were retained; representative screens and all late visual corrections were inspected before promotion. Evidence archive SHA-256: `bb3459ea016d8250ab4e3c0a08b3e65304136de835d8609412bada9d01739fb9`. This is preview evidence; successful production deployment additionally requires the main workflow's deploy and verify-production jobs.

The new browser gate covers five widths in EN/VI, first-viewport actions and metrics, non-overlapping guidance, Escape/reload/replay, direct lessons, native family selector focus, and 200% text scaling. The existing suite retains placement, vocabulary assistance, gameplay, backups, cloud adapter, error recovery and accessibility checks.

## Visual review evidence

The complete preview suite produced 38 browser checks, 36 axe surfaces with zero reported violations, and zero unexpected browser errors. Its layout module captures 49 screenshots, including Activities, Study, Progress and Stories in English and Vietnamese at 320×740, 390×844, 768×1024, 1280×800 and 1920×1080. Other existing journeys capture entry, level setup, placement, account, picture games, construction, listening, notifications, completion dialogs, loading, vocabulary assistance and recovery.

Screens were inspected during multiple iterations, not just generated. Representative review covered the five layout sizes, both languages, first guest form, explicit starting choices, highlighted controls, phone lesson and story workspaces, enlarged text, focused family selectors, notification focus, memory cards/reward, listening and account screens. The test initially reused a completed lesson before taking a “first story” screenshot; it now visits an untouched story and asserts zero completion plus an actual task action. This is a verification correction, not a claim that old progress was broken.

At 320×740 in Vietnamese, the practice action ends at y=453, Study's primary action at y=427, Progress's four metrics at y=615, and the story launch action at y=601. The guest submit action fits its initial phone viewport. These measured bounds support the first-viewport review; they do not by themselves establish usability.

`docs/DESIGN_QUALITY.md` defines the reusable release gate: inspect actual screenshots, test meaningful first actions and complete journeys, preserve assessment/storage assertions, exercise long localized strings, keyboard focus and scaling, and retain explicit verification limits.

## Boundaries

No content keys, answer definitions, profile schemas, placement scoring, cloud ownership or Firestore rules are changed. Guide receipts use existing event storage. The separate unaccepted curriculum/exam expansion is preserved and is not silently included in this deployment. Live Google consent, physical mobile browsers, assistive-technology use and subjective enjoyment require separate observation; automated Chrome scenarios cannot establish them.
