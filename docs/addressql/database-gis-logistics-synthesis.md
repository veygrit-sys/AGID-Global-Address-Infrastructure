# AddressQL Database/GIS/Logistics Synthesis

Status: research and implementation design draft

AddressQL should absorb the best ideas from database research, GIS, and
logistics research.  The goal is not to imitate every system.  The goal is to
turn address facts into typed, source-versioned, spatial, delivery-aware, and
privacy-bounded query operators.

## Core Thesis

```text
AddressQL =
  database query semantics
  + GIS spatial predicates and topology
  + logistics feasibility and handoff constraints
  + congestion, queueing, and bottleneck-aware mobility models
  + privacy-preserving proof boundaries
```

This makes AddressQL different from ordinary address validation APIs.  It is a
query layer where every result must declare:

- source version;
- determinism;
- result schema;
- confidence or explanation when uncertainty exists;
- privacy boundary;
- non-claims.

## Three Research Pillars

### 1. Database research

AddressQL imports:

- relational algebra and typed operators;
- cost-based query optimization;
- statistics, histograms, and selectivity estimation;
- transaction isolation and source-versioned replay;
- materialized views, indexes, and query rewrite;
- provenance, auditability, and conformance testing.

AddressQL interpretation:

```text
An address function is a typed database operator, not an opaque API call.
```

Consequences:

- `ADDRESS_NORMALIZE` can be materialized only under a declared source version.
- `DELIVERY_ESTIMATE` is volatile and should not be indexed as truth.
- `ADDRESS_MATCH` must expose explanation and purpose, not just true/false.
- adapters must report conformance levels instead of pretending to be identical.

### 2. GIS research

AddressQL imports:

- spatial predicates such as within, contains, intersects, touches, and nearest;
- coordinate reference systems and geodesic distance;
- topology for islands, holes, exclaves, and connected components;
- spatial indexes such as R-tree, GiST, grid, geohash, S2-like cells, and AGID cells;
- map matching, reverse geocoding, and network datasets;
- temporal GIS for events, closures, disasters, and boundary changes.

AddressQL interpretation:

```text
An address is also a spatial and topological reference.
```

Consequences:

- `ADDRESS_WITHIN` must carry region source and boundary uncertainty.
- `ADDRESS_DISTANCE` must declare metric: geodesic, network, walking, driving,
  ferry, or carrier-specific.
- `GEOCODE` and `REVERSE_GEOCODE` return candidates, not verified identity.
- island, exclave, vertical, and disaster cases must be first-class fixtures.

### 3. Logistics research

AddressQL imports:

- vehicle routing, facility location, and assignment problems;
- service areas, time windows, capacity, and SLA constraints;
- hub-and-spoke, locker/PUDO, port, airport, and last-mile handoff models;
- disruption handling for disasters, events, closures, and congestion;
- queueing theory for reception desks, lockers, ports, airports, and gates;
- bottleneck analysis for bridges, rail crossings, narrow streets, lobbies,
  elevators, private roads, and controlled entrances;
- proof of handoff, semantic acknowledgement, and carrier capability negotiation;
- load balancing and delivery-risk scoring.

AddressQL interpretation:

```text
Deliverability is a constrained action, not a static address property.
```

Consequences:

- `DELIVERY_AVAILABLE` is stable only for a declared carrier/source/time policy.
- `DELIVERY_ESTIMATE` is volatile.
- `ADDRESS_ACK` must distinguish parsed, accepted, deliverable, proof verified,
  rejected, expired, revoked, and manual review states.
- carrier capability is part of the query, not an implementation detail.
- shortest distance is not enough; time, congestion, queueing, and bottlenecks
  must be explicit when the question is delivery or reachability.

## Capability Map

