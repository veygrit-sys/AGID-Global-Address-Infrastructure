# Guatemala postal context runtime

## Status

This change adds the ISO `GT` contract, strict five-digit normalization, official-source policy metadata, an AGID-compatible runtime path, HTTP route coverage and synthetic tests. It does not bundle a real Guatemalan postcode assignment, address, person, building or production polygon. The independent country-data repository is `agid-postal-gt`; AGID remains the consumer and spatial index.

The seed is `M1_metadata`. Its synthetic value `99999` has not been checked against the live operator and must be replaced if it collides before promotion.

## Evidence boundary

The November 2025 UPU Guatemala sheet documents five digits, the department/distribution-route/delivery-office coding positions and the address layout for municipality or rural locality and premises. Correos de Guatemala publishes official department PDF directories listing assignments for departments, municipalities, Guatemala City zones and named localities. A production ingestion must inventory every department PDF and pin its URL, retrieval time and digest.

Those tables contain assignment labels, not geometry. A complete code may represent an urban zone, municipality, rural locality, routing area or delivery-office context and is not guaranteed to be a polygon. SEGEPLAN, INE, IGN, RIC and OSM may supply separately licensed administrative, statistical, cartographic, cadastral, road, address or building context, but none becomes postal authority through containment or matching text.

The runtime therefore keeps these claims separate:

1. time-bound postal assignment observation;
2. typed postal object such as urban zone, municipality, rural locality, route or delivery office;
3. postal or validation geometry with independent authority and quality;
4. administrative, statistical and settlement hierarchy;
5. rights-cleared civic-address point;
6. explicit civic-address-ID to building-ID relation;
7. permitted building geometry;
8. versioned AGID crosswalk.

A postal polygon can raise display resolution to a postal or locality context. It cannot manufacture a street number, apartment or building. Building display is allowed only when a rights-cleared civic-address identifier has a stable reviewed explicit relation to a permitted building identifier and geometry.

## Runtime and API

Configure the independent pack through:

```text
AGID_POSTAL_CONTEXT_GT_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_GT_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_GT_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_GT_LKG_DESCRIPTOR_DIGEST
```

The shared endpoints accept `countryCode: "GT"`:

- `POST /api/postal/resolve`
- `GET /api/postal/GT/:postcode`
- `GET /api/postal/intersects?countryCode=GT&bbox=...`

Input is NFKC-normalized and whitespace is removed. Exactly five digits are accepted; country prefixes and hyphenated forms are rejected. Geometry remains opt-in and source-labelled.

## Mathematical generation and realtime enrichment

Voronoi cells, buffered points, alpha or concave hulls, street-network partitions, administrative intersections, interpolation and learned surfaces can reduce storage or prioritize review. They stay `derived` with source and model versions, input digest, confidence, uncertainty, generated time and validation metrics. They do not become official merely because they fit known postcode labels.

Realtime operator lookups may validate a candidate when terms permit. Store the service version, request/input digest, observation time and cache policy; never commit credentials or raw restricted responses. A realtime result must not overwrite versioned source evidence or infer a house number, building, occupant or delivery entitlement.

## Hugging Face and AGID

Hugging Face can build and distribute rights-cleared artifacts with separated responsibilities:

- Dataset repository `agid-postal-gt`: versioned Parquet/GeoParquet partitions, manifests, schema, CRS, source releases, licences and digests.
- Job or CI: source ingestion, department-directory inventory, normalization, candidate geometry, topology and coverage checks, generalization, spatial indexing and deterministic release output.
- Dataset Viewer and Space: discovery, preview, provenance inspection and demonstration only; neither is the authoritative production store.
- AGID runtime: pin a Hub commit, verify every shard digest, then serve the existing API contract. Approved artifacts may be mirrored to Cloudflare R2 for latency while retaining Hub commit provenance.

Restricted Correos, UPU, SEGEPLAN, IGN or RIC inputs must remain private, gated or external according to their terms. INE CC BY and OSM ODbL material must retain attribution and separate partitions. Large GeoJSON is optional interchange; Parquet/GeoParquet and a derived spatial index are preferred for storage and queries.

## Promotion gates

Before `M2` or production geometry:

- inventory every official department directory and pin release, retrieval time and SHA-256;
- prove reuse and derived-output rights for every public shard;
- validate current assignments separately from five-digit syntax and administrative prefixes;
- classify postal objects without forcing polygon geometry;
- pin geometry producer, release, CRS, coverage, licence and topology checks;
- keep official, official-derived, derived and AGID geometry distinguishable;
- require explicit address-to-building relations for building display;
- replace any synthetic value that collides with live evidence;
- pin the Hugging Face commit and verify all artifact digests.

The intended flow is:

```text
permitted postal observation
  -> typed postal object
  -> source or reviewed derived geometry
  -> administrative/address context
  -> explicit address-building relation when available
  -> versioned AGID crosswalk
```
