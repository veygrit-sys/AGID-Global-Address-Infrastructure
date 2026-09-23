# Zero-Knowledge Address Proofs from Address Morphism Theory

## A Companion Framework for Private Residence, Delivery Eligibility, Ownership, and Address-Audit Claims

Version: companion manuscript draft v0.1
Date: 2026-06-06
Author: to be supplied

## Abstract

Address Morphism Theory (AMT) models address resolution as an evidence-sensitive process over ambiguous, multilingual, temporal, vertical, natural, institutional, and operational address references. AMT decides when a system may resolve, abstain, update lineage, and issue a persistent identifier. This companion paper studies a different question: how can address-derived facts be proven without revealing the address itself?

The central idea is to treat an AMT resolution envelope as a semantic source for cryptographic predicates. A user should be able to prove statements such as "the hidden address is inside Japan", "the hidden address is inside Tokyo", "the hidden address is inside a carrier delivery zone", "this user controls an AOID for the hidden address relation", "this registration is not a duplicate under a scoped nullifier", or "this PID was issued by the prescribed AMT workflow", without disclosing the raw address, unit, coordinate, phone number, recipient name, or private history.

This paper separates semantic correctness from cryptographic correctness. AMT supplies the address semantics: reference classes, attribute maps, source envelopes, lineage records, and PID issuance audit envelopes. Zero-knowledge or selective-disclosure protocols supply the privacy layer: commitments, proof relations, issuer trust, freshness, revocation, nullifiers, scope binding, replay prevention, and anonymity-set analysis. A proof can be cryptographically valid while semantically meaningless if the address predicate is poorly defined. Conversely, AMT can provide a correct address model without proving privacy. The two layers must be composed deliberately.

The paper defines proof families for ZK Address Proof, ZK Residence Proof, ZK Delivery Eligibility, AOID Ownership Proof, PID Issuance Audit Proof, Quality Threshold Proof, Freshness and Revocation Proof, Consent and Scope Proof, Anonymous Rate-Limit Proof, and PID Merge/Split Legitimacy Proof. It then gives compatibility rules for combining these proofs without scope collision or unintended linkability. The claims in this paper remain conditional: full production claims require audited circuits or credential protocols, not merely schemas.

## Keywords

Zero-knowledge proof, address privacy, residence proof, delivery eligibility, AOID, AGID, PID, AMT, verifiable credential, nullifier, revocation, freshness, selective disclosure, delivery privacy, address audit.

## 1. Introduction

Many online services need address-related facts before they need a full address. A merchant may need to know whether an order is deliverable. A regulator may need to know whether a person resides in a jurisdiction. A disaster support system may need to know whether a claimant is inside an eligible region. A shipping agent may need to know whether a buyer is the legitimate recipient. A platform may need to prevent duplicate address registrations without learning the address.

Conventional systems usually solve these problems by asking users to disclose the full address early. This is simple but excessive. A full address may reveal household membership, neighborhood, building, unit, travel pattern, social status, phone number, or exposure to physical risk. Once disclosed, the address may be logged, copied, sold, leaked, or misused.

This paper proposes a narrower interface. Instead of exposing the address, a user exposes a proof of an address-derived predicate. The verifier learns only the scoped claim it needs:

- inside a country;
- inside a city;
- inside a delivery zone;
- member of the same address group;
- holder of an AOID authority relation;
- not already registered under a scoped duplicate-prevention rule;
- issued by the prescribed AMT workflow;
- above a hidden quality threshold;
- fresh and not revoked under accepted roots.

The address itself remains hidden unless a later operational step requires scoped disclosure.

This approach depends on AMT but is not identical to AMT. AMT answers the semantic question: what is the address reference, under what evidence, at what time, and with what uncertainty? A zero-knowledge address protocol answers the disclosure question: what limited fact about that reference can be proven without revealing the witness?

## 2. Boundary with Address Morphism Theory

Let AMT produce an address resolution envelope:

```text
Env_t =
  (policy_id,
   source_set,
   candidate_set_commitment,
   cluster_commitment,
   outcome,
   attribute_commitment,
   lineage_commitment,
   quality_commitment,
   audit_hash)
```

