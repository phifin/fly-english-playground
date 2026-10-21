# One authorized Luna trial: independent result

> Historical trial evidence, preserved unchanged below. The owner subsequently
> approved autonomous production orchestration with validation before integration.
> See [current state](PROJECT_STATE.md).

Trial executed **16 October 2026**; final independent evidence inspection and
validator run **20 October 2026**. Batch `luna-e2e-001`.

**The ordinary run succeeded.** The native child used the requested Luna model
and maximum effort, searched, retrieved a relevant reference, and wrote exactly
the two expected disposable staging files. The parent inspected the actual files,
validated the unchanged contract and reviewed both examples and their English /
Vietnamese explanations. This is a narrow feasibility result, not approval to
automate production content or evidence of bulk educational quality.

## What establishes each claim

| Claim | Evidence | Limit |
|---|---|---|
| Requested configuration | Trial request and README specify `gpt-6-luna` / `max` | A request alone does not establish execution |
| Actual child identity | Runtime `turn_context` records model `gpt-6-luna`, effort `max`; CLI `0.163.0` | Evidence for this session only |
| Parent / child connection | `session_meta` links session `01a14403-8886-7b13-b98b-4f59d34511cf` to parent `01a143d4-b0de-7f53-a090-a9b923a5a24e`, path `/root/luna_e2e_trial` | Does not prove custom-role discovery |
| Search and retrieval | Matched tool calls/results show successful search and a rendered British Council page with the relevant explanation | Hosted web access does not establish general shell network/download access |
| Files produced | Both staging files exist; byte counts and SHA-256 hashes are in `experiments/luna-trial/evidence.json` | No broad sandbox or production acceptance claim |
| Parent validation | `scripts/validate-trial.mjs` checks the actual schema and trial semantics; negative tests exercise rejection | Restricted validator, not general JSON Schema conformance |

The worker explicitly reported that it could not independently observe its model
metadata and had not run schema validation. Its account of research success
agrees with the recorded tool results; its self-identification was not used as
proof. File writes used `tools.exec_command` and PowerShell `WriteAllText`, not
`apply_patch`. The evidence file contains selected runtime fields, tool success
records, source URL, paths and hashes; it does not copy raw conversation, private
configuration, or credentials from the session trace.

## Dataset checks and educational review

The JSON schema uses `$schema`, `title`, `type`, `additionalProperties`,
`required`, `properties`, `const`, `minItems`, `maxItems`, `items`, `uniqueItems`,
`minLength`, `maxLength`, `pattern`, and `format`. The validator handles every one
of those keywords, asserts calendar dates and absolute source URI syntax, and
rejects unknown keywords, formats, dialects and unsupported schema shapes. This
deliberately small standard-library implementation is suitable only for this
controlled experiment. A future production pipeline needs a maintained validator
with appropriate JSON Schema coverage; this experiment does not supply one.

Additional checks establish the exact two unique item IDs, distinct source IDs,
existing source references, one exact gap per prompt, one `is` answer and one
`are` answer, and the reviewed association between each prompt and answer.
The review snapshot hashes pin the two prompts and both guidance languages so a
changed explanation cannot silently inherit the parent's review. These hashes
are a record of review, not an automated linguistic evaluator.

The first prompt explicitly contains one singular count noun; `is` is correct.
The second explicitly contains six plural count nouns; `are` is correct. Both
English explanations identify the number cue correctly. Both Vietnamese
explanations convey the same point naturally and consistently; the translation
of clothing buttons is appropriate. The source supports this bounded rule and
also discusses informal lists, which these examples avoid.
[British Council: Using there is and there are](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/using-there-there-are?page=4)

No exact completed-example duplication was observed in the retrieved reference
page. That is a limited source comparison, not proof of worldwide originality or
a comprehensive rights audit. Both examples remain synthetic and disposable;
the A1 labels remain provisional and unvalidated. Neither record is an approved
lesson, placement instrument, or measure of learning effectiveness.

Negative tests cover missing/extra fields, wrong types/constants/counts, duplicate
IDs and array entries, missing references, swapped answers, mixed answer sets,
missing/repeated/malformed gaps, changed reviewed explanations, invalid calendar
dates, historical access-date mismatch, malformed URLs, unsupported schema
keywords, and trace evidence that is missing or contradicts the requested model.
The immutable dataset and research-notes hashes allow later integrity checking.

## Boundaries and remaining uncertainty

- Only one ordinary run was authorized and exercised. Interruption, crash recovery,
  intentional rejection/repair, retries, and rate-limit behavior were not tested.
- Native custom-role configuration/discovery was not installed or tested. This
  run used an explicit child model/effort override.
- Staging-only ownership was an instruction under inherited workspace permissions,
  not a child filesystem sandbox. The reviewed write command targeted the two
  staging files; that does not establish enforced isolation.
- Raw session evidence stays outside the repository. No authentication or policy
  changes, paid service setup, new content batch, or production integration occurred.
- Trial records remain outside `src/`, `assets/`, and the static build's copy list.
  They are not used by P0 gameplay.
- This small run supplies no credible forecast of bulk reliability, source rights,
  educational review effort, subscription allowance, or future operating cost.

## Recommendation requiring separate approval

Keep the manual Sol–Luna handoff as the active production workflow. The experiment
shows that native delegation can reduce file transfer work, but does not silently
amend the user's mandatory A–I contract and stop-and-wait rules.

If a later protocol change is approved, retain a self-contained batch contract,
explicit `gpt-6-luna` / `max` selection with observed runtime checks, bounded
staging writes, source/rights evidence, independent Sol validation, quarantine,
and a small explicit repair limit. Test interruption and one intentional repair
before relying on unattended continuation. Keep manual transfer as the fallback
for model/tool failure, ambiguous content, permissions, or changed costs. No new
trial, agent, repair run, or content generation is initiated by this report.

Reproduce local data validation with `node scripts/validate-trial.mjs` and the
negative suite with `node --test --test-isolation=none tests/trial.test.mjs`.
All 43 trial tests pass on Node `v24.22.0`. The default test runner's child-process
spawn encountered managed-sandbox `EPERM`; the same-process flag completed the
suite without changing permissions. The sanitized evidence
records this historical trial; revalidating files later does not move the source
access date or imply a fresh Luna execution.