| capability | imported wisdom | AddressQL operators |
| --- | --- | --- |
| typed address relations | schemas, constraints, null semantics | `ADDRESS_PARSE`, `ADDRESS_COMPONENT`, `ADDRESS_SCHEMA`, `ADDRESS_NORMALIZE` |
| cost-based address optimizer | selectivity, histograms, predicate pushdown | `ADDRESS_MATCH`, `ADDRESS_SIMILARITY`, `ADDRESS_SCORE`, `POSTAL_LOOKUP`, `ADDRESS_WITHIN` |
| source-versioned transactions | snapshot isolation, temporal tables, provenance | `ADDRESS_SCHEMA`, `ADDRESS_NORMALIZE`, `ADDRESS_MATCH`, `POSTAL_VALIDATE`, `ADDRESS_ACK` |
| spatial predicate kernel | simple features, CRS, geodesic distance, topology | `ADDRESS_WITHIN`, `ADDRESS_DISTANCE`, `GEOCODE`, `REVERSE_GEOCODE` |
| multi-resolution spatial index | R-tree/GiST, grids, coarse-to-fine search | `ADDRESS_WITHIN`, `ADDRESS_DISTANCE`, `POSTAL_LOOKUP`, `ADDRESS_MATCH`, `ADDRESS_COMMIT` |
| network reachability and map matching | road graph, mode edges, ferry/walk/drive reachability | `GEOCODE`, `REVERSE_GEOCODE`, `ADDRESS_DISTANCE`, `ADDRESS_REACHABLE_WITHIN`, `DELIVERY_AVAILABLE`, `DELIVERY_AREA` |
| congestion and mobility kernel | flow, density, queueing, bottlenecks, delay optimization | `ADDRESS_TRAVEL_TIME`, `ADDRESS_CONGESTION_SCORE`, `ADDRESS_DELIVERY_DIFFICULTY`, `ADDRESS_REACHABLE_WITHIN`, `ADDRESS_BOTTLENECKS` |
| delivery service area model | service areas, time windows, temporary events | `DELIVERY_AVAILABLE`, `DELIVERY_AREA`, `DELIVERY_ESTIMATE`, `DELIVERY_RISK_SCORE`, `ADDRESS_CONGESTION_SCORE`, `ADDRESS_ACK` |
| last-mile constraint optimizer | facility location, assignment, capacity, risk routing | `DELIVERY_AVAILABLE`, `DELIVERY_ESTIMATE`, `DELIVERY_RISK_SCORE`, `ADDRESS_TRAVEL_TIME`, `ADDRESS_DELIVERY_DIFFICULTY`, `ADDRESS_WITHIN`, `ADDRESS_POLICY_CHECK` |
| handoff and acknowledgement protocol | state machines, idempotency, receipts | `DELIVERY_TOKEN_CREATE`, `DELIVERY_TOKEN_VERIFY`, `ADDRESS_POLICY_CHECK`, `ADDRESS_ACK`, `ADDRESS_VERIFY_PROOF` |
| privacy-preserving query boundary | commitments, proof policies, retention limits | `ADDRESS_COMMIT`, `ADDRESS_ENVELOPE_CREATE`, `ADDRESS_PROVE`, `ADDRESS_VERIFY_PROOF`, `ADDRESS_POLICY_CHECK`, `ADDRESS_HASH` |

## Query Optimizer Rules

### Rule 1. Postal/admin filter before fuzzy matching

Unsafe plan:

```sql
SELECT *
FROM addresses
WHERE ADDRESS_MATCH(address, :query)->>'match' = 'true';
```

Preferred plan:

```sql
WITH candidates AS (
  SELECT *
  FROM addresses
  WHERE postal_code IN (SELECT code FROM POSTAL_LOOKUP(:postal, :country))
)
SELECT *
FROM candidates
WHERE ADDRESS_MATCH(address, :query, 'delivery', :source_version)->>'match' = 'true';
```

Safe only when:

- postal/admin input is present;
- source version is fixed;
- policy permits coarse location filtering.

Blocked when:

- the country has no postal code or weak postal data and no fallback index;
- aliases or historical names could be wrongly filtered out.

### Rule 2. Coarse-to-fine spatial lookup

Unsafe plan:

```sql
ADDRESS_WITHIN(address, fine_region)
```

over every row.

Preferred plan:

```text
AGID/admin coarse cell filter -> precise polygon containment
```

Safe only when:

- CRS policy is declared;
- boundary uncertainty is represented;
- fine region is source-versioned.

### Rule 3. Materialize stable normalization

Allowed:

```text
ADDRESS_NORMALIZE(raw, country, V_s)
```

may be materialized if the function is `stable_by_source_version` and the
materialized store does not become a raw address leak.

Blocked when:

- source version is omitted;
- the materialized index increases privacy leakage beyond the declared budget.

### Rule 4. Separate serviceability from live estimate

Correct shape:

```text
DELIVERY_AVAILABLE -> stable source-versioned decision
DELIVERY_ESTIMATE  -> volatile annotation
```

Do not use `DELIVERY_ESTIMATE` as the only deliverability decision.

