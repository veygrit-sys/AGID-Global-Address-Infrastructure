# French Guiana Postal Context M2 pack

This real, non-synthetic pack covers all 25 current `973NN` postal codes in the pinned 2026-08-08 La Poste snapshot. Each official assignment is joined by exact INSEE commune code to the fixed COG 2026 `geo.api.gouv.fr` administrative contour.

The geometry is **derived administrative display context**, not an official postal boundary. The following pairs intentionally share the same full commune surface:

- `97311` / `97352` — Roura (`97310`)
- `97318` / `97360` — Mana (`97306`)
- `97353` / `97390` — Régina (`97301`)

The API and app expose provenance `derived`, source date `2026-08-08`, confidence `0.90`, Polygon/MultiPolygon type and attribution. No address, building, parcel, recipient, customer, delivery or land-rights record is included.

Rebuild with the 32 hash-pinned source bodies held outside Git:

```text
node scripts/build-postal-context-gf-m2.mjs <source-directory> data/postal_country_packs/gf/postal-context/m2 reports/postal-context-m2/gf-current-postcodes-2026-09-01.json
```
