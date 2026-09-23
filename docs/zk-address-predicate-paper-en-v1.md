# Address Morphism Theory II: Zero-Knowledge Address Predicates

## A Companion Framework for Private Residence, Delivery Eligibility, AOID Ownership, and Address-Audit Proofs

Version: 1.0

Status: research manuscript and implementation-aligned proof-framework paper

Date: 2026-06-07



## Abstract

Address Morphism Theory, or AMT, models addresses as semantic references rather than mere strings, coordinates, or administrative labels. It studies how uncertain address expressions are parsed, expanded, clustered, resolved, left unresolved, assigned persistent identifiers, and updated through historical transformations. This companion paper develops a second layer: zero-knowledge address predicates. The goal is not to replace AMT with cryptography. The goal is to make selected AMT-derived facts provable without revealing the underlying address, person, phone number, coordinate, apartment unit, AOID body, or raw resolution history.

The central claim is conditional and deliberately narrow. If an address credential or AMT resolution envelope is valid, fresh, non-revoked, issued by a trusted issuer, bound to an allowed purpose scope, and if the desired predicate is representable in a zero-knowledge circuit or equivalent verifiable computation relation, then a user can prove the predicate while hiding the witness. Examples include "the hidden address is in Japan", "the hidden address is in Tokyo", "the hidden address belongs to a delivery-eligible region", "the prover owns an AOID secret key", "the prover has not registered the same address-AOID-region triple twice", and "a PID was issued only after candidate generation, clustering, unresolved gating, history update, and issuance gates were satisfied".

The paper formalizes witnesses, public statements, commitments, nullifiers, freshness roots, revocation roots, purpose scopes, proof bundles, and compatibility constraints. It also states what this framework does not prove. Zero-knowledge proofs do not make an address true. They only prove a relation about committed or credentialed data under a proof-system assumption. AMT does not make a fact private. It only supplies semantic structure. The two layers must remain separate.

This manuscript is aligned with the current AGID/AOID implementation, where TypeScript proof objects are currently ZK-ready envelopes and predicate runtimes rather than production SNARK, STARK, or zkVM proofs. The paper therefore distinguishes implemented envelope checks from future cryptographic backends. It also includes theorem statements, proof sketches, counterexamples, and a verification plan separating Lean-formalizable claims, GIS-testable claims, implementation tests, and future circuit audits.



## Keywords

Address Morphism Theory, AMT, AGID, AOID, PID, address credential, zero-knowledge proof, private address predicate, residence proof, delivery eligibility, nullifier, revocation, freshness, proof bundle, purpose scope, address audit, privacy-preserving logistics.

# 0. Status and Claim Boundary

This paper is a companion theory paper. It is not a production cryptographic audit report, not a complete circuit specification, and not a claim that the current implementation already produces production SNARK, STARK, or zkVM proofs. Its purpose is to define the semantic objects, public statements, private witnesses, predicate families, compatibility gates, threat model, and verification roadmap needed to turn Address Morphism Theory into privacy-preserving address predicates.

The paper uses four claim labels.

**Formalizable claim.** A claim that can be modeled in Lean or another proof assistant at the level of sets, predicates, projections, compatibility rules, domain separation, or policy gates. These claims do not automatically prove real-world address truth or circuit soundness.

**Implementation-supported claim.** A claim supported by current TypeScript modules and tests, such as proof-ready envelope validation, proof bundle compatibility checks, freshness and revocation gates, purpose-scope checks, private-material stripping, and AOID/nullifier policy checks. These are not yet production cryptographic proofs.

**GIS or source-verifiable claim.** A claim that requires public geographic data, official source data, point-in-polygon checks, boundary testing, postal source validation, or delivery-zone experiments. These claims cannot be settled by cryptography alone.

**Unverified or future cryptographic claim.** A claim that requires real proof backends, circuit audits, zkVM audits, external cryptographic review, issuer operations, carrier tests, or field experiments. These claims are treated as roadmap items, not established results.

The current implementation should therefore be described as **ZK-ready** rather than as a complete ZK system. It can model commitments, public statements, nullifiers, scope, revocation, freshness, proof bundles, and compatibility constraints. A future backend must still prove soundness, zero-knowledge, constraint correctness, serialization safety, metadata privacy, and verifier behavior.

This distinction is essential. A privacy-preserving address predicate fails if either side is missing. A cryptographically valid proof can be meaningless if the AMT envelope is unresolved, stale, revoked, or based on an unsafe predicate. A semantically correct AMT resolution can still leak private address data if it is disclosed without cryptographic or consent controls.



# 1. Introduction

Addresses are among the most common identifiers in human society. They are used to deliver goods, assign taxes, verify residence, open accounts, dispatch emergency services, register real estate, manage disaster relief, and organize civic life. Yet an address is also sensitive. A full address can disclose where a person lives, where they work, how their family is organized, which building entrance they use, which floor they occupy, which locker receives deliveries, and which region governs them.

Modern services often ask for a full address when they only need a weaker fact. An online store may need to know whether a package can be delivered to a region, not the full address before checkout. A subsidy program may need to know that a person is resident in a municipality, not the apartment number. A local rule may need to know that a user is within a country or city, not the street. A delegated shopping agent may need to know that an address credential exists and is currently valid, not the address itself. A registration service may need to know that the same address is not being registered twice under the same AOID and region, not which address it is.

This observation motivates a second layer for Address Morphism Theory. AMT I supplies the semantic model. It says how an address expression relates to possible physical, social, virtual, or administrative entities. AMT II asks which facts about that relation can be proven without revealing the relation itself.

This paper introduces zero-knowledge address predicates. A zero-knowledge address predicate is a statement about hidden address-derived data, such as membership in a region, possession of a credential, delivery eligibility, AOID ownership, duplicate-prevention nullifier uniqueness, or correct PID issuance. The statement is public. The address, credential body, phone number, coordinates, and raw resolution trace remain private.

The central design principle is separation:

AMT is the semantic foundation.

ZKP is the private proof layer.

The two are complementary, but neither replaces the other. Without AMT, a proof may be cryptographically valid but semantically meaningless. Without ZKP, an AMT resolution may be semantically useful but privacy-invasive. The purpose of AMT II is to connect them with precise predicates, not to collapse them into one concept.



# 2. Address Morphism Theory as the Semantic Foundation

AMT models address resolution as a chain of transformations from human expressions to persistent references.

Let `S_t` be the set of address strings or address-like expressions observable at time `t`. These may include postal addresses, building names, road names, locality names, natural feature names, disaster shelters, lockers, private labels, or multilingual aliases.

Let `E_t` be the set of addressable entities at time `t`. An entity may be a parcel, building, unit, entrance, bridge, road segment, station, locker, warehouse, shelter, river, island, administrative office, or other referenceable place-like or service-like object.

Let `A_t` be an attribute space. Attributes include country, region, city, postal code, route hints, administrative hierarchy, language labels, delivery availability, quality scores, issuer attestations, and history metadata.

The AMT I pipeline can be summarized as follows:

1. Parsing and normalization.
2. Candidate generation.
3. Candidate expansion through aliases, languages, postal sources, maps, and historical references.
4. Structural comparison and clustering.
5. Unresolved gating when evidence is insufficient.
6. Persistent identifier issuance when evidence is sufficient.
7. History update, including merge, split, migration, and administrative change.
8. Attribute mapping from resolved or credentialed references to usable facts.

For AMT II, the important object is not the raw address string but the semantic envelope produced by AMT.

Definition 2.1, AMT semantic envelope.

An AMT semantic envelope is a tuple

`M = (x, C, R, H, P, Q, V)`

where:

`x` is a hidden input expression or hidden resolved reference.

`C` is a candidate set.

`R` is a resolution result, either resolved, unresolved, or conditionally resolved.

`H` is a history state or lineage commitment.

`P` is a persistent identifier or a null value when issuance is not allowed.

