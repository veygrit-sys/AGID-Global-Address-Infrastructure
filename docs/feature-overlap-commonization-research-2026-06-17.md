# Feature Overlap and Commonization Research

Date: 2026-06-17

This note reviews overlapping AGID/AOID features and decides what should be
deduplicated, what should become shared infrastructure, and what should remain
separate even if it looks similar.

## Executive Summary

AGID/AOID now contains many product surfaces: local resolver, registry API,
AddressIntent, Address Element, Address Radar, POS, carrier labels, ZK proof
envelopes, public/private separation, address map quality, federation, cloud DB
adapters, and ocean/logistics control tower concepts. The overlap is real, but
not all overlap is bad.

The highest-value refactor is not to merge the features themselves. It is to
extract the repeated low-level primitives that carry security, privacy, and
interoperability risk:

- stable canonical JSON serialization
- domain-separated commitments and hashes
- public projection and privacy-boundary checks
- status, next-action, and evidence envelope vocabulary
- in-memory registry/store scaffolding
- mode and scope normalization
- provider capability manifests

The features that should remain separate are domain state machines: address
registration, carrier label issuance, POS handoff, ZK proof bundles, consent
envelopes, AGID-S secure sharing, registry anchoring, and delivery reachability
reports. They may share primitives, but their legal meaning, threat models, and
audit requirements differ.

## Current Overlap Hotspots

### 1. Stable Serialization

Many modules define local `stableJson` or `stableStringify` functions. Examples
include address credentials, consent envelopes, DNS records, carrier labels,
quality proofs, region membership proofs, ZK bundle registry, revocation roots,
entity resolution, public/private separation, delivery reachability reports, and
the ocean control tower module.

Risk:

- two modules may hash semantically identical objects differently
- future proof, registry, or QR payloads may become incompatible
- test vectors become harder to maintain

Recommendation:

- create one canonical serializer under `src/lib/protocol/`
- export `stableJson(value)` and `canonicalBytes(value)`
- add test vectors for objects, arrays, nested objects, null, booleans,
  integers, strings, and Unicode
- keep the exact current behavior unless changing it deliberately through a
  versioned migration

### 2. Commitment and Hash Derivation

Commitment logic is repeated with slightly different names and algorithms:
address credential commitments, DNS record commitments, shipping label
commitments, consent commitments, freshness commitments, delivery reachability
commitments, and COSCO-inspired event commitments.

Risk:

- accidental use of plain hash where a salt/domain-separated commitment is
  required
- missing domain separation across delivery, residence, return, aid, and POS
  contexts
- inconsistent audit wording around what is safe to publish

Recommendation:

- introduce `createDomainSeparatedCommitment(input)` with explicit fields:
  `family`, `purpose`, `scope`, `audience`, `version`, `salt`, and `payload`
- require all public commitments to include a domain string
- keep feature-specific algorithm constants, but make them wrappers around the
  same primitive
- add a negative test proving the same payload under two domains produces
  different commitments

### 3. Privacy Boundary Metadata

The same safety flags appear throughout the codebase:

- `rawAddressStored: false`
- `rawAgidStored: false`
- `rawAoidStored: false`
- `rawCoordinatesStored: false`
- `rawProofCodeStored: false`
- `rawPayloadStored: false`

Risk:

- a new feature may forget one of the flags
- a public projection may leak raw AGID/AOID while another module correctly
  redacts it
- tests become repetitive but incomplete

Recommendation:

- create a shared `PrivacyBoundary` type
- create `assertPublicProjectionSafe(record, policy)` for tests and runtime
  checks
- define standard public modes:
  - `commitments-only`
  - `coarse-agid-only`
  - `issuer-status-only`
  - `local-private`
- keep per-feature privacy notes, but make them use the shared vocabulary

### 4. Status and Next Action Workflows

Several modules independently model lifecycle status and next actions:
`AddressIntent`, `CarrierLabelIntent`, POS acceptance, Address Radar,
Address Element sessions, delivery reachability reports, registry operations,
and quality layers.

Risk:

- UI labels and API states drift
- POS, API, and docs disagree on what `requires_review`, `partial`, or
  `rejected` means
- future SDKs have to translate too many similar status values

Recommendation:

- extract a common `WorkflowAssessment` model:
  - `status`
  - `severity`
  - `blocking`
  - `reasons`
  - `nextActions`
  - `evidenceRefs`
- do not force every state machine into one enum
- map domain-specific states into a common assessment layer for UI, API, and
  dashboard display

### 5. Evidence Envelope Shape

Address validation, proof bundles, POS receipts, carrier labels, reachability
reports, and map quality all attach evidence, but they do not share a single
evidence vocabulary.

