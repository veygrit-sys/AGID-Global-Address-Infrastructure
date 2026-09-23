# Greenland Postal Context M2 review

## Technical summary - real official polygons exist, but M2 remains blocked on redistribution rights

The Government of Greenland national Address Register exposes an official `Postnummer` Polygon layer through the public NunaGIS ArcGIS REST/WFS service. The fixed complete query returned 32 features for 31 distinct postcodes. Thirty features are non-empty, closed and Turf-valid. OBJECTID `42399` is the only `2412` feature and is an empty Polygon; OBJECTID `42400` is an empty Polygon for `3992`, while OBJECTID `42369` supplies a separate valid `3992` Polygon. The current Tusass table has 28 coded and 44 dash-valued locality rows and omits register values `3940`, `3972` and `3982`; the public register therefore controls the reviewed denominator.

M2 is nevertheless unmet. NunaGIS says that the services are publicly available and connectable to GIS software, and the ArcGIS service exposes Query/Data capabilities, but the five reviewed bodies publish no explicit licence granting AGID storage, derivation, redistribution and public serving of the postcode polygons. Empty `copyrightText` is not a licence. The source date fields are also null and no immutable release/reference date is published. No raw response or production geometry was committed.

## Scope and country-specific M2 definition

The review covers ISO `GL` and preserves Greenland / Kalaallit Nunaat identity. It does not merge Greenland with Denmark, the Faroe Islands, Canada or another Arctic jurisdiction. The target is `M2_current_greenland_address_register_postcode_polygon_visualization`.

M2 requires a current complete competent-authority release covering every assignment, alias, validity interval, correction, exception and typed area/non-area object; fixed bytes and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving; and finite closed valid Polygon/MultiPolygon geometry with source identity, CRS, reference date, class, confidence and exceptions. The real app must normalize `GL-9999` or `9999`, handle loading/no-match/multiple/API-failure/invalid geometry, fit the map, render a translucent fill and clear outline, clear and re-search, and display code, geometry kind, official/derived/virtual class, source, date and confidence.

## Evidence and data quality

Five exact official bodies totaling 363,762 bytes were fixed outside Git with retrieval time and SHA-256. The Government of Greenland/NunaGIS web-services page identifies the national Address Register, municipalities as authority, Digitaliseringsstyrelsen as technical owner and continuous updating. ArcGIS 11.5 service/layer metadata identify layer 5, `esriGeometryPolygon`, source WKID 4326, the `Postnummer` fields, public Query/Data capabilities and service item `d389110962d74004b11c6c9428c3ac0e`.

The complete `where=1=1` GeoJSON query produced 32 features, 31 distinct codes, 38 closed rings and 3,902 positions within `[-73.999979868, 59.651055252, -14.99073426, 81.748940106]`. Thirty-one non-empty features passed Turf validity; the one empty feature was rejected explicitly. No coordinate was simplified, unioned, buffered or otherwise transformed.

The Tusass table produced 72 rows: 28 current four-digit assignments and 44 localities shown with a dash. Every Tusass code exists in the Address Register; the register additionally contains `3940`, `3972` and `3982`. These differences are evidence that the operator page is a useful cross-reference, not the complete continuously updated register denominator.

## Application boundary

Shared deterministic tests cover normalization, loading, no-match, multiple candidates, API failure, Polygon/MultiPolygon-only drawing, invalid geometry, map fit, opacity-0.22 translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. No real GL AGID loader/API/browser path is claimed because no fixed rights-cleared artifact is eligible. The official external endpoint's ability to return a Polygon is not substituted for an approved immutable AGID artifact.

## Rights, privacy and identity

Public REST/WFS access establishes inspectability and technical use. It does not state the storage, derivative-artifact, redistribution, attribution or public-serving conditions required by M2. No provider was contacted, no registration/authentication/terms/contract was accepted and no payment or protected data access was attempted. Address points, recipients, residents, customers, postal-box holders, parcels, buildings, cadastral objects and land rights were not queried or bundled.

## Blocker and retry

Keep GL blocked until the Government of Greenland, Digitaliseringsstyrelsen or another competent rights holder publishes an explicit compatible licence or supplies written permission for storage, derivation, redistribution and public serving of a fixed postcode-polygon snapshot, together with a stable release/reference date or version. Re-review the empty `2412` and `3992` source features, build the immutable artifact and pass the real GL API/app path before promotion.

Do not retry before `2026-09-08T03:30:45.800Z` while pending countries remain, unless compatible rights or a fixed licensed release is published. Provider contact, registration, agreement acceptance, protected-data access, new public destination or deployment requires explicit approval.
