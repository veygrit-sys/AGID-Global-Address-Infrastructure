# POI Graph Deliverability Model

AGID can support weak-address and no-postcode regions by treating public points
of interest as a delivery graph instead of requiring a full street address.

## Core Idea

```text
AGID cell
+ nearest trusted POI
+ route from entry POI
+ handoff policy
= deliverability decision
```

The graph stores public infrastructure and public facility nodes:

- station
- port
- hotel
- school
- hospital
- store
- locker
- delivery depot
- postal office
- landmark

Edges store public routing evidence such as road, ferry, rail, walk, handoff,
or last-mile cell connection. The model never needs raw recipient addresses.

Crowdsourced verification can raise or lower a POI node's trust score without
publishing private evidence. Safe submissions are reduced to source confidence,
community verification state, safe evidence references, and manual-review
signals.

## Decision States

- `deliverable`: a trusted entry POI can reach a trusted handoff POI near the
  target AGID cell within policy limits.
- `manual-review`: the cell is known, but the nearest POI, route reliability,
  or travel time is insufficient.
- `not-deliverable`: the graph is invalid or no usable public evidence exists.

## Minimal Formula

Let:

- `G = (V, E)` be the POI graph.
- `c` be the target AGID cell.
- `p` be a handoff POI near `c`.
- `s` be an entry POI such as a port, station, depot, or postal office.
- `R(s,p)` be a route from `s` to `p`.

Deliverability is allowed when:

```text
exists s, p:
  type(s) in EntryTypes
  type(p) in HandoffTypes
  distance(p, c) <= maxLastMile
  reliability(R(s,p) + p -> c) >= minReliability
  travelTime(R(s,p) + p -> c) <= maxTravelTime
  trust(p) >= minTrustedPoiScore
```

## Why It Matters

Postal codes and street addresses are uneven across the world. A country may
have settlements, ports, schools, clinics, markets, hotels, lockers, and roads
even when formal address data is incomplete. This model lets AGID publish a
privacy-preserving delivery feasibility layer:

```text
public POI graph -> AGID cell -> route evidence -> delivery decision
```

When official geography is weak, community evidence can make a POI usable only
after privacy checks and corroboration:

```text
redacted evidence + coarse location + arrival aggregate
-> source confidence
-> community-verified or manual-review-required
-> POI graph trustScore
```

Deliverability is also time-dependent. Congestion, road closures, disasters,
weather, security restrictions, public events, service outages, and ferry
suspensions can temporarily change the graph:

```text
POI graph + AGID cell + active geographic events at time t
-> temporal deliverability decision
```

## Publication Boundary

Allowed in open-source packs:

- public POI names
- coarse coordinates
- source links
- AGID cell ids
- synthetic fixtures
- public route class and travel-time fixtures

Not allowed:

- raw personal addresses
- recipient records
- room/unit/access-code data
- private precise coordinates
- carrier private operational records
- proof witnesses or private keys

## Implementation

The reference model is implemented in
`src/lib/poiDeliverabilityGraph.ts` with synthetic tests in
`src/lib/poiDeliverabilityGraph.test.ts`.

Crowdsourced POI verification is implemented in
`src/lib/crowdsourcedPoiVerification.ts` with tests in
`src/lib/crowdsourcedPoiVerification.test.ts`.

Geographic temporal events are implemented in
`src/lib/geographicTemporalEvents.ts` with tests in
`src/lib/geographicTemporalEvents.test.ts`.

Fraud detection is a separate approval layer. The POI graph can show that a
place is reachable, and geographic events can show that a region is currently
usable, but delivery approval should still reject contradictory device, request,
credential, or ZK proof signals. That model is documented in
`docs/delivery-fraud-detection-model.md` and implemented in
`src/lib/deliveryFraudDetection.ts`.

Safe geofencing is another separate policy layer. It classifies dangerous areas,
private property, military facilities, school buffers, disaster zones, and other
sensitive regions as `deliverable`, `manual-review`, `non-public`, or
`zk-proof-only`. That model is documented in
`docs/safe-geofence-policy-model.md` and implemented in
`src/lib/safeGeofencePolicy.ts`.

Spatial intelligence provides the reusable algorithmic layer underneath these
decisions: clustering, Voronoi assignment, graph search, map matching, anomaly
detection, reputation scoring, edge cache placement, and Address Congestion
Index. It is documented in `docs/address-spatial-intelligence-model.md` and
implemented in `src/lib/addressSpatialIntelligence.ts`.
