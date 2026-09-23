# AddressQL Runtime Release Security v1

This release boundary adds four controls above per-adapter Ed25519
attestation:

1. reviewer-key validity, revocation, and rotation;
2. a minimum quorum of two independent reviewer signatures;
3. monotonic release sequence and previous-release digest chaining;
4. a tamper-evident release ledger bound to the exact runtime config bytes.

## Trust Policy

`addressql-trust-store-v2` stores public Ed25519 keys only. Each key has an
active, revoked, or rotated state and an exact validity window. Register at
least two independently controlled reviewer keys:

```bash
npm run register:addressql-reviewer-key -- \
  --trust-store ./trust-store-v2.json \
  --key-id reviewer-a-2026 \
  --reviewer-id reviewer-a \
  --public-key ./reviewer-a.public.pem \
  --valid-from 2026-07-27T00:00:00Z \
  --valid-until 2027-07-27T00:00:00Z \
  --added-at 2026-07-27T00:00:00Z \
  --minimum-signatures 2
```

Each reviewer must have a distinct stable `reviewerId`. Multiple keys owned by
one reviewer count as one reviewer and cannot satisfy quorum. Add a replacement
with the same `--reviewer-id` and `--replaces reviewer-a-2026`. Revoke a
compromised active key with:

```bash
npm run revoke:addressql-reviewer-key -- \
  --trust-store ./trust-store-v2.json \
  --key-id reviewer-a-2026 \
  --revoked-at 2026-09-01T00:00:00Z \
  --reason "Reviewer reported key compromise"
```

Private keys remain with each reviewer and are rejected from trust stores and
signature files. Provision and protect the trust policy as a deployment trust
root; changing that file changes which reviewer identities the runtime trusts.

## Quorum Release

Prepare a canonical payload from an approved runtime config:

```bash
npm run prepare:addressql-runtime-release -- \
  --config ./runtime-config.approved.json \
  --release-id jp-postal-2026-07 \
  --sequence 1 \
  --created-at 2026-07-27T00:00:00Z \
  --valid-from 2026-07-27T00:00:00Z \
  --valid-until 2026-10-27T00:00:00Z \
  --output ./release-1.payload.json
```

At least two reviewers sign the exact payload bytes outside AddressQL.
Finalize the ledger with detached Base64 signatures:

```bash
npm run finalize:addressql-runtime-release -- \
  --config ./runtime-config.approved.json \
  --payload ./release-1.payload.json \
  --trust-store ./trust-store-v2.json \
  --signature reviewer-a-2026=./reviewer-a.sig \
  --signature reviewer-b-2026=./reviewer-b.sig \
  --output ./release-1.ledger.json
```

For sequence 2 and later, pass the prior ledger's `releaseDigest` through
`--previous-release-digest`.

## Runtime Enforcement

```powershell
$env:ADDRESSQL_RUNTIME_CONFIG="runtime-config.approved.json"
$env:ADDRESSQL_TRUST_STORE="trust-store-v2.json"
$env:ADDRESSQL_RELEASE_LEDGER="release-1.ledger.json"
$env:ADDRESSQL_RELEASE_STATE="release-state.json"
npm run serve:addressql-api
```

The state file records the highest accepted sequence and release digest.
Older sequences, sequence reuse with a different digest, sequence gaps, and
incorrect previous digests are rejected before runtime adapters load.

## Security Boundary

The signed digest chain detects config or ledger modification and prevents
accidental or unprivileged rollback when the high-water state is protected by
normal host permissions. A local administrator who can replace the runtime
config, trust policy, ledger, and high-water state together remains outside
this file-only threat model. Strong deployments should protect the state in a
TPM, HSM-backed monotonic store, or equivalent platform service.

The ledger contains source and release metadata only. It contains no postcode
values, raw addresses, recipients, precise coordinates, credentials, or
private keys.
