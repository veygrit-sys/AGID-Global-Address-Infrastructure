# Cambodia postal context runtime

Cambodia is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, official or derived GIS, live Cambodia Post/API responses, real addresses, cadastral or construction records, personal or property data, OSM features, API keys or production geometry. Executable examples use the unverified synthetic value 999999 and synthetic geometry. Collision checks and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The KH normalizer applies NFKC, removes whitespace, preserves leading zeroes and accepts exactly six ASCII digits. It rejects KH prefixes, hyphens, punctuation and wrong lengths.

MPTC Prakas No. 77 was signed and effective on 30 December 2025. Visual review of all 59 pages confirms explicit tabular assignments: PP0000 for province or capital, PPDD00 for municipality, district or khan, and PPDDCC for commune or sangkat. The UPU 11/2018 sheet documents the six-digit province, district or municipality, and commune composition plus urban and rural address elements. Prakas No. 77 controls current assignments; the UPU examples and earlier values remain dated format/history evidence.

Prakas No. 77 calls these postal areas but publishes no coordinate geometry. The NCDD Gazetteer separately exposes Khmer/Latin administrative identities, codes, legal references and GIS through village level. A reviewed join can produce a derived candidate surface, but matching digits, names or containment never makes an NCDD boundary official MPTC postal geometry. Official point, Polygon or MultiPolygon needs an exact competent-authority relation with validity, jurisdiction, CRS, topology, rights and digest pinned. Voronoi, interpolation, roads, routes, OSM, APIs, machine learning and real-time generation stay explicitly derived.

## Civic addresses, buildings, cadastre and privacy

The display hierarchy keeps recipient, organization, building, floor, unit, room, premises/street, village, commune/sangkat, district/khan/municipality, province/capital and postcode as separate fields in Khmer and English/Latin. A postcode or administrative unit narrows context; it cannot infer a house number, entrance, unit, building, resident or delivery entitlement.

Building display requires an exact rights-cleared civic address identity, a stable reviewed relation to a building identifier and separately permitted point or footprint geometry. MLMUPC cadastral, parcel, orthophoto, survey, construction and land services are request-, account- or fee-mediated. A service page, parcel, construction record, coordinate, OSM footprint or proximity is not an open civic-address/building corpus and cannot establish owner, occupant or resident identity.

## Models, API, AGID and time

APIs and mathematical or machine-learning models may compress candidate surfaces, detect conflicts and prioritize review. Preserve input digests, model/features version, observed_at, generated_at, cache TTL, confidence, uncertainty and derived status. A cached response or model output cannot overwrite Prakas assignments, manufacture official polygons or fill unknown coverage.

The shared routes support POST /api/postal/resolve with country code KH, GET /api/postal/KH/{postcode}, and GET /api/postal/intersects?country=KH&bbox=.... Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence and validity separate.

AGID is an independent spatial index connected only by a versioned crosswalk. AGID geometry never becomes MPTC geometry, and postal, administrative, civic, building or parcel objects never become AGID cells.

## Promotion

M2 or later requires exact current typed Prakas artifacts or verified transformations, immutable digests, explicit validity, independently licensed point/area geometry, CRS and topology checks, administrative crosswalk review, civic-address and building-link review, privacy and licence review, and reproducible provenance. Real rows, addresses and production geometry belong in the independent agid-postal-kh data repository, not this AGID application repository.

## M2 source audit

The [2026-08-28 source audit](postal-context-cambodia-m2.md) names the existing
M2 geometry/crosswalk/privacy contract without relaxing any hard blocker.
The full transformed tables remain source observations, not a current validated
release: one district transcription conflict is confirmed against Prakas page 26.
Cambodia Post and the MPTC source remain authoritative in origin but are
metadata-only for the runtime trust gate until a verified release is loaded.
