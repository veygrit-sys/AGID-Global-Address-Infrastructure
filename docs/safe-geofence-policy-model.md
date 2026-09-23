# Safe Geofence Policy Model

Safe geofencing controls how AGID delivery systems behave around sensitive or
temporary-risk places without exposing raw addresses, recipient data, or private
facility boundaries.

## Policy Classes

AGID classifies matched geofences into four public-facing outcomes:

| Status | Meaning |
| --- | --- |
| `deliverable` | Delivery can proceed with normal public-safe metadata. |
| `manual-review` | Delivery may be possible, but a human or trusted carrier policy must review it. |
| `non-public` | Delivery can proceed only with public address/route suppression and carrier-only handling. |
| `zk-proof-only` | Delivery can proceed only if a purpose-bound ZK predicate is verified. |

This lets the system represent dangerous areas, private property, military
facilities, school buffers, disaster zones, public health zones, and temporary
restricted zones without turning them into raw public address disclosures.

## Input Boundary

Allowed:

- coarse AGID cell IDs and prefixes
- public-safe zone IDs
- coarse center/radius geofence hints
- source class and confidence
- time window
- ZK predicate verification state

Disallowed:

- raw address strings
- recipient data
- precise private boundaries
- proof witnesses
- private routes

Unsafe zone definitions are rejected before matching.

## Decision Model

For all valid active zones matching a target cell:

```text
status = most_restrictive(zone.requiredStatus)
disclosure = most_restrictive(zone.disclosureMode)
deliveryAllowed =
  status != zk-proof-only ? status != manual-review : verified_required_zk_predicate
```

Restrictiveness order:

```text
deliverable < manual-review < non-public < zk-proof-only
```

Disclosure order:

```text
public-ok < coarse-only < non-public < proof-only
```

## ZK-Only Geofence

For locations such as sensitive facilities or restricted handoff zones, AGID can
require a predicate such as:

```text
authorized_facility_delivery == true
purpose == delivery
not_revoked == true
freshness <= policy_limit
scope_matches == true
```

The geofence model does not inspect the witness or raw address. It only consumes
the proof verification result and freshness/scope metadata.

## Relationship to Other Layers

```text
POI graph: can this cell be reached?
Temporal events: is this region currently usable?
Fraud detection: are device/proof/session signals coherent?
Safe geofence: what delivery and disclosure policy applies here?
```

The four layers together prevent a common failure: a route may be reachable, but
still unsafe to publish, unsafe to automate, or safe only under a ZK proof.

## Verification

Executable model:

- `src/lib/safeGeofencePolicy.ts`

Tests:

- `src/lib/safeGeofencePolicy.test.ts`

Run:

```bash
npm run verify:safe-geofence
```
