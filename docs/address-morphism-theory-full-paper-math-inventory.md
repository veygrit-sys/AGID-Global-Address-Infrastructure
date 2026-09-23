# Address Morphism Theory Full English Paper: Mathematical Inventory

Date: 2026-06-06

This file collects the definitions, axioms, propositions, lemmas, theorems, and
corollaries that should appear in the full English AMT paper. It separates
formally verified items from empirical or programmatic claims.

## Core Notation

| Symbol | Meaning |
| --- | --- |
| \(t\) | time or version index |
| \(S_t\) | surface address-expression space at time \(t\) |
| \(X_t\) | addressable entities at time \(t\) |
| \(O_t : X_t \to S_t\) | observation or expression map |
| \(u \in S_t\) | user or system input expression |
| \(\Phi_t(u)\) | candidate generator output |
| \(N_t\) | normalized address candidate space |
| \(D_{c,t}\) | context-dependent directed structural dissimilarity |
| \(\Pi_{\delta,t}\) | clustering or partition induced by threshold \(\delta\) |
| \(\kappa_t\) | quotient or cluster projection |
| \(C_t(u)\) | candidate clusters for input \(u\) |
| \(E_t(c;u,\chi)\) | evidence or energy score for cluster \(c\) |
| \(\chi\) | context, including purpose, language, jurisdiction, and risk tolerance |
| \(\tau\) | quality, energy, or risk threshold |
| \(\Delta\) | separation margin between best and second-best clusters |
| \(Y_t(u)\) | resolution outcome |
| \(\psi_t(c)\) | PID issuance map |
| \(L_t\) | address lineage graph or ledger |
| \(Q_t\) | internal quality score |

## Definitions

### Definition 1: Addressable Entity

An addressable entity is any physical, social, institutional, operational,
natural, cultural, or virtual referent that can be the target of an address-like
expression in a declared context.

### Definition 2: Surface Address Expression

A surface address expression is any human- or machine-supplied reference string
or code, including postal address text, postal code, facility name, coordinate
label, natural place name, historical name, PID, AGID-like public reference, or
AOID-like private reference pointer.

### Definition 3: Observation Map

An observation map \(O_t : X_t \to S_t\) assigns to an entity an observable
address expression or expression class. AMT does not assume that \(O_t\) is
injective.

### Definition 4: Candidate Generator

\(\Phi_t : S_t \to \mathcal{P}_{fin}(N_t)\) maps an input expression to a finite
candidate set. Candidate finiteness is required for algorithmic selection, but
candidate completeness is an empirical property.

### Definition 5: Directed Structural Dissimilarity

\[
D_{c,t}(a,b) =
  \lambda_g d_g(a,b) +
  \lambda_a d_a(a,b) +
  \lambda_l d_l(a,b) +
  \lambda_y d_y(a,b) +
  \lambda_v d_v(a,b) +
  \lambda_h d_h(a,b)
\]

where components may include geometry, administrative hierarchy, language,
entity type, vertical reference, and history. This object should be called a
directed dissimilarity or cost, not necessarily a metric.

### Definition 6: Cluster Projection

\(\kappa_t : N_t \to \Pi_{\delta,t}\) maps normalized candidates into reference
clusters under the declared structural partition.

### Definition 7: Resolution Outcome

A resolver returns one of:

```text
resolved(entity or cluster)
ambiguous
unresolved
rejected
```

Only the resolved state may carry a PID candidate.

### Definition 8: Certified PID Issuance

PID issuance is admissible only if candidate membership, cluster separation,
quality, freshness, risk, and audit gates are satisfied.

### Definition 9: Address Lineage Graph

A lineage graph \(L_t=(V_t,E_t)\) records address states and accepted transitions,
including rename, split, merge, retirement, reassignment, and successor links.

### Definition 10: Context-Relative Optimality

A resolver is optimal in context \(\chi\) if it minimizes the declared loss,
risk, or energy function for that context. AMT does not assume that one resolver
is optimal for all contexts.

### Definition 11: Source Validation State

Each evidence source has a validation state:

```text
accepted | unknown | rejected
```

Unknown and rejected sources must not be silently promoted to verified claims.

### Definition 12: Internal Quality Score

An internal quality score \(Q_t\) is a system-side risk and confidence signal
used to hide, warn, revalidate, or accept a candidate. It is not itself a proof
of truth.

