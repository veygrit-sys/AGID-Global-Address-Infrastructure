# Ethiopia Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current Ethiopost assignment rows, real addresses, personal data, production polygons, SSGI/eDAS rows, Ethio-NSDI datasets, land-registry records, parcel features or buildings.

## Evidence flow

`four-digit text -> pinned Ethiopost assignment or branch observation -> official surface or no canonical geometry -> region/zone/woreda/kebele context -> licensed eDAS address -> explicit address-linked building or parcel feature -> ET AGID cell`

The [UPU Ethiopia addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/ethEn.pdf), checked July 2002, places four digits before the locality and describes region, central-office and delivery-office positions. This is dated system context. The current [Ethiopost branch locator](https://ethio.post/branches/) supplies operator branch, region and service observations, while its [delivery form](https://ethio.post/delivery/) exposes sub-city, woreda, house-number and postal-code input fields. Neither interface is treated as a complete bulk assignment release.

## Address, geometry and building gates

SSGI describes eDAS as a national digital-address programme for buildings, parcels, neighbourhoods and physical locations, deployed city by city. The [Ethio-NSDI portal](https://ethionsdi.gov.et/) exposes metadata, maps and OGC service capability, but individual resources may be public or access-controlled. The [Bishoftu address-book publication](https://www.ethionsdi.gov.et/uploaded/documents/Bishoftu_AddressBook.pdf) is city-specific, and the [Addis Ababa land-registration cooperation notice](https://ssgi.gov.et/ssgi-signed-mou-with-addis-ababa-city-land-acquisition-and-registration-agency/) is institutional context rather than a released address-building crosswalk.

No rights-cleared nationwide official postcode polygon release is bundled or identified. Region, zone, woreda and kebele boundaries; branch points; eDAS project extents; NSDI layers; administrative containment; buffers; Voronoi cells; routes; and learned surfaces do not become official postal geometry.

An exact building is returned only when a permitted eDAS or other authoritative artifact supplies a stable explicit address-to-building or parcel relation. Postcode, address text, coordinate containment, polygon overlap, nearest building and model score produce candidates only. The runtime fixture demonstrates this gate with synthetic evidence and cannot be promoted.

## Realtime generation, mathematical models and compression

Realtime lookup can improve freshness for a minimized permitted observation when purpose, terms, selected fields, observed time, source version and request-response digests are retained. Timeout, empty output or blocked access is unknown. A model can normalize, index, detect drift, prioritize review and generate an uncertainty-bearing review surface. Geometry simplification, quantization, PMTiles and bounded-error compression are allowed for permitted data, but modified surfaces remain derived and non-canonical.

## Rights, privacy, Hugging Face and Cloudflare

Public pages, government authorship, map previews and OGC capability do not grant bulk reuse. Exact source ownership, licence, access class, version, CRS, coverage and digests must be pinned. OSM remains in a separate attributed ODbL partition. UPU publication use remains subject to its terms.

Only rights-cleared, versioned Parquet, GeoParquet or PMTiles shards may be stored on Hugging Face, with a pinned Hub commit and verified digests. Cloudflare Workers can serve metadata and permitted indexes, while R2 can hold immutable permitted shards. Restricted address, parcel, household, owner, title, query-log and security-sensitive material remains gated or external. AGID remains an independent spatial index and is never relabelled as canonical Ethiopian postal or administrative geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_ET_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ET_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_ET_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ET_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=ET` or `/api/postal/ET/{postcode}`. Geometry is opt-in and retains official-versus-derived provenance.
