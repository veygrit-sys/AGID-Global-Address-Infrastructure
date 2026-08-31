# Colombia postal context runtime

Status: `M2_national_derived_visualization`. The runtime now serves all 3,681 current normal six-digit assignments with deterministic derived MultiPolygon display geometry. It contains no raw source dump, real address, building, person, customer, property, cadastral or land-right row.

## Core model

Colombia M2 is verified against the current 2025 official assignment denominator and the fixed official 4-72 Polygon archive. The October 2022 UPU sheet defines the six-digit structure:

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
3. Rights reconciliation across the government catalog, exact archive, viewer open clause and current ArcGIS schema.
4. Required 4-72/MINTIC attribution and preserved update metadata.
5. Confirmation that the feature belongs to the normal six-digit layer, not an expanded, site, property or parcel layer.
6. Valid six-digit schema, pinned CRS and valid topology.
7. Reviewed country coverage, validity and supersession.

Failure leaves a typed non-geometric postal object or an explicitly derived review surface; it does not create guessed official coverage.

## Source boundaries

- 4-72/MINTIC is assignment and postal-geometry authority for exact, promoted artifacts and pinned time-bound observations.
- The viewer links direct national CSV and Shapefile resources beside an open-data clause that permits reuse and transformation with attribution, update-metadata preservation, non-distortion and personal-data safeguards.
- The current Division_Codigo_postal MapServer separates normal `CodigoPostal` and expanded `CodigoPostalAmpliado` layers and declares EPSG:4326. The official government catalog applies CC BY-SA 4.0 and links the exact Shapefile; the viewer open clause permits redistribution and transformation with attribution. The service is used only for schema and live record-count corroboration.
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

The shared API serves Colombia through the digest-pinned M2 runtime pack:

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

## M2 national release

The 2025 assignment dataset has 3,681 current codes and matches the 3,681 valid official Polygon features exactly. GDAL 3.12.1 reproducibly simplifies those features for display; the result is 3,681 MultiPolygons, provenance `derived`, confidence `0.97`, and no invented areas. Search `CO/１１０ ９１１` normalizes to `110911`, returns a real MultiPolygon, fits the map, and renders opacity-0.22 fill with opacity-0.95/width-3 outline. Metadata, clear/re-search and all error states are verified by deterministic integration tests. Browser E2E was not run.

See [the Colombia M2 report](postal-context-colombia-m2.md) and immutable artifact commit [5afa0ae7a01b23615a56a0d578881ce0ff54539a](https://github.com/veygrit-sys/Address-Grid-ID/commit/5afa0ae7a01b23615a56a0d578881ce0ff54539a).

## Synthetic test boundary

The bundled `999999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon and construction exist only to test separation of postal, administrative, civic-address, construction and AGID evidence.