`Q` is a quality and confidence object.

`V` is a validation trace or commitment to a validation trace.

In a private proof system, most fields of `M` are not public. Instead, the prover may reveal commitments, issuer identifiers, predicate names, scope, freshness windows, and selected quality thresholds.

AMT II does not require every AMT computation to be performed inside a zero-knowledge circuit. In practice, the semantic computation may be performed off-chain by an address engine, map engine, postal source engine, issuer, or trusted workflow, and then committed or credentialed. The proof relation then verifies a predicate over the committed or credentialed result.



# 3. Separation of Semantics and Cryptography

The separation between AMT and cryptography is the most important safety boundary in this paper.

AMT answers semantic questions:

- What could this address string refer to?
- Which candidates are plausible?
- Which candidates belong to the same reference class?
- When should the system abstain?
- Which persistent identifier may be issued?
- Which history update is valid?
- Which attributes are associated with the resolved or credentialed reference?

ZKP answers cryptographic questions:

- Does the prover know a hidden witness satisfying a relation?
- Is the public statement bound to the witness by commitments?
- Is the proof zero-knowledge under the chosen proof-system assumption?
- Is the proof sound under the chosen proof-system assumption?
- Has a nullifier already been used in a domain?
- Is the credential fresh and not revoked according to a public root?
- Is the proof bound to an intended challenge and purpose scope?

The two layers cannot substitute for each other.

Theorem 3.1, AMT/ZKP non-substitution.

AMT validity does not imply zero-knowledge privacy. Zero-knowledge validity does not imply address truth.

Proof.

For the first direction, suppose an AMT engine correctly resolves a hidden address to a valid PID. If the engine publishes the input string, the apartment unit, and the coordinate, the semantic resolution is valid but privacy is lost. AMT validity alone does not imply zero-knowledge privacy.

For the second direction, suppose a prover creates a zero-knowledge proof that they know a secret value satisfying a circuit. If the credential issuer was false, stale, or untrusted, the proof may be cryptographically valid while the address fact is socially or semantically false. ZKP validity alone does not imply address truth.

Therefore the layers are independent and must be combined by explicit assumptions. QED.

Corollary 3.2.

A production private address system must verify both semantic validity and cryptographic validity.

This corollary is operationally important. The user-facing service must not accept a private proof merely because it has a valid signature. It must also check issuer trust, revocation, freshness, predicate scope, challenge binding, and compatibility with the AMT predicate being requested.



# 4. Private Address Predicates

A private address predicate is a public claim about hidden address-derived data.

Definition 4.1, Address predicate.

Let `W` be a witness space containing hidden address data, credentials, AMT envelopes, AOID secrets, issuer attestations, and salts. Let `Y` be a public statement space. An address predicate is a relation

`R_pred subset W x Y`.

A proof of `R_pred(w, y)` convinces a verifier that some hidden witness `w` satisfies the public statement `y`, without revealing `w` beyond what is implied by `y`.

Examples:

`inside_country(w, "JP")`

The hidden address is within Japan.

`inside_city(w, "Tokyo")`

The hidden address is within Tokyo, under a specified boundary version.

`delivery_eligible(w, carrier_zone_id)`

The hidden address belongs to a delivery-eligible region for a carrier, merchant, route, or time window.

`same_address_resident(w, group_id)`

The prover has a credential placing them in the same committed address group as other eligible residents, without revealing the address.

`aoid_owner(w, aoid_commitment)`

The prover controls an AOID secret key or authorized credential associated with an AOID commitment.

`not_duplicate(w, domain)`

The prover produces a nullifier proving that a hidden address-AOID-region tuple has not already been registered in the same duplicate-prevention domain.

`pid_audit_valid(w, pid)`

The hidden PID issuance trace passed required workflow gates.

`quality_at_least(w, tau)`

The hidden quality score is at least threshold `tau`, without revealing the exact score or detailed components.

Definition 4.2, Predicate granularity.

The granularity of a predicate is the amount of identifying information implied by the public statement. A country-level predicate is usually coarse. A building-level predicate may be highly identifying. A predicate for a single rural household may be effectively injective.

Theorem 4.3, Predicate granularity privacy caveat.

Zero-knowledge hides the witness but does not hide what the public predicate itself reveals.

Proof.

Let the public predicate be `inside_region(r)`. If region `r` contains only one possible address in the relevant population, then proving membership in `r` identifies the address up to that population, even if the cryptographic proof is perfectly zero-knowledge. The leakage comes from the public statement, not from the proof transcript. QED.

Corollary 4.4.

Every private address predicate should be evaluated against an anonymity-set or disclosure-risk policy before being offered to users.

This does not mean fine-grained predicates are forbidden. It means they must be used deliberately. Delivery may require a narrower predicate than country residency. Emergency dispatch may require full disclosure. AMT II is about selective disclosure, not automatic non-disclosure.



# 5. Witness and Public Statement Model

A zero-knowledge address proof has two sides: a hidden witness and a public statement.

Definition 5.1, Witness.

A witness is a tuple

`w = (addr, cred, amt, key, hist, nsec, salts)`

where:

`addr` is hidden address data, possibly including string, normalized tokens, postal code, road, building, unit, recipient, phone, coordinate, or map feature.

`cred` is a hidden credential body or credential opening.

`amt` is a hidden AMT envelope or committed AMT trace.

`key` is an AOID private key, delegated authority key, or credential-binding secret.

`hist` is a hidden history trace, merge/split trace, or PID issuance trace.

`nsec` is a nullifier secret.

`salts` are private random values used for commitments, nullifiers, and unlinkability.

Definition 5.2, Public statement.

A public statement is a tuple

`y = (kind, target, scope, challenge, issuer, roots, threshold, commitments, nullifiers, validity)`

where:

`kind` names the proof family.

`target` names the public predicate target, such as country, city, delivery zone, AOID commitment, or PID.

`scope` states the intended purpose.

`challenge` binds the proof to a verifier session.

`issuer` names trusted issuers or registries.

`roots` include freshness, revocation, Merkle, or registry roots.

`threshold` includes public threshold values when applicable.

`commitments` bind hidden witness values.

`nullifiers` prevent duplicate use in a defined domain.

`validity` gives issued-at and expires-at intervals.

Definition 5.3, Commitment binding.

A commitment scheme `Com` is binding if no efficient adversary can open a commitment to two different hidden values except with negligible probability.

Definition 5.4, Zero-knowledge address proof.

A zero-knowledge address proof for predicate relation `R_pred` is a proof object `pi` such that:

Completeness: if `R_pred(w, y)` holds, an honest prover can produce `pi` accepted by the verifier.

Soundness: if the verifier accepts `pi`, then, except with negligible probability, there exists a witness `w` such that `R_pred(w, y)` holds.

Zero-knowledge: the verifier learns nothing about `w` beyond what follows from `y`.

This definition is standard, but it is important to distinguish it from the current implementation status. The current AGID/AOID TypeScript libraries implement proof envelopes, commitments, compatibility checks, privacy metadata, and predicate runtimes. These are ZK-ready. They are not, by themselves, production cryptographic SNARK or STARK proofs. A production deployment should plug these relations into a backend such as a SNARK circuit, STARK circuit, zkVM, MPC-in-the-head proof, or another audited zero-knowledge system.



# 6. Axioms and Assumptions

This paper uses conditional theorems. The following assumptions make the claims precise.

Axiom A1, AMT envelope validity.

If an AMT envelope is accepted for a proof, its semantic workflow has satisfied the required AMT gates for that proof family, including candidate generation, clustering, unresolved gating, history update, and issuance when applicable.

Axiom A2, Commitment binding.

All commitments used in public statements are computationally binding under the chosen commitment scheme.

Axiom A3, Issuer trust.

Credential issuers and proof registries are accepted only if they appear in a verifier-approved trust registry for the relevant purpose.

