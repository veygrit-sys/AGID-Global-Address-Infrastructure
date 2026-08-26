# Uruguay postal context runtime

Uruguay is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows or polygons, live Correo Uruguayo or IDE responses, real addresses, address points, roads, administrative layers, DNC parcels, people, property data, OSM features, credentials or production geometry. Executable examples use the unverified synthetic value `99999` and synthetic geometry. A live collision check and replacement are mandatory before promotion.

## Postal Code -> Official Release Geometry -> Address Context

The normalizer applies NFKC, removes whitespace and accepts exactly five digits. It rejects country prefixes, hyphens, punctuation and wrong lengths. Correo Uruguayo describes the complete code as identifying a delivery point or a set of delivery points, so postal object type remains independent even though an official polygon release exists.

Correo Uruguayo publishes official SHP and KML postal-code resources under the Licencia de Datos Abiertos de Uruguay. The August 2023 SHP resource declares EPSG:4326. A production feature may be marked official only when the exact resource UUID, bytes, digest, schema, CRS, coverage date, retrieval time, origin note, validity and supersession are pinned. The catalog page, a valid code, the current search UI or an API response is not a substitute for a pinned polygon release, and the 2023 artifact is not silently presented as timeless current truth.

Voronoi, buffers, interpolation, machine learning, real-time lookup comparison and topology repair may create derived review surfaces or compressed indexes. They retain model and feature versions, confidence, uncertainty and derivation status. They cannot overwrite official release bytes, manufacture present-day coverage or bridge missing areas.

## Address points, buildings and cadastre

Correo web services can return normalized street, door number, block, lot, locality, department, postcode and EPSG:4326 point context. The Sistema Único de Direcciones (SuDir) provides nationwide address points and unique address identifiers with official and common street nomenclature. These raise address display and validation resolution but remain separate from postal polygons, parcels and building footprints.

The UI keeps recipient, attention, organization, building, street or road, door number, block, lot, floor, unit, P.O. Box, neighborhood or place, locality, municipality, department and postcode separate. Building display requires a rights-cleared civic-address identifier, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. A postcode, postal polygon, Correo or IDE point, DNC parcel, coordinate, containment or proximity alone is insufficient.

Dirección Nacional de Catastro publishes monthly urban and rural parcel shapes under the Uruguay open-data licence. Parcels provide cadastral context only. Padrón, owner, occupant, value, tax, unit and improvement fields require exact field-level authority and privacy review and never become public address-building truth by proximity.

## APIs, AGID, licence, jurisdiction and time

The shared routes support `POST /api/postal/resolve` with `countryCode: "UY"`, `GET /api/postal/UY/{postcode}`, and `GET /api/postal/intersects?country=UY&bbox=...`. Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, official or derived status, confidence, validity and release identity separate.

The Uruguay open-data licence requires an origin note naming the provider, licence and dataset and disclosure of modifications. Each Correo, IDE and DNC resource UUID and licence text remains pinned. Public web-service availability is handled separately from bulk redistribution rights, request retention and privacy. ODbL material stays in its own provenance partition.

AGID is an independent versioned spatial crosswalk. Postal, civic, administrative, cadastral and building geometries do not become AGID cells, and AGID geometry never becomes official Correo geometry. The ISO UY pack does not extend a postal release into maritime space, unrepresented offshore areas or separately sourced boundary assertions.

## Promotion

M2 or later requires an exact Correo release artifact, immutable bytes and digest, schema/CRS validation, geometry repair logs, code and feature uniqueness checks, current lookup drift review, origin-note automation, SuDir resource and address-ID review, explicit address-building relation evidence, DNC field-level privacy review, temporal and coverage review, and reproducible AGID crosswalk provenance. Real assignments, addresses and production geometry belong in the independent `agid-postal-uy` data repository, not this AGID application repository.
