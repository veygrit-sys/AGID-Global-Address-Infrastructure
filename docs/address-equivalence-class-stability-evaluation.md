# Address Equivalence-Class Stability: Evaluation and Verification

Checked PDF: `C:/Users/kitau/Downloads/「住所同値類安定性」.pdf`

Checked date: 2026-06-06

## Overall Evaluation

The proposal is strong enough to become a core AMT theorem, but only in a
conditional form. The safe statement is:

```text
Address strings are observations. The stable target of AMT is the bounded
reference class supported by evidence. PID issuance must be defined over that
class, not over the raw string.
```

Recommended status: include as a central theorem immediately after the address
reference impossibility theorem, and before address lineage / conservation.

Score:

- Conceptual value: 9.5/10
- Mathematical precision in current PDF: 7.5/10
- Fit with current AGID/AMT implementation: 8.5/10
- Paper readiness after condition and notation fixes: 8.5/10

## Verified Claims

| PDF claim | Verification path | Status |
| --- | --- | --- |
| Address strings are not the stable unit; reference classes are. | New Lean model `RefEquivalent` and `SameReferenceClass` in `formal/AMTCore.lean` | Verified as a formal abstraction |
| If address expressions reference the same entity, they are equivalent. | Lean theorem `same_entity_observations_are_ref_equivalent` | Verified |
| Reference-defined equivalence is reflexive, symmetric, and transitive. | Lean theorems `ref_equivalent_is_reflexive`, `ref_equivalent_is_symmetric`, `ref_equivalent_is_transitive` | Verified |
| Equivalent address expressions have the same reference class. | Lean theorem `same_reference_yields_same_reference_class` | Verified extensionally |
| PID should be issued from the reference class, not the raw string. | Lean theorem `class_pid_invariant_under_ref_equivalence`; AMT PID tests | Verified at formal and implementation levels |
| Raw observation-to-PID issuance is unsafe under collisions. | Lean theorem `observation_based_pid_collides_on_same_observation` | Verified |
| Safe implementation must abstain when evidence is insufficient. | Lean `ResolutionOutcome`; AMT tests for ambiguous and unresolved | Verified |
| Clusters must be bounded to avoid transitive over-merge. | `addressMorphism.test.ts` bounded-clustering test | Verified in implementation tests |
| Conflict evidence should block equivalence formation. | Lean theorem `conflict_gate_prevents_ref_equivalence` | Verified as a gate model |
| ZK address predicates should prove class-level or PID-level properties, not raw address strings. | Private predicate, nullifier, quality threshold, and ZK compatibility tests | Supported |

## Commands Run

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\addressMorphism.test.ts src\lib\addressMorphismSources.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\privateAddressPredicateProof.test.ts src\lib\zkProofCompatibility.test.ts src\lib\addressDuplicateNullifier.test.ts src\lib\qualityThresholdProof.test.ts
npm run verify:pid-risk
```

Results:

- Lean: passed after adding the address equivalence-class stability model.
- Related TypeScript tests: 43 passed, 0 failed in the broad run.
- Final rerun after Lean edit: 38 selected tests passed, 0 failed.
- PID collision-risk budget: passed. For 128-bit PIDs and `10^12` issued PIDs,
  the birthday-bound upper risk is `1.4693679385263966e-15`.
- Visual PDF rendering: pages 1, 8, 13, and 17 rendered cleanly with readable
  Japanese text, page numbers, and margins.

## Strongest Safe Formulation

Use this:

```text
Address Equivalence-Class Stability Principle.
Let A be a set of address expressions and let ref : A -> E map each expression
to its intended reference entity. Define a ~ b iff ref(a) = ref(b). Then the
stable AMT object is not the raw expression a, but the reference class [a]. If
PID assignment is defined as psi([a]), then all equivalent expressions receive
the same PID.
```

Implementation version:

```text
AMT may approximate [a] by a bounded evidence-backed cluster only when candidate
coverage, structural distance, administrative consistency, coordinate or
facility consistency, history evidence, quality, freshness, and risk gates pass.
Otherwise the resolver must return ambiguous or unresolved.
```

Avoid this:

```text
All different spellings of the same real place always become the same class.
```

That sentence is too strong. It is true only when the candidate generator finds
the relevant candidates and the non-conflict gates pass.

## Necessary Corrections Before Paper Use

1. Separate mathematical equivalence classes from implementation clusters.

The quotient `Q = A / ~` is valid if `~` is an actual equivalence relation. An
implementation cluster is an evidence-backed approximation. The paper should
write:

```text
Mathematical layer: a ~ b iff ref(a) = ref(b).
Operational layer: cluster_delta(a, b) approximates ~ only under admissibility
conditions.
```

2. Change the entropy claim to a qualified inequality.

Use:

```text
If Q is a deterministic coarsening of A, then H(Q) <= H(A). Strict inequality
holds only when the quotient merges positive-probability address expressions.
```

Avoid unqualified claims such as `H(Q) < H(A)` unless the distribution and
nontrivial merge condition are stated.

3. Treat over-splitting as safer, not harmless.

The PDF correctly says over-merging is more dangerous than over-splitting.
However, over-splitting can still create duplicate PIDs, credential mismatch,
ZK proof mismatch, and delivery history fragmentation. Add:

```text
Over-splitting is recoverable only if AMT keeps a merge-audit path and preserves
lineage evidence.
```

4. Make conflict gates explicit.

The paper should state a blocking rule:

```text
Conflict(a,b) -> not (a ~ b)
```

where conflicts include country mismatch, contradictory administrative hierarchy,
excessive coordinate distance, different building IDs, different unit numbers,
or contradictory delivery evidence.

5. Do not make stability unconditional.

Recommended theorem shape:

```text
If all observations in a sequence reference the same entity, and if each
operational merge is admissible, then the AMT reference class and class-derived
PID remain invariant under representation changes.
```

The first condition is mathematical. The second is empirical and operational.

## Counterexamples to Include

| Case | What it shows | Correct AMT behavior |
| --- | --- | --- |
| Same place, Japanese and romanized forms | Raw strings differ while class can be stable | Same class if evidence supports it |
| Same place, old and new administrative expression | Class stability needs lineage evidence | Same or linked class only with lineage |
| Same building, different unit numbers | Ground-level similarity is insufficient | Different classes |
| Same road name in different cities | Name equality is not entity equality | Ambiguous or separate classes |
| Multilingual normalization collision | Normalization can destroy information | Do not issue a PID from normalized string alone |
| Chain A close to B and B close to C, but A far from C | Transitive clustering can over-merge | Bounded cluster, not naive transitive closure |

## Recommended Placement in the Paper

Place this after the address reference impossibility theorem and before address
conservation / lineage.

Suggested order:

1. Address reference impossibility theorem.
2. Ambiguous and unresolved as necessary safety states.
3. Address equivalence-class stability.
4. Conflict-gated bounded clustering.
5. Address conservation / lineage as temporal stability.
6. PID issuance over reference classes.
7. ZK address predicates over class-derived PIDs or coarse class attributes.

## Paper-Ready Paragraph

```text
AMT treats an address string as an observation, not as the address object itself.
The mathematical address object is the reference class induced by the map from
expressions to referents. This shift explains why spelling variants,
romanization variants, administrative-expression variants, and multilingual
forms can remain stable under a common PID. It also explains why AMT must refuse
to merge when conflict evidence exists. The aim is not to normalize every string
into a single text form, but to maintain an auditable equivalence class whose
PID remains invariant under admissible representation changes.
```
