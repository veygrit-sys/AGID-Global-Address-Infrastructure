# Uzbekistan postal context runtime

Uzbekistan is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postal-index rows, live UzPost responses, real addresses, personal or property data, cadastral layers, OSM features or production geometry. Executable examples use the unverified synthetic value 999999 and synthetic geometry. A collision check and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The UZ normalizer accepts exactly six digits after NFKC normalization, preserves leading zeroes, and rejects country prefixes, punctuation, hyphens and wrong lengths.

The UPU Uzbekistan sheet dated 07/2019 places six digits before the locality. Its generic coding describes a delivery post office or postal hub, regional centre or territory or town, and regional or provincial context; Tashkent uses a separate three-plus-three post-office coding method. It also documents recipient, organisation, organisation unit, block or street, house, apartment, locality, district, province, post office and P.O. Box elements.

A complete index is therefore a delivery-network or post-office identifier, not a guaranteed area. The runtime keeps current UzPost responses, the dated official list, separately licensed geometry, administrative context, derived surfaces, civic addresses, buildings and AGID crosswalks independent. Digits, an office point, administrative containment, proximity, Voronoi or a model never become official postal geometry.

## Open data, current lookup and time

The official open-data portal dataset was last modified in 2019 and lists branch, post-office name and postal index fields. Portal terms allow reuse, modification and commercial use with lawful use, no distortion and source attribution. That makes the exact archived resource a useful dated assignment candidate, but it is not current validation and contains no postal polygon.

The current UzPost map provides address and index search and post-office categories. Its responses are operational evidence only: exact terms, privacy, retention, rate and display rights must be pinned, and interactive access does not authorise bulk harvesting. The 2026 government open-data registry lists “Zip Code Addresses”, but a catalog label is only discovery metadata until the exact resource, publisher, update, terms and digest are resolved.

Historical and current evidence must coexist. Store valid_from, valid_to, observed_at, retrieved_at, source version and supersession independently; never overwrite the 2019 artifact with a current lookup or treat the old row as current without validation.

## Building display, cadastre and privacy

The Cadastre Agency maintains cadastral and real-estate context, while the state real-estate register includes property, rights and right-holder information. These are not postal geometry or open household-address data. A building may be displayed only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier and its point, footprint or parcel geometry is separately permitted for the exact purpose, jurisdiction and time.

A postcode, office assignment or point, address search, coordinate, administrative polygon, cadastral parcel, property-register result or OSM footprint cannot by itself reveal a resident or establish an exact address-building relation. Recipients, residents, owners, occupants, units, registrations, private coordinates and query logs remain private.

## Source and rights boundaries

- UzPost is the current operator reference; public web pages are not bulk assignment or redistribution permission.
- The UPU 07/2019 sheet establishes dated format and address semantics only; its real examples and contacts are not copied.
- The official 2019 dataset can be reused under portal terms with attribution and no distortion, but needs exact-version provenance and current validation.
- The 2026 open-data registry is discovery metadata, not a dataset or licence override.
- Cadastre and property-register sources require exact resource rights, access and privacy review; government-site attribution text is not a blanket data licence.
- OSM remains a separate ODbL validation layer.

## API and AGID

The shared routes support `POST /api/postal/resolve` with country code `UZ`, `GET /api/postal/UZ/{postcode}`, and `GET /api/postal/intersects?country=UZ&bbox=...`. Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence, validity and jurisdiction separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes UzPost geometry, and postal, administrative, cadastral or territorial objects never become AGID cells.

## Promotion

M2 or later requires a current official assignment artifact or pinned UzPost response contract, immutable digests, explicit postal object types, independently licensed point or area geometry, CRS and topology checks, temporal and jurisdiction coverage, building-link and privacy review, and reproducible provenance. Real postal-index rows, addresses and production geometry belong in the independent `agid-postal-uz` data repository, not this AGID application repository.
