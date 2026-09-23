# Delivery Fraud Detection Model

This model turns location, request, credential, and proof contradictions into a
safe risk decision for AGID delivery flows. It is designed for ZK delivery
proofs and address credentials without using raw addresses, private keys, proof
witnesses, or recipient material.

## Purpose

Delivery fraud detection is not an address resolver. It sits after AMT/AGID
resolution and before delivery approval:

```text
AGID cell / POI graph / delivery session
  -> credential + proof + device signal checks
  -> fraud decision
  -> allow / allow with controls / manual review / block
```

The goal is to catch contradictions that privacy-preserving proofs alone cannot
detect:

- GPS spoofing or mock location use.
- Unnatural movement speed between coarse AGID cells.
- Continuous request bursts against the same device or delivery session.
- Device signature, credential binding, or challenge mismatch.
- ZK proof replay through a reused nullifier.
- Expired, revoked, stale, or untrusted address credentials.

## Input Boundary

Allowed inputs:

- coarse `agidCellId`
- coarse lat/lon samples for speed checks
- location accuracy and provider metadata
- device attestation and sensor-fusion booleans
- already-verified signature status
- challenge/scope match status
- credential lifecycle status
- ZK proof lifecycle and nullifier replay status

Disallowed inputs:

- raw address strings
- recipient identity details
- private keys
- proof witnesses
- biometric templates
- full GPS traces as public output

The implementation returns `privacy.rawAddressUsed = false`,
`privacy.privateKeyMaterialUsed = false`, and `privacy.proofWitnessUsed = false`
by construction.

## Signal Model

Each signal creates a finding:

```text
finding = (kind, severity, score, reason, evidence_refs)
```

Signal kinds:

```text
gps-spoofing
impossible-speed
request-burst
signature-mismatch
device-credential-mismatch
zk-proof-replay
credential-invalid
proof-scope-mismatch
location-policy-mismatch
stale-evidence
```

The score is intentionally conservative. Critical invalid credential, signature
mismatch, and ZK replay findings block delivery approval even if the aggregate
score is below the general block threshold.

## Decision Function

```text
risk_score = clamp(sum(finding.score), 0, 100)

decision =
  block              if critical invalid credential, signature mismatch, or ZK replay
  block              if risk_score >= block_score
  manual-review      if risk_score >= manual_review_score
  allow-with-controls if risk_score >= allow_with_controls_score
  allow              otherwise
```

Default thresholds:

```text
allow-with-controls >= 28
manual-review       >= 55
block               >= 90
```

## Controls

Findings are mapped to operational controls:

| Signal | Control |
| --- | --- |
| `gps-spoofing`, `impossible-speed` | require live device attestation |
| `request-burst` | rate-limit device and session |
| `signature-mismatch`, `device-credential-mismatch` | require device rebind or passkey step-up |
| `zk-proof-replay` | reject nullifier and rotate session |
| `credential-invalid` | check revocation and reissue credential |
| `proof-scope-mismatch` | regenerate purpose-bound proof |
| `stale-evidence` | refresh credential/proof |

## Relation to ZK Delivery Proofs

ZK proves that a hidden address credential satisfies a predicate. Fraud
detection checks whether the surrounding session is coherent.

```text
ZK proof says: this credential satisfies delivery predicate P.
Fraud detection asks: is this proof fresh, session-bound, device-bound, and
consistent with recent coarse movement and request behavior?
```

This distinction matters: a cryptographically valid proof can still be unsafe
if it is replayed, bound to the wrong session, or combined with a compromised
device.

## Relation to POI Graph and Temporal Events

The POI graph answers whether a coarse AGID cell can be reached through nearby
stations, ports, lockers, depots, or handoff points. Temporal events answer
whether a region is currently affected by congestion, closure, disaster, or
service limits.

Fraud detection adds a third layer:

```text
reachable place
+ active regional state
+ coherent device/proof/session signals
= safer delivery approval
```

## Verification

Executable model:

- `src/lib/deliveryFraudDetection.ts`

Tests:

- `src/lib/deliveryFraudDetection.test.ts`

Run:

```bash
npm run verify:delivery-fraud
```
