# Indonesia M2 source review — 2026-08-28

Indonesia remains **M1_metadata / blocked**, not M2. Its existing criterion is
unchanged: **M2_assignment** — a complete rights-cleared current code-to-locality
assignment passing authority, coverage, freshness, licence and digest gates.
Do not replace this with a small scoped preview criterion. Polygon production
is not required at this stage; the existing M3/M4 gates stay separate.

## Current primary evidence

The [official Pos Indonesia search](https://kodepos.posindonesia.co.id/) serves
an anonymous POST form. The reproducible inspection makes just three searches:
one postcode query, one locality-text query and a repeat of the latter. No
recipient, private address, account, shipment or tracking query is made.

At 2026-08-28T12:00:47.730Z, the postcode query returned one row. The locality
query returned 20 rows with 20 distinct five-digit codes and four province
labels. Both initial responses had zero missing/invalid codes, incomplete
locality rows and duplicate tuples. The repeat matched byte-for-byte and as a
normalized tuple multiset. These are **21 initial row observations**, plus a
20-row repeat, not a verified national count or a unique combined dataset.

The row grain is the displayed postcode, village/urban-village, district,
city/regency and province tuple. Display ordinals are not persistent IDs.
Preserve postcode-to-locality multiplicity and do not deduplicate by postcode
or join BPS/Kemendagri namespaces by names. Observation time is not source
edition or validity. Neither a successful lookup nor repeatability establishes
complete coverage, stable identity, a licence or a delivery guarantee.

The search page has a rights-reserved notice. It does not document a bulk API
or grant redistribution in the inspected content. A commented-out navigation
link is not an active download or permission; it was not followed. This is
**rights not established**, not a legal conclusion that all reuse is forbidden.

## Conflicting catalog signals and access boundary

The [Satu Data catalog entry](https://data.go.id/dataset/dataset/kode-pos-desa-kelurahan-di-indonesia)
is attributed to Provinsi Jawa Barat and shows a public/open label alongside
an SDI-principles review notice. The exact public-page metadata states:

| Field | Observed value |
| --- | --- |
| Dataset ID | `95037db4-04d0-4b5f-8799-4c0ca9abb460` |
| `isopen` / `private` | `false` / `true` |
| `license_title` | `null` |
| `review_status` | `rejected` |
| Resource count | 1 (metadata only; not requested) |
| Metadata created / modified | 2024-06-28 / 2024-12-16; timezone unspecified |

These signals contradict an unconditional open-data classification. They do
not establish that the underlying postal values are incorrect. The publisher
[Open Data Jabar page](https://opendata.jabarprov.go.id/id/dataset/kode-pos-desa-kelurahan-di-indonesia)
returned **HTTP 403** to the direct bounded request. This is an observed access
failure, not proof of a paid service or nationwide unavailability. Search-index
previews are not an acquired, versioned dataset and are not used as data proof.

No restricted resource, hidden route or alternative authentication path was
used. Resource URLs and unrelated account/contact fields embedded in the public
page are never emitted or stored. Only allowlisted catalog metadata, counters
and response hashes enter the report. The source catalog now classifies this
entry as web-search metadata, not confirmed bulk-open-data access; source
identity and all existing weak/metadata-only validation boundaries remain.

## Implementation and quality boundaries

`scripts/inspect-postal-context-id-sources.mjs` uses the existing bounded HTTPS
reader with explicit official hosts, manual redirects, a 2 MiB body ceiling,
25-second request timeouts and no cookie/token persistence. Postal POSTs never
follow redirects. Parsing validates the form, six column headers, table shape,
UTF-8, row/text limits and numeric-string code format. Unexpected markup,
encodings, fields or catalog identity fail closed. Page scripts are not run.

Quality inspection distinguishes completeness, format validity, tuple
uniqueness, multi-locality cardinality, repeat stability and missing identity/
freshness/rights. Reports intentionally keep `geometryType=none`, zero civic,
building and coordinate relations, and false national-coverage/runtime/M2
flags. The actual inspection record is
[id-source-review-2026-08-28.json](../reports/postal-context-m2/id-source-review-2026-08-28.json).

The original Indonesia runtime and its configuration remain available for
conformance testing. No live search adapter is wired into production, and no
real-data loader/API test is claimed. Existing synthetic tests are engineering
checks, not M2 evidence. Source snapshots and rows are not retained; hashes
identify the observed responses but cannot substitute for an approved retained
snapshot when a later live response changes.

## Unblock requirements and next review

1. Obtain a documented lawful, complete current assignment source with actual
   coverage, source edition, identifiers and exception semantics. Do not fill
   gaps with an LLM, Voronoi, geocoder or province-boundary inference.
2. Resolve the catalog access/rights contradictions with artifact-specific
   reuse and redistribution terms, permitted fields, attribution and SHA-256.
   Government authorship or a public label is not sufficient.
3. Reproduce normalization and whole-dataset validation outside AGID Git;
   retain editioned BPS/Kemendagri crosswalks only if supplied and permitted.
4. Obtain explicit approval before creating a data destination, accepting
   contracts, using paid services or deploying. Publish fixed artifacts only
   after that gate, remotely verify bytes and test the real AGID loader/API.
5. Keep polygon/address/building authority independent. This M2 assignment
   stage may retain geometry `none`; premise or building output still needs
   separate explicit, rights-cleared source relations.

The primary blocker is source completeness/access/rights, so public-reference
rechecking is allowed after **2026-09-04T12:00:47.730Z**, only after all pending
countries have had their first pass. This does not authorize restricted access
or publication. Next country is **IL (Israel)**. No other country is changed or
started in this run, and no Hugging Face job, repository, Space, paid compute,
inference, contract acceptance or production deployment is performed.
