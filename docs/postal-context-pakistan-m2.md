# Pakistan M2 source audit

Reviewed 2026-08-28 UTC from GitHub base `aa740c2183408587071b51d19c6efe7f247a4a0c`.
Status: **blocked, M2 not achieved**. The existing `M2_assignment` criterion is unchanged:
a complete rights-cleared delivery/non-delivery postcode-office assignment, including amendments,
must pass authority, coverage, freshness, licence and digest gates. Geometry is not required for this M2.

## Actual data and limits

The [Pakistan Post directory](https://pakpost.gov.pk/postcodes.php) was downloaded successfully.
The inspector consumes its `dpo` and `ndpo` tables as separate typed records:

| Snapshot measure | Delivery | Non-delivery |
| --- | ---: | ---: |
| Data rows | 2,298 | 832 |
| Five-digit strings | 2,298 | 832 |
| Distinct codes | 2,293 | 821 |
| Shared-code groups | 5 | 11 |
| Leading-zero rows | 0 | 831 |

The non-delivery body also contains 15 repeated headings; its footer is a heading, not a record.
All observed data fields are nonempty. Shared-code rows are not exact duplicate rows and are not
automatically discarded. Office class comes from the table, never from a digit prefix. Province labels
are preserved, not merged into administrative or sovereignty claims. These counts establish neither
national completeness nor current validity; both remain unknown.

The linked [delivery PDF](https://pakpost.gov.pk/images/national%20post%20code%20directory.pdf)
has 45 pages and a 2021 creation timestamp; the [non-delivery PDF](https://pakpost.gov.pk/images/LIST%20OF%20NON%20DELIVERY%20POs.pdf)
has 17 pages and a 2019 timestamp. Only first-page schemas and metadata were reviewed,
not all PDF rows. File creation/HTTP modification times are not effective assignment editions.

The [existing amendment PDF](https://www.pakpost.gov.pk/pdfForms/2024-5-16-Director-General-Circular-02-4-2022-under-the-DGPPO-IBD.pdf)
is a 19-page circular. Its cover says 15 April 2022; the postcode notice on pages 9-12 is dated
16 April 2022 and refers to the 6 August 2018 base circular. The filename and PDF creation are 2024.
Visual inspection confirmed a six-digit delivery-code cell, a branch code equal to its office code,
another not equal to office-plus-one, and a non-delivery code not starting with zero.
These are source exceptions requiring review, not permission to truncate, calculate or reclassify values.
Unrelated personnel content and signatures are not copied into Git.

A [November 2023 notice](https://www.pakpost.gov.pk/images/2023-11-15-Post-code.jpg),
linked from the [current official homepage](https://www.pakpost.gov.pk/), names the fifth edition
corrected through 30 June 2018 as its base. Its five delivery-code values were manually compared
with the parsed HTML code column and none matched. This is discrepancy evidence, not a complete
amendment reconciliation or proof that those assignments remain current. The handwritten day
is not used as an effective date; the upload filename is not one either.

The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/pakEn.pdf)
is printed 09/2004 despite a 2020 PDF timestamp. Its examples and digit semantics do not establish
current assignments, polygons or real building relations.

## Rights and authority

No artifact-specific redistribution grant was established in the reviewed directory, linked documents,
homepage or [privacy policy](https://www.pakpost.gov.pk/privacypolicy.php). The latter describes personal-data
processing, not a directory licence. This is an unresolved gate, not a claim that reuse is categorically forbidden.
[Survey of Pakistan registration guidance](https://www.surveyofpakistan.gov.pk/detail/MDRlMTFkMjktMDRiMy00MDAyLTkzOTQtNGZjYmFlN2ZkNTdi)
describes registration and fees for covered geospatial work. Applicability to a future geometry product
needs separate review; this audit is not a legal opinion, registration or permission grant.

No map, paid product, new repository, hosting destination, contract, account registration or production
deployment was created. No raw HTML/PDF/image dump, recipient, customer, personnel, owner or land-rights
data is committed. Only source references, aggregate findings, code and synthetic tests are published.

## Reproduction and AGID

`scripts/inspect-postal-context-pk-directory.py` accepts a bounded UTF-8 HTML snapshot and optional
`--expected-digest sha256:...`; stdout contains aggregate JSON, never rows. It records the two observed
optional HTML end tags, rejects structural drift, preserves strings, and does not repair field values.
Run its adjacent Python unittest file for synthetic parser checks.

`npm run inspect:postal-context-pakistan -- --observations <local-receipts.json> --python <python> --report <new-report.json>`
rechecks receipt URL/time/MIME, every source's bytes and SHA-256, and freshly recomputes directory counts.
Receipts use `id`, `observedAt`, `requestedUrl`, `finalUrl`, `redirects`, `httpStatus`, `contentType`,
`lastModified`, `byteLength`, `responseDigest`, and `bodyPath`. See the source report for non-body values.
PDF/image interpretation is human review bound to exact bytes, not automated proof of every row.
Without `--observations`, the inspector performs bounded public GETs; `--curl <executable>` is optional.
Changed bytes fail closed and require a new review. `npm run verify:postal-context-pakistan-sources` tests this gate.

AGID conformance tests reject six-digit anomalies and keep postcode lookup from asserting a street
number or building. They use synthetic fixtures only. No production PK descriptor has been activated;
real-data AGID verification, current assignment accuracy and positional accuracy remain unestablished.

## Unblocking

Reconcile a pinned base edition with every applicable amendment; resolve shared-code and malformed-value
exceptions through source evidence; establish artifact-specific reuse terms. Validate the real typed
assignment pack, then obtain approval for a no-extra-charge immutable publication destination before
publishing, re-downloading and hash-checking it and verifying the actual AGID loader/API. Keep geometry
`none` unless separately supported; exact buildings still require explicit permitted address relations.

Recheck after **2026-09-04T22:55:37.259Z**, only after all pending countries. Evidence is in
`data/postal_country_packs/pk/postal-context/m2-source-review.json` and
`reports/postal-context-m2/pk-source-review-2026-08-28.json`; engineering checks are separate.