Risk:

- hard to build a unified audit report
- hard to create OpenAPI schemas without repeating definitions
- harder to enforce "no raw address in public evidence"

Recommendation:

- define `EvidenceEnvelope`:
  - `kind`
  - `source`
  - `sourceTrust`
  - `observedAt`
  - `subjectRef`
  - `commitmentRef`
  - `publicSummary`
  - `privatePayloadStored`
  - `license`
  - `retentionPolicy`
- allow domain-specific evidence extensions
- make audit reports consume the common envelope

### 6. In-Memory Store Implementations

Multiple modules provide `createInMemory...Store` or registry helpers.

Risk:

- different conflict behavior
- different clock/update semantics
- no consistent adapter path to SQLite/Postgres/Redis/Mongo

Recommendation:

- create `createInMemoryEntityStore<T>()` with:
  - `put`
  - `get`
  - `list`
  - `delete`
  - `compareAndSet` when needed
  - deterministic sorting
- define a common adapter interface before adding more store-specific methods
- keep domain wrappers for type safety

## What Should Be Deduplicated

| Area | Action | Priority |
| --- | --- | --- |
| stable JSON/canonical serialization | Extract shared protocol serializer | P0 |
| SHA-256 base64url/hex wrappers | Keep `sha256.ts`, route all new code through it | P0 |
| domain-separated commitment builder | Extract shared primitive with test vectors | P0 |
| privacy/public projection checks | Extract shared guard and test helpers | P0 |
| status-to-next-action summaries | Extract common assessment layer | P1 |
| evidence records | Extract common envelope schema | P1 |
| in-memory stores | Extract generic store, wrap per domain | P1 |
| provider capability metadata | Standardize manifests | P2 |
| OpenAPI repeated schemas | Generate from shared models | P2 |

## What Should Not Be Merged

These features may look similar, but they should remain separate:

| Feature | Why Separation Is Safer |
| --- | --- |
| `AddressIntent` | User-facing address workflow and next-action orchestration |
| `CarrierLabelIntent` | Carrier acceptance, label issuance, handoff, receipt semantics |
| `AddressConsentEnvelope` | Legal consent, scope, expiry, delegation, revocation |
| `ZK Proof Bundle Registry` | Proof compatibility and privacy-linkability analysis |
| `AGID-S Secure Share` | Encrypted AGID QR/NFC envelope and key lifecycle |
| `Address Radar` | Risk scoring and fraud review policy |
| `Address Map Quality Layer` | Geocoding/place/route/address-validation evidence synthesis |
| `Delivery Reachability Report` | Human/drone/carrier reachability observations |
| `Ocean Control Tower` | Vessel, port, customs, demurrage, and maritime exception layer |
| POS terminal modules | Operator UI, device health, printer/cash drawer/scanner flows |

The shared layer should provide primitives, not erase these boundaries.

## Intentional Overlap That Is Healthy

Some overlap is a product strength:

- Local-only mode and server registry mode should share records but keep
  different trust assumptions.
- Address quality and shipping accuracy should overlap but answer different
  questions: "is the address representation good?" versus "can this shipment be
  accepted now?"
- ZK, Ethereum, and non-ZK modes should share proof/registry vocabulary without
  forcing heavy cryptography into every use case.
- POS and API workflows should share the same judgement labels, while keeping
  different UI timing and operator controls.
- AGID, AGID-S, and AOID must stay distinct: public location reference,
  encrypted location envelope, and private address authority record.

## Proposed Shared Module Layout

```text
src/lib/protocol/
  stableJson.ts
  commitment.ts
  domain.ts
  evidenceEnvelope.ts

src/lib/privacy/
  privacyBoundary.ts
  publicProjectionGuard.ts
  redactionPolicy.ts

src/lib/workflow/
  workflowAssessment.ts
  nextAction.ts
  executionMode.ts

src/lib/storage/
  entityStore.ts
  inMemoryEntityStore.ts
  adapterContracts.ts

src/lib/address/
  addressQuality.ts
  addressValidationCore.ts
  addressFormattingCore.ts

src/lib/logistics/
  carrierCore.ts
  labelCore.ts
  handoffCore.ts

src/lib/zk/
  proofDescriptor.ts
  proofEnvelope.ts
  proofCompatibilityCore.ts
```

This layout should be introduced gradually. Existing files do not need to move
immediately. First extract shared primitives, then migrate modules one by one.

## Suggested Migration Order

### Phase 1: No Behavior Change

1. Add shared canonical serializer.
2. Add shared commitment builder.
3. Add shared privacy-boundary types.
4. Add tests proving compatibility with current module outputs.

