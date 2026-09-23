# ZK Address Theorem - evaluation and verification

Source PDF: `C:/Users/kitau/Downloads/ZK_Address_Theorem（住所零知識証明定理）.pdf`

## Verdict

The ZK Address Theorem is one of the strongest AMT extensions.  It gives a
clear bridge between address reference classes, AGID/AOID/PID layering,
credentials, selective disclosure, and privacy-preserving eligibility checks.

Recommended score:

| Axis | Score | Reason |
| --- | ---: | --- |
| Conceptual value | 9.5 / 10 | It turns addresses from disclosed strings into private witnesses for public predicates. |
| Mathematical precision in the current PDF | 8.0 / 10 | The PDF already states the needed cryptographic conditions, but the theorem should be explicitly conditional. |
| Implementation fit | 9.0 / 10 | Current code already covers proof envelopes, predicates, credentials, freshness, revocation, nullifiers, identity binding, and bundle compatibility. |
| Cryptographic completeness today | 6.5 / 10 | The current implementation verifies proof-envelope logic, not full SNARK/STARK/zkVM circuits. |
| Paper readiness after revision | 9.0 / 10 | Strong if it separates AMT theorem, privacy lemma, credential gate, and cryptographic circuit assumption. |

## What was verified

| Claim | Verification result | Evidence |
| --- | --- | --- |
| A public predicate can hide the exact address if multiple private addresses share the same public claim. | Formally verified. | `predicate_proof_collision_hides_private_value` in `formal/AMTCore.lean`. |
| If the public predicate is injective or too narrow, it can identify the private address. | Formally verified as a counter-warning. | `injective_public_claim_identifies_private_value` in `formal/AMTCore.lean`. |
| Required attributes must be present before a purpose-scoped proof can pass. | Formally verified. | `missing_required_attribute_prevents_attribute_gate` in `formal/AMTCore.lean`. |
| ZK Address / Residence / Delivery proofs hide address fields in public envelopes. | Implementation verified. | `agidZkAddressProofs.test.ts`, `privateAddressPredicateProof.test.ts`, `regionMembershipProof.test.ts`. |
| Same-address, country, city, delivery-region, AOID ownership, freshness, revocation, consent, nullifier, rate-limit, and PID audit proof families compose. | Implementation verified. | 101 targeted ZK/credential tests passed. |
| Scope, challenge, nullifier, commitment, and replay conflicts are detected. | Implementation verified. | `zkProofCompatibility.test.ts`, `zkProofBundleRegistry.test.ts`. |
| Real cryptographic ZK should not be implemented purely in TypeScript. | Implementation policy verified. | `zkProofRuntime.ts` prefers Noir/Circom/Rust-ZKVM and keeps TypeScript as envelope orchestration. |

Commands run:

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\agidZkAddressProofs.test.ts src\lib\privateAddressPredicateProof.test.ts src\lib\regionMembershipProof.test.ts src\lib\addressCredential.test.ts src\lib\addressCredentialFreshnessProof.test.ts src\lib\aoidOwnershipProof.test.ts src\lib\addressDuplicateNullifier.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\pidLifecycleProof.test.ts src\lib\qualityThresholdProof.test.ts src\lib\consentPurposeScopeProof.test.ts src\lib\anonymousRateLimitProof.test.ts src\lib\zkProofCompatibility.test.ts src\lib\zkProofBundleRegistry.test.ts src\lib\revocationFreshnessRootAnchoring.test.ts src\lib\credentialIssuerTrustRegistry.test.ts src\lib\zkProofRuntime.test.ts
npm run verify:pid-risk
npm run verify:gis:budget
```

Results:

- Lean passed.
- 101 targeted ZK and credential tests passed.
- PID collision risk budget passed.
- GIS warning budget passed: 351 features, 0 errors, 149 warnings within budget, 408/408 registered sources.
- The PDF rendered cleanly on sampled pages 1, 5, 10, and 17.

## Strongest safe theorem statement

Use a credential-backed and predicate-scoped formulation:

```text
Let Q be the set of address reference classes.
Let Attr : Q -> P(S) map each reference class to address-derived attributes.
Let P : P(S) -> {0,1} be a public predicate.
Let C be a binding commitment to a hidden q in Q.