Axiom A4, Freshness and revocation.

A credential or AMT envelope is accepted only if its validity window has not expired and it is not revoked according to a public root or registry status accepted by the verifier.

Axiom A5, Scope domain separation.

Proof scopes are domain-separated. A proof issued for delivery cannot be silently reused for identity verification, marketing, audit, or unrelated registration.

Axiom A6, Challenge binding.

Proofs are bound to a verifier challenge unless the use case explicitly permits reusable credentials.

Axiom A7, Nullifier domain separation.

Nullifiers are computed under explicit domains. A nullifier for one purpose or region must not become a global cross-service tracker unless that is explicitly intended and consented to.

Axiom A8, Circuit representability.

The predicate is representable by an audited proof relation, circuit, zkVM program, or verifiable computation procedure.

Axiom A9, Proof-system security.

The zero-knowledge backend satisfies the desired completeness, soundness, and zero-knowledge properties.

Axiom A10, Minimum disclosure.

The public statement reveals only fields necessary for the predicate, verifier policy, and abuse prevention.

Axiom A11, Unresolved safety.

No proof may claim a resolved address fact from an unresolved AMT state unless the proof explicitly states that it is an unresolved or conditional claim.

Axiom A12, Compatibility enforcement.

When several proofs are bundled, the verifier checks common challenge, scope, validity window, issuer policy, privacy compatibility, duplicate nullifiers, and commitment conflicts.

These assumptions are not decorative. Each blocks a real failure mode. Without issuer trust, false credentials can pass. Without freshness, stale residence claims can pass. Without scope, a shipping proof can become an identity proof. Without challenge binding, replay attacks are possible. Without domain-separated nullifiers, private users become linkable across services. Without unresolved safety, the system can convert ambiguity into false certainty.



# 7. ZK Address Proof

A ZK Address Proof proves a region or address-derived attribute without revealing the address.

Definition 7.1, ZK Address Proof relation.

Let `region_version` identify a public boundary dataset. Let `target_region` be a public region identifier. Let `addr` be hidden address data. Let `geo(addr)` be a hidden or committed geometry derived from an AMT envelope or credential. The ZK Address Proof relation is:

`R_addr(w, y)` holds if:

1. `w` contains a valid hidden address or address credential.
2. The credential or AMT envelope is fresh and not revoked.
3. The issuer is trusted for the requested predicate.
4. `geo(addr)` is within `target_region` under `region_version`.
5. Public commitments bind the hidden address or credential.
6. The proof is bound to the public scope and challenge.

Theorem 7.2, Conditional ZK Address Predicate Theorem.

Under Axioms A1 through A10, if a verifier accepts a ZK Address Proof for public statement `y`, then, except with negligible probability, the prover knows a hidden address credential or AMT envelope satisfying the public address predicate encoded by `y`, while the verifier learns no hidden address fields beyond what follows from `y`.

Proof.

By soundness of the proof system, acceptance implies existence of a witness satisfying the proof relation. By A2, the public commitments cannot be opened to conflicting hidden values. By A3 and A4, the accepted credential or envelope belongs to a trusted, fresh, non-revoked source. By A8, the region predicate is correctly represented in the proof relation. By A5 and A6, the statement is bound to the declared scope and challenge. By zero-knowledge of the proof system, no hidden witness fields are leaked beyond the public statement. Therefore the accepted proof establishes only the public predicate and hides the underlying address fields. QED.

Corollary 7.3.

A verifier can learn "resident in Japan", "inside Tokyo", "inside the European Union", or "inside a delivery region" without learning the full address, if the predicate is sufficiently coarse and backed by a valid credential or AMT envelope.

Counterexample 7.4, Singleton region.

If `target_region` contains one household in the verifier's reference population, the proof may be cryptographically zero-knowledge while practically revealing the address. This is not a contradiction. It is public predicate leakage.



# 8. ZK Residence Proof

A ZK Residence Proof proves a residence claim without revealing the address.

Residence differs from mere region membership. A coordinate may be inside a city, but residence is a social and legal attribute. It usually requires an issuer, credential, lease, utility record, government document, institutional record, or local attestation.

Definition 8.1, Address credential.

An address credential is a signed or otherwise verifiable object

`Cred = (subj, attrs, issuer, issued_at, expires_at, revocation_handle, commitment, sig)`

where:

`subj` is a subject binding, hidden or pseudonymous.

`attrs` are address-derived attributes such as country, city, postal zone, delivery zone, residence status, or same-address group.

`issuer` identifies the credential issuer.

`issued_at` and `expires_at` define validity.

`revocation_handle` enables revocation checks.

`commitment` binds the hidden address or address reference.

`sig` is the issuer's signature or attestation.

Definition 8.2, Residence relation.

`R_res(w, y)` holds if:

1. `w` contains a credential proving residence attributes.
2. The credential is issued by a trusted residence issuer.
3. The credential is fresh and non-revoked.
4. The requested residence predicate is contained in or derivable from the credential attributes.
5. The proof reveals only the requested residence target, issuer class, freshness status, scope, challenge, and commitments allowed by policy.

Theorem 8.3, Residence credential theorem.

Under Axioms A2 through A10, a valid ZK Residence Proof proves possession of a fresh, non-revoked, trusted residence credential satisfying the public residence predicate, without revealing the underlying address credential body.

Proof.

Soundness gives witness existence. The witness contains a credential opening. Issuer trust follows from A3. Freshness and non-revocation follow from A4. Binding follows from A2. The public statement contains the predicate target and purpose scope. Zero-knowledge hides the credential body, address text, subject secret, and private salts. QED.

Residence proofs are useful for local eligibility, disaster relief, tax zones, school districts, region-locked benefits, or local service access. But they are not magic. If an issuer is corrupt or a credential was obtained fraudulently, a ZK proof may faithfully prove possession of that bad credential. This is why issuer governance and revocation are part of the model.



# 9. ZK Delivery Eligibility

Delivery eligibility is a weaker and more operational predicate than full address disclosure. It asks whether a hidden address can receive a delivery under some policy.

Definition 9.1, Delivery eligibility relation.

Let `zone` be a public delivery zone, carrier route, merchant coverage map, service promise, or time-limited logistics policy. `R_deliv(w, y)` holds if:

1. `w` contains a hidden address credential or AMT envelope.
2. The address is inside `zone` or otherwise satisfies the carrier's deliverability predicate.
3. The proof is bound to a delivery scope.
4. The credential is fresh and non-revoked.
5. The proof does not reveal full address, recipient name, phone, unit, coordinate, or raw route unless the use case escalates to disclosed delivery.

Theorem 9.2, Two-stage delivery privacy theorem.

Under the standard assumptions, a service can separate delivery eligibility from final delivery disclosure. In stage one, a ZK Delivery Eligibility proof can prove deliverability without revealing the address. In stage two, the user or authorized agent may disclose the address to a carrier under a narrower purpose scope.

Proof.

Stage one uses relation `R_deliv`, whose public statement reveals only eligibility target, carrier or merchant policy, scope, challenge, validity, and commitments. Zero-knowledge hides the address. Stage two is a separate purpose-scoped disclosure, not implied by stage one. Axiom A5 prevents silent reuse of the stage-one proof for a different purpose. Therefore the system can support private checkout eligibility while still allowing actual delivery when needed. QED.

Corollary 9.3.

A shopping agent can verify that an item can be shipped to a user's hidden address before learning or transmitting the full address.

This is especially useful for autonomous purchasing workflows. The agent may select merchants, shipping methods, taxes, or region restrictions using only predicate proofs, then request final address disclosure only when the user consents to a particular transaction.

Limitation 9.4.

Delivery eligibility does not prove delivery success. It proves compliance with a policy. Real-world delivery still depends on route conditions, carrier performance, access control, weather, recipient availability, customs, and other factors.



# 10. AOID Ownership Proof

