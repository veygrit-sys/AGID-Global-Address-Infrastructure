# Turks and Caicos Islands Postal Context

`TKCA 1ZZ` is the current official single postcode for the whole territory. The committed M2 artifact contains one postal node, one country node, 27 government source-region context nodes, 28 evidence assertions and 39 validated source-aligned derived surfaces bundled into 2 real runtime MultiPolygon display features.

Rebuild from the exact official GeoJSON body whose SHA-256 is recorded in `source-profile.json`:

```text
node scripts/build-postal-context-tc-m2.mjs <Shoreline.geojson> data/postal_country_packs/tc/postal-context/m2 reports/postal-context-m2/tc-current-whole-territory-2026-09-02.json
```

No raw UPU PDF, raw government dump, address, building, parcel, population, recipient, customer or land-rights data is stored here. The surface is derived land-extent context and must not be used as an official postal, legal, survey, cadastral or delivery boundary.
