# Montenegro Postal Context country-pack seed

This directory is the AGID-side contract seed for the planned `agid-postal-me` repository. It contains no upstream rows, personal or property data, production geometry or deliverability claim.

## Current M2 audit

The current public Pošta Crne Gore office page embeds 164 valid facility Points and zero postcode Polygon/MultiPolygon records. Its first rendered page shows 12 five-digit office codes; that is not a complete current ordinary-plus-exception allocation denominator. The operator dictionary and 2020 rule define five-digit postcodes, six-digit PAK street-part routing, PO boxes and poste restante, but supply no area geometry. The operator rights page is under construction, so no reviewed public bulk-processing and redistribution grant was established.

Five current Government CKAN searches found no postal/postcode dataset. UZN lists address and spatial-unit registers, while current electronic property-list access requires national eID and payment; those separate address, administrative and cadastral authorities do not create postal areas.

Montenegro therefore remains `M1_metadata` and blocked under `M2_current_montenegro_postcode_area_visualization`. No facility point or address, PAK route or street part, PO box, poste restante, municipality, spatial unit, parcel, building, buffer, hull, Voronoi/raster cell or synthetic fixture may be promoted. See `docs/postal-context-montenegro-m2.md`.

## Maturity

M2 requires a complete current rights-cleared five-digit postcode and six-digit PAK/exception denominator, real eligible Polygon/MultiPolygon surfaces, an approved immutable artifact and verified real ME API/application area rendering.