AOID, or Address Object Identifier, is an address-linked object identifier used to manage ownership, delegation, QR reissue, update authority, or credential binding. Revealing the AOID body or address may be unnecessary when proving authority.

Definition 10.1, AOID ownership relation.

`R_aoid(w, y)` holds if:

1. `w` contains an AOID private key, delegated key, or address credential.
2. The key or credential binds to the public AOID commitment or key fingerprint.
3. The operation is allowed by the public scope.
4. Any delegation is valid, fresh, and non-revoked.
5. The proof hides the AOID body, address, recipient, phone, unit, private key, credential salt, and owner secret.

Theorem 10.2, AOID ownership proof theorem.

Under binding, issuer trust, freshness, and proof-system assumptions, a valid AOID Ownership Proof proves authority over an AOID commitment for the declared scope without revealing the AOID body or private ownership secret.

Proof.

Soundness gives witness existence: a private key, delegated key, or credential opening bound to the public AOID commitment. Binding prevents changing the hidden AOID after proof creation. Scope binding restricts the proof to the declared operation. Zero-knowledge hides the AOID body and private key material. QED.

AOID ownership proofs support:

- AOID update authorization.
- QR reissue without exposing the underlying AOID body.
- Delegated delivery authority.
- Address credential binding.
- Recovery workflows.
- Inheritance or transfer workflows, if separately governed.

Open-source safety note.

AOID security must not rely on hidden source code. It must rely on standard cryptographic assumptions, domain separation, key hygiene, replay protection, revocation, and clear authority rules. An open-source implementation should make the relation and verification rules inspectable.



# 11. Duplicate Prevention and Nullifiers

Duplicate prevention is one of the most practical uses of zero-knowledge address predicates.

Problem.

A service may need to prevent repeated registration of the same hidden address, the same AOID, or the same address-AOID-region tuple. But it should not need to learn the address.

Definition 11.1, Nullifier.

A nullifier is a deterministic public value

`N = H(domain, hidden_tuple, secret)`

where `domain` is public and `hidden_tuple` may include address commitment, AOID commitment, region level, and registration purpose. The nullifier is designed so that the same hidden tuple in the same domain produces the same `N`, while different domains produce unlinkable values.

Definition 11.2, Duplicate-prevention relation.

`R_dup(w, y)` holds if:

1. `w` contains the hidden address, AOID, region, and nullifier secret.
2. The public nullifier equals the domain-separated nullifier for the hidden tuple.
3. The credential or AMT envelope is valid when required.
4. The public statement names the duplicate-prevention domain.
5. The proof hides address, AOID body, person, phone, unit, and owner-device secret.

Theorem 11.3, Nullifier duplicate-prevention theorem.

If the nullifier function is deterministic, collision-resistant in the relevant domain, and domain-separated, then a verifier can reject duplicate registrations for the same hidden tuple in the same domain without learning the tuple.

Proof.

For the same hidden tuple and same domain, determinism yields the same nullifier. The verifier stores used nullifiers and rejects repeats. For different tuples, collision resistance makes accidental or adversarial collisions negligible. Domain separation prevents nullifiers for one context from linking the same hidden tuple in another context. Zero-knowledge hides the tuple used to compute the nullifier. QED.

Counterexample 11.4, Global nullifier.

If the same nullifier is reused across all services and purposes, the nullifier becomes a cross-service tracking identifier. Therefore every nullifier must include an explicit domain and purpose.

Corollary 11.5.

Duplicate prevention should use the narrowest domain that satisfies the application: for example, "same address, same AOID, same city, same registration campaign", not "same address everywhere forever".



# 12. PID Issuance Audit Proof

PID issuance is a high-risk action. A PID may become a durable reference in the system. AMT I requires that issuance not occur merely because a string looked plausible. It should occur only after candidate generation, clustering, unresolved gating, history update, and issuance gates are satisfied.

Definition 12.1, PID issuance workflow.

A PID issuance workflow is a trace

`T = (G, C, U, H, I)`

where:

`G` is candidate generation evidence.

`C` is clustering evidence.

`U` is unresolved-gate evidence.

`H` is history-update evidence.

`I` is issuance evidence.

Definition 12.2, PID issuance audit relation.

`R_pid_audit(w, y)` holds if:

1. `w` contains a hidden issuance workflow trace `T`.
2. Each required workflow gate in `T` passed.
3. The unresolved gate did not require abstention.
4. The issued PID equals or is bound to the public PID commitment.
5. Quality metrics satisfy public thresholds when required.
6. Raw input address, raw candidates, raw clusters, user history, recipient, AOID, and owner-device secret remain hidden.

Theorem 12.3, PID Issuance Audit theorem.

Under Axioms A1, A2, A8, and A9, a valid PID Issuance Audit Proof proves that a PID passed the required AMT issuance workflow gates without revealing the raw address, candidate set, clusters, or user history.

Proof.

Axiom A1 defines semantic workflow validity. The proof relation encodes or verifies commitments to each required step. Soundness implies the accepted proof has a witness trace satisfying those gates. Binding prevents changing the trace after commitment. Zero-knowledge hides raw workflow data. Therefore the verifier learns that the PID issuance was procedurally valid, not the private contents of the procedure. QED.

Corollary 12.4.

A registry can audit PID issuance quality without exposing sensitive user histories or unresolved candidate traces.

Limitation 12.5.

The proof does not prove that all external data sources were complete. It proves that the declared workflow, sources, thresholds, and gates were satisfied.



# 13. Freshness and Revocation

Addresses change. Credentials expire. People move. Delivery zones change. Administrative boundaries shift. An old valid proof can become false.

Definition 13.1, Freshness window.

A freshness window is an interval

`[issued_at, fresh_until]`

within which a credential, root, AMT envelope, or proof statement is accepted.

Definition 13.2, Revocation root.

A revocation root is a public commitment to a revocation state, such as a Merkle root, accumulator root, registry root, or transparency-log checkpoint.

Definition 13.3, Freshness and revocation relation.

`R_fresh(w, y)` holds if:

1. The hidden credential or envelope is inside the public freshness window.
2. The credential is not revoked according to the public revocation root.
3. The root is accepted by the verifier's registry policy.
4. The proof hides credential body, subject, address, revocation handle, revocation list path, and proof salt except for allowed public status fields.

Theorem 13.4, Freshness and revocation safety theorem.

If verifiers enforce freshness windows and accepted revocation roots, then expired or revoked credentials cannot be accepted except through issuer error, registry error, proof-system failure, or verifier misconfiguration.

Proof.

The proof relation requires non-expiration and non-revocation. Soundness gives a witness satisfying these conditions. If a credential is expired or revoked according to the accepted root, no valid witness exists. Thus acceptance can occur only if a premise fails: the root is wrong, the issuer is wrong, the proof system is broken, or the verifier checked the wrong policy. QED.

Corollary 13.5.

Every long-lived address proof family should include either a freshness check, a revocation check, or an explicit statement that the claim is historical rather than current.



# 14. Consent and Purpose Scope

Address proofs are not merely technical objects. They carry use limitations.

Definition 14.1, Purpose scope.

A purpose scope is a public label and policy object stating what the proof may be used for, such as delivery, registration, address verification, audit, fraud prevention, emergency use, cloud sync, or research analytics.

Definition 14.2, Consent scope relation.

`R_scope(w, y)` holds if:

1. The proof is created for a declared purpose.
2. The witness credential or user authorization allows that purpose.
3. The public statement includes a challenge or transaction context.
4. The proof reveals only the data scopes authorized for the purpose.

Theorem 14.3, Purpose-scope safety theorem.

If all verifiers reject proofs whose scope does not match the requested operation, then a proof issued for one purpose cannot be accepted for another purpose by a compliant verifier.

Proof.

The verifier's acceptance condition includes equality or policy compatibility between requested purpose and proof scope. If the proof scope differs and policy does not allow reuse, acceptance fails. Challenge binding further prevents replay into a different session. QED.