The envelope may represent a resolved entity, an unresolved state, a lineage transition, or a PID issuance event. AMT is responsible for the rules that create this envelope.

A proof protocol consumes the envelope and proves a predicate:

```text
Prove knowledge of witness w such that
  AMTEnvelope(w) is valid under policy_id
  and Predicate(w) = true
  and proof metadata is scope-compatible.
```

The relationship is compositional:

```text
AMT layer:
  address expression -> candidates -> cluster -> outcome -> envelope

Proof layer:
  private envelope witness -> public predicate proof
```

AMT should not claim cryptographic privacy merely because it emits an envelope. The proof layer should not claim address correctness merely because a circuit verifies. The composition is valid only when both layers satisfy their own obligations.

## 3. Scope and Non-Claims

This paper proposes a model and writing structure for address-derived zero-knowledge proofs. It does not claim that a production circuit is complete. It does not claim that every country has sufficient official address data. It does not claim that all predicates are safe to reveal. It does not claim that a cryptographic proof prevents all real-world inference.

The paper deliberately separates five claim types:

| Claim type | Example | Required support |
| --- | --- | --- |
| Semantic claim | The hidden address belongs to a resolved AMT class. | AMT validation, source governance, lineage checks. |
| Cryptographic claim | The verifier learns no witness beyond the public statement. | Audited ZK or selective-disclosure protocol. |
| Policy claim | The predicate is allowed for this purpose. | Consent, purpose scope, legal and governance review. |
| Anonymity claim | The public predicate does not identify one address. | Anonymity-set analysis under auxiliary knowledge. |
| Operational claim | Delivery is feasible. | Carrier rule, route evidence, source freshness, audit. |

## 4. Core Objects

Let \(Q_t\) be the set of AMT reference classes at time \(t\). A reference class \(q \in Q_t\) may represent a building, unit, island, lake, administrative region, delivery endpoint, shelter, station, route-relevant feature, or historical address state.

Let:

\[
Attr_t : Q_t \to \mathcal{A}
\]

map a reference class to an attribute bundle. Attributes may include jurisdiction, geometry commitment, delivery zone, feature type, vertical unit, source class, quality score commitment, lineage state, and operational constraints.

Let:

\[
P_j : \mathcal{A} \to \{0,1\}
\]

be a public predicate under policy \(j\). Examples:

- `inside_country(JP)`;
- `inside_city(Tokyo)`;
- `inside_delivery_zone(carrier, zone_id)`;
- `same_address_group(scope_id)`;
- `aoid_authority_valid(scope_id)`;
- `quality_at_least(tau)`;
- `pid_issued_by_policy(policy_id)`;
- `lineage_transition_valid(split_or_merge_id)`.

The private witness may include:

```text
w =
  (q,
   address_expression,
   AMT resolution envelope,
   source witnesses,
   credential witnesses,
   AOID secret or delegation witness,
   revocation witness,
   freshness witness,
   nullifier secret,
   consent record,
   policy binding)
```

The public output should include only:

```text
public =
  (predicate_id,
   policy_id,
   issuer_or_source_policy,
   freshness_window,
   revocation_root,
   scope_id,
   nullifier if needed,
   audit_hash,
   proof_bytes)
```

## 5. Main Proof Relation

For a predicate \(P_j\), define the relation:

\[
R_j(w, public) := ValidAMTEnvelope(w) \land P_j(Attr_t(q)) = 1 \land PolicyCompatible(w, public).
\]

A proof system should prove knowledge of \(w\) satisfying \(R_j\) while revealing only `public`.

`PolicyCompatible` should check at least:

- predicate identifier;
- purpose scope;
- verifier challenge;
- expiration or freshness window;
- accepted issuer or source class;
- revocation root;
- domain-separated nullifier rule;
- consent scope;
- replay policy;
- audit hash binding.

## 6. Proof Families

### 6.1 ZK Address Proof

Purpose: prove that a hidden address reference satisfies a spatial predicate.

Examples:

- hidden address is inside Japan;
- hidden address is inside Hokkaido;
- hidden address is inside Tokyo;
- hidden address is inside the EU;
- hidden address is inside a disaster relief zone.

Public output:

