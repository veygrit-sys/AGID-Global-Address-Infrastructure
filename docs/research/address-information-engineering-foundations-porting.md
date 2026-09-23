# Address Information Engineering Foundations Porting Plan

Status: local porting note for `dawnportinfo-design/address-research`

Date: 2026-07-03

This note explains how to move the executable Address Information Engineering
foundations work from this AGID workspace into
`dawnportinfo-design/address-research` without mixing raw address material,
production credentials, or product-specific AGID implementation details into
the research repository.

## Scope

The portable unit is the foundations contract:

- first-class address information kinds;
- eight safety axioms;
- central operations and their non-claims;
- eight layer contracts;
- standards bridges for ISO 19160, UPU S42 / ISO 19160-4, OGC GeoSPARQL,
  W3C Verifiable Credentials, and W3C DID Core;
- a workflow contract guard for the CI job that runs the foundations registry.

It is not a raw address corpus, production data pack, hosted API, credential
issuer, or proof witness repository.

## File Mapping

| AGID workspace file | address-research target | action |
| --- | --- | --- |
| `docs/research/address-information-engineering-foundations-for-address-research-ja.md` | `docs/foundations/address-information-engineering-foundations.md` | Translate or keep bilingual notes, then link from `SUMMARY.md`. |
| `src/lib/addressInformationEngineeringFoundations.ts` | `src/addressInformationEngineeringFoundations.js` | Port to plain ESM JavaScript to match the current repository style. |
| `src/lib/addressInformationEngineeringFoundations.test.ts` | `tests/addressInformationEngineeringFoundations.test.js` | Port assertions to `node:test` and update import paths. |
| `scripts/verify-address-information-engineering-foundations-workflow.ts` | `scripts/verifyAddressInformationEngineeringFoundationsWorkflow.js` | Port to plain ESM JavaScript if the workflow guard is adopted. |
| `.github/workflows/address-information-engineering-foundations.yml` | `.github/workflows/address-information-engineering-foundations.yml` | Keep Node 22, `npm ci`, read-only permissions, bounded timeout, and path filters. |
| `package.json` script | `package.json` script | Add `verify:address-information-engineering-foundations` and optionally the workflow guard script. |

## Minimal Patch Order

1. Add `src/addressInformationEngineeringFoundations.js`.
2. Add `tests/addressInformationEngineeringFoundations.test.js`.
3. Add `docs/foundations/address-information-engineering-foundations.md`.
4. Update `SUMMARY.md` and `README.md` to link the new foundation.
5. Add `verify:address-information-engineering-foundations` to `package.json`.
6. Run `npm test` and `npm run evaluate`.
7. Add the CI workflow only after the local test is passing.
8. Before a real PR, run the AGID temp-clone preview gate:

```bash
npm run verify:address-research-foundations-port-preview
```

The preview clones `dawnportinfo-design/address-research` into a temporary
directory, generates the JavaScript registry/test/doc port there, updates only
that temporary clone package script, and runs `npm test`, `npm run evaluate`,
and the dedicated foundations gate. It must not push, create a PR,
create/delete a remote repository, or write raw address fixtures.

This order keeps the research repository useful even if the workflow guard is
delayed.

## Acceptance Criteria

The port is complete when:

- `npm test` passes in `address-research`;
- `npm run evaluate` still reports taxonomy coverage and interoperability as
  strengths;
- a dedicated `verify:address-information-engineering-foundations` script
  passes;
- AGID-side `npm run verify:address-research-foundations-port-preview` passes
  against a temporary clone;
- the test proves that expression, referent, identifier, proof, and receipt are
  distinct kinds;
- the test proves that normalization is not referent resolution;
- the test proves that proof does not repair bad address resolution;
- the test proves that standards bridges are compatibility layers, not
  replacement claims;
- all examples remain synthetic, abstract, redacted, or metadata-only.

## Safety Boundary

Do not port:

- raw address examples;
- recipient names, phone numbers, room numbers, or private access notes;
- AOID plaintext;
- AGID-S decrypted payloads;
- production API keys, webhook secrets, private keys, proof witnesses, or proof
  secrets;
- source dumps whose license does not allow redistribution.

The port should use only synthetic labels, abstract regions, metadata-only
source references, and non-reconstructable examples.

## Non-Claims

The port does not claim:

- global address completeness;
- complete country, island, POI, or old-name coverage;
- that ISO 19160, UPU S42, GeoSPARQL, VC, or DID replaces AMT;
- that geocoder output is verified address evidence;
- that postal-code equality proves address identity;
- that ZK proof fixes wrong address resolution;
- that blockchain or DID is mandatory for address information engineering.

## Suggested address-research Test Cases

The first ported test suite should include:

```text
address information engineering foundations validate as a safe registry
foundation keeps expression, referent, identifier, proof, and receipt distinct
central operations preserve non-identity and non-repair boundaries
each layer declares failure states and non-claims
standards bridges are compatibility layers, not replacement claims
foundations document states the raw-address-free safety boundary
```

## Local AGID Verification

Current AGID-side gates:

```bash
npm run verify:address-information-engineering-foundations
npm run verify:address-information-engineering-foundations-workflow
npm run verify:address-research-foundations-port-preview
npm run verify:address-morphism-v2-compatibility
```