## Axioms and Assumptions

### Axiom A1: Finite Operational Candidate Set

For every resolvable input under a fixed runtime policy, \(\Phi_t(u)\) is finite.

### Axiom A2: Explicit Non-Emission States

The resolver must be able to return non-emitting states when evidence is
insufficient.

### Axiom A3: Source-Bound Evidence

Every evidence item has source, time, jurisdiction, license, coverage, and
freshness metadata.

### Axiom A4: Context Declaration

Each resolution request declares a context \(\chi\), or uses a default context
whose assumptions are documented.

### Axiom A5: PID Issuance Requires a Gate

A PID-bearing output may be emitted only after the declared gate predicates pass.

### Axiom A6: Lineage Transitions Are Relations

Address history may be relational. Split and merge events are not forced into a
single-valued successor function.

### Axiom A7: Tie-Breaking Is Declared

When a finite set has multiple minimizers under a score, deterministic selection
requires an explicit ordering or an ambiguous outcome.

## Propositions

### Proposition P1: Candidate Soundness

If an outcome emits entity \(e\) under input \(u\), then \(e\) must belong to the
candidate set or candidate cluster derived from \(\Phi_t(u)\).

Status: Lean-supported by `CandidateSound`, `OutcomeCandidateSound`, and related
membership theorems.

### Proposition P2: Missing Candidate Prevents Correct Emission

If the true entity is not in the candidate set, no candidate-only resolver can
select it.

Status: Lean-supported.

### Proposition P3: Low Quality Prevents Safe Issuance

If quality, freshness, risk, or separation gates fail, a safe resolver should not
issue a PID.

Status: Lean-supported at gate level; production calibration remains empirical.

### Proposition P4: Source Rejection Prevents Verified Claims

Unknown or rejected source status cannot support a verified address claim.

Status: Lean-supported in `AMTPaperExtensions.lean`.

### Proposition P5: Natural Feature Reference Is Type-Dependent

Natural and cultural referents require feature-type-specific representation:
point, line, polygon, volume, graph, or label.

Status: implementation-supported in current scope; global coverage remains open.

## Lemmas

### Lemma L1: Non-Emitting Outcomes Resolve No Entity

`ambiguous`, `unresolved`, and `rejected` do not resolve to any entity.

Status: Lean-proved.

### Lemma L2: Gate Failure Prevents PID Emission

Missing candidate evidence, high energy, low margin, low quality, stale
freshness, or high risk prevents admissible PID issuance.

Status: Lean-proved for the abstract gate.

### Lemma L3: Normalization Collision Blocks Perfect Resolution

If two distinct entities collapse to the same normalized observation, a resolver
that sees only the normalized observation cannot be perfect for both.

Status: Lean-proved.

### Lemma L4: Projection Collision Blocks Vertical Resolution

If two distinct vertical entities share the same horizontal projection, a
horizontal-only resolver cannot preserve their identity.

Status: Lean-proved.

### Lemma L5: Append-Only Lineage Preserves Old Nodes and Edges

If a lineage graph is extended append-only, all prior nodes, edges, and finite
traces remain present.

Status: Lean-proved.

### Lemma L6: Reference-Preserving Rename Preserves Reference Class

If a rename changes notation but not reference, the renamed expression remains in
the same reference class.

Status: Lean-proved.

### Lemma L7: Positive Evidence Monotonicity

For the simplified positive-evidence component, adding positive observations
cannot lower the positive-evidence score.

Status: Lean-proved. Production reputation models require separate calibration.

## Theorems

### Theorem T1: Address Reference Impossibility

If two distinct entities produce the same observable address expression, no
condition-free resolver that sees only that expression can be correct for both.

Status: Lean-proved as `no_condition_free_perfect_resolver`.

### Theorem T2: Compression Collision Implies No Perfect Decoder

If an address representation compresses two distinct raw entities to the same
code, no decoder using only that code can perfectly reconstruct every raw
entity.

Status: Lean-proved.

### Theorem T3: Injective PID Has No Collision

If PID assignment is injective, equal PID implies equal entity.

Status: Lean-proved. Bounded hash PID requires birthday-bound risk analysis.

### Theorem T4: Observation-Based PID Collides Under Observation Collision

