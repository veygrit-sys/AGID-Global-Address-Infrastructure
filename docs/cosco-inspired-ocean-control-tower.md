# COSCO-Inspired Ocean Control Tower

This module translates public COSCO SHIPPING Lines e-business concepts into an
AGID/AOID-compatible, provider-neutral ocean logistics workflow.

It is not an unofficial COSCO API client. It is an OSS design inspired by the
publicly visible COSCO SHIPPING Lines service categories such as cargo tracking,
booking, rates/tariffs, control tower, sailing schedules, and smart documents.

## Why This Exists

AGID/AOID already supports local address validation, carrier label intents,
handoff receipts, QR/NFC workflows, and delivery reachability reports. Ocean
shipping adds a different operational layer:

- container numbers
- booking numbers
- bill of lading numbers
- vessel and voyage references
- origin and destination ports
- transshipment legs
- customs and terminal holds
- port pickup and final-mile handoff
- smart shipping documents

These should not be mixed directly into normal POS handoff screens. The ocean
leg needs its own control-tower state machine that can later hand off to
`CarrierLabelIntent` for the inland or final-mile delivery step.

## Implemented Model

Code:

- `src/lib/coscoInspiredOceanControlTower.ts`
- `src/lib/coscoInspiredOceanControlTower.test.ts`

The module exports:

- `buildCoscoInspiredOceanControlTower`
- `validateCoscoInspiredOceanControlTower`
- `validateIso6346ContainerNumber`

The control tower supports the following capability labels:

- `cargo-tracking`
- `new-booking`
- `rates-tariffs`
- `control-tower`
- `sailing-schedule`
- `booking`
- `smart-documents`

## State Machine

```text
requires-schedule
  -> requires-booking
  -> docs-required
  -> waiting-departure
  -> in-transit
  -> pickup-ready
  -> final-mile-required
  -> completed
```

Exception states:

- `customs-hold`
- `port-hold`
- `requires-review`

The next action is derived from the state:

- missing schedule -> `search-sailing-schedule`
- missing booking -> `request-booking`
- missing or rejected documents -> `upload-smart-documents`
- customs hold -> `customs-review`
- port hold -> `review-control-tower`
- arrived/discharged and final mile needed -> `create-final-mile-label`
- in transit -> `track-cargo`

## Privacy Boundary

Ocean shipment references are useful but sensitive. The public projection never
contains:

- raw booking number
- raw bill of lading number
- raw container number
- raw tracking number
- precise AGID

Instead, the module stores commitments:

```text
ocean:sha256(domain, field, value)
```

Public output contains only:

- state
- next action
- carrier id
- service code
- coarse port references
- document counts
- container validation counts
- signed/unsigned timeline posture

High-risk shipments use `coarse-state-only`.

## ISO 6346 Container Check

`validateIso6346ContainerNumber` performs a local ISO 6346-style format and
check-digit validation:

```text
owner/equipment prefix + serial + check digit
```

This is not a carrier acceptance proof. It is an input sanity check before a
carrier API, registry, or manual review step.

## AGID/AOID Integration

The ocean control tower should connect to AGID in three places:

1. Port AGID:
   - public coarse AGID for the port or terminal area
   - private precise AGID only in commitments or encrypted operational records

2. Delivery Reachability:
   - `port-hold`
   - `customs-hold`
   - blocked gate
   - terminal access failure
   - inland handoff unavailable

3. Carrier Label Intent:
   - when cargo is discharged or pickup-ready and final-mile delivery is needed,
     the next action becomes `create-final-mile-label`.

## Public vs Closed Data

Open/public:

- coarse origin/destination port code
- status
- next action
- document counts
- signed timeline posture
- route leg count
- transshipment count

Closed/commitment-only:

- container numbers
- booking number
- bill of lading number
- tracking number
- precise AGID
- document references
- carrier receipts

## References

- COSCO SHIPPING Lines E-Business entry point: https://elines.coscoshipping.com/ebusiness/
- COSCO SHIPPING Containers Open API portal: https://cop.lines.coscoshipping.com/
- COSCO SHIPPING North America lists Cargo Tracking & Sailing Schedules as a useful link: https://na.coscoshipping.com/
