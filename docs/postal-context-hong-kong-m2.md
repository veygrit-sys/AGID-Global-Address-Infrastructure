# Hong Kong M2: no-postcode address context

## Outcome and country criterion

HK is **M1_metadata / blocked**, not M2. This run introduces the previously
missing HK-specific contract, an experimental ALS candidate adapter, public
source preflight and negative tests. No production country API is enabled.
No external repository, Space, dataset or paid service was created.

The criterion `M2_scoped_address_context` requires a rights-cleared current
real HK dataset with explicit scope and snapshot identity, reproducible
digest-pinned address-context artifacts at an approved immutable destination,
and namespace-aware AGID loader/API verification. It does not require an
invented postcode or postal polygon. A scoped release must not be represented
as complete Hong Kong address, delivery or building coverage.

The machine-readable contract is
`data/postal_country_packs/hk/postal-context/repository-manifest.json`.
Existing HK planning cells and synthetic pack contents are unchanged and are
not input evidence for this M2 review. HK identity and its Asia queue region
are unchanged; no data is merged into CN or MO.

## Source roles and conditions

- [Hongkong Post policy](https://www.hongkongpost.hk/en/about_us/tips/postcode/index.html)
  says no local postcode system is adopted. Its form workarounds are not
  assignments. Keep postal code `null` and official postal geometry `none`;
  GeoAddress, phone codes and AGID cells cannot fill that field.
- [Digital Policy Office ALS catalogue](https://data.gov.hk/en-data/dataset/hk-dpo-als_01-als)
  describes bilingual structured address candidates and monthly updates. It
  explicitly disclaims exhaustive coverage and timely correctness; some
  entries describe complexes or established unofficial rural addresses.
- [DATA.GOV.HK terms](https://data.gov.hk/en/terms-and-conditions), version 1.2
  dated 26 May 2025, positively allow free commercial and noncommercial reuse
  subject to source/IP acknowledgement, attribution and indemnity conditions.
  This is not a claim that data reuse is prohibited, nor permission for every
  third-party resource linked by the portal. Review the actual snapshot and
  intended transformation/distribution, including applicable owner conditions,
  before release. No click-through agreement or account operation occurred;
  the portal's browsewrap notice is recorded, not interpreted as no contract.
- [ALS dictionary](https://www.als.gov.hk/docs/Data_Dictionary_for_ALS_EN.pdf)
  T361 v3.1, September 2023, was read and relevant table pages visually checked.
  Its document-reproduction restriction is separate from data reuse terms.
  The PDF is not bundled. Its 2023 edition is not a data edition in 2026.
- [GeoAddress Finder](https://tools.csdi.gov.hk/geoaddressfinder/?l=en) is a
  location-reference tool. CSDI catalogue identity alone is not source-record,
  postal or footprint evidence. No cadastral or title dataset was queried.

## Interface and semantic decisions

The [lookup contract](https://data.gov.hk/en-data/dataset/hk-dpo-als_01-als/resource/20bac7af-847e-4f99-83c4-0d087ce87f21)
and [GeoAddress contract](https://data.gov.hk/en-data/dataset/hk-dpo-als_01-als/resource/7d2af314-4fe3-4df2-8e9d-6d0116eabb34)
are public GET interfaces. The probe sends JSON/bilingual headers, ten-result
limits, basic matching and `3d=0`. It explicitly sets `t=20`: the HTML default
is 20 while the v3.1 dictionary says 35. No current default is guessed.

GeoAddress is a 19-character location identifier: HK1980-derived digits,
podium/tower indicator and record creation date. Multiple textual addresses
may share it. It is not a postal code, unique address-row key, validity period,
entrance or footprint. WGS84 coordinates come only from the explicit latitude
and longitude fields, not the identifier's digits. Number endpoints and
suffixes remain source strings; ranges are not enumerated into house numbers.
Search scores are only ranking values, never probabilities or deliverability.

## Real bounded observations

The final receipt is
[hk-als-review-2026-08-28.json](../reports/postal-context-m2/hk-als-review-2026-08-28.json).
It includes retrieval times, HTTP details, SHA-256, semantic digests and
aggregate checks. Six required official references passed MIME/content checks;
the dictionary also passed an exact PDF digest check.

| Initial public-building query | Rows | Missing EN/ZH/point | Explicit bilingual building name | Number fields | AGID cell roundtrip |
| --- | ---: | --- | ---: | ---: | ---: |
| Central government offices | 1 | 0 / 0 / 0 | 1 | 1 | 1 |
| Mongkok government offices | 1 | 0 / 0 / 0 | 1 | 1 | 1 |

These are two initial response observations, not a population sample or a
national record count. The missingness rate is 0/1 for each measured field in
each query; the sample is too small to estimate general completeness. The
first response was repeated byte-identically. A GeoAddress lookup matched its
identifier and semantic content while omitting the search score. Those two
additional calls are not extra unique-address coverage. All four responses
passed parsing, but the report counts only the initial two cell checks in its
headline total. No source address rows or point coordinates are retained.

No missing source field was repaired. Empty results, repeated location IDs,
number ranges, missing language, invalid dates/coordinates, unknown/private
fields, response tampering, redirects, changed repeat responses and excess
rows have explicit automated tests. Duplicate comparison excludes transport
echo/score; rows and language variants are never automatically merged.

## AGID integration boundary

`src/lib/postalContextHongKongCandidate.ts` reads digest-verified response bytes
into source-linked **candidate** address fields. The source pointer and receipt
identify the exact snapshot row, not a permanent official record ID. Unknown
source edition and validity remain `null`; retrieval time is separate.

The existing AGID encoder/decoder is exercised on explicit source WGS84 points.
The resulting relation means only coordinate-cell membership. Source country
HK is retained even if the encoder's coarse regional prefix were different.
No building footprint, unit, entrance, postal assignment or delivery assertion
is created. The broad coordinate sanity box is not a boundary or coverage map.

The source catalogue now separates HK postal policy, ALS and CSDI discovery.
All remain metadata/context-only for postal validation: merely naming an
official source cannot validate a particular address. Generic HK postcode
runtime routes remain disabled until the no-postcode descriptor/loader/API
contract is implemented and proven with a published real pack. This adapter
is not that production runtime and does not make a live query into M2.

## Remaining work and authority gate

1. Obtain explicit approval for the immutable country-data destination and
   intended publication under the applicable conditions. Do not create a
   repository, HF Space/dataset, paid job or deployment as a workaround.
2. Retain permitted source/terms snapshots outside AGID Git, with declared
   scope, retrieval version, hashes and reproducible transformation. The live
   API has no observed edition header; monthly cadence and GeoAddress creation
   dates must not be substituted for it.
3. Publish and remotely verify the fixed artifacts; exercise real AGID
   no-postcode loader/API behavior, ambiguity and source-linked display.

Review reminder: **2026-09-04**, after the pending-country pass and only with
new authority for the gated publication work. The date does not authorize
publication or repeated source calls. No additional chargeable operation was
started. Next pending country is **ID (Indonesia)**; not started in this run.

## Reproduction

```text
npm run verify:postal-context-hong-kong
npm run postal-context:hk:inspect -- --report <new-aggregate-report.json>
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

The inspector refuses an existing report path and makes only the fixed public
government-building probes after all reference checks pass. It stores no raw
responses or authentication data. A rerun is a new observation, not a replay
of a retained source artifact. On this host the npm launcher is broken; the
installed `tsx`/`tsc` and exact Node status target are invoked directly. Cached
dependencies were installed offline, without package scripts or lock changes.
