# Argentina postal context runtime

Argentina is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production CPA rows, legacy CP rows, live Correo Argentino or government API responses, real addresses, Georef/BAHRA/IGN/IDERA features, cadastral records, people, property data, OSM features, credentials or production geometry. Executable examples use the unverified synthetic value Z9999ZZZ and synthetic geometry. A live collision check and replacement are mandatory before promotion.

## Postal Code -> Postal Object -> Geometry -> Address Context

The normalizer applies NFKC, uppercases Latin letters, removes whitespace and accepts exactly ANNNNAAA with one of the 24 Correo province letters (I and O are excluded). It rejects prefixes, hyphens, punctuation, wrong lengths and the obsolete four-digit CP. Correo Argentino identifies the eight-character CPA as the current code and says the old four-digit CP has not been updated since 1974.

The first CPA letter identifies a province, four digits identify a city/locality and the final three letters refine the delivery object. In urban areas the object can be a block face; small settlements, rural zones, P.O. Boxes and special cases can be non-area or share one CPA. Therefore a CPA is never assumed to be a polygon. Store object_type independently and keep unknown coverage unknown.

No open canonical national CPA polygon release was identified. A production surface must start from rights-cleared current operator assignments, then use separately versioned evidence such as street topology, address ranges, administrative boundaries and reviewed constraints. Voronoi, buffers, interpolation, machine learning or real-time generation may produce derived candidates, but cannot manufacture official coverage or silently bridge missing evidence.

## Address points, buildings and provincial cadastre

The Argentina Georef service normalizes provinces, departments, municipalities, localities, streets and addresses using IGN, BAHRA and INDEC context. Its address coordinate and containing administrative units improve display and validation but are not CPA assignment, parcel geometry, a building footprint or an exact address-building relation. Exact Georef resource metadata, CC BY 4.0 attribution, version and digest remain pinned.

The UI keeps recipient, attention, organization, building, street, house number, floor, unit, P.O. Box, neighborhood, locality, department/partido, province/CABA and CPA separate. Building display requires a rights-cleared civic-address identifier, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. CPA, Georef point, parcel containment and proximity alone are insufficient.

National Cadastre Law 26.209 makes provinces and CABA responsible for cadastre. There is no assumed single open national parcel/address/building relation. Owner, possessor, occupant, value, tax, unit and improvement records remain private or purpose-specific unless the exact jurisdictional artifact and publication authority say otherwise.

## APIs, models, AGID, jurisdiction and time

The shared routes support POST /api/postal/resolve with countryCode AR, GET /api/postal/AR/{postcode}, and GET /api/postal/intersects?country=AR&bbox=.... Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, derivation status, confidence, validity and source release separate.

Interactive lookups and permitted API observations may be cached only with input/request digests, observed_at, generated_at, TTL, terms and minimization. Model output retains model/feature versions, confidence and uncertainty. It cannot overwrite Correo evidence, infer an address, floor, unit, building or occupant, or convert absence into coverage.

AGID is an independent spatial index joined through a versioned crosswalk. Neither CPA, administrative, civic, cadastral nor building geometry becomes an AGID cell, and AGID geometry never becomes official CPA geometry.

The ISO AR pack does not silently merge separately coded FK, GS or AQ data, Antarctic or maritime claims, or disputed sovereignty. Boundary assertions retain source, asserted_by, recognized_by, legal_status, validity and AGID jurisdiction independently.

## Promotion

M2 or later requires an exact current and lawfully reusable CPA assignment artifact or explicitly permitted observations, typed postal objects, immutable digests and validity, separately licensed point/route/area geometry, source-by-source IGN/IDERA authority checks, address/building relation review, provincial/CABA cadastre review, disputed-boundary review, privacy and licence approval, and reproducible provenance. Real assignments, addresses and production geometry belong in the independent agid-postal-ar data repository, not this AGID application repository.
