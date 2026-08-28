# Postal Context M2 country rollout

The recurring task processes one country at a time in this order:

1. Asia (Japan first, then country/territory code order)
2. Europe
3. Americas
4. Africa
5. Oceania

The ledger is `docs/postal-context-m2-rollout.json` on the cumulative
`codex/postal-context-m2-rollout` branch of `veygrit-sys/Address-Grid-ID`.
Read the latest remote commit before every run. A local working copy may have
been removed after a verified push; an older user worktree is not the ledger.

## Scope and actual starting state

The first audit covers 252 registered country/territory profiles, including
repository-specific territory codes, not 252 ISO sovereign states. Antarctica
and the repository's special profiles are outside the five-region request.
The scheduling region is distinct from source ownership or sovereignty:
AS/GU/MP/UM run with Oceania, and EA runs with Africa. Their original profiles
are unchanged. All other profiles keep the repository's regional grouping.

At the initial audited base `cc7821cc8175031545d2a437fb5a4b10b6dfe5fe`,
110 country manifests exist and all declare M1. Only 61 spell out a named M2
stage. Missing manifests or criteria are work to do, not implicit success.
Some countries require assignment data; some require official postal geometry;
others allow an explicitly scoped experimental release. Preserve those
differences. Do not redefine M2 globally to make a country pass.

## State and resumption

- `pending`: not yet attempted in this rollout.
- `in_progress`: exactly one country; finish it before starting another.
- `blocked`: record concrete evidence, the missing permission/data/contract,
  the action needed to unblock, and an ISO timestamp `retryAfter`.
- `m2_verified`: the country's own criterion has been met by real data,
  reviewed source rights, published digest-pinned artifacts, reproducible
  validation and an AGID runtime verification record.

Visit pending countries across all regions before retrying due blockers.
Never poll the same unavailable source on every hourly wakeup. Prefer a
seven-day retry for unchanged source/licence blockers. Mark permission blockers
with `requiresExplicitApproval: true`; do not retry without new authority. They
remain excluded from automatic retry even after `retryAfter`; that date is a
review reminder, not permission. Explicit user approval can resume the country
earlier by clearing the gate and setting `in_progress`. Do not stop the whole rollout because one
country lacks an obtainable source. When all countries are either completed
or waiting for future review, report the next review date without claiming
completion. Pause the heartbeat only after every in-scope country has genuine
M2 evidence, or when the user asks to pause it.

The ledger checks required evidence fields, not the truth of arbitrary claims.
The executing agent must independently verify the linked artifacts and reports.
A stage label, source URL, code scaffold or passing synthetic fixture is not
M2 evidence. A no-postcode country must be reviewed against its actual system;
never invent an official code or silently mark it completed.

## Commands

```text
npm run postal-context:m2:status
npm run postal-context:m2:refresh
npm run verify:postal-context-m2
node scripts/intake-postal-context-jp-m2.mjs --report reports/postal-context-m2/<new-report>.json
node scripts/intake-postal-context-jp-m2.mjs --report <new-report>.json --expected-archive-digest sha256:<pinned-source-digest>
```

`refresh` regenerates inventory metadata and preserves progress. It refuses
duplicate countries, multiple active countries, missing proof for a completed
country, or removal of a previously tracked country. A changed M2 definition
for a completed country requires review.

## First country: Japan

