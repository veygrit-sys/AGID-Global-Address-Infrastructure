# Algeria Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current Algérie Poste rows, real addresses, personal data, production polygons, Ministry of Interior address records, INCT products, cadastral features or buildings.

## Evidence flow

`five-digit text -> pinned Algérie Poste postal-object observation -> official surface or no canonical geometry -> commune/daïra/wilaya context -> explicit civic-address point -> explicit address-linked building -> DZ AGID cell`

Algérie Poste's wilaya-filtered directory exposes named postal establishments, five-digit codes, addresses and hours. Its separate mobile-establishment directory means a code cannot universally be treated as a stable area. The UPU sheet is dated July 2002 and supplies historical five-digit and delivery-area/wilaya semantics only. A current assignment requires an exact permitted, release-pinned operator observation.

## Address, geometry and building gates

Executive Decree No. 19-258 defines a six-line postal address whose final line contains the five-digit postcode and commune. That defines formatting, not reusable address rows. The Ministry of Interior's National Addressing Referential and local-authorities directory establish institutional and administrative context, not a public nationwide row-level address or building dataset.

No rights-cleared nationwide official postcode polygon release is bundled or identified. An official polygon must explicitly link the same code, postal-object type, edition and validity. Commune, daïra and wilaya boundaries; postal-office addresses; mobile routes; INCT topographic or building products; OSM; buffers; Voronoi cells; routing catchments; and learned boundaries do not become official postal geometry.

An exact building label is returned only when separately permitted authoritative building geometry has a stable explicit relation to the exact civic address or delivery point. Postcode, address text, coordinate containment, cadastral overlap, nearest building and model score produce candidates only. The runtime fixture demonstrates this gate with synthetic evidence and cannot be promoted.

## Realtime generation, mathematical models and compression

Realtime lookup can improve freshness for a minimized permitted single observation when purpose, terms, rate policy, selected fields, observed time, source version and request-response digests are retained. Timeout, empty output or blocked access is unknown. A model can normalize, index, detect drift, prioritize review and generate an uncertainty-bearing review surface. Geometry simplification, quantization, PMTiles and bounded-error compression are allowed for permitted data, but all modified surfaces remain derived and non-canonical.

## Rights, privacy, Hugging Face and Cloudflare

Public pages, government authorship and map previews do not grant bulk reuse. INCT states that it commercialises digital geographic information; exact contract and product terms must be pinned. OSM stays in a separate attributed ODbL partition. UPU publication use remains subject to its terms.

Only rights-cleared, versioned Parquet, GeoParquet or PMTiles shards may be placed on Hugging Face, with a pinned Hub commit and verified digests. Cloudflare Workers can serve metadata and permitted indexes, while R2 can hold immutable permitted shards. Commercial, restricted, personal, household, query-log and security-sensitive material remains gated or external. AGID remains an independent spatial index and is never relabelled as canonical Algerian postal or administrative geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_DZ_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_DZ_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_DZ_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_DZ_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=DZ` or `/api/postal/DZ/{postcode}`. Geometry is opt-in and retains official-versus-derived provenance.
