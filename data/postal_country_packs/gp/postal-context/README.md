# Guadeloupe Postal Context M2 pack

This real, non-synthetic pack covers all 33 current GP postal codes proven by the 38 INSEE 971xx assignment rows in the pinned 2026-08-08 La Poste snapshot. Each distinct official assignment is joined by exact INSEE commune code to the fixed COG 2026 `geo.api.gouv.fr` administrative contour.

The geometry is **derived administrative display context**, not an official postal boundary. `97139` and `97142` intentionally share the Les Abymes (`97101`) surface. Codes `97125`, `97130`, `97131` and `97180` have multiple Ligne 5 rows but each remains one postal identity and one whole-commune surface. La Poste rows `97133/97701` (BL) and `97150/97801` (MF) are excluded from GP.

The API and app expose provenance `derived`, source date `2026-08-08`, confidence `0.90`, Polygon/MultiPolygon type and attribution. No address, building, parcel, recipient, customer, delivery or land-rights record is included.

Rebuild with the 40 hash-pinned source bodies held outside Git:

```text
node scripts/build-postal-context-gp-m2.mjs <source-directory> data/postal_country_packs/gp/postal-context/m2 reports/postal-context-m2/gp-current-postcodes-2026-09-01.json
```
