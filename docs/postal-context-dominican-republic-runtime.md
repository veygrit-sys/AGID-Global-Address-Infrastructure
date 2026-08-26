# Dominican Republic postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

INPOSDOM provides an official search by address, sector or five-digit postcode. The March 2005 UPU sheet records five digits to the left of the locality:

```text
street + number
district
postcode + locality
```

The full code is `postal-area-first`, not automatically polygon-first:

```text
operator_observation(query, time) -> typed_postal_object
typed_postal_object + reviewed rights-cleared area evidence -> derived_review_geometry
```

Syntax, a sector name, a locality, an administrative boundary, a map graphic or model confidence cannot create an official assignment or official polygon.

## Source boundaries

- INPOSDOM search is time-bound assignment evidence when the query, response, observed time, service version and applicable terms are pinned.
- The UPU March 2005 sheet is dated address-format evidence, not a current assignment table or reusable address corpus.
- ONE División Territorial 2021 defines provinces, the National District, municipalities, municipal districts, sections, parajes and barrios as administrative context.
- IDE-RD provides CSW, WMS, WMTS and WFS discovery and access; each producer layer still needs item-level terms, edition, CRS and digest.
- IGN-JJHM base cartography provides official roads, names and geographic context, not postal assignment.
- Registro Inmobiliario parcel services are restricted cadastral context. Its terms do not grant bulk commercial reuse.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address and building display

The display chain is:

```text
coordinate
  -> time-bound INPOSDOM observation
  -> typed postcode, sector or locality object
  -> reviewed derived postal-area surface
  -> ONE / IDE-RD / IGN administrative and cartographic context
  -> rights-cleared civic-address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
```

A postcode, sector, barrio, locality, address string, RI parcel or designation, coordinate, containment or nearest building never proves an exact address-to-building relationship. A model may rank candidates for review but cannot create a missing house number, unit, owner, occupant or delivery entitlement.

## Runtime and API

The shared API supports the Dominican Republic once a digest-pinned runtime pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/DO/{postcode}
GET  /api/postal/intersects?countryCode=DO&bbox=...
```

Configuration is country-isolated:

```text
AGID_POSTAL_CONTEXT_DO_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_DO_DESCRIPTOR_DIGEST=
AGID_POSTAL_CONTEXT_DO_LKG_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_DO_LKG_DESCRIPTOR_DIGEST=
```

The runtime normalizes full-width digits and spaces, accepts exactly five digits, and never treats syntax as assignment proof.

## Hugging Face and Cloudflare

Hugging Face may host only rights-cleared, versioned Parquet or GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Real addresses, INPOSDOM query logs, RI records, owner-linked data and restricted inputs remain gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Geometry shards belong in R2 or another object store with signed manifests; Durable Objects can coordinate release state. Edge simplification and compression remain derived and cannot change evidence class, rights or coverage.

## Synthetic test boundary

The bundled `99999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived postal-area review surface, and its building exists only to test separation of postal, administrative, civic-address, building and AGID evidence.
