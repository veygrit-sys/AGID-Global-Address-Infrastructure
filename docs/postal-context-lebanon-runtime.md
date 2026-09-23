# Lebanon postal context runtime

Lebanon is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, real addresses, NAC tokens, map pins, personal data, cadastral records or production geometry. All executable examples use the synthetic code `9999` and synthetic geometry.

## Postal Code → Geometry → Address Context

The LB normalizer accepts either exactly four digits or eight digits rendered canonically as `NN NNN NNN` after NFKC normalization. It converts Arabic-Indic and Eastern Arabic-Indic digits, preserves leading zeroes and rejects country prefixes, hyphens and wrong lengths.

LibanPost's operational address workflow exposes governorate, district, area, street, building, floor, block, apartment, P.O. Box or ZIP code, map pin and NAC fields. The UPU Lebanon sheet documents recipient, organisation, building, unit, street or area, city or village and district (kaza) structure. The reviewed August 2026 Lebanon sections of the Universal POST*CODE reference list Lebanon formats `9999` and `99 999 999`. These references do not prove that every code is an area, provide a current bulk assignment table, or grant address or geometry reuse rights.

The runtime keeps these layers distinct:

1. exact, dated LibanPost or legally authorised postal assignment;
2. NAC coordinate-derived location token, map pin, P.O. Box, post office or other non-area service object;
3. exact postal-authority geometry, if a future licensed artifact supplies it;
4. optional derived postal-administrative join surface with uncertainty;
5. governorate, district, cadaster, city or village, area and street context;
6. explicit rights-cleared civic address and separately linked building geometry;
7. independent AGID cell and versioned crosswalk.

NAC is not a postcode or AGID. MOPH and atlas `PCODE` values are administrative identifiers, not postcodes. Containment, nearest-office, administrative overlap, parcel overlap, Voronoi, interpolation and models may rank candidates; they cannot create official postal assignment, canonical postal geometry, legal civic address, building relation or delivery entitlement.

## Source and rights boundaries

- LibanPost is the official operational postal and address reference. Pin exact current responses, validity, schema, retrieval time, rights and digest. A public form or lookup is not bulk redistribution permission.
- UPU materials establish address structure and the documented four- and eight-digit formats, not current assignments, production addresses, geometry or building relations.
- The Ministry of Public Health Administrative Zones service exposes governorate, district and cadaster context. Exact layer, edition, CRS, topology, terms, attribution and digest are mandatory. Blank copyright text is not an open licence.
- The 2026 Lebanon Atlas may validate derived administrative context only after exact item, lineage, P-code caveat and rights review.
- The Directorate General of Land Registry and Cadastre describes controlled or paid cadastral, parcel, unit and title-register services. These are not public civic-address or building data.
- Law 81/2018 and Article 98 guidance gate personal address, location, account, owner and cadastral data processing.
- OSM is an ODbL fallback validation layer and never supplies LibanPost or NAC authority.

## Building display gate

The runtime may display a building only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the corresponding geometry is separately permitted for that purpose and time. Postcode or NAC match, administrative P-code containment, map-pin or coordinate equality, cadastral overlap and nearest-building logic are only candidate or validation evidence.

## API and AGID

The shared routes work without country-specific endpoint code:

- `POST /api/postal/resolve` with `countryCode: "LB"`;
- `GET /api/postal/LB/{postcode}`;
- `GET /api/postal/intersects?country=LB&bbox=...`.

Derived geometry is returned only when explicitly requested. Every result keeps assignment authority, geometry authority, derivation status, confidence and validity separate. AGID links by an explicit versioned crosswalk and never replaces postal, NAC, administrative, cadastral, address or building identity.

## Promotion

M2 or later requires exact rights-reviewed source artifacts, immutable digests, current assignment validity, independently licensed geometry, CRS/topology checks, temporal coverage, privacy review and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent `agid-postal-lb` data repository, not this AGID application repository.
