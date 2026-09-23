# Israel postal context runtime

Israel is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live lookup responses, real addresses, personal data, Israel Post data, GovMap responses or production geometry. Executable examples use the unverified synthetic value 9999999 and synthetic geometry. A collision check and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The IL normalizer accepts exactly seven digits after NFKC normalization. It converts Arabic-Indic and Eastern Arabic-Indic digits, preserves zeroes and rejects legacy five-digit values, country prefixes, hyphens and wrong lengths.

Israel Post mail-guide section 7.1 defines the postcode as seven digits representing the address for mail delivery, assigned by the company and updated from time to time. Section 8 defines a separate nine-digit distribution code for bulk-mail ordering. The UPU Israel sheet dated 10/2022 places the seven-digit postcode before the locality.

A full code is not necessarily an area. It may describe an address, delivery route, P.O. Box, delivery centre, large recipient, point or another non-area postal object. The runtime therefore keeps these layers distinct:

1. exact, dated Israel Post seven-digit assignment and postal object type;
2. separately licensed official postal geometry, when it exists;
3. P.O. Box, route, delivery centre, large-recipient or non-area object;
4. GovMap address, block, parcel and map-search candidate;
5. government street, CBS locality, administrative and statistical context;
6. optional derived postal-context surface with uncertainty;
7. explicit rights-cleared civic address and separately linked building geometry;
8. independent AGID cell and versioned crosswalk.

Code digits, a single point, nearest address, parcel containment, locality boundaries, Voronoi, interpolation and models cannot create an official assignment, licensed postal polygon, legal civic address, building relation, delivery entitlement or territorial scope.

## Source, rights and privacy boundaries

- Israel Post is the assignment authority, but its website terms say information is informational only, non-binding, not for official or commercial reliance, and all rights are reserved. The lookup is reference-only without separate written rights.
- The 2020 mail guide establishes seven-digit semantics and the independent nine-digit distribution code. It is not a bulk assignment or geometry licence.
- The UPU 10/2022 sheet establishes format and address-line order. Real examples are not copied.
- GovMap is a Survey of Israel government spatial reference. Registration, exact API or layer terms, schema, CRS and digest must be pinned.
- Data.gov.il default terms updated 2025-08-30 permit reuse with attribution but item-specific terms override them, and privacy, misleading use, unlawful use, third-party rights, protected systems and software remain excluded or restricted.
- Government street lists and CBS geography are validation or administrative context, not Israel Post authority.
- OSM is an ODbL validation layer and never supplies postal or territorial authority.

## Building display gate

The runtime may display a building only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the geometry is separately permitted for that purpose and time. Postcode, GovMap coordinate, street match, parcel, CBS boundary, OSM footprint or proximity is only candidate or validation evidence.

## Territorial scope

The IL country code selects a runtime contract; it is not a sovereignty or boundary claim. The UPU routing note about mail to localities under the Palestinian Authority is kept only as routing metadata and cannot create IL assignments, coverage, polygons, boundaries or AGID territory. Separate source-scoped packs and versioned crosswalks are required.

## API and AGID

The shared routes work without country-specific endpoint code:

- POST /api/postal/resolve with countryCode: "IL";
- GET /api/postal/IL/{postcode};
- GET /api/postal/intersects?country=IL&bbox=....

Geometry is returned only when explicitly requested. Every result keeps assignment authority, geometry authority, derivation status, confidence, validity and territorial scope separate. AGID links through an explicit versioned crosswalk and never replaces postal, address, building, administrative or territorial identity.

## Promotion

M2 or later requires separately licensed Israel Post artifacts, immutable digests, current assignment validity, explicit postal object types, independently licensed geometry, CRS and topology checks, temporal coverage, privacy and territorial review, and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent agid-postal-il data repository, not this AGID application repository.