Counterexample 14.4, Scope-blind verifier.

If a verifier ignores scope, a delivery proof may be reused as an identity proof. This is a verifier failure, not a zero-knowledge failure.

Design rule.

Purpose scopes should be human-readable, machine-checkable, versioned, and included in the proof transcript or signed envelope.



# 15. Anonymous Rate Limiting

Private systems still need abuse control. Anonymous rate limiting lets a service limit requests without identifying users.

Definition 15.1, Rate-limit bucket nullifier.

For a time bucket or policy bucket `b`, the prover computes

`N_b = H(rate_domain, b, subject_secret)`

and proves knowledge of the hidden `subject_secret` without revealing identity.

Definition 15.2, Anonymous rate-limit relation.

`R_rate(w, y)` holds if:

1. The prover knows a valid subject secret or credential.
2. The public bucket nullifier is correctly derived.
3. The request is inside the allowed bucket policy.
4. Hidden subject id, address, AOID, AGID, PID, device id, IP address, and proof salt are not revealed.

Proposition 15.3.

Anonymous rate limiting is compatible with private address predicates if bucket nullifiers are domain-separated from address duplicate nullifiers.

Proof.

If nullifier domains differ, equality of nullifiers across families is not expected and cannot be used to link the same subject. If domains are accidentally shared, linkability can occur. Therefore compatibility requires domain separation. QED.

Use cases include API request throttling, proof request limits, shopping agent quote limits, and anti-spam controls for credential presentation.



# 16. PID History Update and Merge/Split Proofs

Addresses and references change over time. A PID may be updated, merged, split, or migrated. AMT I treats this as address lineage rather than simple replacement.

Definition 16.1, PID lifecycle operation.

A PID lifecycle operation is one of:

`history_update`

`merge`

`split`

`migration`

`retirement`

Definition 16.2, PID lifecycle proof relation.

`R_life(w, y)` holds if:

1. `w` contains hidden prior history roots and proposed new history roots.
2. The operation is allowed by AMT lineage rules.
3. Merge or split conditions are satisfied.
4. Required conflict and freshness gates pass.
5. Public commitments bind prior and new states.
6. Raw address events, candidates, clusters, partitions, AOID, recipient, and owner-device secret remain hidden.

Theorem 16.3, Lifecycle legitimacy theorem.

Under AMT lineage validity and proof-system soundness, a PID lifecycle proof can establish that a merge, split, or history update followed declared lineage rules without revealing raw address history.

Proof.

The proof relation encodes the lifecycle rule or verifies a committed execution trace. Soundness gives an existing witness trace satisfying the rule. Binding prevents changing old and new roots. Zero-knowledge hides raw history. QED.

Counterexample 16.4, Unchecked split.

If a split operation is accepted without proving partition validity, one entity may be falsely split into several PIDs. Therefore split proofs must encode partition, evidence, or governance rules.



# 17. Quality Threshold Proofs

Many address decisions depend on quality scores. A system may need to know that a credential or AMT result is good enough without seeing exact scores or raw evidence.

Definition 17.1, Quality score.

A quality score is a value

`q in [0, 1]`

or a structured vector summarizing confidence, source reliability, address formatting quality, geographic precision, postal evidence, delivery evidence, language quality, and conflict risk.

Definition 17.2, Quality threshold relation.

`R_quality(w, y)` holds if:

1. The hidden quality object computes or commits to a score `q`.
2. `q >= tau` for public threshold `tau`.
3. Required component floors pass when specified.
4. Exact score, raw components, reasons, raw validation, raw sources, hidden address, and subject id remain hidden.

Theorem 17.3, Quality threshold theorem.

Under soundness and binding assumptions, a valid quality threshold proof establishes that a hidden quality score satisfies the public threshold without revealing the exact score.

Proof.

The proof relation includes the inequality `q >= tau` and commitment openings to `q` or its computation. Soundness implies existence of such a `q`. Zero-knowledge hides the exact score and components except for the threshold result. QED.

Design warning.

A public threshold itself may reveal information if only a small population can satisfy it. For example, "quality >= 0.99 in a remote region with one official source" may reveal more than intended. Threshold predicates need disclosure-risk review.



# 18. Proof Bundle Compatibility

Real applications rarely use one proof alone. A delivery checkout may require delivery eligibility, freshness, consent scope, anonymous rate limiting, and AOID ownership delegation. A PID registry may require PID audit, issuer trust, revocation, and duplicate prevention.

Definition 18.1, Proof descriptor.

A proof descriptor summarizes a proof envelope:

`D = (version, family, scope, challenge, issuer, issued_at, expires_at, commitments, nullifiers, hides, reveals)`

Definition 18.2, Proof bundle.

A proof bundle is a finite sequence of proof descriptors and proof bodies:

`B = ((D_1, pi_1), ..., (D_n, pi_n))`

Definition 18.3, Bundle compatibility.

A bundle is compatible if:

1. Required proof families are present.
2. Proof versions are accepted.
3. Scopes are equal or policy-compatible.
4. Challenges are equal or policy-compatible.
5. Validity windows overlap at verification time.
6. Issuers are trusted for their families.
7. Nullifiers do not collide unless intended.
8. Shared commitments are consistent.
9. Revealed fields do not violate the privacy policy of another proof.
10. No proof depends on a hidden field that another proof contradicts.

Theorem 18.4, Bundle compatibility theorem.

If every proof in a bundle is valid and the bundle compatibility relation accepts, then the verifier may treat the public claims as jointly valid for the common accepted scope and challenge, subject to the assumptions of each proof family.

Proof.

Individual proof validity gives each claim separately. Compatibility checks prevent mismatched scopes, replayed challenges, expired combinations, issuer conflicts, duplicate nullifier conflicts, and commitment contradictions. Therefore the public claims may be composed within the accepted bundle policy. QED.

Counterexample 18.5, Individually valid but jointly invalid.

A ZK Address Proof may be valid for "Japan resident", and a delivery proof may be valid for a different address credential in "EU delivery zone". If the verifier combines them without checking shared subject or commitment compatibility, the bundle may falsely imply that the same hidden address satisfies both. Bundle compatibility prevents this.



# 19. Security and Privacy Analysis

This section lists the main risks and mitigations.

## 19.1 Linkability

Risk.

Repeated proofs may reveal that the same user, address, AOID, or credential is involved.

Mitigations.

Use domain-separated nullifiers, fresh challenges, rotating commitments, selective disclosure, and purpose-specific proof scopes. Avoid global nullifiers unless the purpose explicitly requires global uniqueness.

## 19.2 Predicate leakage

Risk.

The public predicate may be narrow enough to identify the address.

Mitigations.

Estimate anonymity sets. Block or warn on singleton and low-population predicates. Use coarser predicates when possible. Separate internal risk scores from user-facing labels.

## 19.3 Replay

Risk.

A proof accepted once may be reused elsewhere.

Mitigations.

Bind proofs to verifier challenge, transaction id, time window, scope, and audience.

## 19.4 Stale credentials

Risk.

The user moved or the delivery zone changed.

Mitigations.

Use freshness windows, revocation roots, issuer checks, and short-lived proofs for operational predicates.

## 19.5 Issuer forgery or issuer overreach

Risk.

A malicious issuer creates false credentials or signs claims outside its authority.

Mitigations.

Use issuer trust registries, issuer scope policies, transparency logs, revocation, audit proofs, and governance review.

## 19.6 Scope violation

Risk.

A proof intended for delivery is used for identity verification or marketing.

Mitigations.

Purpose scopes must be machine-checked. Verifiers must reject scope mismatch. Proof bundles must enforce common scope policy.

## 19.7 AMT ambiguity laundering

Risk.

An unresolved or ambiguous address is converted into a confident private proof.

Mitigations.

