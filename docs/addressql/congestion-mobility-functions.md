# AddressQL Congestion And Mobility Functions v0.1

Status: research and executable-spec draft

AddressQL can use traffic congestion theory, queueing theory, road-network
analysis, and logistics optimization without becoming a live tracking system.
The goal is to answer operational questions such as:

- Is this address reachable within a delivery window?
- Is the delay caused by distance, congestion, a bridge, a port, a gate, a
  locker queue, or vertical building access?
- Should the system ask for manual review instead of pretending a static
  deliverability flag is enough?

This layer is separate from AMT.  AMT resolves and bounds the address referent.
AddressQL asks database-facing questions over the resolved reference, source
version, road graph, service area, and policy.

## Why Congestion Belongs In AddressQL

Nearest is not the same as fastest.  Two addresses can be one kilometer away
from a depot, but one may require crossing a bridge, waiting at a gated
facility, navigating a crowded station area, or using a ferry connection.

AddressQL should therefore model:

```text
address x road network x congestion x bottleneck x deliverability
```

The output is operational evidence, not a promise.  Every result must carry
source version, time window, mode, confidence, and non-claims.

## Function Set

| function | purpose | determinism | non-claim |
| --- | --- | --- | --- |
| `ADDRESS_TRAVEL_TIME` | estimate travel time between two address/region refs | volatile | not a route, SLA, or delivery guarantee |
| `ADDRESS_CONGESTION_SCORE` | score area-level congestion at a time/mode | volatile | not surveillance or safety classification |
| `ADDRESS_DELIVERY_DIFFICULTY` | score last-mile difficulty for a carrier/service level | volatile | not a blacklist or refusal by itself |
| `ADDRESS_REACHABLE_WITHIN` | test time-window reachability | volatile | not universal physical access |
| `ADDRESS_BOTTLENECKS` | list source-versioned bottleneck candidates | stable_by_source_version | may be incomplete or time-dependent |

## SQL Shapes

```sql
SELECT ADDRESS_TRAVEL_TIME(:depot, :address, '2026-07-02T09:00:00Z', 'drive', :source_version);
SELECT ADDRESS_CONGESTION_SCORE(:region, '2026-07-02T09:00:00Z', 'walk', :source_version);
SELECT ADDRESS_DELIVERY_DIFFICULTY(:address, 'carrier_demo', 'standard', '2026-07-02T09:00:00Z', :source_version);
SELECT ADDRESS_REACHABLE_WITHIN(:depot, :address, 45, '2026-07-02T09:00:00Z', 'drive', :source_version);
SELECT ADDRESS_BOTTLENECKS(:address, 500, 'walk', :source_version);
```

## Traffic Theory Mapping

| traffic idea | AddressQL interpretation | functions |
| --- | --- | --- |
| flow | parcel, courier, vehicle, or pedestrian volume over time | `ADDRESS_TRAVEL_TIME`, `ADDRESS_CONGESTION_SCORE` |
| density | concentration of buildings, parcels, people, or service demand | `ADDRESS_CONGESTION_SCORE`, `ADDRESS_DELIVERY_DIFFICULTY` |
| bottleneck | constrained edge or facility: bridge, gate, rail crossing, port, airport, lobby, locker | `ADDRESS_BOTTLENECKS`, `ADDRESS_TRAVEL_TIME` |
| queueing | waiting time at delivery centers, lockers, reception counters, ports, and gates | `ADDRESS_DELIVERY_DIFFICULTY`, `DELIVERY_ESTIMATE` |
| cellular automata | fallback local jam simulation when live data is unavailable | `ADDRESS_CONGESTION_SCORE`, `ADDRESS_REACHABLE_WITHIN` |
| network theory | graph reachability over roads, ferries, entrances, elevators, and stairs | `ADDRESS_REACHABLE_WITHIN`, `ADDRESS_BOTTLENECKS` |
| optimization | choose minimum-delay or minimum-risk plans, not only shortest distance | `ADDRESS_TRAVEL_TIME`, `DELIVERY_AVAILABLE` |

## Result Shapes

### `TravelTimeEstimate`

```json
{
  "origin_ref": "agid-demo-depot",
  "target_ref": "agid-demo-region",
  "mode": "drive",
  "time_window": "2026-07-02T09:00:00Z/PT1H",
  "estimated_minutes": 34,
  "confidence": 0.72,
  "source_version": "synthetic-congestion-v0.1",
  "non_claims": ["not a route, SLA, or delivery guarantee"]
}
```

### `CongestionScore`

```json
{
  "region_ref": "agid-demo-event-area",
  "mode": "walk",
  "score": 0.81,
  "drivers": ["event_surge", "station_density", "narrow_gate"],
  "source_version": "synthetic-congestion-v0.1",
  "non_claims": ["not surveillance", "not residence proof"]
}
```

### `DeliveryDifficultyScore`

```json
{
  "address_ref": "agid-demo-building",
  "carrier": "carrier_demo",
  "service_level": "standard",
  "score": 0.67,
  "factors": ["tower_lobby_queue", "parking_constraint", "elevator_wait"],
  "non_claims": ["not a blacklist"]
}
```

## Required Fixtures

Public OSS fixtures must be synthetic or openly licensed.  They must not contain
recipient traces, courier traces, private access logs, live customer addresses,
proof witnesses, private keys, or production carrier credentials.

Minimum fixture pack:

1. Synthetic road graph with mode edges.
2. Synthetic event congestion grid.
3. Bridge/gate/rail-crossing bottleneck set.
4. Tower-building vertical access fixture.
5. Port/airport controlled-access fixture.
6. Locker or reception queueing fixture.
7. Distance-vs-delay counterexample.

## Query Planning Rules

### Rule 1. Do not replace deliverability with travel time

Correct:

```text
DELIVERY_AVAILABLE -> ADDRESS_TRAVEL_TIME -> DELIVERY_ESTIMATE
```

Incorrect:

```text
ADDRESS_TRAVEL_TIME -> deliverability=true
```

Travel-time output is not authorization to deliver.

### Rule 2. Prefer bottleneck explanation over opaque score

Correct:

```text
ADDRESS_DELIVERY_DIFFICULTY + ADDRESS_BOTTLENECKS
```

The score should be explainable enough for manual review, carrier override, or
user-facing delivery-window adjustment.

### Rule 3. Treat live or time-contextual results as volatile

`ADDRESS_TRAVEL_TIME`, `ADDRESS_CONGESTION_SCORE`,
`ADDRESS_DELIVERY_DIFFICULTY`, and `ADDRESS_REACHABLE_WITHIN` must not be
materialized as permanent truth.  If cached, the cache key must include time
window, mode, source version, and policy.

## Privacy Boundary

Congestion functions must work at region, cell, facility, or declared address
reference level.  They must not expose:

- individual courier paths;
- recipient movement;
- exact private unit access patterns;
- raw carrier telemetry;
- sensitive facility layouts beyond the declared policy.

## Open Questions

- How coarse should the default congestion cell be for dense urban areas?
- Which bottlenecks are safe to expose publicly and which require policy-gated
  output?
- Should `ADDRESS_DELIVERY_DIFFICULTY` be carrier-specific from v0.2 or remain
  carrier-neutral until enough conformance fixtures exist?
- Can a ZK proof state "reachable within delivery zone" without revealing exact
  address or route?

## Non-Claims

AddressQL congestion functions do not claim:

- exact real-time traffic truth;
- delivery guarantee;
- residence or identity proof;
- safety classification;
- legal access permission;
- surveillance capability;
- complete bottleneck discovery.
