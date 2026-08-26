# Chile postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

CorreosChile says that its seven-digit postcode is address-dependent and identifies an area down to one side of a block. The March 2017 UPU Chile sheet defines:

```text
postcode = postal_distribution_area[3] + sequential_block_face[4]
```

The distribution area is usually a commune. Some localities use a commune fallback when no block-face code exists, while P.O. boxes use the postcode of the post office or agency. Those objects remain separate.

The full code is `address-range-first`, not polygon-first:

```text
operator_observation(address, commune, time) -> typed_postal_object
typed_postal_object + reviewed_road_side_range -> derived_review_geometry
```

Syntax, a prefix, a commune boundary, a road buffer or model confidence cannot create an official assignment or official geometry.

## Source boundaries

- CorreosChile postcode lookup is time-bound assignment evidence when the address and commune are sufficiently specified and the response, observed time and applicable terms are pinned.
- CorreosChile v2 normalization is credentialed. It returns normalized street, municipal number, address remainder, commune and postcode; it is not a reusable address corpus, coordinates, building identity or a polygon release.
- The UPU March 2017 sheet defines the seven-digit structure, placement, commune fallback, post-office and rural no-number cases. Its examples are not production rows.
- IDE Chile DPA 2023 and SUBDERE CUT provide region, province and commune context, not postal assignment.
- INE open geodata and Census 2024 cartography provide statistical blocks, entities and building-related context under dataset-specific methodology and disclosure controls.
- SII digital real-estate maps are tax and cadastral context. Public consultation is not bulk reuse permission; detailed owner-linked records and interoperability are controlled.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address and building display

The display chain is:

```text
coordinate
  -> time-bound CorreosChile block-face or commune-fallback assignment
  -> reviewed road-side range or explicitly derived review surface
  -> IDE/SUBDERE administrative context
  -> rights-cleared civic-address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
```

A postcode, normalized string, census block, SII role, cadastral parcel, coordinate, containment or nearest building never proves an exact address-to-building relationship. A model may rank ranges or buildings for review but cannot create a missing municipal number, floor, apartment, owner, occupant or delivery entitlement.

## Runtime and API

The shared API supports Chile once a digest-pinned runtime pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/CL/{postcode}
GET  /api/postal/intersects?countryCode=CL&bbox=...
```

Configuration is country-isolated:

```text
AGID_POSTAL_CONTEXT_CL_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CL_DESCRIPTOR_DIGEST=
AGID_POSTAL_CONTEXT_CL_LKG_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CL_LKG_DESCRIPTOR_DIGEST=
```

The runtime normalizes full-width digits and spaces, accepts exactly seven digits, and never treats syntax as assignment proof.

## Hugging Face and Cloudflare

Hugging Face may host only rights-cleared, versioned Parquet/GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Credentialed responses, real addresses, SII details, owner-linked data, query logs and restricted records remain gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Geometry shards belong in R2 or another object store with signed manifests; Durable Objects can coordinate release state. Edge buffering, simplification and compression remain derived and cannot change evidence class, rights or coverage.

## Synthetic test boundary

The bundled `9999999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived block-face review surface, and its building exists only to test separation of postal, administrative, civic-address, building and AGID evidence.
