# Saudi Arabia Postal Context M2 source review

Saudi Arabia remains at `M1_metadata`; this review does not promote it to M2. The fixed 2026-08-29 snapshot covers 25 official-source receipts: 22 exact-byte-reviewed documents or CSV files and three GEOSA PDF acquisitions that returned non-PDF responses in this environment.

## What the sources establish

- SPL defines a five-digit Postal Code within the six-component National Address and states that its postal-code network covers Saudi Arabia. That statement supplies neither an assignment table nor a boundary surface.
- The UPU `04/2025` guide visually reviewed on both pages confirms separate five-digit home-address and P.O.-box postcode systems. Its examples are examples, not reusable assignments.
- SPL's public library exposed 14 CSV downloads in the captured page. The audit processed 14,014 physical records, including 381 blank records, and 13,633 nonblank records. These are areas, served cities, postal offices, office services, branches and postal buildings—not a nationwide address-to-postcode membership corpus.
- The meaningful postal-office subset has 529 facilities: 485 five-digit values, 44 other nonempty formats, 474 distinct nonempty values, 261 missing districts and 289 missing streets. Ninety-seven trailing empty CSV records are retained as a quality observation instead of being silently treated as offices.
- The office-service file has 8,820 rows and 581 exact duplicate rows. Its 462 distinct office keys have no orphan against the office file; 67 office keys have no service row. This is facility/service referential quality, not national postal coverage.
- Address Geocode documentation requires credentials. It describes a “Four digit numerial” postcode but shows `12643`, while the current SPL and UPU sources define five digits. AGID records this as a documentation inconsistency and does not repair it by guessing.

## Rights and authority boundary

The captured open-data page discusses free exchange and business use but also says the data must be used solely for legitimate and educational purposes and requires citation. The captured API terms grant limited, non-exclusive, non-sublicensable access; require a developer account and credentials; reserve ungranted rights; require requested removal within 24 hours; and restrict large display and generic address-validation use. This is an observed scope conflict, not a legal conclusion.

No account was created, no agreement was accepted, no paid operation was performed and no live address/geocode query was made. Exact AGID redistribution and derivative rights for a nationwide assignment artifact or membership surface remain unproven.

## M2 decision

`M2_assignment_and_derived_geometry` is blocked because the review obtained no current, nationwide, rights-cleared SPL assignment membership artifact and no official or approved derived postal surface with pinned edition, coverage, CRS, topology, uncertainty, valid time and immutable publication. Facility postcodes, samples, points, `PolygonString`, administrative areas, parcels, building numbers, proximity and models cannot fill this gap.

The blocker can be reconsidered after `2026-09-05T00:26:26.437Z`, after the pending-country first pass, or earlier only if a new authoritative artifact or explicit permission is supplied. Building output still requires its own permitted explicit address-building relation and separately licensed geometry.

## Reproduction

The committed inspector replays exact bytes from external receipt/body pairs and emits only aggregate quality metrics. Source bodies, address rows, coordinates, contacts and personal or land-rights data are not committed.

```text
node scripts/inspect-postal-context-sa-sources.mjs \
  --input-dir <private-receipt-directory> \
  --report <new-report.json>
```

The fixed report is `reports/postal-context-m2/sa-source-review-2026-08-29.json`. The existing Postal Context runtime remains fail-closed and does not enable production SA records.