Enforce unresolved safety. Proofs must not claim resolved facts unless the AMT envelope passed required gates. Proofs about uncertainty should explicitly state uncertainty.

## 19.8 Implementation-envelope confusion

Risk.

A ZK-ready TypeScript envelope is mistaken for a production cryptographic proof.

Mitigations.

Label proof envelopes with backend status, such as `zkReady: true` and `zkpGenerated: false`, until real SNARK, STARK, or zkVM proofs are generated and audited.

## 19.9 Side channels

Risk.

Timing, proof size, issuer choice, region version, or error messages reveal sensitive data.

Mitigations.

Normalize error messages, batch verification, pad or bucket metadata, and avoid returning hidden failure reasons to untrusted verifiers.

## 19.10 Anti-surveillance and censorship-resistance obligations

Risk.

A private address proof system can still become a surveillance system if it exposes a reusable AOID, stores plaintext addresses on a central server, reuses nullifiers across purposes, or forces all issuance and verification through one operator. In that failure mode, cryptography may hide a single proof witness while the surrounding system links deliveries, residence checks, shopping-agent actions, credential refreshes, and audit events into a cross-purpose behavioral profile.

Mitigations.

The design must treat anti-surveillance as a system property, not merely as a proof-system property.

First, full address disclosure should be replaced by private predicates whenever the verifier only needs a limited fact. Examples include "resident in Japan", "inside Tokyo", "inside a delivery zone", "same address resident", "AOID authority valid", or "PID issuance audit passed". The full street address, recipient name, phone number, apartment unit, exact private coordinates, AOID body, private address history, credential witness, and proof salts remain hidden.

Second, AOID must not be a public tracking identifier. Public flows should use purpose-specific commitments and domain-separated nullifiers. A nullifier used for duplicate registration must not be reused for delivery eligibility, residence verification, marketing, identity checks, or shopping-agent authorization. Formally, nullifier derivation should include at least the proof family, purpose scope, audience, issuer policy, region or policy version, and challenge domain.

Third, central servers must not persist plaintext addresses, plaintext AOID records, raw resolution histories, raw candidates, raw clusters, raw proof witnesses, or private proof salts. If server or cloud storage is required, it should store owner-device encrypted AOID envelopes, public roots, descriptors, hashes, commitments, and redacted audit events only.

Fourth, issuer trust, revocation, and freshness should be publicly verifiable without revealing the address. Verifiers should be able to check issuer trust roots, revocation roots, freshness windows, policy hashes, and proof-bundle compatibility without receiving the hidden credential body.

Fifth, deployment should avoid a single chokepoint where one operator can observe all address-related proof usage. Self-hosting, offline credential issuance, offline proof presentation, mirror distribution, onion-friendly endpoints, and portable open-source data packs should be supported where feasible. These mechanisms do not prove anonymity by themselves, but they reduce mandatory central observation.

Sixth, the implementation should be open source, reproducibly built where feasible, released with checksums or signatures, and subject to external security review. Production ZK claims require circuit or protocol audits; TypeScript proof envelopes are implementation scaffolds, not audited cryptographic proof systems.

Theorem 19.10.1, Non-linkability requires domain separation beyond zero knowledge.

Even if each proof family is zero-knowledge, cross-purpose linkability may occur when the same public AOID, commitment, or nullifier is reused across domains. Therefore, zero-knowledge of the witness is not sufficient for anti-surveillance. Domain separation of public identifiers is required.

Proof.

Assume two verifiers receive proofs whose witnesses are hidden, but both transcripts contain the same public value `z`. If `z` is a global AOID, global commitment, or reused nullifier, the verifiers can conclude that the two proofs share the same subject or address relation, regardless of witness privacy. The link is created by the public value, not by breaking zero knowledge. If `z` is instead derived under different domains, for example `z_delivery = F(secret, domain_delivery)` and `z_residence = F(secret, domain_residence)`, equality across domains is no longer exposed unless intentionally designed. QED.



# 20. Verification Plan

The claims in this paper have different verification methods.

## 20.1 Lean-formalizable claims

Lean or another proof assistant can formalize:

- Non-substitution of semantic validity and cryptographic privacy.
- Missing required attributes prevent attribute gates.
- Predicate injectivity implies public-claim leakage.
- Stale freshness prevents issue under freshness gates.
- Gate failure blocks PID issuance.
- Scope mismatch blocks acceptance by a compliant verifier.
- Nullifier domain separation prevents intended cross-domain equality.
- Bundle compatibility as a finite predicate over descriptors.

These are structural and logical claims. They do not require real GIS data.

## 20.2 GIS-testable claims

GIS experiments can test:

- Region membership predicates.
- Boundary-version sensitivity.
- City, country, island, river, lake, desert, wetland, mountain, and natural-feature coverage.
- Anonymity-set estimates for public predicates.
- Delivery zone membership under public or carrier-provided regions.
- Address-quality thresholds across urban, rural, island, desert, polar, and informal-addressing contexts.

These experiments should be recorded as fixtures with source licenses and versioned datasets.

## 20.3 Implementation tests

Implementation tests can verify:

- Proof envelope schemas.
- Hidden and revealed field policies.
- Purpose scope enforcement.
- Challenge binding.
- Nullifier determinism and domain separation.
- Freshness and revocation envelope checks.
- Proof bundle compatibility.
- PID audit required-step enforcement.
- AOID ownership proof validation.
- Anonymous rate-limit bucket behavior.

These tests do not replace cryptographic audits, but they catch application-layer mistakes.

## 20.4 Circuit and cryptographic audits

Production ZK backends require:

- Circuit specification.
- Witness encoding review.
- Constraint review.
- Soundness assumptions.
- Zero-knowledge assumptions.
- Trusted setup analysis when relevant.
- Hash and commitment choices.
- Range checks and boundary checks.
- Merkle or accumulator proof correctness.
- Recursive or bundled proof composition review.
- Side-channel review.

For the current AGID/AOID codebase, the TypeScript layer should remain the orchestration layer. The heavy cryptographic backend may be better implemented in Rust, Noir, Circom, Halo2, Plonky-style systems, RISC Zero, SP1, or another audited stack depending on performance and portability.



# 21. Use Cases

## 21.1 E-commerce and shopping agents

A merchant or shopping agent can ask:

- Is this hidden address inside a delivery region?
- Is the credential fresh?
- Is the purchase purpose authorized?
- Has this address-AOID-region tuple already registered for a one-per-household campaign?

The merchant does not need the full address until order finalization.

## 21.2 Delivery and logistics

A delivery provider can use two stages:

1. Proof-only eligibility check.
2. Scoped disclosure to authorized carrier for actual routing.

This supports privacy-preserving quote generation, route availability, locker compatibility, and restricted-area checks.

## 21.3 Residence eligibility

A service can verify country, state, city, or district residence without collecting full address. This may apply to local benefits, municipal services, regional age rules, education zones, or disaster aid.

## 21.4 Humanitarian identity

Disaster victims, refugees, or people without stable formal addresses may receive temporary or virtual address credentials. Proofs can show eligibility for aid distribution, shelter assignment, or regional service access while limiting disclosure of vulnerable location data.

## 21.5 AOID management

AOID owners can prove authority to update, delegate, recover, or reissue an AOID without exposing the AOID body or private address details.

## 21.6 PID registry audit

A registry can require PID issuance audit proofs before accepting new persistent identifiers. This creates accountability without publishing sensitive raw candidates.

## 21.7 Credential marketplaces and issuer ecosystems

Trusted issuers may issue credentials for residence, delivery eligibility, disaster status, address quality, ownership authority, or history continuity. AMT II supplies the predicate language; governance supplies issuer trust.



# 22. Limitations

AMT II has hard limits.

First, zero-knowledge does not prove that the real world is true. It proves that a hidden witness satisfies a formal relation. If the witness is a false credential, the proof can still be valid.

Second, AMT does not provide cryptographic privacy. It structures address meaning. Privacy requires cryptographic design and careful public statement selection.

