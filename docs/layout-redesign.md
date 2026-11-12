# Layout and interaction redesign — 11 November 2026

## Root causes and implemented changes

- The Study route reused the adventure catalog. It now opens direct lessons, five-question practice, review and listening. Activities offers stories, construction and picture games. Lesson presentation does not mutate the learner's Kids/Balanced/Serious preference.
- The learning journal placed creations before learning metrics and promoted game discoveries alongside assessment. Learning evidence and due review now lead; creations and story collections are available in an expandable section.
- Large introductory headings, illustrations and panels displaced the task. Screen-specific composition makes guest entry, learning, progress, story entry and practice more compact while preserving readable exercise text and touch targets.
- First guest entry exposed guardian configuration. It now asks for an optional name and experience preference; family controls remain available when adding another learner. Starting-level selection remains explicit and blocking for assessed learning.
- Help appeared as a large inline block. It now follows a real highlighted control with a dim surround, short bilingual prompt, Escape dismissal and replay. Completion/skip receipts remain per learner, separate from learning evidence.
- Review promoted listening before actual review; its due items and recovery action now come first. A wrong Kids answer no longer exits the story into the construction toy. The older picture-clue collection remains available through picture games.

## Verification status

Local domain suite: 408 passes; four emulator-dependent checks run separately in GitHub CI. Build succeeds. Browser verification and screenshot review are in progress on `work/design-quality`; this document does not yet claim production deployment.

The new browser gate covers five widths in EN/VI, first-viewport actions and metrics, non-overlapping guidance, Escape/reload/replay, direct lessons, native family selector focus, and 200% text scaling. The existing suite retains placement, vocabulary assistance, gameplay, backups, cloud adapter, error recovery and accessibility checks.

## Boundaries

No content keys, answer definitions, profile schemas, placement scoring, cloud ownership or Firestore rules are changed. Guide receipts use existing event storage. The separate unaccepted curriculum/exam expansion is preserved and is not silently included in this deployment. Live Google consent, physical mobile browsers, assistive-technology use and subjective enjoyment require separate observation; automated Chrome scenarios cannot establish them.
