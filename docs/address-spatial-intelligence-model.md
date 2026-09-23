# Address Spatial Intelligence Model

This module collects the reusable spatial algorithms that make AGID more than a
static address database. It treats addresses, POIs, cells, lockers, delivery
depots, and observations as computational objects that can be clustered,
assigned, routed, snapped, scored, cached, and throttled.

## Covered Algorithms

| Area | Model | AGID Use |
| --- | --- | --- |
| Clustering | k-means, DBSCAN, density clustering | group weak-address settlements, postal-equivalent cells, POI clusters |
| Voronoi | nearest depot/post office/locker assignment | delivery zone generation and postal area design |
| Graph search | shortest route, reachability | route from port/station/depot to handoff cell |
| Map matching | noisy point to road/building/facility candidate | correct GPS observations without storing raw address |
| Anomaly detection | impossible travel, speed anomaly, device mismatch | fraud model for ZK delivery and credentials |
| Trust scoring | source, contributor, community, reachability | reputation model for POI and geography submissions |
| Edge cache | region cache placement and TTL | fast local address data without over-caching sensitive data |
| Congestion | Address Congestion Index | rate limits, queue priority, overload protection |

## Pipeline

```text
address/POI/cell observations
  -> clustering
  -> Voronoi delivery area assignment
  -> graph reachability
  -> map matching
  -> anomaly and reputation scoring
  -> cache/congestion policy
```

This complements the other AGID safety layers:

```text
POI graph             : where can delivery move?
Temporal events       : what is temporarily blocked?
Safe geofence         : what can be public, private, or ZK-only?
Fraud detection       : are device/proof/session signals coherent?
Spatial intelligence  : how should regions be grouped, assigned, routed, cached, and throttled?
```

## Privacy Boundary

The reference model uses:

- public-safe POI IDs
- AGID cells
- coarse point observations
- source confidence and reachability counts
- device ID consistency flags

It does not require:

- raw recipient address strings
- private keys
- ZK proof witnesses
- biometric data

## Address Congestion Index

```text
ACI = f(utilization, queue pressure, latency pressure, cache miss rate)
```

Outputs:

- `normal`
- `busy`
- `congested`
- `overloaded`

When overloaded, AGID can prefer verified requests, throttle low-priority
traffic, or shift hot public regions to edge cache.

## Verification

Executable model:

- `src/lib/addressSpatialIntelligence.ts`

Tests:

- `src/lib/addressSpatialIntelligence.test.ts`

Run:

```bash
npm run verify:spatial-intelligence
```
