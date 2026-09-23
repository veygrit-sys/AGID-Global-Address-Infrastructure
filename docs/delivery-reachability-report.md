# Delivery Reachability Report

Delivery Reachability Report is a reporting layer for places that carriers, drone operators, autonomous devices, store staff, municipalities, NGOs, or public users cannot safely deliver to or reach.

The goal is to improve address and route quality without turning reachability reports into a surveillance or abuse tool.

## What It Solves

Some failures are not address-format errors:

- the road is closed;
- a bridge is unavailable;
- the building entrance is blocked;
- a gate or private access condition prevents delivery;
- a drone cannot land or fly in the area;
- the map points to the wrong side of a river, cliff, rail line, or highway;
- a disaster, conflict, weather event, or local restriction changes reachability.

These reports should improve AGID/AOID resolution and POS delivery decisions, but the system must not publicly expose exact homes, vulnerable shelters, private access notes, drone telemetry, or reporter identity.

## Reporter Types

Supported reporter classes:

- carrier;
- drone operator;
- autonomous device;
- public user;
- municipality;
- NGO;
- warehouse;
- merchant.

Verified operators can publish stronger evidence. Public users can contribute, but their reports should be reviewed or aggregated before broad publication.

## Open vs Closed Sharing

### Open by Default

These can usually be shared publicly after validation or aggregation:

- coarse AGID / coarse cell;
- country or region;
- generic problem type, such as road closed or bridge closed;
- severity;
- status: reported, confirmed, disputed, resolved, expired;
- observation time window and TTL;
- confidence band;
- reporter class, not reporter identity;
- redacted evidence class, such as signed report or redacted photo.

### Closed by Default

These must stay private, local, or restricted to verified carriers, municipalities, NGOs, or the tenant:

- raw address;
- AOID;
- precise AGID when it points to a sensitive location;
- AGID-S payload;
- exact coordinates;
- reporter ID;
- device ID;
- terminal ID;
- drone telemetry;
- original photos or videos;
- EXIF metadata;
- gate codes, room numbers, access instructions;
- recipient names and phone numbers;
- private notes;
- reports about unsafe areas, shelters, domestic violence contexts, refugees, conflict zones, or high-risk humanitarian flows.

The code stores these as commitments in the restricted projection. The raw material should live only in local storage or an encrypted vault.

## Publication States

| State | Meaning |
| --- | --- |
| `public` | Safe to display on public map/feed. |
| `aggregated-only` | Show only as an aggregate, not as an individual report. |
| `review-first` | Queue for manual review before sharing. |
| `restricted` | Share only with verified carriers, municipalities/NGOs, or tenant-private systems. |
| `local-only` | Keep on the device or local tenant system. |

## Suggested UI

For operators:

- Report unreachable
- Select reason
- Attach redacted evidence
- Mark temporary/permanent
- Mark high-risk mode
- Submit local / submit to registry

For public map or address display:

- Delivery restriction nearby
- Road/bridge closure
- Weather or seasonal access issue
- Address needs route review

For restricted console:

- precise evidence commitments;
- reporter trust;
- device signature;
- raw evidence vault reference;
- manual review action;
- resolution/dispute workflow.

## Connection to Existing AGID/AOID Features

This report layer feeds:

- Address Validation Pipeline;
- Address Radar;
- Address Review Console;
- POS handoff and reverification reports;
- Address Resolution System;
- AGID Place Record;
- future carrier/drone route adapters.

It should not replace official carrier records or municipal closure notices. It should combine public reports, verified carrier reports, and official notices into a confidence model.

## Implementation

Code:

- `src/lib/deliveryReachabilityReport.ts`

Tests:

- `src/lib/deliveryReachabilityReport.test.ts`

The model creates:

- a public projection for map/feed use;
- a restricted projection with commitments;
- a sharing policy;
- an aggregate feed builder;
- a validation function that checks public projection leakage.
