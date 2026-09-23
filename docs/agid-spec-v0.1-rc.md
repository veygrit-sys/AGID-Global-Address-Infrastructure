# AGID Specification v0.1 Release Candidate

Status: Release Candidate
Date: 2026-06-18
Canonical base: `docs/agid-standard.md`

## 1. Scope

AGID v0.1 defines the public, non-personal address and location reference layer.
It is designed to be implemented by SDKs, offline tools, web apps, POS terminals,
GIS workflows, and local resolvers.

AGID v0.1 includes:

- deterministic AGID encode/decode behavior
- public cell and approximate location reference semantics
- 21-bit-per-axis eight-neighbor cell relations
- public `AGID + buildingId` references with private sub-premise separation
- SDK conformance vectors
- public QR/NFC parsing boundaries
- local resolver and address display conformance expectations
- data-license separation for external source packs
- no-raw-address release requirements

AGID v0.1 does not include:

- AOID plaintext
- recipient names
- phone numbers
- room/unit/access details
- proof witnesses or credential secrets
- hosted registry uptime claims
- production-grade ZK claims
- token or cryptocurrency economics

## 2. Public / Private Boundary

AGID is public by design. It can appear in maps, public APIs, SDK vectors, and
public examples when it does not identify private recipients or access details.

AOID is private by design. AOID contents belong to the owner-controlled address
layer and must not be included in public AGID conformance vectors or public data
packs.

AGID-S is an encrypted sharing envelope. It is not a replacement for AOID and
must not be published as a long-lived public sample.

## 3. Required Artifacts

The v0.1 release candidate expects these artifacts:

| Artifact | Required | Purpose |
| --- | --- | --- |
| `docs/agid-standard.md` | yes | Human-readable standard |
| `sdk/agid-spec/agid-spec.json` | yes | Machine-readable core contract |
| `sdk/agid-spec/test-vectors.json` | yes | SDK conformance vectors |
| `docs/agid-address-neighborhood-and-subpremise-v0.1.md` | yes | Neighborhood, building reference, privacy, and synthetic benchmark profile |
| `/api/v1/openapi.json` | recommended | Server/API contract |
| `DATA_LICENSES.md` | yes | Source data license boundary |
| `SECURITY.md` | yes | Vulnerability reporting and safety policy |
| `docs/external-audit-hardening-ja.md` | yes | External audit readiness |
| `docs/funder-brief-en.md` | recommended | Public funding and public-good summary |

## 4. Conformance Levels

### 4.1 Core SDK Conformance

An implementation is core-conformant when it passes shared vectors for:

- `encode`
- `decode`
- `cellBounds`

`cellPolygon` is recommended but not mandatory for v0.1.

`adjacentCells` and `gridNeighborhoodMatch` are implemented neighborhood
extensions. They must reproject across cubed-sphere face boundaries and must
not convert proximity into a building, entrance, route, or delivery proof.

### 4.2 Local Resolver Conformance

A resolver is v0.1 local-resolver-conformant when:

- it can run without Hosted Registry, Ethereum, or ZK
- it supports language-aware address display
- it marks unresolved or partial results instead of inventing certainty
- it does not export raw address material by default
- it preserves data source attribution and license boundaries

### 4.3 Address Element Conformance

An Address Element is v0.1 conformant when:

- it supports postal-code assistance and AGID assistance
- it can return redacted decision state to a host page
- it keeps internal quality scores internal unless a developer mode explicitly requests them
- it does not leak recipient names, phone numbers, proof codes, AOID plaintext, or AGID-S payloads

### 4.4 POS Handoff Conformance

A POS implementation is v0.1 conformant when:

- it supports QR/NFC intake
- it can verify AGID-S expiry and used-state locally or by a registry adapter
- it separates Address OK, Carrier Scan OK, Recipient Pending, and Handoff Complete
- it prints or exports redacted receipts
- it supports offline queue and conflict review
- high-risk mode hides raw address, raw AGID/AOID, phone, proof code, and precise private location

### 4.5 ZK-Ready Conformance

A ZK-ready implementation is not automatically a production-grade ZK system.
It is v0.1 ZK-ready when:

- public signals are allowlisted
- forbidden public signals are rejected
- witness and private inputs are never logged
- nullifiers are domain-separated
- fixture circuits are labeled as fixtures
- production-grade wording is blocked until external cryptography audit status exists

## 5. Release Gates

Before marking v0.1 as released:

```bash
npm run verify:no-raw-address
npm run verify:preaudit-secrets
npm run verify:external-audit
npm run verify:agid-address-matching
npm run benchmark:agid-address-normalization
npm run verify:a11y
npm run lint
```

Required manual gates:

1. Review `SECURITY.md`.
2. Review `DATA_LICENSES.md`.
3. Confirm no public examples contain real private addresses.
4. Confirm no checked-in release artifact contains private keys, API keys, AOID plaintext, AGID-S ciphertext, or proof witnesses.
5. Confirm ZK wording says `ZK-ready` unless the circuit is externally audited.
6. Confirm funding materials do not reposition AGID/AOID as token-first infrastructure.

## 6. Release Candidate Known Limitations

The v0.1 release candidate is not a promise of global address verification parity
with paid commercial APIs. It is a standards and OSS baseline.

Known limitations:

- country/language quality is uneven
- official postal source coverage must continue expanding
- ZK circuits are not production-grade until externally audited
- hosted registry and dashboard need external penetration testing before production claims
- accessibility still needs human screen-reader and keyboard-only review
- data packs must keep third-party licensing and freshness explicit

## 7. Public Claim Labels

Use these labels in docs and README:

| Label | Meaning |
| --- | --- |
| `implemented` | Code and tests exist in this repo |
| `internally-tested` | Local tests pass but no independent review yet |
| `external-reviewed` | Reviewed by an independent party |
| `production-audited` | External audit completed for production use |
| `design-hypothesis` | Design exists; implementation or proof is incomplete |

## 8. Non-Negotiable Safety Rules

- Mode 0 Local Only remains real.
- Hosted Registry is optional.
- Ethereum and ZK are optional verification layers.
- Raw address storage is never required for basic operation.
- High-risk privacy controls are never paid-only.
- Safety fixes are never paid-only.
- Public release artifacts contain only synthetic or redacted examples.

## 9. RC Exit Criteria

This release candidate can become AGID Spec v0.1 when:

- v0.1 artifacts are complete
- no-raw-address and pre-audit secret scans pass
- conformance vectors are documented
- at least one SDK or reference app demonstrates conformance
- `SECURITY.md` and funding paths are ready
- external audit packet is prepared
- known limitations are clearly published
