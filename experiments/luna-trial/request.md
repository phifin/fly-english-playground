# Controlled Sol-to-Luna trial: luna-e2e-001

This task is explicitly authorized by the user as one small disposable feasibility
trial. It is not a production Luna batch and is unrelated to P0 game content.

## Mission and context

Act as the educational content worker. Create exactly two original, very short
English grammar fixtures about singular/plural `there is` / `there are`, with
English and Vietnamese explanations. Label all level claims provisional and all
records synthetic/disposable. Do not create other lessons, scrape a dataset,
generate audio or images, or initiate any paid service.

## Research

Use web search to find one authoritative publisher/educator grammar reference
(for example British Council or Cambridge). Actually open/read the page. Return
its title, URL, access date and one short paraphrased finding. Use it as reference
knowledge only; do not copy examples or exercises. If web tools fail, record that
failure and do not fabricate research or access evidence.

## Exact output contract

Read `experiments/luna-trial/schema.json`; the file is the complete JSON Schema
2020-12 contract. Supply exactly two unique IDs: `trial-item-01` and
`trial-item-02`. One original prompt needs `is`, and the other needs `are`.
Each prompt contains exactly one `___` gap. The correct answer must be
unambiguous from an explicit singular/plural noun phrase. Do not put either answer
in the other accepted-answers set. References in `sourceIds` must exist.

Use UTF-8. Required destination:

```
experiments/luna-trial/staging/dataset.json
experiments/luna-trial/staging/research-notes.md
```

Research notes must distinguish your requested model/effort from anything you can
actually observe. Do not treat self-identification as proof. List the web query,
page actually opened, any failures and paths written. A final short message to Sol
must list both paths and any limitations. Do not claim schema validation unless
you actually ran a validator. Sol independently validates and reviews the files.

## Boundaries and recovery

You own only `experiments/luna-trial/staging/`. Do not edit the request, schema,
game source, configuration, approved content or deployment files. No child agents,
no bulk content, no production integration, no credentials, no changes to sandbox
policy. If interrupted, preserve partial output and report which steps remain.
If a write is rejected, report the actual error and return the small dataset in
your final handoff instead; do not seek elevated permissions.
