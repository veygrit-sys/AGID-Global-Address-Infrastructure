# Afghanistan postal context runtime

Afghanistan is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live address-search responses, real addresses, personal data, Afghan Post GeoJSON or production geometry. Executable examples use the deliberately non-assignment synthetic code `999999` and synthetic geometry.

## Postal Code → Geometry → Address Context

The AF normalizer accepts exactly six digits after NFKC normalization. It converts Arabic-Indic and Eastern Arabic-Indic digits, preserves component zeroes and rejects legacy four-digit values, country prefixes, hyphens and wrong lengths.

The UPU Afghanistan sheet dated 07/2025 states that the current six-digit system came into force on 1 October 2024. Digits 1-2 identify one of 34 provinces in the range 10-43; digits 3-4 identify a city district in 01-50 or rural district in 51-99; digits 5-6 identify a postal delivery zone in 01-99. Existing four-digit metadata is therefore legacy and is not accepted.

The current Afghan Post Postal Code System searches an address or postcode and can return postal-area GeoJSON, coordinates, province, city or rural district, locality, road, home number and post-office context. Interactive access establishes a current official reference, not bulk reuse or a personal-address licence.

The runtime keeps these layers distinct:

1. exact, dated Afghan Post six-digit assignment;
2. exact Afghan Post postal-area response or rights-cleared release;
3. post office, P.O. Box, address-search result or coordinate object;
4. OCHA province, district and administrative P-code context;
5. optional derived postal-administrative join surface with uncertainty;
6. explicit rights-cleared civic address and separately linked building geometry;
7. independent AGID cell and versioned crosswalk.

Administrative P-codes are not postcodes. Containment, address-search similarity, nearest-office, coordinate equality, OCHA overlap, Voronoi, interpolation and models may rank candidates; they cannot create an official assignment, licensed postal polygon, legal civic address, building relation or delivery entitlement.

## Source and rights boundaries

- Afghan Post is the official operator. Its site links the current Postal Code System and states all rights reserved. Pin exact responses, validity, schema, terms, retrieval time and digest.
- The UPU 07/2025 sheet establishes the transition date, six-digit coding method and address-line structure. Its real examples are not copied into this repository.
- Afghan Post policy describes address standardization, numbering and network expansion, but is not data or a reuse grant.
- OCHA/HDX COD-AB version 03 is sourced from AGCHO and NSIA and licensed CC BY 3.0 IGO. Its 34 provinces and 401 humanitarian-use districts are administrative context. The 2026 metadata warns that 457 districts are designated while corresponding boundary data are unavailable.
- HOT and OSM are ODbL validation layers and never supply Afghan Post authority.

## Building display gate

The runtime may display a building only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the geometry is separately permitted for that purpose and time. Postcode or administrative containment, map coordinates, home-number text, road match, OCHA boundaries, HOT or OSM building proximity are only candidate or validation evidence.

## API and AGID

The shared routes work without country-specific endpoint code:

- `POST /api/postal/resolve` with `countryCode: "AF"`;
- `GET /api/postal/AF/{postcode}`;
- `GET /api/postal/intersects?country=AF&bbox=...`.

Geometry is returned only when explicitly requested. Every result keeps assignment authority, geometry authority, derivation status, confidence and validity separate. AGID links through an explicit versioned crosswalk and never replaces postal, administrative, address or building identity.

## Promotion

M2 or later requires exact rights-reviewed Afghan Post artifacts, immutable digests, current assignment validity, independently licensed geometry, CRS/topology checks, temporal coverage, privacy review and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent `agid-postal-af` data repository, not this AGID application repository.
