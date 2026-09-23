# Geographic Temporal Event Model

AGID should not treat address and deliverability data as static. A place can be
deliverable in the morning and restricted in the afternoon because of
congestion, road closures, disasters, weather, security controls, public events,
service outages, or ferry suspension.

This model adds a time-bounded event layer over POI graph deliverability.

## Core Idea

```text
static POI graph
+ target AGID cell
+ active geographic events at time t
= temporal deliverability decision
```

## Event Scope

Events must be coarse and public-safe. They can target:

- country code
- region code
- AGID cell ids
- AGID cell prefixes
- public POI ids
- public graph edge ids

They must not contain:

- raw personal addresses
- recipient records
- precise private coordinates
- private carrier routes
- proof witnesses
- private keys

## Event Kinds

- `congestion`
- `road-closure`
- `ferry-suspended`
- `disaster`
- `public-event`
- `weather`
- `security-restriction`
- `service-outage`
- `manual-review-zone`

## Effects

Events can temporarily:

- increase route travel time
- reduce route reliability
- block edges
- block POIs
- force manual review
- mark delivery as temporarily not deliverable
- reduce confidence

## Decision States

```text
normal
  no active public-safe event affects the route or target cell

congested
  active event increases travel time or lowers reliability but delivery remains allowed

restricted
  event or route degradation makes the result require review

manual-review
  the event explicitly requires operator review

blocked
  the event temporarily makes delivery not deliverable
```

## Temporal Formula

Let `D(G, c)` be POI graph deliverability for target AGID cell `c`.
Let `E_t(c)` be public-safe active events affecting `c` at time `t`.

```text
TemporalDeliverability(G, c, t)
  = D(apply(E_t(c), G), c)
```

The event layer is conservative:

```text
not-deliverable event > manual-review event > route degradation > normal route
```

## Implementation

Reference code:

- `src/lib/geographicTemporalEvents.ts`
- `src/lib/geographicTemporalEvents.test.ts`

Related layers:

- `src/lib/poiDeliverabilityGraph.ts`
- `src/lib/crowdsourcedPoiVerification.ts`
