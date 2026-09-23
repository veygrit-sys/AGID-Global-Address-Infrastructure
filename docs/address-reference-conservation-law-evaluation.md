# Address Reference Conservation Law: Evaluation and Verification

Checked PDF: `C:/Users/kitau/Downloads/住所保存則.pdf`

Checked date: 2026-06-06

## Overall Evaluation

The proposed "address conservation law" is valuable, but the safe formulation
is not "addresses never disappear." The safe and useful formulation is:

```text
Address expressions are not conserved. Reference continuity is conserved on an
auditable Address Lineage graph when a transition is supported by evidence.
```

Recommended status: include as a core AMT principle, but rename or subtitle it
as "Reference Continuity Conservation" to avoid misunderstanding.

Score:

- Conceptual value: 9/10
- Mathematical precision in current PDF: 7/10
- Fit with AMT implementation: 8.5/10
- Paper readiness after notation and condition fixes: 8/10

## Verified Claims

| PDF claim | Verification path | Status |
| --- | --- | --- |
| Address strings are not identical to address entities. | AMT tests for multilingual variants, clustering, and PID issuance | Supported |
| One-to-one continuation should preserve the public reference PID. | Supported as a design rule; not yet a standalone Lean theorem unless RPID compatibility is included as an assumption | Partially verified |
| Splits and merges cannot be treated as simple one-to-one identity. | Lean theorem `functional_transition_cannot_represent_split`; PID lifecycle tests | Verified |
| Split/merge should preserve lineage rather than force identical child PIDs. | `pidLifecycleProof` tests for merge and split lineage preservation | Verified at implementation-envelope level |
| Retired or disappeared entities can remain historical references, not active delivery references. | PID lifecycle status model and tests | Supported |
| Address lineage can support private continuity proofs without exposing old/current address strings. | PID lifecycle and private predicate proof tests | Supported at implementation-envelope level |
| GIS source validation can support transition evidence quality. | `verify:gis:budget` | Current dataset checks pass; not a universal proof |

## Commands Run

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\pidLifecycleProof.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\zkProofCompatibility.test.ts src\lib\addressMorphism.test.ts src\lib\privateAddressPredicateProof.test.ts
npm run verify:gis:budget
```

Results:

- Lean: passed.
- Related TypeScript tests: 32 passed, 0 failed.
- GIS warning budget: passed, 351 features, 0 errors, 149 warnings within the current budget.

## Strongest Safe Formulation

Use this:

```text
Address Reference Conservation Law.
Address expressions may change over time. However, when an address transition is
recorded as an evidence-backed edge in the Address Lineage graph, the relevant
reference continuity is conserved. In one-to-one continuation, the public
reference PID is preserved. In split and merge events, continuity is preserved
as parent, child, or ancestor relations. In disappearance events, active
reachability may end, but historical reference remains.
```

Avoid this:

```text
Addresses never disappear.
```

That stronger sentence is false for demolished buildings, submerged islands,
closed facilities, merged lots, over-merged clusters, and social entities that
move to a new physical place.

## Mathematical Corrections

1. Separate expression, physical entity, social entity, and reference identity.

The PDF correctly notes this, and it should become formal:

```text
Physical PID: place, building, unit, parcel, station, locker.
Social PID: company, shop, institution, household, project.
Reference PID: the public persistent reference used by AMT.
```

This prevents a shop relocation from being confused with a physical-place
continuation.

2. Make the transition relation explicit.

Use a relation, not only a function:

```text
Transition_t(q, q') : Prop
```

or a multivalued transition:

```text
tau_t : Q_t -> P(Q_{t+1})
```

This is necessary because splits and merges are not one-to-one functions.

3. Define preservation as a policy-compatible transition.

RPID preservation is not true from `q -> q'` alone. It becomes true if the
transition edge is typed as one-to-one continuation or if the lineage policy
declares RPID compatibility:

```text
Continuation_t(q, q') -> rho_t(q) = rho_{t+1}(q')
```

For split:

```text
Split_t(q, {q'_1, ..., q'_n}) -> parent(rho(q'_i)) = rho(q)
```

For merge:

```text
Merge_t({q_1, ..., q_n}, q') -> parents(rho(q')) = {rho(q_1), ..., rho(q_n)}
```

For disappearance:

```text
Retired(rho(q)) and HistoricalReference(rho(q))
```

4. Do not call split children equal to the parent.

The PDF identifies this correctly. The child PIDs should usually be derived or
new, with a lineage edge back to the parent PID.

5. Fix PDF math rendering.

Rendered pages show broken arrows, brackets, and some function notation. The
content is readable, but final publication should use a math-safe renderer and
embedded fonts.

## Lean Verification Status

Already verified:

```text
A plain function cannot represent a one-to-many split transition.
```

Still worth adding:

```text
If a transition edge is typed as RPID-compatible continuation, then RPID is
preserved.

If a split edge is valid, the source PID is retired and every target PID records
the source PID as an ancestor.

If a merge edge is valid, the target PID records every retired source PID as an
ancestor.
```

These are policy-shape theorems. They do not prove real-world sameness by
themselves; evidence and audit logs are still needed.

## Implementation Verification Status

The implementation already supports the paper direction through
`src/lib/pidLifecycleProof.ts`.

Verified behavior:

- PID history updates can be proven without exposing hidden history roots.
- PID merges require source retirement and lineage preservation.
- PID splits require source retirement, target PIDs, disjoint hidden partitions,
  and lineage preservation.
- Tampered lifecycle signatures are rejected.
- Unstripped private lifecycle material is rejected as public proof.

This is a good operational foundation for the conservation law.

## Recommended Placement in the Paper

Place this after the address reference impossibility theorem and before PID
issuance / ZK proofs.

Suggested section order:

1. Address reference is not condition-free resolvable.
2. Therefore AMT must use ambiguous/unresolved states.
3. Address expressions change over time.
4. Therefore AMT must use Address Lineage.
5. Reference continuity conservation defines what is preserved across time.
6. PID lifecycle proofs and ZK proofs can audit this without exposing private
   address strings.

## Final Judgment

This is a strong addition. It should be kept, but only in the conditional
Lineage-graph form. The phrase "address conservation law" is memorable, but the
precise theorem should be "reference continuity conservation."
