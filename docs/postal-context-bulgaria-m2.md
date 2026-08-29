# Bulgaria Postal Context M2 review

## Technical summary

BG now has the country-specific target `M2_current_assignment_and_rights_cleared_postal_area_visualization`, but remains **M2 blocked**. Bulgarian Posts' official open-data catalog exposes a CC0 dataset of settlement postcodes dated 2020. The exact resource bytes and a current complete 2026 assignment edition were not available. Eurostat GISCO 2025 supplies 4,880 distinct four-digit BG features, all Points and none Polygon/MultiPolygon. The reviewed sources therefore cannot drive a real postcode search-to-translucent-area result.

## Key findings and evidence

| Evidence | Result | Decision impact |
| --- | --- | --- |
| Bulgarian Posts open-data catalog | Dataset UUID `acb135ab-00a2-4aa7-b5e5-49c992385ef5`, version 2.4, 2020-10-27, CC0 | Official but historical; exact resource bytes and current completeness are unverified |
| GISCO 2025 EPSG:4326 GeoJSON | 490,205,060 bytes; SHA-256 pinned | Reproducible current catalog artifact |
| BG profile | 4,880 distinct four-digit features; all Point; zero Polygon/MultiPolygon | No drawable postal area exists |
| TERCET source composition | 0 postal-provider, 101 address, 4,359 GISCO 2020, 420 manual/geocoded | Not a current complete operator assignment |
| GISCO caveats | completeness and exact locations are not guaranteed; non-geographic codes are inconsistent | Point count is not a coverage denominator |
| Production/public area | 0 eligible records; 0 immutable artifacts | Real BG API/app visualization cannot be claimed |

A compact evidence table is used instead of a chart because the decisive relationship is categorical—4,880 points versus zero areas—and a chart would hide the authority gate.

## Scope, data and definitions

A BG postal area must be an exact rights-cleared postal Polygon/MultiPolygon or an explicitly noncanonical surface derived from a complete, time-compatible and permitted postcode membership relation. The 2020 locality list can support historical assignment checks after exact byte/schema audit, but a locality is not a perimeter. GISCO points support format and location cross-checks only. TERCET's NUTS correspondence does not turn NUTS into postal geometry.

Post offices, EKATTE settlements, municipalities, administrative or cadastral units, address points, parcels, buildings, buffers, Voronoi/model surfaces and AGID cells retain separate authority. Special, P.O.-box, organization and route codes remain non-area. House numbers and buildings require a separate permitted stable address/building relation.

## Methodology

Five exact Eurostat artifacts were downloaded without authentication, payment or terms acceptance and bound by byte size and SHA-256: the version catalog, point-file manifest, EPSG:4326 GeoJSON, BG TERCET crosswalk and methodology V4 PDF. A deterministic inspector streams every file hash so the 490 MB GeoJSON need not be loaded during routine audit. A full one-time parse selected `CNTR_ID=BG`, counted features/distinct codes and geometry types, validated four-digit formatting and computed the extent.

The Bulgarian government open-data catalog was reviewed separately for publisher, dataset/resource UUID, version, date and CC0 label. Because the exact resource could not be retrieved during this run, no row count, schema, digest or current completeness is asserted.

Shared tests verify exact postcode candidate resolution, Polygon/MultiPolygon-only drawing, explicit geometry opt-in, bounds/fit, opacity-0.22 fill, opacity-0.95 width-3 outline, update/removal, clear/re-search and error states. These tests do not convert the BG points into areas and cannot promote the country.

## Limitations, uncertainty and robustness

TERCET V4 calls the reference year 2025, but its BG source table attributes 4,359 of 4,880 records to GISCO 2020 and 420 to manual/geocoded input; zero come from a Member State postal-code dataset. Eurostat explicitly warns that not all codes may be present or correctly located. Accordingly, assignment completeness and postal-area coverage are null rather than calculated from 4,880.

The Bulgarian Posts catalog page proves the existence and CC0 status of the 2020 dataset, not current validity or exact row contents. Network unavailability prevented exact-resource capture; this is recorded as missing evidence, not silently substituted with GISCO points or the synthetic BG fixture.

## Recommended next steps

Recheck for a current Bulgarian Posts assignment release with explicit special/non-geographic semantics and exact resource bytes. Search for an official postal-area vector or a complete rights-cleared address/road membership relation that can support documented noncanonical derivation. Only then publish an approved digest-pinned artifact and verify the real BG loader, API and app search, fit, translucent fill, outline, provenance, no-result, multiple, invalid, failure, clear and re-search paths.

Recheck after the pending-country pass and no earlier than `2026-09-05T11:31:04.000Z`, unless a current release appears sooner. Do not authenticate, accept terms, pay, create a destination, publish or deploy without explicit approval.

## Further questions

- Will Bulgarian Posts publish a current complete machine-readable assignment edition?
- Is there an operator or government postal-area vector distinct from settlement and administrative boundaries?
- Can a current address membership release be reused to derive public noncanonical areas?
- How are P.O.-box, organization, route and other non-geographic codes identified?

Next is **BY (Belarus)**. No second country was started.