If PID is a pure function of a non-injective observation, distinct entities with
the same observation receive the same PID.

Status: Lean-proved.

### Theorem T5: Function Cannot Represent Split

If one historical state splits into two successor states, a single-valued
transition function cannot represent both successors without loss.

Status: Lean-proved.

### Theorem T6: Context Conflict Prevents Absolute Address Optimality

If two contexts have conflicting strict optima, no single address rendering or
resolver is absolutely optimal for both.

Status: Lean-proved.

### Theorem T7: Accepted GIS Certificate Has No Hard Errors

If the generated GIS certificate is accepted under a zero-error budget, then the
recorded GIS error count is zero.

Status: Lean-GIS bridge; not a direct proof of all geography.

### Theorem T8: Conditional AMT Well-Definedness

Under finite candidates, declared clustering, finite scoring, tie policy or
separation margin, and successful gates, the AMT resolution pipeline produces a
well-defined model-internal outcome.

Status: theorem shape supported by Lean fragments; full pipeline is a paper
theorem assembled from assumptions.

### Theorem T9: Safe PID Issuance Discipline

If a PID-bearing output is emitted by the certified gate, the declared
admissibility predicates were satisfied.

Status: Lean-proved at gate level and implementation-supported.

### Theorem T10: AMT Does Not Imply Cryptographic Privacy

AMT may produce attributes and audit envelopes, but cryptographic privacy
requires a separate proof system, credential policy, and leakage analysis.

Status: conceptual theorem/proposition for the paper; ZK details belong to a
companion paper.

## Corollaries

### Corollary C1: Unresolved Is Theoretically Necessary

Because condition-free perfect resolution is impossible under non-injective
observation, a safe resolver requires an explicit abstention state.

### Corollary C2: Postal Codes Cannot Be Universal Identifiers

Postal codes are useful compression schemes, but because they intentionally map
many referents to one code, they cannot identify all addressable entities.

### Corollary C3: Coordinate Codes Cannot Preserve All Address Identity

Coordinate or grid codes lose social, vertical, historical, and institutional
information unless supplemented by additional attributes.

### Corollary C4: Candidate Recall Is a First-Class Evaluation Metric

Since missing candidates cannot be recovered by downstream scoring, candidate
recall must be benchmarked directly.

### Corollary C5: Quality Scores Are Control Signals, Not Truth

A quality score may drive warnings, hiding, revalidation, or threshold policies,
but it is not a standalone proof of real-world correctness.

### Corollary C6: AGID/AOID/ZK Are Applications of AMT, Not AMT Itself

Applied identifiers and proof systems may use AMT outputs, but they require
separate specifications and security claims.

## Counterexamples to Include

| Counterexample | Failed assumption | AMT response |
| --- | --- | --- |
| Same normalized string for two places | Injective observation | ambiguous or additional evidence |
| Same postal code for many endpoints | Compression as identity | candidate expansion and clustering |
| Same coordinate, different floors | 2D projection preserves identity | vertical reference layer |
| Old address still appears in documents | Current-only address model | lineage graph |
| One town splits into two | Functional history | relational lineage |
| Two municipalities merge | One-to-one history | many-to-one lineage |
| Lake or desert has no postal endpoint | Postal endpoint only | natural referent type |
| Delivery and emergency contexts disagree | Universal optimum | context-relative scoring |
| Narrow private predicate identifies user | ZK hides all inference | anonymity-set and predicate granularity policy |
| Delivery failure caused by weather | Delivery failure equals address falsehood | failure-cause evidence model |

## Verification Map

| Claim family | Lean | GIS | Implementation tests | Empirical benchmark | Security audit |
| --- | --- | --- | --- | --- | --- |
| Non-injective impossibility | yes | no | no | examples only | no |
| Candidate gates | yes | no | yes | recall needed | no |
| Structural clustering | partial | no | yes | yes needed | no |
| Lineage preservation | yes | no | partial | real history needed | no |
| Natural geography | no | partial | yes | coverage needed | no |
| Vertical reference | yes for collision | no | partial | case studies needed | no |
| PID hash collision risk | ideal theorem + script | no | yes | no | no |
| Source governance | yes for unknown/rejected | partial | yes | live source audit needed | no |
| ZK proof bundles | policy-level only | no | yes | no | full cryptographic audit needed |
