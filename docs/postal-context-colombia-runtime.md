# Colombia postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

Colombia is a strong official-polygon candidate. The 4-72/MINTIC viewer links national CSV and Shapefile downloads, and the October 2022 UPU sheet defines the six-digit structure:

```text
postcode = department[2] + postal_zone[2] + district[2]
```

The official viewer also exposes a normal postcode, an expanded postcode and multiple ArcGIS layers. Those objects must stay separate.

For a normal postcode `c`, AGID accepts geometry as an official release only through an artifact gate:

```text
release_feature(c, bytes, digest, update, licence, CRS, topology, validity)
```

Promotion requires all of the following:

1. Exact official Shapefile bytes and a cryptographic digest.
2. Proof that the 4-72/MINTIC open clause applies to the archive.
3. Resolution of the ArcGIS item-level `all rights reserved` notice.
4. Required 4-72/MINTIC attribution and preserved update metadata.
5. Confirmation that the feature belongs to the normal six-digit layer, not an expanded, site, property or parcel layer.
6. Valid six-digit schema, pinned CRS and valid topology.
7. Reviewed country coverage, validity and supersession.

Failure leaves a typed non-geometric postal object or an explicitly derived review surface; it does not create guessed official coverage.

## Source boundaries

- 4-72/MINTIC is assignment and postal-geometry authority for exact, promoted artifacts and pinned time-bound observations.
- The viewer links direct national CSV and Shapefile resources beside an open-data clause that permits reuse and transformation with attribution, update-metadata preservation, non-distortion and personal-data safeguards.
- The CCPP ArcGIS service exposes EPSG:4326 `CodigoPostal`, `CodigoPostalAmpliado`, site-of-interest and property-point layers. Its item metadata says all rights reserved, so the service remains reference-only until that conflict is resolved.
- The UPU October 2022 sheet establishes six digits and the department/zone/district structure.
- UPU S42 v8 separates organization, P.O. box, department, city, neighborhood, thoroughfare, placa, building and apartment fields. Its examples are not production address rows.
- DANE DIVIPOLA/MGN provides versioned administrative and statistical context, not postal authority.
- IGAC and SINIC can provide release-specific cadastral nomenclature, land, construction and construction-unit context under their own coverage, legal exceptions and licence terms.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address and building display

The display chain is:

```text
coordinate
  -> release-pinned six-digit 4-72 polygon
  -> DANE administrative context
  -> rights-cleared civic address or nomenclature ID
  -> explicit reviewed civic-address-ID to construction-ID relation
  -> permitted construction point or footprint
  -> AGID crosswalk
```

A postcode, viewer property point, address string, DANE block, cadastral parcel, coordinate, containment or nearest construction never proves an exact address-to-building relationship. A model may rank candidates for review but cannot create a missing placa, apartment, construction, organization, person or delivery entitlement.

## Runtime and API

The shared API supports Colombia once a digest-pinned runtime pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/CO/{postcode}
GET  /api/postal/intersects?countryCode=CO&bbox=...
```

Configuration is country-isolated:

```text
AGID_POSTAL_CONTEXT_CO_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CO_DESCRIPTOR_DIGEST=
AGID_POSTAL_CONTEXT_CO_LKG_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CO_LKG_DESCRIPTOR_DIGEST=
```

The runtime normalizes full-width digits and spaces, accepts exactly six digits, and never treats syntax as assignment proof.

## Hugging Face and Cloudflare

Hugging Face may host rights-cleared, versioned Parquet/GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Required 4-72 attribution, release update metadata, licence snapshot and derivation provenance travel with every public shard. Restricted addresses, property points, legal-reserve fields, credentials and logs stay gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Polygon shards belong in R2 or another object store with signed manifests; Durable Objects can coordinate release state. Edge simplification or compression must retain a digest-linked canonical source geometry and cannot change evidence class, licence or coverage.

## Synthetic test boundary

The bundled `999999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon and construction exist only to test separation of postal, administrative, civic-address, construction and AGID evidence.
