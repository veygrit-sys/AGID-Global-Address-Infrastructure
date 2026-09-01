# Ecuador postal context runtime

Ecuador is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows or polygons, live MINTEL or interoperability responses, real addresses, CUENs, cadastral identifiers, address or census points, roads, administrative layers, parcels, people, property data, OSM features, credentials or production geometry. Executable examples use the unverified synthetic value `999999` and synthetic geometry. A live collision check and replacement are mandatory before promotion.

## Postal Code -> Postal Zone Evidence -> Address Context

The normalizer applies NFKC, removes whitespace and accepts exactly six digits. It rejects country prefixes, hyphens, punctuation and wrong lengths. The Ecuadorian technical standard defines the first two digits as province, the next two as planning district and the final two as postal zone. It defines the postal zone as a territorial portion, so the normal full-code geometry semantic is `postal-area-first` while exceptional future assignments remain typed explicitly.

The official lookup supports address, place, postcode and CUEN searches and can report uncertainty at postal-zone boundaries. It also says its adjusted source cartography is referential and unsuitable for precision projects. A production observation therefore pins service behavior, request and response digests, `observed_at`, ambiguity and retention policy. A map rendering or an unidentified public FeatureServer is not promoted to a reusable official polygon without authority provenance, versioned bytes and explicit redistribution rights.

Voronoi, buffers, interpolation, machine learning, real-time comparison, topology repair and compressed indexes may create derived review surfaces. They retain model and feature versions, confidence, uncertainty and derivation status. They cannot overwrite official observations, manufacture official geometry or bridge unknown coverage.

## Address, buildings and cadastre

The DINARP interoperability catalog documents postal-zone, street-intersection, locality, parish and coordinate fields, but catalog inclusion is not anonymous API authorization. Production calls require a service contract, lawful purpose, input minimisation, response-field and retention review.

INEC's census cartography exposes localities, road axes, entrances, blocks and census-building multipoints. INEC states that statistical cartography lacks metric precision and does not prove political-administrative jurisdiction. These layers can improve display and validation context but are not postal assignments, civic-address registers, cadastral parcels, building footprints, residents or automatic address-building relations.

The UI keeps recipient, attention, organization, building, main street, house or building number, cross street, block, lot, floor, unit, P.O. Box, development or sector, neighborhood, locality, parish, canton, province and postcode separate. Building display requires a rights-cleared civic-address identifier, a stable reviewed relation to a permitted building identifier and separately licensed point or footprint geometry. A postcode, postal-zone rendering, intersection, census point, CUEN, parcel, coordinate, containment or proximity alone is insufficient.

The national cadastral framework standardizes an integrated georeferenced cadastre, while municipal and metropolitan GADs remain responsible for their urban and rural data. Parcels provide cadastral context only. Owner, resident, value, tax, utility, unit and property fields require exact local authority and privacy review.

## APIs, AGID, rights, jurisdiction and time

The shared routes support `POST /api/postal/resolve` with `countryCode: "EC"`, `GET /api/postal/EC/{postcode}`, and `GET /api/postal/intersects?country=EC&bbox=...`. Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, observation or derived status, confidence, validity and release identity separate.

Rights are artifact-specific. The public official lookup is not a blanket bulk polygon licence; DINARP access can be purpose-restricted; INEC statistical cartography follows its use and distribution policy; IGM artifacts may restrict commercial use, transfer and internet redistribution; municipal cadastral terms vary; ODbL material stays in its own provenance partition.

AGID is an independent versioned spatial crosswalk. Postal, civic, census, administrative, cadastral and building geometries do not become AGID cells, and AGID geometry never becomes official Ecuador postal geometry. Source coverage records mainland, insular and other declared areas explicitly and is not extended into maritime space or boundary assertions.

## Promotion

The 2026-09-01 M2 review fixed nine official bodies (667,199 bytes) by byte count and SHA-256. Official example `180204` returned one closed 227-position MultiPolygon and the official JavaScript fits and draws it. This proves a live official area lookup, not a current complete immutable release: the response omits validity, alias, supersession, object class, producer lineage, source edition, reference date, CRS, method, confidence and exception metadata.

ARCP Resolution 2020-26 declares national postcode lists, thematic maps and a vector postal-polygon file public, while requiring interested natural or legal persons to accept an annexed use agreement and satisfy protected-download conditions. The fixed five-page resolution omits Annex 1. No agreement was reviewed or accepted and no artifact was downloaded. The historical standard's 1,225-zone count is not a current denominator because the standard expressly permits assignment changes after geographic or demographic updates.

EC therefore remains `blocked` and M2-unmet. M2 or later requires a current complete authority release, reviewed compatible terms, immutable digests, schema/CRS validation, geometry repair logs, code and feature uniqueness checks, every assignment reconciled to valid Polygon/MultiPolygon or explicit non-area reason, boundary-ambiguity review, and reproducible AGID crosswalk provenance. The real EC API/app must demonstrate normalization, loading, no-match, multiple, failure, invalid-geometry, fit, translucent fill, clear outline, provenance, clear and re-search states. Shared runtime tests and synthetic `999999` do not satisfy this criterion. Real assignments, addresses and production geometry belong in the independent `agid-postal-ec` data repository, not this AGID application repository.
