# El Salvador postal context runtime

El Salvador is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows or polygons, live Correos or CNR responses, real addresses, cadastral keys, registration records, geographic-code files, census records, parcels, people, property data, OSM features, credentials or production geometry. Executable examples use the unverified synthetic value `9999` and synthetic geometry. A live collision check and replacement are mandatory before promotion.

## Postal Code -> Routing / Locality Evidence -> Address Context

The normalizer applies NFKC, removes whitespace and accepts exactly four digits. It rejects country prefixes, hyphens, punctuation and wrong lengths. The UPU's May 2019 sheet describes the digits as region, department, locality or delivery area, and distribution. That supports `routing-locality-first` semantics, not a claim that every code is a polygon or remains currently assigned.

Correos de El Salvador is the national operator, but its current public site does not expose a versioned bulk national assignment or polygon release. Production observations therefore pin the exact service or page, retrieved time, request and response digests, ambiguity, terms and retention policy. The UPU sheet is dated format evidence rather than a current assignment table.

CNR publishes geographic-location codes and downloadable municipality context: two digits for departments, four for municipalities and six for cantons. Those identifiers are administrative, not postal. The country also changed to a department-municipality-district structure in 2023; legacy municipality identities and current districts remain versioned and require an explicit crosswalk. ONEC statistical vintages are separate again.

Voronoi, buffers, network catchments, interpolation, machine learning, real-time comparison, topology repair and compressed indexes may create derived review surfaces. They retain model and feature versions, confidence, uncertainty and derivation status. They cannot overwrite official observations, manufacture official postal geometry or bridge unknown coverage.

## Address and building boundary

The schema keeps recipient, attention, organization, building, street or passage, house number, block or poligono, lot, floor, unit, P.O. Box, post office, development or condominium, colonia or barrio, caserio, canton, district, municipality, department, locality and postcode distinct. A postal or administrative match can improve locality display but cannot infer a missing house number, unit, building or recipient.

Building display requires a rights-cleared civic-address ID, an explicit stable civic-address-to-building relation and separately permitted point or footprint geometry. CNR cadastral products are paid or purpose-bound and can contain parcel, address, owner, neighbor and registration context; those fields are not bundled or treated as public building data.

## API and AGID

The shared routes support `POST /api/postal/resolve` with `countryCode: "SV"`, `GET /api/postal/SV/{postcode}`, and `GET /api/postal/intersects?country=SV&bbox=...`. Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, observation or derived status, confidence, validity and release identity separate.

AGID is an independent versioned spatial crosswalk. Postal, administrative, statistical, cadastral and building geometries do not become AGID cells, and AGID geometry never becomes official El Salvador postal geometry.

## Promotion

M2 or later requires a current authority-published versioned postal artifact or a permitted reproducible observation workflow, pinned terms and immutable digests, schema and CRS validation, code and feature uniqueness checks, administrative-vintage crosswalks, topology and ambiguity review, explicit address-building relation evidence, field-level privacy review, temporal and coverage review, and reproducible AGID crosswalk provenance. Real assignments, addresses and production geometry belong in the independent `agid-postal-sv` data repository, not this AGID application repository.
