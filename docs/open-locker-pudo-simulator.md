# Open Locker/PUDO Simulator

The Open Locker/PUDO Simulator is an OSS reference app for local-first parcel
locker and pick-up/drop-off counter workflows. It is designed for development,
training, demos, and conformance checks before a real locker controller or
commercial fleet operation is connected.

## Scope

The simulator covers:

- Locker reservation and capacity checks.
- PUDO counter handoff decisions.
- QR and NFC reader readiness.
- Recipient proof decisions using commitments only.
- MQTT, HTTP, and Modbus local protocol frame simulation.
- Offline queue and deferred sync behavior.
- Redacted operator receipts and audit events.

The simulator does not control real locker doors, drones, payments, tax flows,
or carrier production systems.

## Route

The reference screen is available at:

```text
/locker
```

## Scenarios

| Scenario | Purpose |
| --- | --- |
| `pickup-success` | Normal reservation, QR/NFC proof, and release path. |
| `full-capacity` | No compatible compartment, then manual PUDO counter handoff. |
| `reader-failure` | QR reader unavailable, release blocked, reader disabled for review. |
| `offline-sync` | Site works locally, queues frames, and syncs later. |
| `high-risk` | Short TTL and stronger NFC/passkey/AOID credential proof. |

## Privacy Boundary

The simulator surfaces only aliases, commitments, health state, protocol
metadata, and audit hashes. It does not store or expose:

- Raw address text.
- Raw AGID.
- Raw AOID.
- Raw waybill payload.
- PINs or proof codes.
- QR/NFC payloads.
- Precise location telemetry.
- Hardware API keys or device secrets.

## Verification

Run:

```bash
npm run verify:open-locker-pudo
```

This checks the Open Locker/PUDO simulator, the shared Locker System OS model,
the local MQTT/HTTP/Modbus simulator, and the route-level UI wiring.
