# Falkland Islands Postal Context

`FIQQ 1ZZ` is the official single postcode for the whole Falkland Islands territory. The committed M2 artifact contains one postal node, one official reference assertion and two real derived `MultiPolygon` display features produced from a fixed CC BY 4.0 geoBoundaries source.

Rebuild from the pinned simplified source:

```text
node scripts/build-postal-context-fk-m2.mjs <geoBoundaries-FLK-ADM0_simplified.geojson> data/postal_country_packs/fk/postal-context/m2 reports/postal-context-m2/fk-current-whole-territory-2026-09-01.json
```

No raw UPU PDF, government page, address, building, parcel, recipient, customer or land-rights data is stored here. The map surface is explicitly derived and must not be used as an official postal, legal, survey, cadastral or delivery boundary.
