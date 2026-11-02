# Platform foundation v1 — NOT ACCEPTED

Sol review, 2 November 2026. There is no production acceptance receipt and no published platform dataset. The staging report is the author's report, not independent approval.

Blocking findings:

- Several gap prompts supply the entire answer ("use X unchanged") instead of testing retrieval or application.
- B2 returns-policy questions depend on a notice absent from their own context.
- C1 data-reading tasks mostly copy numbers or test elementary arithmetic. C2 ellipsis and mediation tasks do not justify their advanced labels; some keys exclude other valid answers.
- Prerequisites form an arbitrary chain across unrelated domains rather than knowledge dependencies.
- Correct choice positions are heavily concentrated in the first option, and ordering tokens are often already solved.
- TOEIC question 7 confuses the Friday collection deadline with the Tuesday construction start; question 4 uses an awkward collocation. Part 7 choices should use the intended four-option format.
- The Vietnamese transformation set excludes valid alternatives such as "Despite being brief".
- The interrupted revision of A1 objectives introduced literal question marks in place of Vietnamese characters. This is file corruption, not browser font shaping. These strings must be restored with UTF-8-safe edits and checked.

Sol subsequently restored all 21 damaged Vietnamese strings in the partial A1–B1 revisions using a UTF-8 file patch. The validator now rejects this corruption and obvious unchanged-keyword answer leakage. This repairs encoding only; the other educational blocking findings still apply. The author's earlier review report has not yet been reconciled with the interrupted edits.

Luna's targeted revision was interrupted by an explicit usage-limit response. Do not retry repeatedly, change model to evade that limit, or treat the last schema pass as educational acceptance. Preserve the substantive original draft and requested corrections; resume Luna when permitted, then independently reread all changed objectives, all exam items and listening items. Higher-band listening distractors also need more plausible alternatives before claiming appropriate advanced challenge.

Independent engineering and mechanical browser verification may use an isolated candidate artifact clearly marked unaccepted. Candidate files must never be deployed to GitHub Pages or written into the repository's `data/published/` directory. The normal Pages workflow now runs the platform acceptance gate before building/deploying.
