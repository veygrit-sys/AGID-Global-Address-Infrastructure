# Cuba postal context runtime

## Status

This change adds the ISO `CU` contract, strict five-digit normalization, source-policy metadata, an AGID-compatible runtime path, HTTP route coverage and synthetic tests. It does not bundle a real Cuban postcode assignment, address, person, building or production polygon. The future country-data repository is `agid-postal-cu`; AGID remains the consumer and spatial index.

The seed is `M1_metadata`. Its synthetic value `99999` has not been checked against the live operator and must be replaced if it collides before any promotion.

## Evidence boundary

The dated UPU Cuba sheet documents five digits, the `CP` display prefix, postal-zone context, cross streets, `s/n` and P.O. Box layout. Because it is dated 2004, it is syntax and layout evidence, not a current assignment table. Grupo Empresarial Correos de Cuba is the designated operator. A current operator observation or an exactly licensed current UPU POST*CODE release is required for assignment claims.

No public, versioned and reusable nationwide full-code polygon release is asserted here. IDERC, ONEI, GEOCUBA and OSM may provide separately licensed administrative, statistical, cartographic, address or building context, but none becomes postal authority merely through containment or matching text.

The runtime therefore keeps these claims separate:

1. postal assignment observation;
2. typed postal object such as locality, route, P.O. Box or unknown;
3. postal or validation geometry with its own authority and quality;
4. administrative and statistical hierarchy;
5. civic-address point;
6. explicit civic-address-ID to building-ID relation;
7. building geometry;
8. versioned AGID crosswalk.

A postal polygon can raise the display level to postal area or locality. It cannot manufacture a house number, apartment or building. Building display is allowed only when a rights-cleared civic-address identifier has a stable reviewed explicit relation to a permitted building identifier and geometry.

## Runtime and API

Configure the independent pack through:

```text
AGID_POSTAL_CONTEXT_CU_GRAPH_PATH
AGID_POSTAL_CONTEXT_CU_GEOMETRY_PATH
AGID_POSTAL_CONTEXT_CU_EXPECTED_SHA256
AGID_POSTAL_CONTEXT_CU_EXPECTED_RELEASE_ID
```

The shared endpoints accept `countryCode: "CU"`:

- `POST /api/postal/resolve`
- `GET /api/postal/CU/:postcode`
- `GET /api/postal/intersects?countryCode=CU&bbox=...`

Input is NFKC-normalized and whitespace is removed. Exactly five digits are accepted; country prefixes and hyphenated forms are rejected. Geometry remains opt-in and source-labelled.

## Hugging Face deployment

Hugging Face can host and build the country pack with a strict separation of responsibilities:

- Dataset repository `agid-postal-cu`: publish rights-cleared versioned Parquet/GeoParquet shards, manifests, schemas, CRS metadata, source releases, licences and digests. Use configurations or partitions for official observations, reference context, AGID crosswalks and derived review surfaces.
- Dataset Viewer: use `/is-valid`, `/splits`, `/first-rows`, `/rows`, `/filter`, `/parquet`, `/size` and `/statistics` for discovery, previews and shard URLs. It is not the authoritative low-latency production API.
- Job or CI: ingest permitted releases, normalize records, build candidate geometry, check topology and coverage, generalize at explicit tolerances, create spatial indexes, run promotion gates and emit deterministic shards.
- Space: provide a Gradio or Docker demonstration for postcode and coordinate lookup, provenance inspection and reviewer feedback. Keep secrets server-side and do not treat a Space cache as the source of truth.
- AGID production runtime: pin a Hugging Face Hub commit, fetch the approved Parquet/GeoParquet or derived index artifacts, verify SHA-256 digests and serve through the existing AGID API contract. Production can also mirror approved artifacts to Cloudflare R2 for latency while retaining the Hub commit as release provenance.

Large GeoJSON should be an optional interchange artifact, not the primary store. Parquet/GeoParquet reduces repeated text and supports column pruning; PMTiles or another derived spatial index can be emitted for map delivery. Restricted UPU, operator, IDERC, ONEI or GEOCUBA material must stay private, gated or external exactly as its terms require. A public Hugging Face repository must contain only redistributable partitions.

Machine learning or mathematical generation may improve review speed and compression, but it cannot raise authority. Voronoi cells, buffers, concave hulls, road-network partitions, interpolations and learned surfaces stay `derived` with confidence, uncertainty, training or input digest, generated time and model version until compared against permitted evidence and promoted by deterministic checks and review.

## Promotion gates

Before `M2` or production geometry:

- pin an exact source release, licence, coverage, schema, CRS and digest;
- prove redistribution and derived-output rights for every public shard;
- validate current assignments separately from five-digit syntax;
- classify postal objects without forcing polygon geometry;
- validate geometry, topology, overlaps, gaps and temporal validity;
- keep source, derived and AGID geometry distinguishable;
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
