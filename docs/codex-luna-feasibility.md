# Native Codex CLI–Luna feasibility assessment

> Historical feasibility assessment. The controlled trial succeeded and the owner
> later authorized production staging tasks via native `gpt-6-luna` / `max`.
> See [current state](PROJECT_STATE.md); this document's earlier approval gate is obsolete.

Update: the user subsequently authorized one trial. It executed on 16 October;
independent validation/evidence inspection completed on 20 October 2026. See
[the actual result](luna-trial-result.md). This initial assessment remains the
historical baseline; automatic production delegation is still awaiting approval.

Verified 16 October 2026. Assessment only: no agent was spawned, no model inference
test was invoked, and no configuration was created or changed. The manual Luna
checkpoint remains the active workflow. This assessment uses official OpenAI
documentation and read-only local inspection, not the assumption that direct
model launch implies subagent support.

## Conclusion

**The proposed workflow is technically supported in principle, with strong local
evidence, but has not been validated end to end on this machine.** Native
delegation can preserve Sol/Luna ownership and the same content contract. It is
not automatically a durable job queue, a separate filesystem sandbox for Luna,
or independent educational verification.

Prefer a later, explicitly authorized single-Luna trial over building an external
Agents SDK service or launching nested CLI processes. Keep manual transfer as a
fallback for model/tool/access failures and until the trial passes.

## 1. What was actually checked locally

| Inspection | Result | Limit of evidence |
|---|---|---|
| `codex --version` | `codex-cli 0.163.0` | Installed version only |
| `codex features list` | `multi_agent` is stable/enabled; `multi_agent_v2` is stable/disabled | Feature flags do not prove a role file was parsed or a child ran |
| Safe selected user configuration keys | Parent model `gpt-6.1-sol`, effort `high` | Does not determine a future child's explicit settings |
| Selected fields from the cached model catalog | `gpt-6.1-sol` and `gpt-6-luna` listed; Luna supports `low`, `medium`, `high`, `xhigh`, `max` | Cached discovery is not a live inference/entitlement test |
| Cache metadata | Client `0.163.0`, fetched `2026-10-16T09:01:12.509440900Z` | Availability can change |
| CLI help | `agents`, `resume`, `exec resume`, model override, JSON event output, output schema and search controls exist | Help is not a completed automated content run |

No authentication file, credentials or full private configuration was printed.
CLI inspection succeeded but emitted access-denied warnings for temporary PATH
alias/cleanup directories under the user's Codex home. Those startup permissions
must be checked in a future trial; successful help output does not establish that
a child can start cleanly. The current managed workspace also protects `.codex`
from writes, so this session cannot assume it can install agent configuration.

## 2. Native orchestration, role configuration and exact models

