# Canada postal context runtime

Canada is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postal-code assignments or geometry, Canada Post licensed rows, PCCF records, AddressComplete responses or keys, National Address Register rows, census FSA boundaries, building footprints, real people, organizations, properties, OSM features or production geometry. Executable examples use the unverified synthetic value `H9H 9H9` and synthetic geometry. A live collision check and replacement are mandatory before promotion.

## Postal Code -> Delivery Unit Evidence -> Address Context

The normalizer applies NFKC, uppercases, removes whitespace, validates Canada Post letter positions and emits `ANA NAN`. It rejects country prefixes, hyphens, punctuation, forbidden letters and wrong lengths. Canada Post defines the first segment as the Forward Sortation Area and the second as the Local Delivery Unit. A full code can represent a city-block face, single building, large-volume receiver or rural community, so the full-code semantic is `delivery-unit-first`, not universal polygon.

Canada Post's AddressComplete API provides credentialed address search and formatted-address observations. Postal Code Address Data and related coordinate, delivery-mode and PCCF products are licensed and updated independently. Production use pins the exact product or service version, credentials policy, purpose, request and response digests, cache and retention rules and redistribution terms. No licensed row is stored in this application repository.

Statistics Canada's 2021 Census Forward Sortation Area boundary file is an official-derived CFSA reference built from respondent-reported postal codes and dissemination areas. Statistics Canada explicitly distinguishes it from Canada Post FSA geography. It has no LDU boundaries and must not be labelled as current full-postal-code geometry.

PCCF links full postal codes to census geographies and coordinates but does not validate postal codes, can produce multiple records for a code and is subject to restricted licensing. Voronoi, buffers, interpolation, network catchments, machine learning, real-time comparison, topology repair and compressed indexes may create derived review surfaces; they retain source versions, confidence and uncertainty and never become Canada Post geometry.

## Address and building boundary

The bilingual schema keeps recipient, attention, organization, building, unit, civic number and suffix, street name, type and direction, delivery information, rural route, P.O. Box, delivery installation, municipality, province or territory and postal code distinct.

The Statistics Canada National Address Register provides release-versioned, open-licensed, non-confidential civic-address and location identifiers. The Open Database of Buildings provides incomplete harmonized footprints from contributing governments. Neither proximity nor containment establishes an exact address-to-building-footprint relation. Building display requires an explicit stable relation between rights-cleared address and building identifiers.

## API and AGID

The shared routes support `POST /api/postal/resolve` with `countryCode: "CA"`, `GET /api/postal/CA/{postcode}`, and `GET /api/postal/intersects?country=CA&bbox=...`. Geometry is opt-in and keeps assignment authority, FSA/LDU object type, geometry authority, authoritative or derived status, confidence, validity and release identity separate.

AGID is an independent versioned spatial crosswalk. Canada Post assignments, CFSA boundaries, PCCF coordinates, NAR points, administrative areas and building footprints do not become AGID cells, and AGID geometry never becomes Canada Post postal geometry.

## Promotion

M2 or later requires an exact licensed Canada Post release or permitted API observation workflow, pinned contracts and immutable digests, schema and CRS validation, FSA/LDU and postal-object classification, CFSA non-equivalence labelling, topology and ambiguity review, NAR and ODB release/provider coverage, explicit address-building relation evidence, privacy review, temporal and jurisdiction review, and reproducible AGID crosswalk provenance. Real assignments, addresses and production geometry belong in the independent `agid-postal-ca` repository.
