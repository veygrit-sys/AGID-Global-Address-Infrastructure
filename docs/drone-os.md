# Drone OS

Scope note: Drone OS is not the P2 product scope. For P2 drone operations,
AGID should focus on the Drone Delivery Evidence / Reachability API:
delivery evidence, cannot-reach reports, public/restricted projections, and
operator receipts. This document remains as an advisory research/support
module for mission readiness, not as an autopilot, fleet-control, or flight
authorization system.

Drone OS is the mission-supervision layer for unmanned aircraft operations in
AGID. It is intentionally broader than AGID/AOID: it can use AGID as one
location reference, but it is designed around aircraft readiness, mission
policy, weather, airspace caution, landing-zone risk, corridor checks,
failsafe planning, and audit receipts.

Drone OS does not emit autopilot commands. It is not flight authorization. It
is a safety and operations decision layer that can be used before a human pilot,
field team, or approved flight controller proceeds.

## Design Goals

- Keep drone features useful without turning the public map UI into an
  autopilot control panel.
- Separate aircraft readiness from address or delivery identity.
- Make every mission decision explainable: release to field check, hold, or
  block.
- Support AGID/AOID delivery use cases without requiring them.
- Keep recipient identity, pilot identity, raw address, and exact target
  coordinates out of public audit receipts.
- Prefer advisory, auditable state machines over direct hardware commands.

## Core Components

The implementation lives in `src/lib/droneOs.ts`.

### Aircraft Readiness

`assessDroneOsAircraft` normalizes aircraft telemetry and maintenance state:

- battery percentage and reserve policy;
- payload versus aircraft limit;
- GNSS satellite count;
- horizontal accuracy;
- telemetry/control link status;
- Remote ID broadcasting;
- maintenance due state;
- home/current point when available.

Output status:

- `ready`
- `attention`
- `blocked`

### Mission Policy

`normalizeDroneOsPolicy` defines operational boundaries:

- Remote ID requirement;
- visual line of sight requirement;
- supervised-autonomy permission;
- maximum distance;
- maximum altitude AGL;
- wind and gust limits;
- visibility minimum;
- battery reserve;
- high-risk mode.

High-risk mode tightens distance, wind, battery, and autonomy assumptions.

### Weather Gate

`normalizeDroneOsWeather` checks:

- wind speed;
- gust speed;
- precipitation;
- visibility.

Weather can produce warnings or hard blockers.

### Mission Supervisor

`buildDroneOsMission` combines:

- aircraft readiness;
- mission plan from `buildDroneMissionPlan`;
- optional corridor report from `buildDroneCorridorReport`;
- optional landing assessment;
- optional obstacle/navigation point;
- weather;
- policy.

Decision outcomes:

- `release-to-field-check`: open data and aircraft state show no strong
  blocker, but field/legal confirmation is still required.
- `hold-for-review`: caution signals require manual review.
- `block-mission`: hard blockers exist.

### Failsafe Plan

`chooseDroneOsFailsafe` produces a conservative action:

- `continue-monitoring`
- `abort-before-launch`
- `return-to-home`
- `land-now`
- `hold-position`

These are policy recommendations, not autopilot commands.

### Fleet Snapshot

`buildDroneOsFleetSnapshot` selects the strongest available aircraft for a
mission based on readiness, range, battery, and blockers.

### Audit Receipt

`buildDroneOsAuditReceipt` creates a public-safe receipt:

- mission id;
- aircraft id;
- decision;
- decision reasons;
- mission commitment;
- aircraft commitment;
- target commitment.

It does not include raw coordinates, raw pilot identity, raw recipient identity,
raw address, or autopilot commands.

## Relationship To Existing Drone Modules

Drone OS uses existing AGID drone modules as sensors and evidence:

- `droneAssessment.ts`: landing-zone risk.
- `droneMissionPlan.ts`: distance, bearing, altitude, checklist, route samples.
- `droneCorridor.ts`: route corridor summary.
- `droneNavigation.ts`: obstacle, altitude, and safety evidence.
- `droneMissionPackage.ts`: QR mission package, when a mission must be saved or
  transferred.

Drone OS is the layer above these modules.

## Screens To Build Later

Operator console:

- Aircraft readiness list.
- Mission decision banner.
- Weather and corridor gates.
- Failsafe state.
- Checklist.
- Audit receipt export.

Fleet manager:

- Aircraft health.
- Battery and maintenance status.
- Remote ID status.
- Sensor readiness.
- Firmware version.

Field mode:

- Offline-ready mission brief.
- Hold/block reasons.
- No raw recipient or address display unless explicitly authorized.
- Local audit queue.

## Verification

Current tests cover:

- healthy aircraft release to field check;
- hard blockers from battery, Remote ID, weather, and corridor;
- high-risk mode tightening;
- fleet selection;
- public-safe audit receipt without raw coordinates;
- degraded link review behavior.

Run:

```bash
npx tsx --test src/lib/droneOs.test.ts
npm run lint
```