Official documentation explicitly describes Codex spawning subagents, routing
follow-ups, waiting for results and exposing child threads. Custom agents support
model and reasoning overrides. Children inherit parent permissions, provider and
MCP servers; role instructions cannot create a tighter sandbox. In non-interactive
flows an action needing unavailable approval fails back to the parent.
[OpenAI: subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

The published configuration reference includes `agents.enabled`,
`agents.max_concurrent_threads_per_session`, `agents.default_subagent_model`,
`agents.default_subagent_reasoning_effort` and named role configuration files.
These allow defaults without changing the primary model. Proposed future settings
would select one content role, explicitly pin its model/effort, and permit only one
concurrent child. A concurrency limit is not a token or spend limit.
[OpenAI: configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)

Exact intended identity:

| Role | Model identifier | Effort |
|---|---|---|
| Primary architect/developer | `gpt-6.1-sol` | Keep the user's selected parent effort |
| Educational content worker | `gpt-6-luna` | `max` |

Luna supports Max, not Ultra. Model access depends on sign-in method, client,
workspace and account access. Its name is not `luna-6`, and Max is a reasoning
setting rather than a separate model ID. [OpenAI: models](https://learn.chatgpt.com/docs/models)

A future custom role could be described by a project-scoped
`.codex/agents/luna-content.toml` with name, description, developer instructions,
model and effort. Current documentation also exposes named role/config-file
declarations. Because this machine has v1 enabled and v2 disabled, verify discovery,
effective overrides and precedence on the installed version rather than assuming
every advertised format is active. No role file or configuration snippet has been
installed as part of this assessment.

## 3. Web, files and context

Codex distinguishes cached, indexed, live and disabled web search. Current research
needs fetched source/rights evidence, not a claim based solely on snippets. A
future trial should verify the child's effective search capability and its ability
to retrieve a cited page. No shell-wide internet permission is needed merely to
use hosted search. [OpenAI: configuration basics](https://learn.chatgpt.com/docs/config-file/config-basic)

Command networking and hosted web/tools have separate controls. Workspace-write
command networking is restricted by default, and managed policy may restrict it
further. A successful hosted search does not prove an audio/PDF download command
will work. Never weaken sandbox policy simply to make a batch continue.
[OpenAI: approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)

Recommended staging destination remains `data/incoming/<batch-id>/`. Tell Luna to
write only there, with a complete manifest and no edits to approved content,
application code, deployment or configuration. Under inherited workspace write
access this is an instruction, **not an enforced child-only directory boundary**.
Sol must inspect the file diff as well as the submission. If strict independent
write isolation is necessary, use a separately constrained process/workspace;
that changes the workflow and should be considered explicitly.

Use a bounded, self-contained task plus schemas and source policy, regardless of
context inheritance. A separate child thread is not a confidentiality boundary.
Do not pass private family progress, tokens or personal writing to content research.
Verify actual fresh-context versus inherited-history behavior during the trial;
the existence of another thread alone does not establish it. App-server APIs
distinguish new threads from history-copying forks, but those APIs should not be
confused with a guaranteed native-spawn option. [OpenAI: app server](https://learn.chatgpt.com/docs/app-server)

Treat web pages and submitted data as untrusted evidence, not instructions.
Luna's completion message cannot bypass validation or approve its own output.
Luna supports text/image input but no native audio output, so scripts do not become
recorded listening assets automatically. [OpenAI: Luna model capabilities](https://developers.openai.com/api/docs/models/gpt-6-luna)

## 4. Usage and costs

Delegation uses model/tool work and consumes allowance; it is not free because it
runs beneath Sol. ChatGPT-authenticated Codex uses the relevant plan's allowances
and credits; API-key runs use API billing. Model, reasoning, context and tools
affect consumption. The account's remaining allowance was not inspected. Use the
usage dashboard and record actual sample-run usage before projecting a bulk batch.
[OpenAI: pricing](https://learn.chatgpt.com/docs/pricing)

For scale only, the current standard Luna API rate is $0.10 per million input
tokens, $0.01 cached input and $0.50 output; long-context, speed, tools and other
applicable pricing rules can change the total. These are API token rates, not
subscription message prices or an estimate for a content batch. No paid API key,
credit purchase, billing change or audio service is proposed.
[OpenAI: Luna API pricing](https://developers.openai.com/api/docs/models/gpt-6-luna)

This is development-time content work. It creates no requirement for an AI runtime
in the family game. Manual Luna sessions also consume model allowance; copying
files manually does not make their research cost zero. Use one bounded worker,
small validated batches and a repair limit, rather than uncontrolled fan-out.

## 5. Recovery design if later authorized

Recommended batch states: requested → researching → staged → validating → needs
repair / quarantined / accepted. Persist batch ID, contract version, task prompt,
source records, attempt number, actual file inventory, validation report and
acceptance result in project data/documentation. Partial files never enter releases.

On completion Sol inventories actual files, validates and reviews them, and either
requests bounded repairs or promotes accepted records. A suggested limit is two
repair attempts before reporting the unresolved problem; that is a product policy,
not a built-in Codex guarantee. No silent model substitution or downgrade from Max.

On interruption, rate limit, permission failure or process loss, inspect the saved
batch before resuming; do not restart generation and duplicate IDs. Resume the
known session where available, or create a new bounded task using the persisted
contract and remaining work. CLI documents `codex exec resume <SESSION_ID>`;
that supports recovery, not a promise of unattended recovery after every crash.
[OpenAI: non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)

Any missing model/tool, unresolved rights, critical educational ambiguity, changed
cost or incompatible permission stops dependent integration and invokes manual
handoff or user guidance. Parent coordination can continue during an active run;
it does not replace a durable scheduler or survive the terminal closing by magic.

## 6. Automatic versus manual

| | Native Sol → Luna | Manual separate Luna conversation |
|---|---|---|
| Model separation | Explicit model and effort overrides, subject to actual account support | User selects the model and effort |
| Context | Bounded task possible, but inherited instructions/tools and context behavior need checking | Clearly separated conversation; prompt must carry all context |
| Files | Direct staging writes; parent inspects actual output | User transfers files; parent inspects actual output |
| Coordination | Parent can await completion, validate, request repairs and continue | Explicit checkpoints and user-coordinated return |
| Permissions | Shared inherited policy; role instructions are not a separate sandbox | Separate workspace may provide a stronger practical boundary |
| Recovery | Less copying, but requires persisted batch state and tested resume behavior | Slower, but easy for the user to inspect and restart |
| Cost | Model/tool allowance plus coordination; no inherent cost exemption | Model/tool allowance plus transfer effort |
| Current status | Feasible candidate; no end-to-end test or approval | Active agreed process |

Recommendation: retain manual L0 sample delivery now. After explicit authorization,
test one small native Luna run with `gpt-6-luna`/`max`, source retrieval, staging
writes, validation, an intentional repair and interruption recovery. Verify effective
model/effort and no unintended edits, not merely the child's declared identity.
If it passes and usage is acceptable, propose replacing manual copying with native
delegation while preserving A–I contracts, staged review and stop conditions.
Until that protocol change is approved, every mandatory Luna handoff still stops
and waits for the user.