```text
predicate_id
region_id or region_commitment
policy_id
freshness_window
proof
```

Hidden witness:

```text
address reference class
geometry or containment witness
AMT envelope
source evidence
```

### 6.2 ZK Residence Proof

Purpose: prove residence in a specified region without revealing the full address.

This differs from simple region membership because residence may require an issuer, credential, utility record, government document, carrier record, or verified AOID relation. The proof must bind address semantics to an accepted residence policy.

### 6.3 ZK Delivery Eligibility

Purpose: prove that a hidden address is deliverable under a carrier or shopping-agent policy.

The merchant should learn:

```text
deliverable = true
policy_id
freshness_window
optional carrier class
```

The merchant should not learn:

```text
street address
unit
recipient name
phone number
exact coordinate
access instruction
```

The carrier may later receive scoped disclosure after checkout. This creates a two-stage flow:

```text
merchant stage: eligibility proof only
carrier stage: minimum necessary delivery disclosure
```

### 6.4 AOID Ownership Proof

Purpose: prove authority over an AOID relation without exposing the AOID secret, private address, or owner identity.

The proof may show:

- the prover controls a private key linked to an AOID commitment;
- the AOID delegation is valid for this purpose;
- the authority has not expired;
- the action is within consent scope.

### 6.5 Duplicate-Registration Nullifier Proof

Purpose: prevent duplicate registration of the same address relation without revealing the address.

A scoped nullifier may be:

```text
nullifier = H(domain || scope || epoch || secret)
```

The domain must be separated across duplicate registration, anonymous rate limiting, delivery eligibility, same-address proof, and ownership proof. Otherwise unrelated proofs may become linkable.

### 6.6 PID Issuance Audit Proof

Purpose: prove that a PID was issued only after the required AMT workflow.

Public claim:

```text
This PID passed candidate generation, clustering, unresolved/ambiguous gates,
history update, quality threshold, source freshness, and issuance policy.
```

Hidden material may include:

- raw address;
- candidate records;
- user history;
- source-specific evidence;
- quality score;
- rejected alternatives.

The proof should reveal only the policy-bound audit claim and commitments.

### 6.7 Freshness and Revocation Proof

Purpose: prove that a credential or address relation is current enough and not revoked.

The proof should bind:

- accepted issuer registry;
- freshness root;
- revocation root;
- expiration window;
- policy id;
- verifier challenge.

### 6.8 Consent and Purpose-Scope Proof

Purpose: prove that the user consented to this specific use without allowing cross-purpose reuse.

Examples:

- use for checkout only;
- use for carrier delivery only;
- use for disaster support only;
- use for one verifier and one expiration window.

### 6.9 Anonymous Rate-Limit Proof

Purpose: allow a user to make at most \(n\) requests per epoch without revealing identity or address.

This can be modeled with epoch-bound nullifiers. It should not share nullifier domains with duplicate-registration prevention.

### 6.10 PID Merge/Split Legitimacy Proof

Purpose: prove that a PID lineage transition followed the required merge or split policy.

Public claim:

```text
The hidden transition connects old PID classes to new PID classes under
an accepted lineage policy.
```

Hidden witness may include detailed address records, affected users, private AOID bindings, and source evidence.

### 6.11 Quality Threshold Proof

Purpose: prove that internal address quality satisfies a threshold without exposing the raw score.

Public claim:

```text
Q(country, language, context, source_set) >= tau
```

The raw score should usually remain internal. The verifier should learn only whether the threshold passed under a stated policy.

## 7. Theorems and Lemmas

### Lemma 1: Singleton Predicate Leakage

If a public predicate \(P\) is true for exactly one possible address under the verifier's auxiliary knowledge, then a proof of \(P(a)=1\) reveals \(a\) by inference.

Consequence: zero-knowledge of the cryptographic witness is not enough. Predicate granularity and anonymity-set size matter.

### Lemma 2: Semantic Grounding Requirement

A cryptographic proof of an address predicate is semantically meaningful only if the predicate is evaluated over a well-defined address reference model.

Consequence: a proof that "inside region R" is not meaningful unless the region, address reference, containment rule, time, source policy, and uncertainty policy are specified.

### Lemma 3: AMT Does Not Imply Cryptographic Privacy

