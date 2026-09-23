# North Macedonia Postal Context country-pack seed

This directory is the AGID-side contract seed for the planned `agid-postal-mk` repository. It contains no upstream row, public-facility coordinate, personal or property data, production geometry or deliverability claim.

## Current M2 audit

The official correct-addressing page exposes 1,831 locality rows, 230 distinct four-digit codes, 1,693 localities, 230 delivery offices, 87 municipalities and 15 branches, but no postcode Polygon/MultiPolygon. The official public locator returns 331 valid facility Points and zero areas. Its 326 rendered postcode values reconcile with only 218 of the table's 230 values, leaving 12 table-only and 108 locator-only values; neither source documents a complete ordinary-plus-exception denominator.

The operator privacy and contact pages do not grant dataset-specific extraction, derivation, redistribution or public-serving rights. Current Government open-data and NSDI portals timed out during the run, so nonexistence is not claimed. No public official search result established a postcode-area release, and address, municipality, spatial-unit and cadastral context remain separate authorities.

North Macedonia therefore remains `M1_metadata` and blocked under `M2_current_north_macedonia_postcode_area_visualization`. No locality, delivery office, facility point, municipality, branch, address or cadastral unit, buffer, hull, Voronoi/raster cell or synthetic fixture may be promoted. See `docs/postal-context-north-macedonia-m2.md`.

## Maturity

M2 requires a complete current rights-cleared four-digit ordinary and exception denominator, real eligible Polygon/MultiPolygon surfaces, an approved immutable artifact and verified real MK API/application area rendering.
