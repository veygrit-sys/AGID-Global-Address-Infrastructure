# Mexico Postal Context Runtime

Status: M1_metadata. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Evidence flow

SEPOMEX catalog row -> SEPOMEX 2025 state SHP feature -> validated official-source Polygon or MultiPolygon -> structured address context -> explicit building or establishment relation -> AGID crosswalk

Mexico is postal-area-first because SEPOMEX publishes official geographic postcode delimitations by federative entity. The national catalog and the state SHPs are still separate artifacts: a catalog row without a release-pinned matching SHP feature remains non-geometric. Each state resource needs its own 2025 edition, CC BY 4.0 attribution, schema, CRS, resource URL and SHA-256 digest. Multipart codes remain MultiPolygon unless a topology-reviewed dissolve preserves the source meaning.

Unmodified SEPOMEX source geometry may be labelled official-source geometry. Any repair, ring fixing, snapping, dissolve, simplification, quantization, PMTiles conversion or gap model is a separately versioned derived artifact. Mathematical and machine-learning surfaces can prioritize review and compress geometry, but cannot fill unknown coverage or become official through confidence alone.

## Address and building boundary

UPU documents five digits before locality and the federative-entity abbreviation. The 2024 INEGI/SNIEG geographic-address standard supplies structured components. INEGI geographic keys and the 2025 Marco Geoestadístico add federative entity, municipality or territorial demarcation, locality, settlement, road, AGEB and block context. These layers never replace SEPOMEX assignment or postal geometry.

DENUE publishes economic-establishment identifiers, structured address fields and approximate points under INEGI terms. It does not cover every residence or building, and rural points can be locality centroids. Building-level display therefore requires an explicit rights-cleared civic-address relation to a separately permitted building or establishment identifier and geometry. Postal containment, settlement, block, DENUE point, parcel, interpolation and proximity are insufficient.

## API and AGID

The shared runtime exposes country-isolated postcode lookup, coordinate resolution and bbox intersection. Geometry is omitted from postcode lookup unless explicitly requested. Every geometry response carries release, source, quality and authority metadata. AGID is an independent index and never becomes canonical Mexican postal geometry.

## Hugging Face and Cloudflare

Rights-cleared source and derived partitions can be released as versioned Parquet, GeoParquet or PMTiles on Hugging Face. Production readers pin a Hub commit and verify shard digests. Cloudflare Workers can serve metadata and indexed lookups, while R2 stores immutable shards and Durable Objects coordinate release state. A Space remains a demonstration surface, not the authoritative store.

## Synthetic fixture

The bundled 99999 fixture is fabricated, was not checked against live SEPOMEX data and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic official-release-like validation surface, and its building exists solely to test separation among postal, geo-statistical, civic-address, establishment or building and AGID evidence.