The first implementation performs bounded official-source intake for the
[Japan Post UTF-8 ordinary assignment file](https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html)
and pins the [field definitions and reuse notice](https://www.post.japanpost.jp/service/search/zipcode/download/readme.html).
It validates all 15 fields, seven-digit string codes, update flags, row/byte
limits and the single expected ZIP entry. It rejects altered rights text,
unapproved redirect hosts, malformed CSV and retired rows in a current file.

The normalizer preserves fallback, no-town, partial/qualified and multiple-town
semantics. An ordinary row without exception flags is still locality context,
not proof that a whole-town polygon is available. Building names, civic house
numbers, parcel identities and geometry are never inferred from the CSV.
The ordinary file does not include the separately published business-specific
assignment file.

The committed intake report contains counts, source/terms digests and validation
results only. The source archive, source locality rows and normalized JSONL
exist only in memory during this intake. No source snapshot or deployed pack
had been published by that intake step; Japan remained M1 / `in_progress`.

The next Japan step is now implemented: the [scoped real-source runtime](postal-context-japan-m2-runtime.md)
builds a non-synthetic, digest-pinned Chiyoda pack and checks all 485 selected
postcodes through the shared loader, with actual AGID v1 HTTP API checks.
Source exceptions/flags are retained and geometry/building information is not
invented. The [validation report](../reports/postal-context-m2/jp-chiyoda-runtime-2026-08-28.json)
remains explicitly publication-pending. No country maturity has been promoted.

Next: obtain approval for the separate public country repository, retain the
source/rights evidence there, publish immutable artifacts, verify remote digests
and replay before reviewing Japan's experimental M2 criterion. Do not repeat
the same approval request or build merely because the heartbeat wakes up.
Nationwide intake is not nationwide runtime, address or building coverage.

The 2026-08-28 heartbeat found no new publication authority. Japan is now
`blocked` / `M1_metadata`, with the previous intake/runtime evidence preserved.
The seven-day review date does not grant permission or trigger a rebuild.
No new source data was downloaded and no repository or public artifact was
created during this hold review. The next run selects AE (United Arab Emirates)
from pending Asia entries; no second country was started in this run.

## United Arab Emirates: source contract review

The 2026-08-28 AE run reviewed the previously missing country-specific M2
definition. The [AE contract and review](postal-context-united-arab-emirates-m2.md)
separate branch-scoped PO Boxes, Dubai entrance locators and Abu Dhabi Onwani
postal codes. It is not correct to label all AE addressing as no-postcode.
Reference metadata now stays outside postal-validation eligibility, including
exact historical-document matches that must not inherit generic UPU authority.

The [reference probe report](../reports/postal-context-m2/ae-reference-review-2026-08-28.json)
contains document hashes and actual access failures, not source-data records.
AE remains **M1_metadata / blocked**, with zero retained data snapshots or
published artifacts. Its M2 criterion requires a rights-cleared real scoped
dataset, reproducible transformation, immutable public evidence and
namespace-aware AGID checks. No country-only AE runtime was enabled.

Next read-only review is 2026-09-04, after the pending-country pass. Any new
authentication, contractual acceptance or public destination still needs
explicit authority. Japan's approval hold is unchanged. The next country is
**AF (Afghanistan)**; no second country was started in this AE run.

## Afghanistan: live area preflight

The 2026-08-28 AF run formalized the existing country M2 requirements as
a machine-readable stage without relaxing rights, temporal, geometry or
privacy conditions. The [source review](postal-context-afghanistan-m2.md)
verified one public postal-area response with a matching six-digit code:
MultiPolygon, one polygon/ring and 126 positions. No raw response was kept.

The report records three verified reference documents and three direct
operator-site access failures. A live polygon and a document hash do not
replace licensed, retained, editioned source data. AF remains M1 / blocked.
Full CRS/topology, real-data AGID checks and immutable publication are
still required. Source webpages are no longer eligible validation datasets.

Next read-only review is 2026-09-04 after all pending countries. JP and AE
holds are unchanged. The next pending country is AM; no second country
was started during this AF run.

## Armenia: office-directory and rights preflight

The 2026-08-28 AM run retained its original experimental M2 definition.
The [source and quality review](postal-context-armenia-m2.md) verified eight
official references and inspected a pinned nine-page HayPost directory:
428 rows, 427 distinct codes, one repeated-code group and four unresolved
same-baseline extraction rows. No office address became a civic-address
assertion and no polygon or building link was inferred.

AM remains M1 / blocked. Current assignment edition, reuse rights, complete
row identity, approved immutable artifacts and real-data AGID validation
are still required. Reference URLs now stay outside validation eligibility.
The next read-only review is 2026-09-04 after the pending-country pass.
JP, AE and AF are unchanged; the next pending country is AZ.
No second country was started in this AM run.

## Git, privacy and authority boundaries

Use an isolated worktree from the cumulative remote branch. Preserve every
pre-existing user change, including incomplete SDK and Luxembourg work. Keep
raw national dumps, personal/customer records and heavy indexes out of AGID
Git. Do not create repositories, paid services, public data destinations or
production deployments without explicit approval. No force pushes or merges
to main. Keep `origin` unchanged and push only to the explicit approved
`veygrit-sys/Address-Grid-ID` URL, SSH first and HTTPS if SSH is unavailable.

After focused/shared tests, typechecking and diff review, commit only completed
in-scope changes. Verify GitHub's exact branch SHA before removing that run's
temporary worktree, data and local branch. Never delete unpublished work or
existing user changes. Each report names the country, actual maturity,
remaining blockers, tests, branch, commit URL and next country/action.
