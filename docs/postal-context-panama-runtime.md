# Panama Postal Context Runtime

Status: M1_metadata. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, live API responses, real addresses, personal data or production geometry.

## 2026 system and evidence flow

Correos Panama launch evidence -> pinned official API observation -> full estafeta-prefix plus grid code -> observed postal zone, estafeta and PICO cell -> independently versioned administrative hierarchy -> explicit civic-address/building relation -> AGID crosswalk

Correos Panama announced the national geolocated postcode system on 7 May 2026. The official portal currently accepts a full code made from a two-character estafeta prefix plus an eight-character grid and also accepts the eight-character grid alone. AGID canonicalizes full input as `XXXXX-XXXXX` and grid-only input as `XXX-XXXXX`; it never invents a missing estafeta prefix.

The public location and decoder responses can return a full code, postal zone, estafeta, province, district, corregimiento, settlement, barrio and a PICO grid-cell neighborhood. A successful response is a time-bound observation, not a bulk catalogue or a standing redistribution licence. The February 2015 UPU sheet is retained only as pre-system address-layout context.

## Polygon, cell and administrative boundaries

The live response exposes small grid-cell bounds and a postal-zone area scalar. An area number is not a Polygon. No reusable nationwide postal-zone polygon release with confirmed bulk redistribution terms is bundled. A source response cell can be retained only under a pinned contract with request and response digests, time, CRS, terms and privacy controls.

INEC political-administrative codes and the IGN Tommy Guardia 1:25,000 DPA and settlement service stay separate. IGN item metadata applies CC BY-NC-SA and describes a 2025 publication updated through 2024. Province, comarca, district and corregimiento containment can validate context, but cannot create a Correos postal zone or PICO cell. Buffers, Voronoi cells, interpolation, dissolves and learned surfaces remain derived review artifacts.

## Realtime generation, mathematical compression and privacy

The national grid makes deterministic lookup and compact indexing practical: store the full code or grid key, cell level, bounds or a reproducible decoder version instead of repeating high-resolution polygons. Prefix indexes, quantized coordinates, PMTiles and bounded-error simplification can reduce storage further. Promotion still requires a published or permitted algorithm or API contract, reproducible test vectors and full-resolution verification. Reverse engineering a web client does not create redistribution rights.

Realtime calls can improve freshness but must record purpose, normalized query, observed time, response status, terms, rate policy and digests. Coordinates and codes can identify households, so logs and caches are minimized. Timeouts and empty responses remain unknown. Models can flag drift and prioritize review, but cannot invent an estafeta, assignment, zone boundary, premises number, unit, building, person or delivery entitlement.

## Address, building and AGID boundary

Recipient, organization, building, floor, unit, street, premises number, barrio, poblado, corregimiento, district, province or comarca, locality, estafeta, P.O. Box and geolocated code are stored separately. Although the launch describes locating homes and buildings, a code or approximately point-scale cell is not a stable building ID or an explicit address-to-building relation. Building display requires rights-cleared civic-address and building identifiers joined by reviewed evidence.

The shared runtime exposes country-isolated postcode lookup, coordinate resolution and bbox intersection. Geometry is omitted unless explicitly requested and every geometry carries release, source, quality and authority metadata. AGID is an independent index, never canonical Panama postal geometry.

## Hugging Face and Cloudflare

Only rights-cleared, licence-compatible, versioned Parquet, GeoParquet or PMTiles partitions may be published on Hugging Face. Exact attribution, release, jurisdiction, schema, CRS, digests and provenance are mandatory; IGN CC BY-NC-SA and ODbL partitions remain visibly separate. Production readers pin a Hub commit and verify shard digests. Cloudflare Workers may serve metadata and permitted indexed observations, R2 may store immutable shards and Durable Objects may coordinate releases. A Space is demonstration only.

## Synthetic fixture

The bundled `Z9ZZZ-ZZZZZ` fixture is fabricated, was not checked against the official service and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its cell polygon and building exist only to test separation among postal observations, administration, civic addresses, buildings and AGID.
