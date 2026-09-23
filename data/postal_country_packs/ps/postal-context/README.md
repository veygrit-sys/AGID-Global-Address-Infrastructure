# PS Postal Context: P3 areas and P7 delivery points

Status: **M1 metadata; M2 blocked**, not a production data release.
Repository identity remains **PS / Palestine / فلسطين**. No separate repository
or public data destination was created; no territorial identity was changed.

## Country-specific M2

`M2_official_p3_postal_areas` requires complete, current, rights-cleared official
P3 polygons linked to the official locality assignment list, reproducible
validation and transformation, approved immutable artifacts and the real PS
AGID loader/API. The full definition is in `repository-manifest.json` and
`m2-source-review.json`; P7 records cannot substitute for area geometry.

P3 is `P` plus three digits; P7 is `P` plus seven digits. Keep code strings,
leading zeroes and multiple locality relations. P7 identifies a final delivery
point, not a civic house number or building footprint. A code prefix alone does
not establish a spatial join. Buildings need separately permitted source
records and explicit address/building relations.

## Evidence reviewed on 2026-08-28 UTC

- [MTDE catalog API](https://opendata.ps/api/3/action/package_show?id=postcodes)
  exposes five resources: full P3 list, full P3 geometry, P3 sample, full P7
  coordinates and P7 sample. Catalog modification is 2021-06-15; resource dates
  are April 2021. Retrieval time does not establish present-day validity.
- The complete P3 list was obtained and its 63,411 bytes hashed: 755 relations,
  603 P3 codes, 16 district labels, 93 shared-code groups, zero invalid code
  strings and zero identical rows. 534 coverage fields are blank, not zero
  area. No rows were deduplicated, repaired, geocoded or published.
- The listed 11,291,622-byte polygon CSV failed twice with a terminated TLS
  transfer. The retry captured only 98,304 HTTP bytes. It is **not a complete
  artifact**: no source-data digest, topology, code-join or coverage validation
  is claimed. The viewer also failed TLS verification. Verification was never
  disabled. P7 data and samples were not downloaded.
- The catalog declares `cc-by` and links a generic
  [licence index](https://opendefinition.org/licenses/cc-by/) listing several
  versions. A pointer to that index does not identify the publisher's chosen
  version. Exact licence, attribution and artifact-specific scope remain a
  release gate; this is not a claim that the publisher prohibits reuse.
- The [UPU addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/pseEn.pdf)
  printed 05/2025 was reviewed as a full rendered page. It establishes code
  anatomy and addressing guidance, not national assignment completeness.
- [MTDE](https://mtde.gov.ps/home/PostalCodes?culture=en-US) and
  [Palestine Post](https://www.palpost.ps/home/postalCodesPages?culture=ar-SA)
  selector pages were captured as official references, not polygon datasets.

Six complete reference bodies have exact SHA-256, lengths and timestamps in
the config/report. The HTML catalog, viewer and polygon transfer are explicitly
unverified. Unknown accuracy, CRS and current coverage are not reported as 0
or 100%. The catalog's longitude/latitude wording does not establish a datum.

## Reproduce the review

Python 3, standard library only:

```text
python scripts/inspect-postal-context-ps-sources.test.py
python scripts/inspect-postal-context-ps-sources.py --observations <receipts.json> --report <new-report.json>
```

Each receipt has `id`, `requestedUrl`, `finalUrl`, `redirects`, `observedAt`,
`httpStatus`, `contentType`, `byteLength`, `responseDigest` and a local `bodyPath`.
Use the exact config URLs and captured bytes; failed references have no body or
digest. The checker re-parses the list/catalog and verifies every complete
receipt. PDF/HTML human reviews are reusable only for identical bytes. A new
download or edition requires a newly reviewed config and observed time; never
pretend a later download was captured at the original time. Reports are
write-once and contain aggregates only. Raw bodies stay outside Git.

Use unauthenticated HTTPS GET, normal TLS verification, allowlisted official
hosts, a 25-second timeout and 4 MiB reference limit. The full P3 polygon resource
has a separate 16 MiB cap. Refuse incomplete transfers, unapproved redirects,
unexpected MIME/schema and sample substitutions. Do not download P7 records to
work around missing P3 geometry. No credentials, forms, fees or contract
acceptance are needed for this reference-only check.

## AGID integration and remaining work

PS address metadata now enables an optional postcode field, accepts canonical
P3/P7 syntax and leaves room for all eight P7 characters. This fixes input
metadata, not assignment verification or a production spatial API. Generic
Postal Context PS runtime activation remains disabled until real artifact and
descriptor validation succeeds. The existing country catalog retains its IDs.

Unblock with: complete polygons, verified current edition/coverage and explicit
P3 joins, exact licence version/attribution, reviewed CRS and topology, then
approved immutable publication and real AGID loading. The rollout records a
seven-day recheck after the pending-country first pass. Do not mark M2 complete
from this source review, UI validation or synthetic tests.
