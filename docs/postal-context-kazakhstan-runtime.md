# Kazakhstan postal context runtime

Kazakhstan is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live QazPost responses, bearer tokens, real addresses, RKA values, personal or property data, NSDI or cadastral layers, OSM features or production geometry. Executable examples use the unverified synthetic current value X99X9X9, legacy value 999999 and synthetic geometry. Collision checks and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The KZ normalizer accepts either exactly seven ASCII alphanumeric characters in LNNLNLN order or exactly six digits after NFKC normalization, uppercases Latin letters, preserves leading zeroes and rejects country prefixes, punctuation, hyphens, Cyrillic lookalikes and wrong lengths.

The UPU Kazakhstan sheet dated 07/2025 documents a transition in which both systems coexist. The new code appears before the locality. Current assignment rules make its first Latin letter a capital, region or city-of-republican-significance code, its next two digits an address-block code, and its remaining letter-digit pairs a real-estate-object code inside that block. The legacy six-digit numeric index instead carries post-office, district and regional context and is being phased out.

Neither code is automatically a polygon. The current code can be strong object-assignment evidence, but it is not automatically a building footprint, entrance or unit. The legacy code can be routing evidence, but it is not automatically a delivery area. Code characters, post-office coverage, RKA, points, administrative or cadastral containment, proximity, Voronoi, interpolation or a model never become official postal geometry.

## QazPost, Digital Address Register and buildings

QazPost Open API service 26 supports search by address, new postcode or address-registration code and requires a bearer token. A pinned response can support a dated code-to-address-object relation only under its exact schema, terms, privacy, retention, rate and display rights. Interactive or API access is not authority to harvest or republish a national address or geometry corpus.

The Digital Address Register establishes registered-address existence. Its 16-digit RKA is a separate identifier generated for a real-estate address; it is not a postcode, AGID cell, cadastral identifier, footprint or ownership record. Building-level display requires a rights-cleared address identity, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. An address, postcode, RKA, cadastral parcel, rights-register result or OSM footprint alone cannot reveal a resident or establish the complete relation.

## NSDI, cadastre, rights and time

Kazakhstan NSDI rules provide search, view, download and copy services and allow users to obtain generally accessible spatial data without charge. Each exact dataset still needs its owner, metadata, access class, reuse terms, jurisdiction, validity, CRS, topology and digest pinned. Portal visibility or a GeoServer endpoint is not a blanket postal, address, building or redistribution licence. The public cadastral map is parcel context only; the legal cadastre includes rights and right-holder information and is not an open address corpus.

Current and legacy evidence must coexist. Store code_type, valid_from, valid_to, observed_at, retrieved_at, source version and supersession independently. Never rewrite old assignments as current ones or merge both code systems into one geographic object.

## API and AGID

The shared routes support POST /api/postal/resolve with country code KZ, GET /api/postal/KZ/{postcode}, and GET /api/postal/intersects?country=KZ&bbox=.... Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence, validity and jurisdiction separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes QazPost geometry, and postal, address-register, administrative, cadastral or territorial objects never become AGID cells.

## Promotion

M2 or later requires current typed assignment artifacts, immutable digests, explicit current-versus-legacy validity, independently licensed point or area geometry, CRS and topology checks, RKA and building-link review, privacy and licence review, temporal and jurisdiction coverage and reproducible provenance. Real rows, addresses and production geometry belong in the independent agid-postal-kz data repository, not this AGID application repository.
