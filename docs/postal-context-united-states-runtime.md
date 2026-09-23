# United States postal context runtime

The United States is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production ZIP or ZIP+4 rows, AIS products, live USPS or government API responses, real addresses, ZCTA or TIGER features, NAD points, USGS structures, parcels, people, property data, OSM features, credentials or production geometry. Executable examples use the unverified synthetic value 99999 and synthetic geometry. Collision checks and replacement are mandatory before promotion.

## Postal Code -> Postal Object -> Geometry -> Address Context

The US normalizer applies NFKC, removes whitespace, preserves leading zeroes, accepts five digits, nine compact digits or canonical five-plus-four, and emits either NNNNN or NNNNN-NNNN. It rejects US prefixes, wrong separators, punctuation and wrong lengths.

USPS ZIP Codes are delivery-network identifiers, not administrative areas. Five-digit and ZIP+4 assignments can describe street delivery, rural routes, highway contract routes, P.O. Boxes, general delivery, unique organizations, military mail or inactive delivery objects. ZIP+4 narrows a delivery point or range but does not prove who occupies an address, provide a building footprint or create a polygon. The runtime therefore uses area-or-non-area semantics and stores postal object type independently.

Census ZIP Code Tabulation Areas are generalized statistical representations built from 2020 Census blocks for some ZIP Codes. They are useful validation surfaces, but they are not USPS delivery boundaries, do not represent every valid ZIP and cannot disclose Title 13 protected address locations. Every ZCTA retains its Census/TIGER vintage and derived status. Unknown USPS coverage stays unknown.

## Address points, buildings, parcels and display

Publication 28 dated October 2024 supplies address-format semantics for primary and secondary delivery lines, rural and highway-contract routes, general delivery, P.O. Boxes, Puerto Rico and military mail. The UI keeps recipient, attention, organization, building, primary number, street directional and suffix, secondary-unit designator and number, route, P.O. Box, urbanization, city, state or territory, county, ZIP and country as separate fields. No real example address is bundled.

The USDOT National Address Database can supply provider-dependent address points after the exact release, contributing jurisdiction, access class, rights, disclaimer and digest are pinned. The USGS National Structures Dataset can supply selected structure points or preliminary building polygons under exact layer provenance. Neither creates an address-building link. Building display requires a rights-cleared civic address ID, a stable reviewed relation to a building ID and separately permitted point or footprint geometry. ZIP, ZIP+4, Census geocode, NAD point, USGS structure, parcel, containment or proximity alone is insufficient.

There is no single canonical open national parcel/address-to-building relation. State, county, tribal, territorial and local artifacts remain separate, and owner, occupant, household, assessor, tax and query data are excluded unless exact lawful publication authority exists.

## APIs, models, AGID, jurisdiction and time

USPS Addresses 3.0 requires OAuth. Credentials, request addresses and raw responses are never stored in this pack. Mathematical models, machine learning and real-time generation may compress candidate surfaces and detect conflicts, but every result preserves source, model and feature versions, input digests, observed_at, generated_at, TTL, confidence, uncertainty and derived status. Model output cannot overwrite USPS evidence, infer a house, unit, occupant or building, manufacture official geometry or fill unknown coverage.

The shared routes support POST /api/postal/resolve with country code US, GET /api/postal/US/{postcode}, and GET /api/postal/intersects?country=US&bbox=.... Geometry is opt-in and keeps assignment authority, postal-object type, geometry authority, derivation status, confidence and validity separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes USPS geometry, and postal, statistical, administrative, civic, building or parcel objects never become AGID cells.

The ISO US pack does not silently absorb Puerto Rico, Guam, the U.S. Virgin Islands, American Samoa, the Northern Mariana Islands, U.S. Minor Outlying Islands or other separately coded jurisdictions. USPS domestic and APO/FPO/DPO routing scope is kept separate from physical location, sovereignty, administrative containment and AGID jurisdiction.

## Promotion

M2 or later requires exact current USPS products or permitted API observations, explicit delivery-object typing, immutable digests and validity, separately licensed point, route or area geometry, ZCTA/TIGER vintage checks, address and building-link review, jurisdiction review, privacy and licence approval, and reproducible provenance. Real assignments, addresses and production geometry belong in the independent agid-postal-us data repository, not this AGID application repository.
