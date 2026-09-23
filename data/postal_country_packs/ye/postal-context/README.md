# `agid-postal-ye` contract seed

Status: `M1 metadata / no production Yemen address or postal-area data`

This seed defines Yemen's Postal Context authority boundary. It contains no
Yemen Post code list, office records, addresses, production geometry, API
receipts, personal data or raw source bodies.

UPU's September 2025 list says Yemen does not require postcodes. Yemen Post's
P.O. box service separately says a subscriber receives a special box number
and a postal code tied to the post office by area. The reviewed pages publish
no exact code values, syntax, assignments, declared coverage or code-to-map
relation. These statements are preserved without forcing them into one claim.

A P.O. box number, office code, office point, placeholder map link,
administrative boundary, route, AGID cell or mathematical region is not an
official postal polygon. Postal code remains nullable until an exact current
operator record establishes a value and semantics.

M2 requires current rights-cleared real data with explicit coverage, edition,
validity, stable source-row identity and SHA-256; a reproducible transform; an
approved immutable artifact; and actual YE loader/API/app verification. A
drawable area additionally requires explicit Polygon/MultiPolygon authority
and deterministic search, fit, translucent fill, outline, clear/re-search and
provenance display. House numbers and buildings require a separate explicit
permitted address-to-building relation.

The existing parent `data/postal_country_packs/ye` Postal Forge pack remains a
synthetic planning resource. It cannot satisfy a real-data M2 gate.
