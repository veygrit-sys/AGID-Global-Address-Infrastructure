# Guernsey Postal Context contract seed

This directory is metadata only. It defines the Guernsey-specific Postal
Context evidence and promotion rules without bundling Guernsey Post lookup
results, ONSPD rows, Digimap products, addresses, UPRNs, parcels, buildings,
customers, personal data, or production geometry.

## Current result

Guernsey remains at `M1_metadata` and is blocked for M2.

- Guernsey Post provides an official Bailiwick address/postcode finder and
  policy statements, but no public bulk assignment file, postcode polygon
  release, or redistribution grant was found.
- ONSPD May 2026 lists 3,384 GY records: 3,298 live and 86 terminated. Its User
  Guide explicitly gives Channel Islands postcodes no geographic coordinates;
  all are positional-quality class 9.
- Digimap advertises an annual-fee postcode centroid product. A centroid is a
  Point, not a postcode area.
- Digimap CAF is a licensed authenticated address-point database. Address
  points do not create postcode areas.
- Guernsey Public Mapping is agreement/API-key gated and serves tiled base-map
  endpoints, not postcode vector geometry.
- Digimap map-service metadata exposes land-parcel Polygons with postcode and
  cadastral/address fields. Their grain is land parcel, not postal extent, and
  no reuse grant for an AGID derivative was established.

No point, placeholder coordinate, parcel, address set, building, buffer,
Voronoi cell, administrative boundary, base-map tile, synthetic fixture, or
AGID cell is substituted for the missing authorized postcode surface.

## Country-specific M2

`M2_current_guernsey_postcode_area_visualization` requires a current,
rights-cleared, Bailiwick-wide Guernsey Post assignment denominator and
full-code Polygon/MultiPolygon release; edition, validity, terms, SHA-256,
island coverage, and exceptions; an approved immutable artifact; and a real GG
loader/API/app search path that fits and draws a translucent area with a clear
outline and provenance.

ONSPD rows or coordinate placeholders, paid centroids, authenticated CAF
results, cadastral parcels, tiled base maps, synthetic fixtures, and invented
surfaces do not satisfy this criterion. Large-user, organization, PO Box,
terminated, route, and other unavailable/non-area cases remain non-areal with
an explicit reason.

## Files

- `repository-manifest.json` defines the Guernsey postal object, authority
  boundaries, exception classes, quality gates, and promotion stages.
- `source-profile.json` records each source role, rights class, prohibited
  claim, and required authorization.
- `docs/postal-context-guernsey-m2.md` is the human-readable source and data
  quality review.
- `reports/postal-context-m2/gg-source-review-2026-08-30.json` binds the exact
  official observations and blocked decision.

Authentication, agreement acceptance, purchase, credential use, publication,
new data hosting, and deployment all require separate approval.
