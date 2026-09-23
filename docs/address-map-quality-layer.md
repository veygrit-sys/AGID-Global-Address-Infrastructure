# Address Map Quality Layer

This document defines the AGID Address Map Quality Layer: an OSS-oriented
quality model inspired by the separation of Geocoding, Places, Address
Validation, and Routes capabilities in Google Maps Platform documentation.

The implementation is local-first and provider-neutral. It does not require
Google APIs. Google Maps Platform is used here only as a reference for product
boundaries:

- Geocoding converts between addresses, coordinates, and place identifiers.
- Places enriches establishments, geographic locations, and points of interest.
- Address Validation validates, standardizes, completes, and formats address
  components and can return geocode, address precision, and postal data where
  available.
- Routes checks reachability, travel time, distances, vehicle modes, and route
  quality/latency tradeoffs.

In AGID, these ideas become independent evidence layers that can be backed by
open-source data, self-hosted services, official postal datasets, or local
field records.

## Layer Model

`evaluateAddressMapQualityLayer` combines evidence into a single internal
assessment while keeping the raw score hidden from users.

```text
address input
  + geocoding evidence
  + places evidence
  + address validation evidence
  + routes evidence
  + reverse geocoding evidence
  + boundary evidence
  + display quality
        |
        v
AddressMapQualityAssessment
```

The assessment returns:

- `status`: `verified`, `good`, `partial`, `needs-review`, or `unavailable`.
- `decision`: `accept`, `warn`, `review`, or `reject`.
- `deliveryEligibility`: `eligible`, `partial`, `not-eligible`, or `unknown`.
- `boundaryRisk`: `inside`, `near-boundary`, `outside`, or `unknown`.
- `actions`: next checks to run, such as route, boundary, validation, or manual
  review.
- `warnings`: machine-readable quality warnings.
- `internalScore`: for internal ranking only.
- `scoreVisibleToUser: false`: user-facing screens must show decisions, not raw
  numeric scores.

## OSS Provider Mapping

| Google-like capability | AGID evidence layer | OSS / public-friendly backing |
| --- | --- | --- |
| Geocoding | `geocoding` | Nominatim, Pelias, libpostal, OpenAddresses, Overture/OSM-derived data |
| Places | `places` | Overture Places, OpenStreetMap POIs/buildings, local carrier entrances |
| Address Validation | `address-validation` | official postal rules, local format rules, AGID address validation engine |
| Routes | `routes` | OSRM, Valhalla, GraphHopper, local field reachability reports |
| Reverse Geocoding | `reverse-geocoding` | Nominatim/Pelias reverse results, AGID reverse resolver |
| Boundary | `boundary` | Overture/admin boundary polygons, Natural Earth, official GIS boundaries |
| Display Quality | `display` | local formatting, language tab, shipping-label rendering rules |

The layer accepts provider names as evidence metadata, but the score and
decision model is independent of provider identity.

## Boundary and Delivery Rules

Boundary risk is handled separately from generic confidence because borders,
coastlines, islands, ports, polar regions, disputed areas, and maritime zones
can produce correct-looking but operationally unsafe results.

- `inside`: point or AGID cell is inside the asserted boundary and outside the
  warning buffer.
- `near-boundary`: inside but within `borderBufferMeters`; run reverification.
- `outside`: hard review/reject condition.
- `unknown`: run boundary check before strong claims.

Delivery eligibility is also separate:

- `eligible`: validation says deliverable and routing says reachable.
- `partial`: at least one delivery layer is partial.
- `not-eligible`: validation says not deliverable or route says unreachable.
- `unknown`: insufficient evidence.

## Privacy Boundary

The layer is intentionally an internal decision engine:

- Do not expose `internalScore` to users.
- Do not log raw addresses from this layer.
- Do not expose precise coordinates through the public assessment.
- In high-risk mode, use `coarse-decision-only` public output.
- Use commitments or aliases when writing audit logs.

This lets AGID improve address display and delivery confidence without turning
quality scoring into a public reputation or surveillance signal.

## UI Guidance

User-facing screens should show only operational decisions:

- `Address OK`
- `Check Address`
- `Manual Review`
- `Cannot Accept`

The UI may show short reasons such as:

- address validation not run
- route check required
- near boundary
- address not deliverable
- display needs completion

It should not show raw scores, exact confidence percentages, or private source
details unless an operator has explicit audit permission.

## Implementation

Code:

- `src/lib/addressMapQualityLayer.ts`
- `src/lib/addressMapQualityLayer.test.ts`

The current implementation is intentionally side-effect free. API calls,
database reads, route computation, geocoding, and boundary polygon checks should
run outside this module, then pass normalized evidence into the evaluator.

## References

- Google Maps Platform documentation: https://developers.google.com/maps/documentation
- Address Validation API overview: https://developers.google.com/maps/documentation/address-validation/overview
- Geocoding API overview: https://developers.google.com/maps/documentation/geocoding/guides-v3/overview
- Places API overview: https://developers.google.com/maps/documentation/places/web-service/overview
- Routes API: https://developers.google.com/maps/documentation/routes