An AMT audit envelope can minimize disclosure, but it does not by itself provide zero-knowledge privacy. Cryptographic privacy requires a proof protocol or selective-disclosure credential system.

### Lemma 4: Proof Validity Does Not Imply Address Truth

A proof may be valid relative to a false or stale source envelope. Therefore proof verification must include source policy, freshness, revocation, and AMT evidence assumptions.

### Lemma 5: Domain Separation Is Required for Unlinkability

If two proof purposes reuse the same nullifier domain, then the verifier may link events across purposes. Distinct proof families must use distinct domains, scopes, and challenges.

### Lemma 6: Delivery Eligibility Requires Disclosure Staging

A merchant-facing delivery proof should not automatically disclose carrier-stage delivery details. Eligibility and actual delivery are different disclosure stages.

## 8. Proof Bundle Registry

Proofs should be packaged with explicit semantic metadata:

```json
{
  "bundle_version": "zk-address-bundle-1",
  "proof_type": "delivery_eligibility",
  "predicate_id": "carrier-zone-membership:v1",
  "amt_policy_id": "amt-resolution-policy:v1",
  "issuer_policy_id": "issuer-policy:v1",
  "scope_id": "checkout-session-or-purpose",
  "challenge": "verifier-challenge",
  "freshness_window": "2026-06-06T00:00:00Z/2026-06-07T00:00:00Z",
  "revocation_root": "root",
  "freshness_root": "root",
  "subject_commitment": "commitment",
  "address_commitment": "commitment",
  "audit_hash": "hash",
  "nullifier": "optional-domain-separated-nullifier",
  "public_claim": {
    "deliverable": true,
    "region_or_zone": "committed-or-public-zone"
  },
  "anonymity_set_min": 128,
  "proof_system": "backend-identifier",
  "proof": "opaque-proof-bytes"
}
```

Compatibility checks should reject:

- missing scope;
- mismatched challenge;
- expired freshness window;
- revoked credential;
- untrusted issuer;
- reused nullifier where single-use is required;
- nullifier domain collision;
- proof type inconsistent with predicate;
- public claim not bound to AMT policy;
- raw private address in public metadata.

## 9. Compatibility Between Proofs

Multiple proof families may be used together. For example, delivery eligibility may require a residence credential, AOID ownership, freshness, and non-duplicate registration. Composition is useful but dangerous.

The registry should enforce:

| Compatibility dimension | Rule |
| --- | --- |
| Scope | Every proof must bind to the same intended purpose or an explicitly allowed sub-purpose. |
| Challenge | Proofs in one transaction should bind to the verifier challenge. |
| Freshness | The accepted freshness windows must overlap. |
| Revocation | Revocation roots must be accepted by the verifier policy. |
| Issuer trust | Every issuer must be in the trust registry for the predicate. |
| Nullifier domain | Nullifiers must not collide across unrelated proof purposes. |
| Audit hash | Address predicates should bind to the relevant AMT envelope. |
| Disclosure level | A merchant proof must not include carrier-only delivery data. |

## 10. Verification Plan

### 10.1 Lean or Formal Model

Lean can verify set-theoretic and logical properties:

- singleton predicate leakage;
- non-singleton witness condition;
- policy compatibility as a typed predicate;
- nullifier-domain separation at the symbolic level;
- proof-family compatibility rules;
- PID audit statement requires all AMT gates.

Lean cannot prove that a real-world source is complete, that a carrier actually delivers, or that a cryptographic circuit is secure.

### 10.2 GIS and Source Validation

GIS validation should support the semantic predicates:

- region containment;
- city or country membership;
- delivery-zone membership;
- natural feature association;
- vertical or unit-level ambiguity;
- source freshness;
- boundary version.

### 10.3 Implementation Tests

Tests should reject:

- raw private address in public proof metadata;
- replayed nullifier;
- missing challenge;
- expired freshness window;
- revoked credential;
- mismatched scope;
- incompatible proof family composition;
- public predicate too narrow under configured anonymity policy;
- PID audit proof without candidate generation, clustering, unresolved gate, history update, and issuance policy.

### 10.4 Circuit and Protocol Audit

Production cryptographic claims require:

- audited proof circuits or credential protocols;
- trusted setup analysis where relevant;
- soundness and zero-knowledge review;
- serialization and transcript binding review;
- side-channel and metadata leakage review;
- issuer-key management review.

## 11. Security and Abuse Analysis

| Risk | Example | Mitigation |
| --- | --- | --- |
| Predicate over-narrowing | "Inside this apartment" identifies the user. | Anonymity-set threshold and policy rejection. |
| Source staleness | User moved but old credential remains valid. | Freshness roots, revocation roots, expiration. |
| Cross-purpose linkability | Same nullifier used for checkout and rate limiting. | Domain separation and scope binding. |
| Replay | Proof reused outside original session. | Verifier challenge and expiration. |
| False semantic source | Bad map or fake carrier event. | AMT source governance and audit. |
| Merchant over-collection | Merchant asks for exact address before needed. | Delivery eligibility proof and disclosure staging. |
| Carrier under-disclosure | Carrier lacks necessary route data. | Scoped disclosure after purchase. |
| Open-source leakage | Test data contains private addresses. | Redaction, generated fixtures, no embedded secrets. |

## 12. Relationship to Identity Systems

DID and verifiable credential systems can represent subjects and issuer-signed claims. They do not by themselves solve address semantics. AMT can supply the address reference layer; DID/VC systems can supply issuer and subject control; zero-knowledge systems can supply selective disclosure.

The relationship should be:

```text
AMT: what address reference or attribute is being claimed?
DID/VC: who issued or controls the claim?
ZK/selective disclosure: what is revealed and what is hidden?
```

## 13. Limitations

First, a zero-knowledge proof can hide the witness but cannot prevent all inference from the public predicate. A city-level proof may be safe in one city and unsafe in a tiny village.

Second, the proof is only as meaningful as the semantic source. A valid proof over a stale or poisoned address envelope may still mislead.

Third, delivery eligibility is not the same as successful delivery. Weather, access control, carrier error, sanctions, disaster conditions, or recipient absence may still prevent delivery.

Fourth, proof composition can create accidental linkage. Compatibility rules must be treated as security-critical, not merely metadata validation.

Fifth, production readiness requires audited cryptographic systems. A registry schema and TypeScript envelope tests are not full zero-knowledge proof verification.

## 14. Conclusion

Address Morphism Theory should remain the theory of address reference, uncertainty, lineage, and identifier issuance. Zero-Knowledge Address Proofs should be a companion theory of scoped disclosure over AMT-derived address semantics.

This separation makes both papers stronger. The AMT paper avoids overstating cryptographic privacy. The ZK paper gains a rigorous semantic foundation for its predicates. Together, they support a practical goal: users and agents can prove address-derived facts such as residence, delivery eligibility, same-address relation, AOID ownership, quality threshold, and PID issuance legitimacy while revealing no more address information than the relying party actually needs.

## Appendix A. Claim Status Table

| Claim | Status | Required support |
| --- | --- | --- |
| A public address predicate can leak the address if its witness set is singleton. | Formal lemma | Set-theoretic proof or Lean model. |
| AMT is required to define address predicate semantics. | Modeling claim | AMT envelope specification and examples. |
| ZK proof preserves witness privacy. | Cryptographic claim | Audited proof system or credential protocol. |
| Delivery eligibility can be proven before carrier disclosure. | Protocol claim | API design, threat model, integration tests. |
| Nullifiers prevent duplicate registration without revealing address. | Cryptographic/protocol claim | Domain-separated nullifier design and tests. |
| Revocation and freshness prevent stale credentials. | Protocol claim | Accepted roots, issuer policy, tests. |
| Quality threshold proof hides raw score. | Protocol claim | Commitment/range proof or selective-disclosure design. |

## Appendix B. References To Complete

The final bibliography should include sources on:

- zero-knowledge proof systems;
- selective-disclosure credentials;
- decentralized identifiers and verifiable credentials;
- anonymous credentials;
- nullifier and rate-limit designs;
- revocation accumulators;
- private set membership and range proofs;
- privacy-preserving location proofs;
- address verification and geocoding;
- GIS containment and boundary versioning;
- AMT core paper.
