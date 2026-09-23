# Iraq postal context runtime

Iraq is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, live operator responses, real addresses, personal data, app records, StoryMap features, NOGP or IGP data, COSIT data or production geometry. Executable examples use the unverified synthetic value 99999 and synthetic geometry. A collision check and replacement are mandatory before promotion.

## Postal Code -> Geometry -> Address Context

The IQ normalizer accepts exactly five digits after NFKC normalization. It converts Arabic-Indic and Eastern Arabic-Indic digits, preserves zeroes and rejects country prefixes, hyphens, wrong lengths and extended zone-sector candidates.

The UPU Iraq sheet dated 03/2005 places five digits below the locality and labels region, province, delivery type and post-office-number components. A 2004 Iraqi Post and Ministry of Communications announcement documents the scheme origin. Both are dated references, not current assignment releases.

A full code is not necessarily an area. It may identify a post office, delivery type, P.O. Box, business holdout, point or another non-area postal object. The runtime keeps exact current Iraq Post assignment, separately licensed geometry, private delivery records, government context, derived surfaces, explicit civic addresses, buildings and AGID crosswalks independent.

## Unverified 2025 zone-sector proposal

A public ArcGIS StoryMap dated 2025 describes converting five-digit post-office numbers to postal zones using administrative and natural boundaries, then adding a three-character road or street sector. ArcGIS metadata identifies owner fatima_atlasgis and has empty licence and access-information fields. Iraq Post authorship, deployment, exact syntax, coverage and reuse rights are therefore unverified. The model remains separate migration-candidate metadata and is rejected by the five-digit postcode parser.

## Source, rights and privacy boundaries

- Iraq Post is the operator reference, but public service pages and apps are not bulk assignment or redistribution permission.
- Iraq Post privacy policy updated 2025-05-25 treats name, email, phone and permitted location as personal data.
- The UPU 03/2005 sheet establishes dated format semantics only; its real examples and contacts are not copied.
- The 2004 announcement is historical scheme provenance, not a current release.
- NOGP policy aims to enable reuse of exact public government resources subject to data-protection, privacy and information-security restrictions; catalog presence alone is insufficient.
- IGP and COSIT may validate administrative or statistical context only after exact layer rights, authority, jurisdiction, validity, CRS and digest are pinned.
- OSM remains a separate ODbL validation layer.

## Building display gate

A building may be displayed only when a rights-cleared civic-address identifier is explicitly and stably related to a building identifier, and the geometry is separately permitted for that purpose, jurisdiction and time. Postcode, office point, app coordinate, road, administrative boundary, parcel, OSM footprint or proximity is candidate or validation evidence only.

## Territorial and jurisdiction scope

IQ selects a runtime and source contract; it is not a sovereignty, jurisdiction, boundary or universal-coverage claim. Federal, governorate, Kurdistan Region, local and other source authority, jurisdiction, language, validity and licence must remain explicit. No single source is presumed to cover every area or settle boundary status.

## API and AGID

The shared routes support POST /api/postal/resolve with countryCode IQ, GET /api/postal/IQ/{postcode}, and GET /api/postal/intersects?country=IQ&bbox=.... Geometry is opt-in and keeps assignment authority, geometry authority, derivation status, confidence, validity and jurisdiction separate. AGID is an independent spatial index connected only by a versioned crosswalk.

## Promotion

M2 or later requires a current Iraq Post assignment artifact, written rights, immutable digests, explicit postal object types, verified transition status, independently licensed geometry, CRS and topology checks, temporal and jurisdiction coverage, privacy review and reproducible provenance. Real postcode rows, addresses and production geometry belong in the independent agid-postal-iq data repository, not this AGID application repository.
