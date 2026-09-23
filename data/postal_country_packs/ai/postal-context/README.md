# Anguilla Postal Context

`AI-2640` is the official single postcode for all of Anguilla. The committed M2 artifact contains one postal node, one official reference assertion, and two real derived MultiPolygon display features produced from a fixed CC BY 4.0 geoBoundaries source.

Rebuild from the pinned source:

```text
node scripts/build-postal-context-ai-m2.mjs <geoBoundaries-AIA-ADM0.geojson> data/postal_country_packs/ai/postal-context/m2 reports/postal-context-m2/ai-current-whole-territory-2026-08-31.json
```

No raw UPU PDF, operator page, address, building, parcel, recipient, customer or land-rights data is stored here. The map surface is explicitly derived and must not be used as an official postal, survey, cadastral or delivery boundary.
