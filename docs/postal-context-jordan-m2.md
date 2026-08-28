# Jordan M2 review - 2026-08-28

## Outcome and criterion

**JO remains M1_metadata / blocked.** The previously unnamed M2 stage is now
`M2_licensed_assignment`: a current permitted source-scoped Jordan Post routing
assignment release, complete validation/conversion, fixed published data and
actual AGID loader/API evidence. The seven hard blockers, country identity,
non-area objects, derived geometry and independent civic/building links remain.
No postal polygon or address/building relation was generated.

## What was actually acquired

The [official office catalogue](https://opendata.gov.jo/en/dataset/jordan-post-offices-1661-2023)
and its documented public `package_show` API responded successfully. The two
listed CSV resources and a repeat of the first are all 31,286 bytes with
SHA-256 `abc065e573259e764ac6388bdf6b1ea461270b330fe3639f7ea7f3078b17543f`.
This is **one unique dated file**, not three datasets or 720 distinct offices.

The full CSV parses as 243 logical records: two preamble records, one header,
and 240 office records. Quoted newlines mean physical line counts are not row
counts. Only governorate/name/code are used in memory for aggregate checks;
addresses, property status, notes and hours are excluded from output.

| Office-file check | Count / denominator | Interpretation |
| --- | --- | --- |
| Non-five-digit code cells | 30 / 240 (12.5%) | Syntax nonconformance; not proof of an invalid official assignment |
| Empty code, name or governorate cells | 0 / 240 each | Completeness of these columns only |
| Duplicate candidate office keys | 0 / 240 | Governorate/name/code is not a stable official identifier |
| Repeated valid-code occurrences | 1 / 210 syntactically valid occurrences | Different offices may share a code; do not deduplicate by code |
| Distinct syntactically valid codes | 209 | Not national postcode coverage |
| Column-count errors | 0 | Seven-column reviewed schema |

The catalogue year is **2023**, metadata modification is **2025-07-16**, and
version is null. Migration status is pending while publication status is
passed. Both datastore-completeness flags are false; the full files, not
datastore pages, were profiled. Retrieval in 2026 is not record validity.
Current assignment rows remain zero, with assignment-quality rates unmeasured.

The operator homepage returned 403. A bounded publisher `package_search`
request returned 400, not an empty result. Indexed publisher pages expose
other dated office/services/coordinate datasets, but this run does not claim
an exhaustive current national inventory or that newer national data do not
exist. No private queries, coordinates, resident or cadastral data were used.

## Rights and source correctness

The official [Arabic licence v1.0](https://modee.gov.jo/ebv4.0/root_storage/ar/eb_list_page/ogd-license_ar.pdf)
and [English translation](https://www.modee.gov.jo/ebv4.0/root_storage/en/eb_list_page/ogd-license_en.pdf)
were acquired, hashed and visually reviewed on both pages. The English PDF
has an **Unofficial translation** watermark. The Arabic text controls. The
framework allows conditional reuse and derivation with publisher/data/date/
platform attribution, non-endorsement and protected-data exclusions. It also
contains a use/acceptance clause. No clickthrough or explicit contract was
accepted; publication, new destinations and restricted operations remain gated.

This is not a finding that Jordan prohibits open-data reuse. The item declares
`JORDONIAN-DEFAULT`, but its live licence URL pointed to `http://www.instagram.com`;
that URL was recorded, **not followed** or treated as a licence. An earlier
response omitted it. The licence version is not pinned by that identifier.
The portal licence page contains only a title, and its terms page is a
placeholder. Exact file-to-licence binding must be resolved before release.

The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/jorEn.pdf)
was hashed and visually reviewed: September 2004, five-digit syntax and the
region/department/zone/sector/unit diagram. Examples and contacts are not copied.
The [policy PDF titled 2025](https://www.modee.gov.jo/EBV4.0/Root_Storage/AR/EB_News/ICTP_Policy_2025.pdf)
has 31 pages; cover and PDF pages 19 and 22 were visually reviewed. Sections
104 and 131 call for completion of street/building addressing. Its HTTP
Last-Modified is 2019 and it contains 2019/2020 planning targets; neither
title nor transport timestamp establishes adoption or actual 2026 conditions.
The earlier carrier-route-sorting attribution is not supported by this PDF
and was corrected in JO metadata, notes and tests, preserving non-area rules.

## Implementation, reproducibility and evidence

`scripts/lib/postal-context-jo-offices.mjs` validates bounded UTF-8 CSV,
quoted newlines, exact headers, string codes, missingness and candidate keys.
It never emits source rows, office names/codes, addresses or property fields.
`scripts/inspect-postal-context-jo-sources.mjs` pins the reviewed PDF hashes,
rejects title/footer-only terms, bounds HTTPS hosts/redirects/bytes/concurrency,
checks exact public package/resource identity and deduplicates artifact hashes.
Office-file availability does not make a source name sufficient for strong
address verification; Jordan Post authority and bulk-file availability remain.

```sh
node scripts/inspect-postal-context-jo-sources.mjs --report tmp/jo-new-review.json
node scripts/inspect-postal-context-jo-sources.mjs --catalog-report tmp/jo-new-catalog.json
npm run verify:postal-context-jordan
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

Report commands refuse overwriting evidence. Receipts are
`reports/postal-context-m2/jo-source-review-2026-08-28.json`,
`jo-catalog-review-2026-08-28.json` and `jo-checks-2026-08-28.json` in that directory.
The ledger pins their SHA-256 values. Only aggregate evidence is in Git.
The host npm launcher/child shell is broken; equivalent package-script test
targets were run with installed Node/tsx. Dependencies came from the existing
lock/cache offline, lifecycle scripts disabled. Python needed UTF-8 mode for
PDF extraction; local image-tool path errors were worked around by reading
the unchanged rendered PNGs. No TLS bypass, paid compute or deployment.

## Unblock and next review

Obtain a current complete source-scoped routing assignment input, clarify the
30 nonconforming cells/object semantics, pin exact source licence/validity and
version, and reproduce full conversion and reconciliation. Obtain explicit
approval before any fixed data publication outside AGID Git and verify the
actual loader/API. Independently evidence geometry and civic/building relations.
Recheck public references seven days after the source receipt, after all pending
countries; this does not authorize restricted access, contracts or publication.
Next pending country is KG (Kyrgyzstan), confirmed by the ledger status command.