### Rule 5. Policy check before proof generation

Correct shape:

```text
ADDRESS_POLICY_CHECK(envelope, policy, receiver_capability)
  -> ADDRESS_PROVE(envelope, claim, proof_policy)
```

Proof generation without purpose, audience, retention, and max disclosure is
not AddressQL-conformant.

### Rule 6. Prefer delay-aware delivery metrics over geometric distance

Unsafe plan:

```text
ADDRESS_DISTANCE(origin, address, geodesic) -> delivery difficulty
```

Preferred plan:

```text
ADDRESS_BOTTLENECKS(address)
  -> ADDRESS_TRAVEL_TIME(origin, address, time, mode)
  -> ADDRESS_DELIVERY_DIFFICULTY(address, carrier, service_level, time)
```

Safe only when:

- time window is declared;
- travel mode is declared;
- bottleneck source version is fixed;
- non-guarantee is returned.

Blocked when:

- no network or synthetic congestion fixture exists;
- output would expose sensitive facility constraints;
- live mobility data would be required in public tests.

## Result Model

AddressQL results should be typed records:

```json
{
  "result": {},
  "source_version": "source-2026-07",
  "determinism": "stable_by_source_version",
  "confidence": 0.91,
  "explanation": [],
  "privacy_boundary": "not proof of residence",
  "non_claims": []
}
```

For GIS and logistics functions, add:

```json
{
  "crs": "EPSG:4326",
  "metric": "network_drive_time",
  "time_window": "2026-07-02T08:00:00Z/2026-07-02T12:00:00Z",
  "carrier_capability": "standard_parcel",
  "boundary_uncertainty": "medium"
}
```

## Index Architecture

AddressQL should support a hybrid retrieval plan:

```text
CandidateSet =
  PostalIndex
  union AdminIndex
  union SpatialCellIndex
  union AliasGraphIndex
  union LandmarkPoiIndex
  union NetworkReachabilityIndex
  union CommitmentIndex
```

Then:

```text
Score -> Explain -> PolicyCheck -> DeliveryCheck -> Proof/Ack
```

This order is important.  It prevents early overclaiming and keeps privacy
controls close to the query plan.

## Logistics State Model

Delivery is modeled as a state machine:

```text
requested
parsed
candidate_found
policy_checked
service_area_checked
carrier_capability_checked
proof_verified
handoff_authorized
accepted
rejected
manual_review_required
expired
revoked
completed
```

`ADDRESS_ACK` should return one of these states or a compatible semantic ACK
state.  ACK is not proof of residence, ownership, sovereignty, or identity.

## Implementation Targets

### PostgreSQL

Use PostgreSQL for the first full adapter:

- JSONB result records;
- optional PostGIS-backed region operations;
- source-version tables;
- expression indexes for stable functions;
- no indexing of volatile proof or live carrier functions.

### SQLite

Use SQLite for the local/offline adapter:

- local source packs;
- deterministic replay fixtures;
- offline `ADDRESS_ACK`;
- no production network calls;
- proof hooks as stubs or verify-only in early versions.

### NoSQL

Use NoSQL adapters as SDK wrappers:

- precomputed normalized fields;
- stored source version;
- materialized policy-safe indexes;
- conformance tests at the SDK boundary.

## Required New Artifacts

1. `addressql-query-cost.md`
   Cost model for parsing, normalization, matching, spatial containment,
   reachability, delivery decision, and proof verification.

2. `addressql-spatial-kernel.md`
   CRS policy, topology rules, island/exclave cases, polygon containment, and
   boundary uncertainty.

3. `addressql-logistics-kernel.md`
   Service area model, time windows, carrier capability, route/reachability, and
   handoff state machine.

4. `addressql-congestion-mobility-functions.md`
   Flow, density, bottleneck, queueing, reachability, travel-time, and delivery
   difficulty fixtures.

5. `addressql-index-model.md`
   Postal/admin/spatial/alias/landmark/network/commitment multi-index plan with
   leakage budget.

6. `addressql-optimizer-rules.md`
   Safe query rewrite rules and blocked conditions.

## Non-Claims

AddressQL does not claim:

- perfect global address resolution;
- proof of residence from deliverability;
- identity from geocoding;
- route guarantee from distance;
- universal truth from one carrier service area;
- privacy protection from plain address hashes;
- identical behavior across SQL and NoSQL engines without conformance tests.
