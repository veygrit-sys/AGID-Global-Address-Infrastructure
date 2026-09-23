# Feature Overlap and Commonization Policy

This note records the implemented overlap cleanup for AGID/AOID operational modules.

## What Was Commonized

The following low-level behavior is now centralized in `src/lib/redactedWorkflowCore.ts`:

- deterministic JSON serialization
- stable hash roots
- stable IDs
- domain commitments
- conservative text, number, boolean, and timestamp normalization
- non-empty private-material key checks

These utilities are intentionally small. They do not encode product policy, address rules, carrier rules, locker rules, or ZK semantics. They only make repeated operational modules produce deterministic, redacted, testable outputs.

## Modules Updated

- `Locker System OS`
  - reservation IDs, command commitments, audit hashes, timestamp normalization, and private-material key checks now use the shared core.
- `Address Operations`
  - dashboard, dispute, identity, webhook, and tax/customs helpers now share deterministic JSON and primitive normalization.
- `Address Connect Operations`
  - webhook operations, SLA reports, retention policy checks, and report roots now share deterministic JSON and primitive normalization.
- `Operations`
  - WMS/TMS commitment inputs now use the shared deterministic JSON serializer while preserving existing ID and commitment formats.

## Overlap That Should Remain

Some overlap is intentional because the workflows are different even when their names sound similar.

| Area | Keep Separate | Reason |
| --- | --- | --- |
| POS terminal diagnostics | yes | POS hardware posture differs from locker hardware posture. |
| Shipping label QR | yes | A label is a shipment intent and receipt object, not a locker reservation. |
| Locker System OS | yes | Locker assignment, door state, and compartment health are endpoint operations. |
| Address Notification | yes | Notification templates must stay channel- and event-specific. |
| Address Radar / Signal | yes | Fraud and risk rules should not be mixed into core normalization. |
| ZK proof modules | yes | Circuit/witness semantics must remain explicit and auditable. |
| Ethereum registry modes | yes | Chain metadata and gas constraints are deployment-specific. |

## Rule of Thumb

Commonize:

- deterministic serialization
- hashing and commitment wrappers
- primitive input normalization
- privacy-boundary key checks
- generic status/count helpers

Do not commonize too early:

- business state machines
- proof semantics
- carrier-specific or country-specific address logic
- UI text and screen transitions
- hardware driver packets
- legal/compliance policy decisions

This keeps the project less repetitive without turning distinct workflows into a single opaque framework.
