# Moldova Postal Context country-pack seed

This directory is the AGID-side contract seed for the planned `agid-postal-md` repository. It contains no upstream rows, personal data, production geometry or deliverability claim.

## Current M2 audit

The current public Poșta Moldovei map/API exposes 1,164 active facility Points and zero postcode Polygon/MultiPolygon records. A `2012` query adds 26 street/house membership rows but no area. Three ASP legacy workbooks contain 4,873 code-bearing rows and zero geometry; they are stale and marked `License Not Specified`. Broad distribution zones in the quality standard are service-quality groupings, not postcode boundaries.

Moldova therefore remains `M1_metadata` and blocked under `M2_current_moldova_postcode_area_visualization`. No facility point, street/house list, distribution zone, administration, locality, address, building, parcel, buffer, hull, Voronoi/raster cell or synthetic fixture may be promoted. See `docs/postal-context-moldova-m2.md`.

## Maturity

M2 requires a complete current rights-cleared ordinary-plus-exception denominator, real eligible Polygon/MultiPolygon surfaces, an approved immutable artifact and verified real MD API/application area rendering.
