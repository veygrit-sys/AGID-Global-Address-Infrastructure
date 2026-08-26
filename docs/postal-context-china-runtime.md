# China postal context runtime

China is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live China Post or Tianditu responses, API keys, real addresses, universal delivery address codes, doorplates, personal or property data, map or real-estate layers, OSM features or production geometry. Executable examples use the unverified synthetic value 999999 and synthetic geometry. Collision checks and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The CN normalizer applies NFKC, removes whitespace, preserves leading zeroes and accepts exactly six ASCII digits. It rejects CN prefixes, hyphens, punctuation and wrong lengths.

China has used a four-level six-digit postcode system since 1986. China Post compiles codes under State Post Bureau rules. The UPU sheet dated 09/2013 places six digits before the province, illustrates delivery-region and destination-county coding context, documents Chinese big-to-small order and Latin or Pinyin small-to-big order, and identifies door, floor, building, compound, P.O. Box and poste-restante elements. These format and element descriptions are not current assignments or reusable addresses.

A six-digit code is not automatically a polygon. Code digits, prefixes, destination county, post-office coverage, an address or map point, administrative containment, roads, OSM, proximity, Voronoi, interpolation, machine learning or real-time generation never become official postal geometry. Exact China Post or competent-authority geometry must explicitly relate the typed code to a point, polygon or multipolygon and pin jurisdiction, validity, CRS, topology, licence and digest. Derived surfaces remain labelled derived and cannot silently fill unknown coverage.

## Universal delivery address code, civic addresses and buildings

GB/T 41832-2022 defines a separate universal delivery address code. The State Post Bureau describes it as a high-precision system with country or region, satellite-navigation-system and delivery-location components plus optional attributes. It is not a six-digit postcode, an AGID cell, a public address corpus or automatically invertible geometry. A model or API response cannot translate between these systems without an exact authorized crosswalk.

GB/T 39609-2020 supplies address-geocoding semantics, while the 2022 Geographical Names Regulation establishes standard-name and local standard-address responsibilities. Neither legal framework publishes an open national doorplate corpus. Building-level display requires an exact rights-cleared standard address or doorplate identity, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. A postcode, address code, geocode, Tianditu result, parcel, real-estate unit, coordinate or OSM footprint alone does not establish that relation or identify a resident.

## Tianditu, real estate, rights and time

Tianditu is the national geospatial public-service portal. Every exact API, layer or product still needs its owner, key or quota, terms, attribution, map-review and security obligations, jurisdiction, validity, CRS, topology and digest pinned. Free online service and viewer access do not authorize national address or map harvesting and redistribution.

Real-estate registration queries are purpose-limited and may include rights, right-holder, parcel and unit context. They are not an open address or building corpus. Exact locations, entrances, rooms, recipients, residents, owners, API keys and query logs remain excluded without lawful purpose, minimisation, retention and publication approval.

Store code_type, valid_from, valid_to, observed_at, retrieved_at, source version and supersession independently. Cached API responses and model outputs never become timeless facts.

## API, AGID and technical jurisdictions

The shared routes support POST /api/postal/resolve with country code CN, GET /api/postal/CN/{postcode}, and GET /api/postal/intersects?country=CN&bbox=.... Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence, validity and jurisdiction separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes China Post geometry, and postal, universal address-code, civic, building, administrative or territorial objects never become AGID cells. CN, HK, MO and TW packs remain technically separate; runtime selection and data boundaries imply no sovereignty determination.

## Promotion

M2 or later requires exact current typed assignment artifacts, immutable digests, explicit validity and jurisdiction, independently licensed point or area geometry, CRS and topology checks, standard-address and building-link review, privacy and licence review, technical jurisdiction separation and reproducible provenance. Real rows, addresses and production geometry belong in the independent agid-postal-cn data repository, not this AGID application repository.
