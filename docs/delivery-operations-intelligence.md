# Delivery Operations Intelligence

This module adds a local-first operations layer for AGID/AOID delivery and POS workflows. It covers workforce management, route optimization, and performance tracking without storing raw addresses, raw AGIDs, AOIDs, or driver license documents in public operational output.

## Scope

The first implementation is a deterministic scoring baseline, not a black-box AI model. It is intentionally simple, explainable, and safe to run inside a POS, warehouse, field site, or self-hosted server. Later deployments can replace the scoring and travel-time adapters with OSRM, Valhalla, GraphHopper, carrier routing APIs, traffic feeds, or a trained ETA model.

## Workforce Management

`evaluateDriverWorkforce` handles:

- driver registration metadata
- skills such as cold chain, hazmat, high-value, cross-border, drone operator, humanitarian field, POS handoff, and heavy item
- license verification status and expiration
- labor time remaining for the day
- leave windows
- vehicle mode coverage

The license record stores only verification metadata and an optional document commitment. The raw license image or PDF is explicitly outside the module boundary.

## Route Optimization

`optimizeDeliveryRoutes` handles:

- stop assignment by driver skill, vehicle mode, license state, leave state, labor capacity, priority, time windows, and coarse traffic status
- real-time adjustment signals such as heavy traffic, blocked route, and ETA extension
- high-risk mode preferences for drivers with high-risk or humanitarian field eligibility

The output includes redacted stop identifiers, address commitments, AGID tails, ETA, warnings, and route score. It does not expose a full raw address or full AGID.

## Performance Tracking

`summarizeDeliveryPerformance` computes:

- delivery completion rate
- on-time rate
- customer rating average
- a combined KPI score
- per-driver KPI summaries
- recommended operational actions

The KPI score is a transparent weighted score:

```text
0.45 * completion_rate + 0.40 * on_time_rate + 0.15 * rating_score
```

where `rating_score = average_customer_rating / 5`.

## Dashboard Composition

`buildDeliveryOperationsDashboard` composes the workforce, route, and KPI outputs into one snapshot. This is the recommended entry point for POS management screens, admin dashboards, and delivery simulation tools.

## Privacy Boundary

The module returns the same privacy boundary on all outputs:

- `rawAddressStored: false`
- `rawAgidStored: false`
- `rawAoidStored: false`
- `rawDriverLicenseDocumentStored: false`
- `rawPreciseDriverTrajectoryPublic: false`
- `storesOperationalMetadataOnly: true`

This lets AGID support professional operations management without turning driver, recipient, or address data into a surveillance log.
