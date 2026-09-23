# Drone Delivery Evidence / Reachability API

Last updated: 2026-06-18

This API is the P2 drone scope for AGID. It is not a Drone OS, autopilot,
fleet-control layer, or flight authorization system. It only records and
projects delivery evidence and reachability decisions.

## Purpose

Use this API when a drone operator, carrier, field worker, or autonomous
delivery device needs to report:

- delivery attempted;
- delivery completed;
- delivery cannot reach the target;
- drone landing impossible;
- drone no-fly condition;
- unsafe area;
- weather, terrain, road, bridge, or access constraint.

The API returns:

- a public-safe projection;
- a restricted operator receipt;
- a reachability report;
- confidence and TTL;
- next action for handoff, review, or restricted sharing.

## Endpoints

- `GET /api/drone-delivery-evidence/capabilities`
- `POST /api/drone-delivery-evidence/report`

## Explicit Non-Goals

- No autopilot commands.
- No flight authorization.
- No remote-control link management.
- No raw route publication.
- No raw recipient address storage.
- No raw telemetry publication.

Every receipt guarantees:

```json
{
  "autopilotCommandsEmitted": false,
  "flightControlStateStored": false,
  "rawAddressPublic": false,
  "rawAgidPublic": false,
  "rawAoidPublic": false,
  "rawCoordinatesPublic": false,
  "rawTelemetryPublic": false
}
```

## Public / Restricted Separation

Public projection may include:

- receipt id;
- delivery ref;
- outcome;
- decision;
- report id;
- publication state;
- coarse AGID;
- country / region;
- problem kind;
- evidence classes;
- confidence;
- TTL.

Restricted operator receipt may include commitments to:

- delivery id;
- operator ref;
- mission ref;
- access grant ref;
- signed receipt ref;
- reachability report.

Raw address, exact coordinates, precise telemetry, device id, operator id, and
private notes remain closed or committed.

## Relationship To Drone OS

`src/lib/droneOs.ts` can remain as an advisory readiness module. P2 should not
turn it into the product surface. If mission readiness data is useful, it should
enter this API only as signed or committed evidence, then be projected through
the same public/restricted boundary.

## Verification

Run:

```bash
npx tsx --test src/lib/droneDeliveryEvidenceApi.test.ts src/server/routes/droneDeliveryEvidenceRoutes.test.ts
npm run lint
```