Third, public predicates can leak. "Inside this city" may be safe in Tokyo and unsafe in a tiny settlement. The system needs disclosure-risk scoring.

Fourth, delivery eligibility is not delivery success. A road may be closed. A building entrance may be inaccessible. Weather, customs, human behavior, and carrier policy can change.

Fifth, issuer governance is central. Without trustworthy issuers, revocation, transparency, and audits, private proofs can become a wrapper around bad data.

Sixth, current TypeScript proof envelopes are not production ZK proofs. They are a useful implementation scaffold, but production deployment requires audited cryptographic backends.

Seventh, legal acceptance differs by jurisdiction. A private proof may be technically sound but legally insufficient for some identity, residence, tax, or delivery requirements.



# 23. Conclusion

Address Morphism Theory II proposes a companion layer for private address-derived facts. AMT supplies the semantics: what the address refers to, how candidates are generated, when ambiguity remains unresolved, how persistent identifiers are issued, how history changes, and which attributes are derivable. Zero-knowledge proofs supply selective disclosure: which facts can be proven without revealing the underlying address.

The result is not "private addresses by default" in a simplistic sense. It is a predicate framework. A verifier asks for a specific address-derived fact. The prover supplies a proof. The proof is accepted only if the semantic source, issuer, freshness, revocation, scope, challenge, compatibility, and cryptographic relation all pass.

This framework makes it possible to build private residence proofs, delivery eligibility proofs, AOID ownership proofs, duplicate-prevention nullifiers, PID issuance audit proofs, quality threshold proofs, and proof bundles for shopping agents or logistics systems. It also gives a disciplined language for saying when not to use zero-knowledge, when to disclose, and when a claim is too narrow to be private.

The central contribution is therefore a boundary:

AMT is address meaning.

ZKP is private proof of selected address meaning.

Keeping that boundary explicit is what makes the theory useful, auditable, and safe to implement.



# Appendix A. Mathematical Inventory

This appendix collects the core formal objects.

## A.1 Spaces

`S_t`: address expressions at time `t`.

`E_t`: addressable entities at time `t`.

`A_t`: attribute space at time `t`.

`P`: persistent identifiers.

`W`: witness space.

`Y`: public statement space.

`Pi`: proof object space.

`D`: proof descriptor space.

## A.2 AMT maps

`parse_t: S_t -> Tokens_t`

`expand_t: Tokens_t -> CandidateSet_t`

`cluster_t: CandidateSet_t -> Partitions_t`

`resolve_t: Partitions_t -> Resolved + Unresolved + Conditional`

`issue_t: Resolved -> P`

`hist_t: P x Event_t -> P x History_t`

`attr_t: P -> A_t`

## A.3 ZK maps

`commit: W -> Commitments`

`nullify: Domain x W -> Nullifier`

`prove: W x Y -> Pi`

`verify: Y x Pi -> Bool`

`bundle_verify: Bundle -> Bool`

## A.4 Predicate families

`R_addr`: address-region predicate.

`R_res`: residence credential predicate.

`R_deliv`: delivery eligibility predicate.

`R_aoid`: AOID ownership predicate.

`R_dup`: duplicate-prevention nullifier predicate.

`R_pid_audit`: PID issuance audit predicate.

`R_fresh`: freshness and revocation predicate.

`R_scope`: consent and purpose-scope predicate.

`R_rate`: anonymous rate-limit predicate.

`R_life`: PID lifecycle predicate.

`R_quality`: quality threshold predicate.

`R_bundle`: proof bundle compatibility predicate.



# Appendix B. Definitions, Lemmas, Theorems, and Corollaries

## B.1 Definitions

Definition B.1, Privacy-safe predicate.

A predicate is privacy-safe for a population model if its public statement leaves an anonymity set above a policy threshold and does not reveal prohibited fields.

Definition B.2, Address-derived attribute.

An address-derived attribute is any attribute computed from, credentialed by, or semantically associated with an AMT envelope or address credential.

Definition B.3, AMT witness.

An AMT witness is hidden data sufficient to prove an AMT-derived predicate: address expression, credential, resolution trace, history root, quality object, or persistent identifier relation.

Definition B.4, Proof backend status.

A proof backend status is metadata indicating whether a proof object is an envelope only, simulated proof, SNARK proof, STARK proof, zkVM proof, or other audited proof.

## B.2 Lemmas

Lemma B.5, Missing-attribute gate.

If a predicate requires attribute `a` and the witness credential does not contain `a` or a derivation of `a`, the proof relation cannot be satisfied.

Proof.

The relation includes membership or derivability of `a`. Without it, no witness satisfies the relation. QED.

Lemma B.6, Expired credential gate.

If current verification time is outside the freshness window and no historical claim is requested, the freshness relation cannot be satisfied.

Proof.

The relation includes `now <= fresh_until`. If false, no satisfying witness exists. QED.

Lemma B.7, Scope mismatch rejection.

A compliant verifier rejects a proof whose scope is incompatible with the requested operation.

Proof.

Compliance includes scope checking. Incompatibility makes the acceptance predicate false. QED.

Lemma B.8, Challenge mismatch rejection.

A compliant verifier rejects a challenge-bound proof if its challenge differs from the verifier's active challenge.

Proof.

The acceptance predicate includes challenge equality or approved challenge derivation. If it fails, verification fails. QED.

Lemma B.9, Public injectivity leakage.

If a public predicate is injective over the relevant population, then proving that predicate identifies the hidden value in that population.

Proof.

An injective predicate maps each hidden value to a unique public claim. Observing the claim selects at most one hidden value. QED.

Lemma B.10, Coarse predicate indistinguishability.

If many hidden addresses satisfy the same public predicate and proofs are zero-knowledge with unlinkable commitments, the transcript does not distinguish which satisfying address is used beyond the public predicate.

Proof.

Zero-knowledge gives a simulator producing indistinguishable transcripts from the public statement. Since the public statement is shared by many witnesses and commitments are unlinkable, transcript information does not select a specific witness. QED.

## B.3 Main theorems

Theorem B.11, Minimum disclosure theorem.

For every address predicate represented by a relation `R_pred`, the verifier need not receive any witness field that is not required by the public statement, verifier policy, or abuse-prevention mechanism, assuming the proof backend is zero-knowledge.

Proof.

By definition, the witness is private. The proof transcript reveals only the public statement and whatever metadata is intentionally included. Zero-knowledge hides all other witness fields. Therefore unnecessary witness fields need not be disclosed. QED.

Theorem B.12, Credential-backed predicate theorem.

If a trusted, fresh, non-revoked credential contains or implies a predicate `p`, and `p` is circuit-representable, then a prover can prove `p` without revealing the credential body, under the proof-system assumptions.

Proof.

The witness contains the credential and opening. The relation verifies issuer trust, signature or commitment, freshness, non-revocation, and predicate derivation. Completeness gives proof generation for honest witnesses. Zero-knowledge hides the body. QED.

Theorem B.13, AMT-backed predicate theorem.

If an AMT envelope validly derives an attribute `a` from an address reference, and the derivation or its committed trace is circuit-representable, then a prover can prove `a` without revealing the raw address trace, under the proof-system assumptions.

Proof.

The witness contains the AMT envelope or committed trace. The relation checks the derivation. Soundness ensures accepted proofs have a valid witness. Zero-knowledge hides raw trace data. QED.

Theorem B.14, Non-truth theorem.

No zero-knowledge address proof alone establishes real-world truth beyond the validity of its formal witness relation and trusted sources.

Proof.

The proof relation is formal. It verifies consistency with a witness and public statement. If trusted sources are wrong, stale, or socially invalid, the formal relation can still hold. Real-world truth requires assumptions outside the cryptographic proof. QED.

Theorem B.15, Compatibility theorem.

