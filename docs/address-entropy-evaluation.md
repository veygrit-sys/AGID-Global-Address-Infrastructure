# Address Entropy: Evaluation and Verification

Checked PDF: `C:/Users/kitau/Downloads/住所エントロピーは.pdf`

Checked date: 2026-06-06

## Overall Evaluation

The address entropy idea is one of the strongest extensions of Address Morphism
Theory (AMT). It connects address resolution, ambiguity, AGID/PID length,
vertical reference layers, ZK address proofs, and natural-feature addressing
under one information-theoretic view.

The safe central statement is:

```text
Address entropy is the residual information uncertainty, under a given
observation, input, context, and history, about which reference entity is meant.
Resolution can emit a PID only when that residual uncertainty is sufficiently
small and the candidate/evidence gates are trustworthy.
```

Recommended status: include as a core chapter, but distinguish Shannon entropy,
per-entity surprisal, finite code capacity, and implementation score gaps.

Score:

- Conceptual value: 9.5/10
- Mathematical precision in current PDF: 7/10
- Fit with current AGID/AMT implementation: 8.5/10
- Paper readiness after notation and condition fixes: 8.5/10

## Verified Claims

| PDF claim | Verification path | Status |
| --- | --- | --- |
| A larger distinguishable entity universe needs more representational capacity. | Lean `BitCapacity`, `CapacityCovers`, and `insufficient_bit_capacity_prevents_capacity_cover` | Verified as a finite capacity lower-bound model |
| More than one still-admissible candidate means residual uncertainty remains. | Lean `CandidateResidualZero`, `multiple_candidates_prevent_zero_residual`, and `proxy_residual_forces_ambiguous_abstention` | Verified as a candidate-count proxy |
| Ambiguous and unresolved are safety states, not mere algorithm failures. | Lean `ResolutionOutcome`; AMT tests for ambiguous/unresolved | Verified |
| PID issuance should require gates, not raw string certainty. | Lean `IssueAdmissible`; PID audit tests | Verified |
| Direct observation-to-PID issuance is unsafe under collisions. | Lean `observation_based_pid_collides_on_same_observation` | Verified |
| Equivalent-class compression reduces expression variation. | Lean reference-class model; AMT bounded clustering tests | Supported |
| Natural geography names can leave residual ambiguity. | `naturalAddress`, `mapFeatureAddress`, and search tests | Supported |
| Urban/rural/island/mountain/desert/water contexts need different quality handling. | `addressTabQuality.test.ts` | Supported |
| PID hash length has a checked risk budget. | `npm run verify:pid-risk` | Verified for the current PID risk model |
| Current GIS source budget has no hard validation errors. | `npm run verify:gis:budget` | Current dataset check passes; not a universal proof |

## Commands Run

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\addressMorphism.test.ts src\lib\addressTabQuality.test.ts src\lib\naturalAddress.test.ts src\lib\mapFeatureAddress.test.ts src\lib\qualityThresholdProof.test.ts src\lib\searchQuery.test.ts
npm run verify:pid-risk
npm run verify:gis:budget
```

Results:

- Lean: passed after adding the finite capacity and residual-candidate proxy model.
- Related TypeScript tests: 56 passed, 0 failed.
- PID collision-risk budget: passed. For 128-bit PIDs and `10^12` issued PIDs,
  the birthday-bound upper risk is `1.4693679385263966e-15`.
- GIS warning budget: passed, 351 features, 0 errors, 149 warnings within the
  current registered-source budget.
- Visual PDF rendering: pages 1, 6, 12, and 19 rendered cleanly with readable
  Japanese text and margins.

## Strongest Safe Formulation

Use this:

```text
Let E be a reference-entity random variable and let U, C, and L denote the
observed input, operational context, and lineage/history evidence. The address
entropy after observation is

H_addr(E | U=u, C=c, L=l)
  = - sum_e p(e | u,c,l) log2 p(e | u,c,l).

