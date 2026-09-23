# Hugging Face development with no additional spend

User constraint, 2026-08-28: use the existing subscription, with **zero
additional charges**. A subscription is not evidence that every service,
storage overage or compute job is included. This document is an operating
constraint, not a billing setting or a guarantee about third-party charges.

## What is implemented

`scripts/plan-postal-context-hf-release.ts` is an **offline preflight**.
It uses the existing AGID pack loader to check country identity, descriptor,
graph, geometry, SHA-256, counts, provenance and topology. It then lists the
three permitted runtime files, expected sizes and full-commit HF URLs.
It does not upload, create a repository, authenticate, call a model, start
a Space/Job, verify remote bytes or change billing. It adds no dependency.
Synthetic/experimental packs require explicit flags and remain non-M2.
Residential-address-point packs are refused pending separate privacy review.

```sh
npm run postal-context:hf:plan -- --help
npm run postal-context:hf:plan -- --descriptor PATH --digest sha256:HEX --country CN --dataset OWNER/REPO --revision FULL_40_CHARACTER_COMMIT
npm run verify:postal-context-hf
```

All capitalized values are placeholders, not existing approved destinations.
The supplied revision is syntax-checked, not remotely attested. A successful
offline plan is neither a licence nor publication/M2 approval. Revalidate
files before any approved upload; files may change after the plan is made.

## Zero-additional-cost boundary

- Keep Jobs, paid GPU/CPU upgrades, Inference Endpoints, metered inference,
  storage/egress overages and automatic top-ups disabled for this workflow.
  Do not use a credit balance as permission to spend it.
- Existing contract-included storage and a free CPU Basic Space can be
  considered only after exact destination, remaining quota, current cost
  and visibility are checked. New repositories/Spaces still need approval.
- Stop when included capacity is insufficient or the price is unclear.
  Do not automatically fall back to paid hardware or purchase credits.
- Do not overwrite unrelated existing address-AI models or training data.
  Model-assisted parsing can propose candidates; it is not postal authority,
  source rights, exact building evidence or country M2 completion.

## Recommended development split

GitHub remains the source of code, tests and the M2 ledger. Country-specific
HF Datasets can hold approved immutable source/derived shards, under their
individual licences and technical jurisdiction. Keep restricted material
private or outside HF where its terms require; private visibility alone
does not establish processing or redistribution rights.

Parquet/GeoParquet can support exploration and column-oriented processing.
The current AGID loader consumes verified local **JSON graph/geometry plus
descriptor**, not arbitrary Parquet. A separately reviewed deterministic
transform and ephemeral staging step are needed between these layers.
No transparent remote loader or production deployment is introduced here.

The [HF download guide](https://huggingface.co/docs/huggingface_hub/guides/download)
supports a full commit revision and selective file downloads. Pin that
commit and verify SHA-256 after downloading. Do not use mutable `main` or
tag references as immutable evidence.

The [Dataset Viewer Parquet documentation](https://huggingface.co/docs/dataset-viewer/parquet)
describes separate conversion refs and potentially partial output.
Viewer previews/statistics and `refs/convert/parquet` are discovery tools,
not a guarantee of an exact source commit, complete country coverage or
licensing. Resolve config/split explicitly and inspect partial/failed flags
before analysis. Do not replace source-release provenance with Viewer URLs.

[Spaces](https://huggingface.co/docs/hub/spaces-overview) are suitable for a
private development/demo surface after approval and cost checks, not the
authoritative M2 store or an assumed always-on production service.

For CN, only the source-review aggregates and synthetic engineering checks
are currently available. The live outlet rows are not retained or cleared
for HF upload; national assignment/geometry/rights/publication gates remain
blocked. No HF upload or paid operation was performed in this run.
