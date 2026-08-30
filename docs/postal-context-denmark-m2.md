# Denmark Postal Context M2 source review

## Outcome

Denmark remains at `M1_metadata`. The anonymous official DAWA endpoint returned 1,089 land-clipped Danish postcode `MultiPolygon` features and a matching 1,089-record four-digit postcode list. The exact 152,973,384-byte GeoJSON body is recorded as SHA-256 `5f489e68f49f95fe8e89ec9cd38c7f8a93986b88a95a1b4233bf3bed22e2bbf2`; postcode `2400` independently returned a real `MultiPolygon`.

The data is usable under the reviewed Dataforsyningen free-geodata terms with provider, dataset and acquisition/service attribution. M2 is nevertheless blocked: the live 24-hour-cache response is mutable and exposes no transaction or immutable edition; no approved fixed public artifact exists; `ErGadepostnummer` and bitemporal classification are absent; 39 features fail deterministic geometry validity, including three-position rings for `4000` and `8543`; and the existing DK loader/API path uses synthetic code `0000` and synthetic geometry only.

## Evidence and quality

| Measure | Reviewed result | M2 consequence |
|---|---:|---|
| Current official land features | 1,089 `MultiPolygon` | Real source geometry exists |
| Matching four-digit postcode records | 1,089 | Code sets match with zero duplicates |
| Coordinates / rings | 2,076,495 / 3,152 | National byte-level scan completed |
| Turf-valid / invalid features | 1,050 / 39 | Full geometry gate fails |
| Rings with fewer than four positions | 2 (`4000`, `8543`) | No silent repair or invented area |
| `ErGadepostnummer` fields | 0 | Street-postcode exception denominator is incomplete |
| Public immutable DK data artifacts | 0 | Reproducibility gate fails |
| Real DK postcode search -> API -> translucent map | 0 | Application gate fails |

The WGS84 bounding box is `[8.07250975, 54.55907837, 15.19740034, 57.75257255]`, consistent with Denmark proper and not a GL/FO merge. All observed codes are unique four-digit strings. The DAWA convenience response preserves `dagi_id`, `geo_version`, change timestamps and visual center, but not the full DAGI `ErGadepostnummer`, valid-time and registration-time contract.

## Authority, rights and fixedness

1. [DAWA postcode API](https://dawadocs.dataforsyningen.dk/dok/api/postnummer) documents anonymous postcode lookup, GeoJSON output and the `landpostnumre` coastline-clipped view. The response is cacheable for up to 24 hours.
2. [DAGI Postnummerinddeling](https://grunddatamodel.datafordeler.dk/objekttypekatalog/Danmarks%20Administrative%20Geografiske%20Inddeling/Postnummerinddeling.html) defines the postal geography, `ErGadepostnummer`, four-digit identity and bitemporal behavior. It also distinguishes ordinary geographic areas from road-based Copenhagen/Frederiksberg postcodes.
3. [DAWA replication guidance](https://dawadocs.dataforsyningen.dk/dok/guide/replikering) supplies consistent snapshots keyed by the latest transaction. The observed latest transaction was `4141673` at `2026-08-29T21:41:01.481Z`, but the postcode GeoJSON response does not expose that transaction and the normalized `postnummer` replication entity does not carry `Postnummerinddeling` geometry.
4. [Dataforsyningen free-geodata terms](https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Vilk%C3%A5r%20for%20brug%20af%20frie%20geografiske%20data.pdf), dated 1 December 2022, permit worldwide free non-exclusive copying, distribution, publication, modification, combination and commercial/noncommercial use. Attribution must name Styrelsen for Dataforsyning og Infrastruktur, the dataset and acquisition time or service, and make the terms available to third parties. No endorsement is implied and data is supplied as-is.
5. [DAGI model 3 transition notice](https://datafordeler.dk/drift/aendringer/46358) records current model-3 availability and fildownload version 4, while legacy services close on 15 January 2027. Account/API-key or OAuth acquisition was not attempted.
6. [PostNord postcode finder](https://www.postnord.dk/varktojer/find-postnummer/) remains the operator lookup surface; the automated request returned HTTP 403 and was not bypassed.

The exact receipts, response lengths and hashes are pinned in the [machine-readable source report](../reports/postal-context-m2/dk-source-review-2026-08-30.json). Raw national bodies remain outside Git. An observed SHA-256 proves what was inspected; it does not make a changing live URL an immutable public artifact.

## Application status

Shared tests cover four-digit normalization, Polygon/MultiPolygon filtering, fit bounds, translucent fill, visible outline, clear/re-search and failure behavior. DK-specific runtime and route tests currently instantiate the synthetic `0000` fixture and synthetic geometry authorities. They do not load the 1,089 official features, expose them from a real artifact-backed API, or demonstrate a real postcode search in the app. Therefore the correct current result is **no verified DK production area available**.

Postal geometry remains separate from PostNord assignment, DAR address identity, administration, buildings and AGID. Invalid features, street postcodes, facility codes and non-area classes receive no buffer, convex hull, administrative proxy or AGID-cell surface.

## Remaining work

1. With explicit approval for a publication destination, pin a current DAGI/DAWA artifact to a transaction or edition outside AGID Git, publish it immutably, and retain exact terms, attribution, schema, coverage and SHA-256.
2. Reproducibly join authoritative `ErGadepostnummer`, valid/registration time and non-area classes while preserving DAGI identity and separate GL/FO packs.
3. Resolve all 39 invalid geometries from a corrected official release or authority-preserving documented transform; validate topology without inventing areas.
4. Pass the real DK loader/API/app path through postcode normalization, ambiguity, validity, fit, translucent fill, visible outline, provenance, loading, no-result, failure, clear and re-search.

Recheck only after the pending-country pass and `2026-09-30T02:21:43.245Z`, unless an official immutable corrected release appears earlier. Elapsed time does not authorize account creation, authentication, publication or deployment.