If proof descriptors pass bundle compatibility and each proof verifies, then the bundle is accepted only for the intersection of compatible scopes, challenges, validity windows, and issuer policies.

Proof.

Bundle compatibility computes these intersections and rejects conflicts. Therefore no proof can extend the bundle beyond the common accepted policy. QED.

## B.4 Corollaries

Corollary B.16.

Address disclosure can be delayed until the operational phase that truly requires it.

Corollary B.17.

For many digital services, "eligible", "resident", "inside region", or "not duplicate" is enough; full address collection is excessive.

Corollary B.18.

Private address proofs require governance as much as cryptography.

Corollary B.19.

Address privacy is not binary. It is a function of predicate granularity, population size, scope, metadata, and proof reuse.



# Appendix C. Counterexamples and Failure Modes

## C.1 Perfect proof, false credential

A malicious issuer signs "resident in City X" for a non-resident. The ZK proof is valid. The real-world claim is false. Mitigation: issuer trust, audit, revocation, liability, and transparency.

## C.2 Valid proof, unsafe predicate

A user proves "inside village V" where only one household is eligible. The proof hides the address cryptographically but reveals it practically. Mitigation: anonymity-set policy.

## C.3 Valid proof, wrong scope

A user gives a delivery proof. A verifier uses it for identity verification. Mitigation: scope checking and challenge binding.

## C.4 Valid individual proofs, invalid bundle

Two proofs refer to different hidden addresses. If combined naively, they imply a false joint claim. Mitigation: commitment compatibility.

## C.5 Duplicate prevention becomes tracking

A global nullifier is used for all registrations. Every service can link the user. Mitigation: domain-separated nullifiers.

## C.6 Unresolved address converted to resolved proof

An ambiguous address has several plausible candidates. A proof is issued as if resolution were final. Mitigation: unresolved safety and PID issuance audit.

## C.7 Stale delivery zone

A delivery proof is generated from an old carrier zone. The package is no longer deliverable. Mitigation: freshness windows and short-lived carrier roots.

## C.8 Envelope mistaken for cryptographic proof

A TypeScript proof object says `zkReady` but no actual proof backend generated a SNARK, STARK, or zkVM proof. Mitigation: backend status metadata and verifier policy.



# Appendix D. Implementation Mapping

The current AGID/AOID implementation already contains several AMT II-aligned modules. This manuscript treats them as application-layer proof envelopes and predicate runtimes.

## D.1 Private address predicates

Module: `src/lib/privateAddressPredicateProof.ts`

Implemented predicate families include verified address, delivery region, same-address resident, country resident, and city resident. Hidden fields include address text, credential body, postal code, road, house number, building, unit, recipient, phone, coordinate, region geometry, identity subject, credential salt, and proof salt.

## D.2 ZK Address, Residence, and Delivery wrappers

Module: `src/lib/agidZkAddressProofs.ts`

The implementation defines separate scopes for ZK Address Proof, ZK Residence Proof, and ZK Delivery Eligibility. This matches the separation in Sections 7 through 9.

## D.3 AOID ownership

Module: `src/lib/aoidOwnershipProof.ts`

The implementation supports owner-key, address-credential, and combined methods while hiding AOID body and owner private data.

## D.4 Duplicate nullifiers

Module: `src/lib/addressDuplicateNullifier.ts`

The implementation models duplicate prevention for address, AOID, and region domains while hiding the underlying tuple.

## D.5 PID issuance audit

Module: `src/lib/pidIssuanceAudit.ts`

The implementation records required workflow steps: candidate generation, clustering, unresolved gate, history update, and PID issuance.

## D.6 Freshness and revocation

Module: `src/lib/addressCredentialFreshnessProof.ts`

The implementation models issuer, credential layer, revocation status, registry root, freshness window, and hidden credential fields.

## D.7 Consent and purpose scope

Module: `src/lib/consentPurposeScopeProof.ts`

The implementation separates purposes such as address verification, delivery, cloud sync, quality assistance, registration, PID issuance, audit, fraud prevention, support, emergency, and research analytics.

## D.8 Anonymous rate limit

Module: `src/lib/anonymousRateLimitProof.ts`

The implementation separates bucket nullifier and request nullifier while hiding subject and address-linked fields.

## D.9 PID lifecycle

Module: `src/lib/pidLifecycleProof.ts`

The implementation models history update, merge, and split operations with hidden raw history data.

## D.10 Quality thresholds

Module: `src/lib/qualityThresholdProof.ts`

The implementation proves threshold satisfaction while hiding exact scores, components, raw validation, sources, address, and subject identifiers.

## D.11 Bundle compatibility

Module: `src/lib/zkProofCompatibility.ts`

The implementation defines proof descriptors, known proof versions, private field names, commitment paths, nullifier paths, and compatibility checks.

## D.12 Registry and anchoring

Relevant modules include proof bundle registry, credential issuer trust registry, revocation/freshness root anchoring, Polkadot adapter, and API endpoint modules. These correspond to issuer trust, root anchoring, and proof publishing layers.



# Appendix E. Backend Roadmap

The current implementation is suitable as a typed policy and envelope layer. A production cryptographic system should add at least one of the following backends.

## E.1 Region membership circuit

Inputs:

- Hidden coordinate or committed geocell.
- Public region identifier.
- Public boundary root or cell-cover root.
- Hidden Merkle path or cell membership proof.

Output:

- Region membership true or false.

Use:

- Country, city, EU, delivery zone, disaster area, and service coverage predicates.

## E.2 Credential presentation circuit

Inputs:

- Hidden credential.
- Issuer public key.
- Hidden attribute opening.
- Revocation witness.

Output:

- Predicate attribute satisfied, credential fresh, credential not revoked.

Use:

- Residence, delivery eligibility, issuer-backed address credentials.

## E.3 AOID ownership circuit

Inputs:

- Hidden AOID private key or delegated credential.
- Public AOID commitment or key fingerprint.
- Challenge and scope.

Output:

- Ownership or delegation authority.

Use:

- AOID update, QR reissue, delegated delivery, recovery.

## E.4 Nullifier circuit

Inputs:

- Hidden address commitment.
- Hidden AOID commitment.
- Hidden region id or region commitment.
- Nullifier secret.
- Public domain.

Output:

- Public nullifier.

Use:

- Duplicate registration prevention.

## E.5 PID audit zkVM program

Inputs:

- Hidden AMT workflow trace.
- Public workflow policy.
- Public PID commitment.

Output:

- Required gates passed.

Use:

- Registry audit and high-assurance PID issuance.

## E.6 Bundle verifier

Inputs:

- Proof descriptors.
- Proof verification outputs.
- Public policies.

Output:

- Bundle accepted or rejected.

Use:

- Shopping agent, delivery checkout, registry audit, humanitarian workflows.

Backend selection should be pragmatic. Simple predicates can use compact SNARK circuits. Complex AMT workflow audits may be better suited to zkVMs or transparent proof systems. The application layer should expose a stable proof-envelope format so that backends can evolve without rewriting the entire product.



# Appendix F. Relationship to Address Morphism Theory I

AMT I is the base theory. It studies address meaning, address reference, candidate generation, clustering, unresolved states, PID issuance, history, address compression, address relativity, address conservation, and address reference impossibility.

AMT II is not a replacement for that theory. It is a companion framework.

AMT I asks:

What does this address mean?

AMT II asks:

Which fact about that meaning can be proven privately?

AMT I studies ambiguity.

AMT II prevents ambiguity from being laundered into false private certainty.

AMT I studies history.

AMT II proves selected history or lifecycle predicates without revealing raw history.

AMT I studies address-derived attributes.

AMT II proves selected attributes under scope, freshness, revocation, and privacy constraints.

This distinction should be preserved in publications. AMT I should remain a semantic and mathematical paper. AMT II should be a privacy, credential, and proof-system companion paper. AGID and AOID should be treated as applications of the two theories, not as definitions of the theories themselves.
