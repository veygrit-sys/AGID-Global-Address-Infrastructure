# Iran postal context runtime

Iran is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live GNAF or certificate responses, real addresses, personal data, NSDI layers, third-party map rows, OSM features or production geometry. Executable examples use the unverified synthetic value 9999999999 and synthetic geometry. A collision check and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The IR normalizer accepts exactly ten digits after NFKC normalization and converts Arabic-Indic and Eastern Arabic-Indic digits. It preserves leading zeroes and rejects country prefixes, punctuation, hyphens and wrong lengths.

The UPU Iran sheet updated 10/2023 places ten digits below the locality. It labels zone, segment, part, district, forwarding-code and identification-code components, and describes recipient, organisation, building, premise, floor, door, street, sub-street, locality, sub-locality and province elements. P.O. Box and poste restante addresses do not use the postcode.

A complete code is a fine-grained place identifier, not a guaranteed area. The five-digit forwarding prefix can be indexed as routing context only when exact semantics are pinned; it is not automatically an official polygon. The runtime keeps current Iran Post assignment, separately licensed geometry, GNAF responses, certificates, administrative context, derived surfaces, civic addresses, buildings and AGID crosswalks independent.

## GNAF, building display and privacy

GNAF is an operational standard-address and geocoding evidence source, not an open bulk address corpus. A response can support an address point or other relation only when its exact schema, service terms, purpose, retention, privacy and display rights are pinned. A ten-digit code, query, certificate, coordinate, road, parcel candidate, NSDI layer, third-party map or OSM footprint cannot by itself reveal a resident or establish an exact address-building relation.

A building may be displayed only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the point, footprint or parcel geometry is separately permitted for that purpose, jurisdiction and time. Units, recipients, residents, owners, occupants, P.O. Box holders and private query logs remain private.

## Source and rights boundaries

- Iran Post is the operator reference, but public pages are not bulk assignment or redistribution permission.
- GNAF and the certificate service are operational references; interactive access is not permission to harvest or publish addresses.
- The UPU 10/2023 sheet establishes format and address semantics only; its real examples and contacts are not copied.
- Iran NSDI may validate administrative or spatial context only after exact layer authority, terms, jurisdiction, validity, CRS and digest are pinned.
- Iran Open Data is an independent reference, not Iran Post or government authority, and requires exact item licensing.
- OSM remains a separate ODbL validation layer.

## API, time and AGID

The shared routes support POST /api/postal/resolve with countryCode IR, GET /api/postal/IR/{postcode}, and GET /api/postal/intersects?country=IR&bbox=.... Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence, validity and jurisdiction separate.

Assignments, addresses, coordinates, buildings and crosswalks are time-dependent. Store valid_from, valid_to, observed_at, retrieved_at, source version and supersession independently. AGID is an independent spatial index connected only by a versioned crosswalk; AGID geometry never becomes Iran Post geometry.

## Promotion

M2 or later requires a current Iran Post assignment artifact, written rights, immutable digests, explicit postal object types, P.O. Box and poste restante handling, independently licensed point or area geometry, CRS and topology checks, temporal and jurisdiction coverage, privacy review and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent agid-postal-ir data repository, not this AGID application repository.
