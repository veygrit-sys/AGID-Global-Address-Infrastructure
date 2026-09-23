# Nicaragua postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

Correos de Nicaragua defines five numeric digits. The first digit is the geopostal region; the following positions identify municipality or Managua quadrant and then an urban barrio or rural comarca. Official search results can also identify a municipality `Código Maestro`.

```text
operator_observation(query, time) -> typed_postal_object
typed barrio_or_comarca + reviewed rights-cleared boundary -> derived_review_geometry
municipality_master / route / post_office / po_box -> non-area object unless separate area evidence exists
```

The full code is therefore `area-or-non-area`, not automatically polygon-first. Syntax, an administrative-code match, a barrio name, a search page, a map graphic or model confidence cannot create an official assignment or official polygon.

## Source boundaries

- Correos de Nicaragua is the current operator reference for five-digit structure and time-bound lookup observations. Public search access is not bulk redistribution permission.
- The UPU May 2014 sheet is dated address-layout evidence, not a current assignment table or reusable address corpus.
- INIDE publishes official department, autonomous-region and municipality context, including the 2023 statistical yearbook.
- INETER exposes national, departmental and municipal WMS/WFS boundaries plus BCN50 base cartography. Each exact service or layer still needs edition, terms, CRS and digest review.
- INETER cadastral IDE terms restrict use and reproduction; it is not a bulk-open parcel or building source.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address and building display

Nicaraguan addresses may use a traditional landmark, direction and distance instead of a conventional street-number pair. The display chain keeps that text separate:

```text
coordinate
  -> time-bound Correos observation
  -> typed barrio/comarca, municipality-master or other postal object
  -> reviewed derived postal-area surface when the object is area-capable
  -> INIDE / INETER administrative and cartographic context
  -> rights-cleared stable civic-address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
```

A postcode, directional reference, landmark, barrio, comarca, administrative boundary, parcel, coordinate, interpolation, containment or nearest building never proves an exact address-to-building relationship. A model may rank candidates for review but cannot invent a missing house number, unit, owner, occupant or delivery entitlement.

## Runtime and API

The shared API supports Nicaragua once a digest-pinned runtime pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/NI/{postcode}
GET  /api/postal/intersects?countryCode=NI&bbox=...
```

Configuration is country-isolated:

```text
AGID_POSTAL_CONTEXT_NI_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_NI_DESCRIPTOR_DIGEST=
AGID_POSTAL_CONTEXT_NI_LKG_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_NI_LKG_DESCRIPTOR_DIGEST=
```

The runtime normalizes full-width digits and spaces, accepts exactly five digits, and never treats syntax as assignment proof.

## Hugging Face and Cloudflare

Hugging Face may host only rights-cleared, versioned Parquet or GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Real addresses, operator query logs, directional references, cadastral records, owner-linked data and restricted inputs remain gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Geometry shards belong in R2 or another object store with signed manifests; Durable Objects can coordinate release state. Edge simplification and compression remain derived and cannot change evidence class, rights or coverage.

## Synthetic test boundary

The bundled `99999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived postal-area review surface, and its building exists only to test separation of postal, administrative, civic-address, building and AGID evidence.
