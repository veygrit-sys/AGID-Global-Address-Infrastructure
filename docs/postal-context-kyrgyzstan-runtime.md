# Kyrgyzstan postal context runtime

Kyrgyzstan is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, official or derived GIS, live Kyrgyz Post/API responses, real addresses, Address Register or cadastral records, personal or property data, OSM features, API keys or production geometry. Executable examples use the unverified synthetic value 799999 and synthetic geometry. Collision checks and replacement are mandatory before promotion.

## Postal Code -> Postal Object -> Geometry -> Address Context

The KG normalizer applies NFKC, removes whitespace, preserves leading zeroes and accepts exactly six ASCII digits. It rejects KG prefixes, hyphens, punctuation, wrong lengths and the non-numeric mobile-post-office marker.

The current Kyrgyz Post directory was published on 16 October 2025 and updated on 28 October 2025. It lists branch, postal code and address context, and the same six-digit code can occur on multiple rows. It also contains a non-numeric mobile-post-office marker. That marker is a route-like or mobile postal object, not a postcode and not an area. The UPU 03/2019 addressing sheet documents a country digit, three region digits and two post-office digits, plus address formatting. The operator directory controls current row evidence only after the exact artifact, scope, validity, rights and digest are pinned; UPU examples are dated format evidence.

Neither source publishes official coordinate geometry. Administrative boundaries, the Address Register, cadastral objects, post-office points, routes, OSM, Voronoi, interpolation, APIs, machine learning and real-time generation can support explicitly derived candidate surfaces. They never become official postal Polygon or MultiPolygon geometry or fill unknown coverage. An official point, route or area needs an exact competent-authority relation with object type, validity, jurisdiction, CRS, topology, rights and digest pinned.

## Civic addresses, buildings, cadastre and privacy

The display hierarchy keeps recipient, organization, building, floor, unit, room, street, house number, microdistrict or sub-locality, locality or village, district or rayon, region or republican city, post office, P.O. Box and postcode as separate fields. Kyrgyz Post guidance allows street plus house or building lookup to select a code. This narrows delivery context but cannot infer an entrance, unit, building, resident, operator coverage or delivery entitlement.

Building display requires an exact rights-cleared civic address identity, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. The State Agency exposes Address Register and GIS metadata, while the Cadastre portal supports property, parcel, street, building and apartment searches and account-, contract- or fee-mediated services. A registry result, ENI, parcel, owner, person, organization, coordinate, OSM footprint or proximity is not an open national address/building corpus or a public owner/occupant relation.

## Sources, models, API, AGID and time

The Open Data Portal and CAIAG GeoNode are artifact- and layer-specific inputs, not blanket-licensed postal authority. Each dataset needs its exact publisher, date, schema, licence, scope and digest pinned. OpenStreetMap remains ODbL validation evidence. The historical nsdi.kg hostname is fail-closed: as observed on 26 August 2026 it resolves to an unrelated gambling site, so it is retained only as a legacy safety tombstone and is excluded from every active KG source list.

APIs and mathematical or machine-learning models may compress candidate surfaces, detect conflicts and prioritize review. Preserve input digests, model and feature versions, observed_at, generated_at, cache TTL, confidence, uncertainty and derived status. A cached response or model output cannot overwrite operator evidence, manufacture official geometry or infer a house number or building.

The shared routes support POST /api/postal/resolve with country code KG, GET /api/postal/KG/{postcode}, and GET /api/postal/intersects?country=KG&bbox=.... Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, derivation status, confidence and validity separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes Kyrgyz Post geometry, and postal, administrative, civic, building or parcel objects never become AGID cells.

## Promotion

M2 or later requires exact current operator artifacts, explicit typing of numeric codes and mobile postal objects, immutable digests, validity, independently licensed point, route or area geometry, CRS and topology checks, administrative crosswalk review, civic-address and building-link review, privacy and licence review, and reproducible provenance. Real rows, addresses and production geometry belong in the independent agid-postal-kg data repository, not this AGID application repository.
