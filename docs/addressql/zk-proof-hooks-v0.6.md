# AddressQL ZK Proof Hooks v0.6

Status: proof input schema, verifier hook, and non-claim tests

AddressQL v0.6 does not add real ZK circuits.  It defines the safe interface
that real circuits, verifier services, and proof bundles must satisfy later.
This keeps AddressQL honest: the database layer can prepare proof requests and
verify public verifier receipts, but it must not pretend that a schema check is
cryptographic proof verification.

## Scope

v0.6 adds three things:

```text
1. proof input schema
2. verifier hook contract
3. non-claim tests
```

It deliberately excludes:

```text
real circuits
trusted setup
prover keys
verifier keys
witness generation
production key management
cryptographic audit
```

## Proof Input Schema

The proof input is an envelope-bound object:

```json
{
  "schemaVersion": "addressql-zk-proof-hooks-v0.6",
  "proofFamily": "addressql-zk-ready-v0.6",
  "claim": {
    "kind": "deliverable",
    "purpose": "research_fixture",
    "statement": "addressql:deliverable"
  },
  "envelopeCommitment": "commitment:amt-envelope:synthetic:v0.6",
  "publicSignals": {
    "challengeHash": "hash:challenge:synthetic:v0.6",
    "nullifierHash": "hash:nullifier:delivery:synthetic:v0.6",
    "verifierPolicyHash": "hash:verifier-policy:synthetic:v0.6",
    "sourceVersion": "synthetic-addressql-v0.6",
    "proofExpiry": "2030-01-01T00:00:00Z"
  },
  "roots": {
    "issuerRoot": "root:issuer:synthetic:v0.6",
    "revocationRoot": "root:revocation:synthetic:v0.6",
    "freshnessRoot": "root:freshness:synthetic:v0.6",
    "areaRoot": "root:area:synthetic:v0.6"
  },
  "verifierPolicy": {
    "verifierId": "verifier:synthetic",
    "audience": "audience:addressql-tests",
    "allowedClaims": ["deliverable", "region_membership", "postal_equivalent"],
    "maxDisclosure": "proof_only",
    "requireFreshnessRoot": true,
    "requireRevocationRoot": true
  },
  "proofArtifact": {
    "format": "fixture_proof_bundle",
    "proofCommitment": "commitment:proof-artifact:synthetic:v0.6",
    "publicInputCommitment": "commitment:public-inputs:synthetic:v0.6"
  },
  "nonClaims": [
    "Schema acceptance is not cryptographic proof verification.",
    "Proof verification does not prove address resolution correctness."
  ]
}
```

The schema is intentionally commitment-based.  It does not accept raw address
text, normalized address text, precise coordinates, witness values, private
keys, salts, proof secrets, or raw recipient data as public fields.

`claim.statement` is a canonical token determined by `claim.kind`; it is not
free-form text. Unknown fields at the proof-input root and documented nested
objects are rejected.

## Allowed Public Signals

AddressQL v0.6 allows only these public signal keys:

```text
challengeHash
nullifierHash
verifierPolicyHash
sourceVersion
proofExpiry
```

Roots are public references, not witnesses:

```text
issuerRoot
revocationRoot
freshnessRoot
areaRoot
```

## Claim Families

Initial claim families:

```text
region_membership
postal_equivalent
deliverable
quality_threshold
consent_scope
freshness
not_revoked
```

These are proof statements over an AMT-compatible envelope or AddressQL source
state.  They are not raw address disclosures.

| Claim kind | Canonical statement |
| --- | --- |
| `region_membership` | `addressql:region-membership` |
| `postal_equivalent` | `addressql:postal-equivalent` |
| `deliverable` | `addressql:deliverable` |
| `quality_threshold` | `addressql:quality-threshold` |
| `consent_scope` | `addressql:consent-scope` |
| `freshness` | `addressql:freshness` |
| `not_revoked` | `addressql:not-revoked` |

## Verifier Hook

The verifier hook is a boundary, not a circuit:

```text
AddressQL proof input
        ↓
schema and non-claim validation
        ↓
verifier hook
        ↓
external verifier receipt or schema-only fixture result
```

The schema-only hook may return:

```text
schemaAccepted = true
hookReady = true
verified = false
cryptographicVerification = not_performed
```

An external verifier hook may return:

```text
schemaAccepted = true
hookReady = true
verified = false
cryptographicVerification = external_required
```

`verified` stays false in v0.6 because AddressQL has not performed real
cryptographic verification.  A future v0.7+ integration may accept an audited
external verifier receipt, but that still needs separate circuit-readiness and
audit gates.

## Non-Claim Tests

Every proof hook decision must carry these boundaries:

```text
Schema acceptance is not cryptographic proof verification.
Proof verification does not prove address resolution correctness.
Deliverability is not proof of residence or identity.
Postal-equivalent membership is not an official postal code claim.
No AddressQL v0.6 hook may store witness, private key, raw address, or proof secret material.
```

The test suite must reject:

```text
rawAddressText
normalizedAddress
addressText
street
building
room
recipient
phone
email
latitude / longitude
witness
privateKey
proofSecret
salt
ciphertext
```

## SQL Surface

AddressQL keeps the existing function names:

```sql
ADDRESS_PROVE(envelope, claim, proof_policy) -> AddressProofBundle
ADDRESS_VERIFY_PROOF(proof_bundle, claim, verifier_policy, roots?) -> ProofVerificationDecision
```

In v0.6 these functions are hook-ready, not circuit-complete.  A SQL adapter may
validate schema shape, reject private material, and forward a public-only proof
input to an external verifier.  It must not generate witnesses inside ordinary
database logs or public fixtures.

## Mathematical Model

Let:

```text
E = AMT-compatible envelope commitment
C = claim
P = verifier policy
R = root set
S = public signals
W = private witness
```

The future circuit relation is:

\[
ZKVerify(E, C, P, R, S; W) = 1
\]

AddressQL v0.6 implements only:

\[
SchemaOK(E, C, P, R, S) \land PublicOnly(S) \land NoPrivateMaterial(Input)
\]

Therefore:

\[
SchemaOK \not\Rightarrow ZKVerify
\]

and:

\[
ZKVerify \not\Rightarrow AddressResolutionCorrect
\]

This distinction is the core safety boundary.

## Executable Artifacts

```text
src/lib/addressQlZkProofHooks.ts
src/lib/addressQlZkProofHooks.test.ts
docs/addressql/zk-proof-hooks-v0.6.md
```

## Next Step

The next step is not a full prover.  The next smallest useful step is an
external verifier receipt fixture:

```text
proof input schema
        ↓
external verifier receipt schema
        ↓
AddressQL verifier hook conformance test
```
