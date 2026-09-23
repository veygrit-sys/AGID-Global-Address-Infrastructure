# Managed ZK Proof Generation Server

This document defines the managed proof-generation surface for AGID/AOID.

The server is a job orchestration boundary. It is not a plaintext witness collection service.

## Goals

- Queue proof-generation or proof-verification jobs for AGID/AOID workflows.
- Support Circom/snarkjs first, while leaving room for Noir, Halo2, RISC Zero, and SP1 workers.
- Keep raw addresses, raw AGID/AOID values, witness bodies, holder secrets, proof codes, and proving keys out of public HTTP payloads.
- Make managed SaaS, self-hosted, municipality, NGO, carrier, and enterprise deployments use the same public job contract.

## API

- `GET /api/zk/managed-proof-server/capabilities`
- `POST /api/zk/managed-proof-server/jobs`

Job requests accept only:

- `publicInputs`
- `commitments`
- `registryRoots`
- `policy`
- `circuit.circuitId`
- `circuit.verifierKeyRef`
- `artifactRefs`

Job requests reject:

- raw address text
- raw AGID
- raw AOID
- witness JSON or witness bytes
- holder secrets
- credential secrets
- nullifier secrets
- proof codes
- proving keys or zkey payloads

## Witness Modes

| Mode | Status | Use |
| --- | --- | --- |
| `client-side-witness` | Recommended | The client or private deployment builds the witness and proof. The server stores public job metadata and can verify/register public outputs. |
| `remote-encrypted-witness` | Restricted | Allowed only as object references with short retention. Managed SaaS requires confidential compute or a private deployment profile. |
| `server-held-witness` | Rejected | The public managed API must not receive or retain plaintext witness material. |

## Deployment Profiles

- `self-hosted`
- `private-municipality`
- `private-ngo`
- `private-carrier`
- `private-enterprise`
- `managed-saas`

High-risk humanitarian, evacuation, residence, or delivery eligibility workflows should prefer private deployment profiles or client-side witness mode.

## Recommended Initial Runtime

Use Circom/snarkjs for the first production-compatible worker because the project already includes Circom/snarkjs tooling and circuit-fixture verification scripts.

The TypeScript server should remain orchestration-only:

1. Validate the public job contract.
2. Reject forbidden private material.
3. Build a stable job id and idempotency key.
4. Dispatch to a separate worker process.
5. Store only commitments, roots, policy hashes, public signals, proof refs, and audit metadata.

## Storage Policy

The job record may store:

- proof family
- backend
- deployment profile
- witness mode
- public inputs
- commitments
- registry roots
- policy hash
- circuit id
- verifier key ref
- proof artifact ref
- job root

The job record must not store:

- raw address
- raw AGID
- raw AOID
- witness
- proof code
- private salts or secrets
- recipient contact fields

## Failure Policy

- Private material in the request returns `400`.
- `server-held-witness` returns `400`.
- `remote-encrypted-witness` on managed SaaS without confidential compute returns `409`.
- `mock-dev` backend is test-only and must not be enabled for production launch checks.

## Relation to Existing Modes

- Mode 0 and Mode 1 can ignore this server.
- Mode 2 can use it as a local/private proof orchestration server without Ethereum.
- Mode 3 does not need it unless proof generation is also enabled.
- Mode 4 can use it to generate or verify proofs before writing public commitments/nullifiers to Ethereum.