### Phase 2: Migrate Low-Risk Modules

1. Migrate `addressDnsRecord`.
2. Migrate `addressConsentEnvelope`.
3. Migrate `deliveryReachabilityReport`.
4. Migrate `coscoInspiredOceanControlTower`.

These are good candidates because they use commitment-safe public records and
have focused tests.

### Phase 3: Migrate Proof and Carrier Modules

1. Migrate `qualityThresholdProof`.
2. Migrate `regionMembershipProof`.
3. Migrate `shippingLabelQr`.
4. Migrate `carrierLabelIntent`.

This phase needs stronger regression tests because public proof/QR encodings
may be externally visible.

### Phase 4: Split Large Files

Large-file refactors should come after primitive extraction:

- split `src/lib/agid.ts`
- split `src/lib/openApiSpec.ts`
- split `src/App.tsx`
- split `src/services/GeocodingService.ts`
- split large POS/settings components

## Common API Candidates

```ts
export interface DomainSeparatedCommitmentInput {
  family: string;
  purpose: string;
  scope: string;
  audience?: string;
  version: string;
  salt?: string;
  payload: unknown;
}

export interface PrivacyBoundary {
  publicMode: 'commitments-only' | 'coarse-agid-only' | 'issuer-status-only' | 'local-private';
  rawAddressStored: boolean;
  rawAgidStored: boolean;
  rawAoidStored: boolean;
  rawCoordinatesStored: boolean;
  rawProofsStored?: boolean;
  rawPayloadStored?: boolean;
}

export interface WorkflowAssessment {
  status: 'ok' | 'partial' | 'requires_input' | 'requires_review' | 'rejected' | 'expired';
  severity: 'info' | 'warning' | 'critical';
  blocking: boolean;
  reasons: string[];
  nextActions: string[];
  evidenceRefs: string[];
}

export interface EvidenceEnvelope {
  kind: string;
  source: string;
  sourceTrust: 'official' | 'carrier' | 'issuer' | 'operator' | 'derived' | 'unknown';
  observedAt: string;
  subjectRef: string;
  commitmentRef?: string;
  publicSummary: string;
  privatePayloadStored: boolean;
  license?: string;
  retentionPolicy?: string;
}
```

These are intentionally small. They should stabilize public SDK and OpenAPI
schemas before deeper folder moves.

## Refactor Guardrails

- Do not collapse privacy-sensitive features just because they share fields.
- Do not change public QR, proof, or registry encodings without versioning.
- Preserve domain separation in every commitment/nullifier.
- Add golden test vectors before migrating existing outputs.
- Keep raw address data out of public fixtures.
- Prefer wrapper migration: feature modules call shared primitives but keep
  domain-specific names and docs.
- Move files only after tests cover the import path change.

## Feature Collision Map

| Collision | Decision |
| --- | --- |
| AGID versus AGID-S | Keep separate. AGID is a public location reference; AGID-S is encrypted sharing. |
| AGID-S versus AOID | Keep separate. AGID-S transports a location reference; AOID represents authority, ownership, redaction, and credentials. |
| AddressIntent versus LabelIntent | Share workflow assessment, keep separate state machines. |
| Address Radar versus POS review | Share risk reasons and severity, keep separate UI/queue flows. |
| Address Map Quality versus Address Verification Engine | Share evidence envelope, keep separate scoring policies. |
| ZK proof envelopes versus non-ZK registry modes | Share commitment/nullifier/freshness vocabulary, keep cryptographic mode optional. |
| Cloud DB adapters versus registry API | Share storage contract, keep deployment-specific adapters. |
| Address DNS/Federated Resolver/Registry API | Share record format and resolver result schema, keep trust models separate. |

## Recommended Next Implementation Batch

The next coding batch should be narrow:

1. Add `src/lib/protocol/stableJson.ts`.
2. Add `src/lib/protocol/commitment.ts`.
3. Add `src/lib/privacy/privacyBoundary.ts`.
4. Add tests with golden vectors.
5. Migrate only two modules first: `addressDnsRecord.ts` and
   `deliveryReachabilityReport.ts`.

This reduces real risk without triggering a large, noisy refactor.

## Final Assessment

The current overlap is manageable and expected for a fast-growing protocol
prototype. The dangerous duplication is in primitives that determine hashes,
commitments, privacy projections, and public workflow meanings. The healthy
duplication is in domain workflows that must remain independently auditable.

Therefore the correct strategy is:

1. commonize protocol primitives,
2. commonize privacy and evidence vocabulary,
3. keep domain workflows separate,
4. migrate gradually with golden test vectors.