If this residual uncertainty is near zero, the address reference is
information-theoretically close to unique. If it remains positive and the top
candidates are not sufficiently separated, the resolver should return
ambiguous. If the candidate set or evidence source is not trustworthy, the
resolver should return unresolved.
```

Finite ID capacity version:

```text
For an ID field with b free bits, the representational capacity is 2^b. A
necessary capacity condition for uniquely naming N distinguishable entities is
N <= 2^b, plus safety margin for reserved values, versioning, error detection,
collision budget, and future expansion.
```

## Necessary Corrections Before Paper Use

1. Separate entropy and surprisal.

The PDF says:

```text
H_addr(e) = -log2 P(e)
```

This is not Shannon entropy. It is per-entity surprisal. Use:

```text
h(e) = -log2 P(E=e)
H(E) = - sum_e P(E=e) log2 P(E=e)
```

Then define residual address entropy as:

```text
H(E | U=u, C=c, L=l)
```

2. Make `log2 |E|` conditional on uniformity and scope.

`log2 |E|` is correct when all entities are equally likely inside a fixed
reference universe. In real address systems, priors are not uniform. A busy
commercial building, a remote island, and a common road name can have very
different posterior distributions.

3. Replace "cities always increase address entropy" with a safer claim.

Use:

```text
As the number, density, vertical stacking, and operational granularity of
distinguishable reference entities increase, the required identifying
information tends to increase.
```

Avoid:

```text
Urbanization always increases address entropy.
```

Counterexamples include compact grid-address systems, dense cities with highly
regular addressing, rural regions with repeated place names, and natural
features whose boundaries are ambiguous.

4. Correct the AGID bit-length explanation.

The PDF's `12 Base32 characters = 60 bits` is a generic fixed-length-code
statement. In the current AGID model, the full public ID is a semantic prefix
plus a 10-character Base32 payload. The payload capacity is 50 bits, while the
current packed grid model uses 45 bits. Therefore the paper should say:

```text
If all 12 characters are free Base32 symbols, the code space has 60 bits.
In the current AGID contract, some characters carry semantic prefix/version
information; free payload capacity must be calculated from the actual encoding.
```

5. Do not claim `H(E | AGID) = 0` for all address entities.

AGID can reduce geographic uncertainty, but many address entities can share a
cell or 2D/3D vicinity: rooms, lockers, apartments, floors, shops, and temporary
delivery points. Use:

```text
AGID reduces spatial uncertainty. AOID, PID, vertical reference, and evidence
history are needed to reduce address-entity residual entropy.
```

6. Qualify the mutual-information theorem.

For random variables:

```text
H(E | U) = H(E) - I(E;U)
```

So if `I(E;U) < H(E)`, the average residual entropy is positive. For a concrete
input, write:

```text
H(E | U=u) > epsilon
```

not simply `I(u;E) < H(E)`, because mutual information is defined over random
variables, not one isolated string.

7. Make PID issuance entropy-gated but not entropy-only.

Residual entropy below a threshold is not enough by itself. The existing AMT
gate also needs candidate membership, score gap, quality, freshness, and risk:

```text
emit PID only if:
  H_residual <= epsilon
  candidate coverage holds
  source quality passes
  freshness passes
  risk budget passes
  conflict gates do not fail
```

8. Treat "entropy conservation" as a limited lineage principle.

Old address to new address can preserve identifying information in one-to-one
renaming. It is not generally conserved under split, merge, demolition, boundary
change, room subdivision, or social relocation.

Safe wording:

```text
Under one-to-one lineage transitions that preserve the reference entity and
granularity, the amount of information needed to identify that entity is often
stable even when the expression changes.
```

## Counterexamples to Include

| Claim under pressure | Counterexample | Safer AMT interpretation |
| --- | --- | --- |
| City addresses are always longer because entropy is higher. | A gridded city can encode locations compactly. | Density and granularity increase capacity needs; notation efficiency varies by system. |
| Rural addresses are low entropy. | Repeated village names, no street numbers, and sparse natural places can remain highly ambiguous. | Low density does not guarantee low posterior entropy. |
| AGID removes address entropy. | Many apartments or lockers can share one grid cell. | AGID reduces spatial entropy, not necessarily address-entity entropy. |
| Postal code identifies a place. | One postal code can cover many buildings. | Postal codes reduce candidate space but usually leave residual entropy. |
| Natural feature name identifies one object. | "Mount Fuji" can mean summit, trailhead, fifth station, hut, ridge, or crater. | Natural-feature addresses need explicit granularity. |
| `H(Q) < H(A)` always. | If the quotient map is one-to-one for the observed distribution, entropy is equal. | Use `H(Q) <= H(A)`, strict only under nontrivial merging. |

## Recommended Placement in the Paper

Place this after the address reference impossibility theorem and before
equivalence-class stability:

1. Address reference impossibility theorem.
2. Address entropy and residual uncertainty.
3. Ambiguous/unresolved as entropy and evidence-gate outcomes.
4. Address equivalence-class stability as expression entropy compression.
5. Address conservation / lineage as temporal information continuity.
6. AGID/AOID/PID bit capacity and collision-risk budgeting.
7. ZK Address Proof as controlled disclosure of address entropy.

## Paper-Ready Paragraph

```text
Address entropy measures the residual uncertainty about the intended reference
entity after an address observation, context, and lineage evidence have been
applied. It explains why a short or incomplete address can remain ambiguous even
under a correct algorithm, why postal codes and AGID cells reduce but do not
necessarily eliminate uncertainty, and why PID issuance must be gated by
candidate separation and evidence quality. AMT can therefore be understood as a
controlled entropy-reduction process: from noisy expressions, to candidate
sets, to bounded equivalence classes, to audited PID issuance.
```
