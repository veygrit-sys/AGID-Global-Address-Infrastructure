# Ascension Island Postal Context

`ASCN 1ZZ` is the official single postcode for all of Ascension Island. The committed M2 artifact contains one AC postal node, one official reference assertion and two real derived MultiPolygon display features produced from the AC-only subset of a fixed CC BY 4.0 geoBoundaries source.

Rebuild from the pinned source:

```text
node scripts/build-postal-context-ac-m2.mjs <geoBoundaries-SHN-ADM0.geojson> data/postal_country_packs/ac/postal-context/m2 reports/postal-context-m2/ac-current-whole-territory-2026-09-03.json
```

No raw UPU PDF, government page, address, building, parcel, recipient, customer or land-rights data is stored here. The map surface is explicitly derived and must not be used as an official postal, survey, cadastral or delivery boundary. AC identity stays separate from the SHN source container.