If a prover holds a valid, fresh, non-revoked credential for q and
P(Attr(q)) = 1, and if P is computable inside the selected proof system, then
the prover can produce a proof that reveals P(Attr(q)) = 1 while hiding q and
the raw address representation, under the zero-knowledge and soundness
assumptions of that proof system.
```

This avoids the unsafe phrase "ZK always lets us prove address attributes" and
makes the assumptions visible.

## Necessary corrections

1. Do not claim unconditional constructibility.

Current idea:

```text
If P(q)=true, a ZK proof can be constructed.
```

Safer:

```text
If P(q)=true and P can be represented by the selected circuit/zkVM, and the
prover has a valid credential or commitment opening for q, then a proof can be
constructed under the chosen proof system.
```

2. Separate three layers:

| Layer | What it proves |
| --- | --- |
| AMT semantic layer | What q, PID, Attr, and P mean. |
| Credential layer | Who issued the attribute, whether it is fresh, and whether it is revoked. |
| Cryptographic proof layer | Whether the witness satisfies the circuit without leaking the witness. |

3. Replace "address is a proofable attribute set" with a more precise line:

```text
An address reference class can serve as a private witness from which public
address predicates are proven.
```

This keeps the insight while preserving the fact that addresses also remain
references, routes, histories, and legal/social entities.

4. Add an anonymity-set or entropy condition.

ZK syntax alone is not enough.  If only one address satisfies the predicate,
the public predicate identifies the address by inference.

Use:

```text
PrivacySafe(P, D) iff |{q in D : P(Attr(q)) = 1}| >= k
```

or an entropy version:

```text
H(Q | P(Attr(Q)) = 1) >= tau
```

5. Require AMT resolution gates before proof issuance.

The PDF correctly notes this.  Make it a rule:

```text
No ZK Address Proof may be issued from an ambiguous or unresolved address
resolution state unless the proof is explicitly about ambiguity/unresolved
status itself.
```

6. Name the current implementation accurately.

Current code verifies:

- privacy-safe public envelopes;
- commitments;
- signed claims;
- credential checks;
- revocation/freshness roots;
- nullifier and replay controls;
- proof-bundle compatibility.

It does not yet generate complete cryptographic SNARK/STARK/zkVM proofs for all
address predicates.  The paper should call the current implementation
"ZK-ready proof envelope and predicate runtime" until circuit backends are
complete.

## Counterexamples and risks

| Over-strong claim | Counterexample or risk | Required fix |
| --- | --- | --- |
| "ZK proof reveals no address information." | The predicate "inside this one-house polygon" identifies the house. | Add anonymity-set and entropy leakage gates. |
| "P(q)=true implies a proof exists." | P may require GIS point-in-polygon, signature verification, or revocation membership not supported by the circuit. | Require circuit representability. |
| "The user owns the address because they know q." | A user may know someone else's address. | Require AOID ownership, credential possession, issuer trust, or delegated authority. |
| "Fresh credential is optional." | A moved-out resident can reuse an old residence proof. | Require freshness and revocation roots for relying-party decisions. |
| "Same-address proof is always safe." | Stable same-address nullifiers can link users across services. | Domain-separated group IDs, scope, challenge, and expiration. |
| "Delivery eligibility means the merchant never needs an address." | The carrier may still need scoped disclosure to complete delivery. | Split eligibility proof from later carrier-only disclosure. |

## Paper-ready theorem block

```text
Theorem: ZK Address Predicate Proof.
Let Q be the set of address reference classes, let Attr : Q -> P(S) be an
attribute map, and let P : P(S) -> {0,1} be a public predicate.  Suppose a
prover holds a valid credential or commitment opening for q in Q, the credential
is fresh and non-revoked, P(Attr(q)) = 1, and P is representable in the chosen
zero-knowledge proof system.  Then, under the zero-knowledge and soundness
assumptions of that proof system, the prover can convince a verifier that
P(Attr(q)) = 1 without revealing the raw address expression, exact coordinate,
unit, recipient name, phone number, or private AOID material.
```

```text
Privacy caveat.
The theorem hides the witness cryptographically.  It does not guarantee that
the public predicate is semantically non-identifying.  Predicate privacy also
requires a sufficiently large anonymity set or sufficient residual entropy after
the predicate is disclosed.
```

```text
Minimum Disclosure Lemma.
Let Req(p) be the attributes required for purpose p.  If Req(p) is contained in
Attr(q), then purpose p can be evaluated from Req(p) without disclosing
irrelevant attributes of q.  Therefore the privacy-optimal proof for p discloses
or proves only Req(p), subject to soundness, freshness, revocation, issuer trust,
and anonymity constraints.
```

## Suggested chapter placement

Put this after:

1. Address Reference Impossibility
2. Address Equivalence Classes
3. PID / AGID / AOID Layering
4. Address Relativity Principle
5. Address Entropy and Minimal Disclosure

Then use it as the opening of the privacy/proof part:

6. ZK Address Theorem
7. Address Credential
8. Revocation and Freshness
9. Proof Bundle Compatibility
10. Delivery Eligibility and Scoped Disclosure

Reason: ZK Address depends on stable reference classes, context-specific
purpose, and minimum disclosure.  It should not appear before those layers are
defined.

## Implementation next steps

Highest-value additions:

1. Add explicit `anonymitySetMin` or `entropyFloor` to proof policies and
verification results.
2. Mark each proof as either `cryptographic-zk`, `simulated-envelope`, or
`predicate-runtime-only`.
3. Move high-risk predicates to Noir/Circom/Rust-ZKVM circuits or a zkVM backend.
4. Add policy tests for too-small regions, unique-address predicates, and
over-specific city/district proofs.
5. Keep carrier delivery disclosure separate from merchant eligibility proof.

These additions would make the theorem defensible both mathematically and
operationally.
