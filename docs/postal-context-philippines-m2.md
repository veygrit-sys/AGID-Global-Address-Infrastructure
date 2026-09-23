# Philippines M2 review — 2026-08-28

**Blocked; M2 not achieved.** The existing `M2_assignment` criterion is unchanged:
a complete rights-cleared, editioned PHLPost ZIP assignment passing authority,
coverage, freshness, licence and digest gates. Passing code tests is not data completion.

## What was actually obtained

The [PHLPost locator](https://phlpost.gov.ph/zip-code-locator/) was fetched without
authentication on `2026-08-28T22:22:02.139Z`. The 963,702-byte HTML snapshot has
SHA-256 `f351d7a7d6e3f0dfa78612406e1f300f5a71f93d4805c76397f2b53eed9f357b`.
The table `offices` has Region, Provinces, City/Municipality and Zip Code columns.

| Check | Snapshot result | Treatment |
| --- | ---: | --- |
| HTML body rows | 1,400 | Not the number of assignments |
| Entirely blank rows | 440 | Counted explicitly, never filled |
| Populated rows | 960 | Source table rows, not nationwide coverage |
| Four-digit code rows | 959 | Syntax candidates, not current validated assignments |
| Distinct four-digit codes | 958 | Text keys; no deduplication |
| Invalid code cells | 1 | Body row 628 contains a locality label; quarantined, no guessed correction |
| Exact duplicate row groups | 1 | Two identical rows retained in profiling |
| Region / province labels | 13 / 55 | Source labels, not current PSGC unit counts |

No populated row has a missing field; this does not negate the 440 all-blank rows.
No leading-zero code was observed, but the parser preserves leading zeroes in
future sources. Shared postcodes and repeated rows are different diagnostics.
The decoded matrix digest includes blanks, order and duplicates. No source row
or corrected assignment is exported. The checked HTML has no established data
edition/effective date; retrieval time and the footer copyright year cannot replace it.
Web-search renderings are not byte-identical captured datasets and were not merged in.

## Rights and time are separate gates

The same locator page has a public-domain-with-exceptions notice and a PHLPost
copyright footer. The public-domain notice is **positive evidence**, not evidence
that no reuse terms exist. Its artifact-specific exceptions and profit-exploitation
scope remain unresolved; this release neither declares the table prohibited nor
grants a blanket commercial redistribution licence.

The [Supreme Court copy of RA 8293](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/4371)
was byte-verified. Section 171.11 defines government work using official duties,
including government-controlled corporations; section 176 distinguishes qualifying
government works, profit-exploitation approval, certain exceptions and pre-existing
third-party rights. This is a reviewed source text, **not a legal opinion** or a
PHLPost-specific permission. The [WIPO 2015 edition](https://www.wipo.int/wipolex/en/legislation/details/18399)
was consulted only as a web cross-reference, not claimed as a hash-verified artifact.

The [UPU Philippines sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/phlEn.pdf)
is 135,640 bytes; both pages were visually reviewed. Its printed edition is **09/2004**,
while PDF creation/modification is 2020-06-08. Neither proves current allocation
coverage. The diagram explains four-digit routing and address order, not polygons.
Examples, named recipients and contact details were not imported into data artifacts.

## Four-digit ZIP and ZIP Code PH must not be conflated

A [PHLPost announcement dated 2024-03-06](https://phlpost.gov.ph/cpt-press-releases/phlpost-continues-to-send-and-receive-mails-in-192-countries-worldwide/)
describes seven-character alphanumeric ZIP Code PH. It supplies no complete allocation
artifact, effective transition date or explicit four-to-seven-character crosswalk.
The existing AGID four-digit namespace remains unchanged. New regression checks
reject alphanumeric or seven-digit input in that namespace; they do not claim the
announced system is nonexistent or unsupported by PHLPost. No Postal ID records,
tracking queries, biometrics or user identities were requested.

## Administration, geometry and exact address display

Direct [PSGC listing](https://psa.gov.ph/classification/psgc/node) and
[PSGC summary](https://psa.gov.ph/classification/psgc/summary) requests returned **403**.
No restriction was bypassed. Search rendering identifies a 2026-06-30 administrative
edition and the PSA CC BY 4.0 notice; no attachment, row or digest was validated.
PSA terms cannot license PHLPost data, and PSGC names or boundaries cannot repair
the postal table or establish a ZIP-to-barangay crosswalk.

For this intake geometry is **none**, not an invented official, derived or virtual
polygon. Existing synthetic geometry remains test-only. An eventual derived surface
requires independently permitted inputs, a method, uncertainty and provenance.
House numbers and buildings require separate rights-cleared civic evidence and an
explicit stable address-building relation. No nearest-building, postcode containment,
administrative-name match or model completion is enabled.

## Reproduction and limits

Use Python 3 (standard library only) and the repository's pinned Node dependencies:

```text
python3 scripts/inspect-postal-context-ph-table.py <captured-locator.html> --expected-digest sha256:f351d7a7d6e3f0dfa78612406e1f300f5a71f93d4805c76397f2b53eed9f357b
python3 -B scripts/inspect-postal-context-ph-table.test.py
node scripts/inspect-postal-context-ph-sources.mjs --observations <receipts.json> --python <python3-executable> --report <new-report.json>
npm run inspect:postal-context-philippines -- --report <new-report.json>
npm run verify:postal-context-philippines-sources
```

Capture receipts use `id`, `requestedUrl`, `finalUrl`, `redirects`, `observedAt`,
`httpStatus`, `contentType`, `lastModified`, `byteLength`, `responseDigest`, and a
local `bodyPath` for successful bodies. The offline command validates exact receipts
and recomputes the table profile. Denial receipts have no body/digest. The live command
uses bounded, unauthenticated HTTPS GETs, keeps bodies in memory, skips the two prior
403 sources, and fails closed on byte/MIME/content changes. `--curl <executable>`
can select native verified TLS; no credentials, cookies or TLS bypass are used.
Live hash equality can reuse this exact historical review; it cannot prove freshness.
Outputs use exclusive creation and never overwrite an earlier report.

[Source report](../reports/postal-context-m2/ph-source-review-2026-08-28.json),
[review configuration](../data/postal_country_packs/ph/postal-context/m2-source-review.json)
and [engineering report](../reports/postal-context-m2/ph-checks-2026-08-28.json)
distinguish real-source inspection, synthetic conformance and missing production proof.
The complete source documents and normalized rows are not stored in AGID Git.

## Unblock and next review

Obtain an editioned complete PHLPost assignment artifact, source-defined handling of
blanks/invalid values/duplicates, current validity and explicit namespace/transition
metadata. Record applicable reuse conditions and any required provider permission.
Validate the real records reproducibly, then publish to an **approved** immutable
no-extra-charge destination, re-download/hash-check it and exercise the actual AGID
loader/API. None of those publication/runtime evidence gates is satisfied yet.

Review public sources again only after the pending-country pass and
`2026-09-04T22:27:15.802Z`. Restricted access, contracts, new repositories/data
destinations, additional charges and production deployment still need approval.
Only PH was worked on in this run; the other 251 ledger entries are preserved.
