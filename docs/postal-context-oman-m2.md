# Oman M2 review — 2026-08-28

Status: **blocked, not M2 complete**. Keep the existing `M2_office_assignment`
definition: a complete rights-cleared office/code artifact with ownership,
licence, coverage, freshness and digest evidence. Runtime code and synthetic
fixtures are not national postal data.

## Real data and its limits

The [Al Dakhiliyah Governorate listing](https://www.dg.gov.om/open_data)
links a [postal-facility workbook](https://www.dg.gov.om/files/open_data/post_office_locations.xlsx)
and its [Open Data Use License](https://www.dg.gov.om/files/open_data_use_license.pdf).
The licence permits copying, transformation and redistribution within its
scope, including commercial use, with attribution, change disclosure and
third-party/privacy exclusions. This is positive scoped permission, not a
blanket licence for Oman Post or other government hosts.

The exact downloaded XLSX is 9,827 bytes:
`sha256:df8f77f825d3717104b0a707decca9cce3802aa1e99f752ea4fc12990c2e10ef`.
Its sole sheet `مكتب بريد.shp`, range `A1:H13`, contains a header and 12 records.

| Check | Observed result | Consequence |
| --- | --- | --- |
| Schema | FID, NAMEEN, NAMEAR, TOWN, SOURCEFC, SOURCEFC_A, X, Y | No postcode or address-building relation |
| Record key | 12 distinct numeric FIDs | Snapshot IDs, not postcodes or proven cross-edition IDs |
| XY duplicates | 11 pairs; 2 records share one pair | Preserve both; do not merge identities |
| Missing labels | NAMEAR: 1; TOWN: 2, whitespace-only | No inferred translation or locality |
| Coordinates | 12 finite degree-range-compatible pairs | CRS/accuracy unknown; no WGS84 assumption |
| Coverage | One governorate's facility-category POIs | Not a complete national office/code register |
| Time | XLSX created/modified and HTTP Last-Modified: 2024-05-02 | Listing 4/2025 and reference 2024–2025 do not establish current validity |

The workbook includes facility descriptions of different kinds. A shared
source category is not proof of identical postal services or building identity.
No source rows, coordinates, subscriber information, workbook authors or source
filesystem paths are committed; reports contain aggregate checks only.

## Separate authorities

- [UPU January 2026 sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/omnEn.pdf):
  three-digit code, first digit region and last two post office, P.O.-box example.
  It is format evidence, not current assignments or polygon geometry. Example
  addressees, contact details and box numbers were not ingested.
- [Oman Post terms](https://website.omanpost.om/index.php/privacy-and-policy):
  viewing/republication/harvesting restrictions are present alongside unresolved
  template placeholders. No bulk-reuse permission is inferred. The locator was
  viewed as reference only; no automated directory harvest or member query ran.
- [NCSI WilayatB metadata](https://ncsigeostatportal.ncsi.gov.om/server/rest/services/NCSIData/WilayatB/FeatureServer/layers?f=pjson):
  layer 3, 18 fields, EPSG:4326 polygon metadata, Ministry of Interior owner,
  NCSI alternative provider, no postcode field or explicit relationships. No
  features were queried and no edits were made. Metadata capabilities do not
  confer write authority, reuse permission, coverage or topology evidence.
- [NCSI portal terms](https://data.gov.om/legal/termsofuse) link a separate
  [licence document](https://data.gov.om/s3/gov_license.pdf). Its scope is the
  portal's open data, not automatically the separate geostat service. The old
  `data.ncsi.gov.om` policy PDF failed acquisition; this is not proof it was
  removed or that policy is absent.
- [Muscat building-numbering service](https://gov.om/en/w/request-building-addressing-or-numbering),
  page updated 2026-07-02, is an application workflow, not reusable civic rows,
  a footprint database or national coverage. No form or identity/ownership
  document was submitted.

Licence PDFs were visually reviewed on substantive pages 1–3, UPU on page 1.
Printed editions, PDF metadata dates, HTTP modification times and acquisition
times are separate. No effective date is fabricated.

## Reproducible checks

`m2-source-review.json` in this country pack pins URLs, byte counts, MIME types,
retrieval timestamps, SHA-256 and reviewed scope. Bodies remain outside Git.

```sh
npm run verify:postal-context-oman-sources
python3 -B scripts/inspect-postal-context-om-workbook.test.py
python3 scripts/inspect-postal-context-om-workbook.py /temporary/post_office_locations.xlsx
node scripts/inspect-postal-context-om-sources.mjs --observations /temporary/receipts --python /path/to/python3 --report /temporary/checks.json
npm run inspect:postal-context-oman -- --report /temporary/new-checks.json
```

Python needs only its standard library. The workbook checker accepts only the
reviewed byte digest, validates bounded ZIP/XML layout and profiles real rows.
Changed bytes, extra fields, formulas, external relationships and invalid values
fail closed. The live checker uses HTTPS/host allowlists, 25-second/4-MiB limits,
no credentials and no writes. It skips a previously failed policy URL pending
review, and fetches the workbook only after its listing and licence match the
reviewed bytes. Matching workbook bytes can reuse the pinned aggregate profile;
the report explicitly distinguishes that from fresh Python recomputation.

## AGID boundary and unblock conditions

Existing Oman runtime, normalizer, source trust and address formatting remain
unchanged. New pack source entries are review metadata only: no production
descriptor or endpoint is enabled. A POI point, wilayat polygon or AGID cell
does not assign a postcode, P.O. box, civic address or exact building.

Acquire a complete current office/code artifact under explicit applicable reuse
rights; validate source identities, exceptions, freshness, privacy and coverage.
Geometry stays `none` absent separate licensed evidence and a reviewed CRS.
Exact civic/building output requires separate explicit permitted relations.
Then obtain approval for a specific immutable publication destination within
the existing cost ceiling, publish, re-download and verify hashes through the
actual AGID loader/API. No new repository/destination, contract, paid compute
or production deployment was created here.

Recheck public sources after **2026-09-04T21:59:53.131Z**, only after all pending
countries have been visited. Current source and engineering evidence is in
`reports/postal-context-m2/om-*-2026-08-28.json`. Next queued country: Philippines
(`PH`); no Philippines work belongs to this run.
