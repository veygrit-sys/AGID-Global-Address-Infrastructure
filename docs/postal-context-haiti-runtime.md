# Haiti Postal Context Runtime

Status: M1_metadata. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Evidence flow

Office des Postes observation -> integral HTNNNN assignment -> explicit IHSI/CNIGS crosswalk -> validated derived-review Polygon or MultiPolygon -> structured address context -> explicit building relation -> AGID crosswalk

UPU's September 2017 sheet defines HT plus four digits as the integral postcode even for domestic mail. The digits encode department, arrondissement, commune and delivery area. That hierarchy is useful for validation, but it is not a polygon licence and does not prove that an administrative boundary exactly matches a delivery area.

No reusable nationwide operator polygon release with confirmed redistribution terms is bundled. IHSI's separate six-digit territorial code and CNIGS reference geography stay independent. They can support derived-review geometry only after an explicit postcode crosswalk, resource permission, edition, CRS, digest, topology and ambiguity checks. Centroids, buffers, Voronoi cells, interpolation and ML surfaces never become official through confidence alone.

## Realtime, mathematical generation and compression

Realtime operator lookup can improve freshness for one observation when terms, rate limits, timestamps and response digests are retained. An outage, timeout or empty result remains unknown. Release-pinned observations and permitted context can detect drift, rank gaps and build review surfaces. Geometry simplification, quantization, tiling and learned compression are separate derived artifacts and must preserve source lineage, error bounds and a full-resolution verification path.

## Address and building boundary

Recipient, organization, building, floor, unit, street, house number, neighborhood, communal section or quarter, commune, arrondissement, department, locality, post office, P.O. Box and HTNNNN are stored separately. Building display requires a rights-cleared stable civic-address identifier, a separately permitted building or footprint identifier and an explicit reviewed relation. Postcode or administrative containment, a street number, parcel, point and proximity are insufficient.

## API and AGID

The shared runtime exposes country-isolated postcode lookup, coordinate resolution and bbox intersection. Geometry is omitted unless explicitly requested. Every geometry response carries release, source, quality and authority metadata. AGID is an independent index and never becomes canonical Haitian postal geometry.

## Hugging Face and Cloudflare

Only rights-cleared versioned Parquet, GeoParquet or PMTiles partitions may be published on Hugging Face with exact attribution, release, jurisdiction, schema, CRS, digest and provenance. Production readers pin a Hub commit and verify shard digests. Cloudflare Workers can serve metadata and indexed lookups, R2 can store immutable shards and Durable Objects can coordinate release state. A Space remains a demonstration surface.

## Synthetic fixture

The bundled HT9999 fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon and building exist only to test the separation of postal, administrative, civic-address, building and AGID evidence.
