# Refactoring and SDK Update Research

Date: 2026-06-17

## Executive Summary

The codebase has grown from a map application into an AGID/AOID platform with POS, address resolution, ZK, registry, cloud/database adapters, shipping labels, and papers. The main maintainability risk is not one large file by itself, but duplicated contracts across implementation, SDK generator, OpenAPI, docs, POS flows, and generated SDK packages.

The first refactoring priority is to make AGID core and SDK contracts generated from one source of truth. This update promotes the public AGID security boundary into the SDK generator and TypeScript SDK validation helpers.

## Immediate SDK Update

Implemented now:

- `scripts/generate-agid-sdks.ts` now emits the AGID public security profile into `agid-spec.json`.
- Generated SDK README content now explains the public/private boundary.
- Generated JavaScript/TypeScript SDK scaffolds include:
  - `AGID_SECURITY_PROFILE`
  - `normalizeAgid`
  - `isValidAgid`
  - `validateAgid`
- `sdk/agid-spec/agid-spec.json` now lists the validation API.
- `sdk/agid-js-ts/src/index.ts` now exposes validation helpers backed by the core AGID security utilities.
- `scripts/generate-agid-sdks.test.ts` now fails if the generated spec loses this security and validation API contract.

## Refactoring Priority Map

### P0: Single Source of Truth for AGID

Current issue:

- AGID constants and validation rules exist in `src/lib/agidSecurity.ts`.
- SDK generation previously had a thinner spec object.
- `sdk/agid-spec/agid-spec.json` had richer security information than the generator.

Recommended direction:

- Treat `scripts/generate-agid-sdks.ts` plus `sdk/agid-spec/agid-spec.json` as a generated contract pipeline.
- Move shared constants into a small `src/lib/agidContract.ts` module if generator import boundaries become awkward.
- Add a release check that generated SDK output is up to date.

### P1: Split AGID Core by Responsibility

Current issue:

- `src/lib/agid.ts` combines projection, quantization, region prefix choice, encode/decode, bounds, and compatibility behavior.

Recommended module split:

- `agid/constants.ts`
- `agid/projection.ts`
- `agid/packing.ts`
- `agid/prefix.ts`
- `agid/encode.ts`
- `agid/decode.ts`
- `agid/bounds.ts`
- `agid/index.ts`

Keep the public API stable and re-export from `src/lib/agid.ts` during migration.

### P1: Make SDK Conformance Explicit

Required compatibility gates:

- `encode`
- `decode`
- `cellBounds`
- `normalizeAgid`
- `isValidAgid`
- `validateAgid`
- shared parity vectors
- malformed input vectors
- over-range packed-value vectors
- public/private payload boundary vectors

Recommended next SDK feature:

- Add `invalid-vectors.json` next to `test-vectors.json`.
- Generate validation tests for all SDKs.

### P2: Provider Adapter Boundaries

Current issue:

- Database, cloud, shipping, trade data, and registry providers are expanding quickly.
- Without strict adapter contracts, provider-specific edge cases will leak into UI and core resolver code.

Recommended direction:

- Keep provider adapters as data-only capability descriptors plus small runtime clients.
- Avoid importing heavy provider SDKs in UI bundles.
- Add a provider conformance test shape:
  - discovery metadata
  - credential source
  - offline behavior
  - retention class
  - PII policy
  - failure mode

### P2: POS and Address Resolution State Machines

Current issue:

- POS, shipping label, handoff, QR/NFC, registry, and recipient proof flows are state-heavy.

Recommended direction:

- Model handoff as a state machine:
  - `address_valid`
  - `carrier_scan_ok`
  - `recipient_pending`
  - `handoff_complete`
  - `requires_review`
  - `rejected`
- Model `AddressIntent` as the cross-UI workflow object.
- Keep UI components thin and derive screens from state.

### P3: Documentation Hygiene

Current issue:

- The repository contains many research PDFs, drafts, chapter notes, and design files.

Recommended direction:

- Maintain a generated document index.
- Separate:
  - normative specs
  - implementation design
  - research notes
  - papers
  - evaluation logs
  - deprecated drafts
- Do not publish raw exploratory notes as if they are verified protocol documentation.

## Next Concrete Refactoring Tasks

1. Add AGID invalid test vectors and generate validation tests for each SDK.
2. Extract AGID constants and validation contract into a small shared module.
3. Split `src/lib/agid.ts` behind stable re-exports.
4. Add a generated-SDK freshness check in CI.
5. Introduce `AddressIntent` as the POS/address-registration workflow state.
6. Move provider-heavy integrations behind lazy runtime adapters.
7. Add a document publication allowlist for open-source release.
