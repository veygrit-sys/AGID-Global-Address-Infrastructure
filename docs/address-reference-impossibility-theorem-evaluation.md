# Address Reference Impossibility Theorem: Evaluation and Verification

Checked PDF: `C:/Users/kitau/Downloads/住所参照不可能性定理.pdf`

Checked date: 2026-06-06

## Overall Evaluation

The theorem is mathematically sound and important for Address Morphism Theory
(AMT). Its strongest contribution is that it changes AMT from a theory that
claims to always solve addresses into a theory that proves when address
resolution is impossible, then issues identifiers only under explicit safety
conditions.

Recommended status: keep and promote as a core theorem.

Score:

- Mathematical core: 9/10
- Formal precision in the PDF: 7/10
- Usefulness for AMT architecture: 9/10
- Paper readiness after notation fixes: 8.5/10

## Verified Claims

| PDF claim | Verification path | Status |
| --- | --- | --- |
| If `obs : E -> O` is non-injective, no total resolver `r : O -> E` can satisfy `r(obs(e)) = e` for all entities. | Lean theorem `no_condition_free_perfect_resolver` in `formal/AMTCore.lean` | Verified |
| Candidate generation must contain the true entity before a resolver can emit it. | Lean theorem `missing_candidate_prevents_issue`; tests around AMT candidate generation | Verified as an abstract gate |
| Ambiguous and unresolved are safety states, not failures. | Lean theorems for `ResolutionOutcome.ambiguous` and `ResolutionOutcome.unresolved` | Verified |
| PID issuance should require candidate membership, score threshold, margin, quality, freshness, and risk gates. | Lean model `IssueAdmissible`; PID audit tests | Verified as a gate model |
| Direct observation-to-PID issuance collides when observations collide. | Lean theorem `observation_based_pid_collides_on_same_observation` | Verified |
| ZK address proofs need a safely defined PID or predicate target before proof generation. | Private address predicate, quality-threshold, compatibility tests | Verified at implementation-envelope level |
| GIS and postal evidence are necessary operational support for candidate quality. | `verify:gis:budget`, `verify:postal-sources` | Verified as current dataset checks, not as a universal theorem |

## Commands Run

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\addressMorphism.test.ts src\lib\addressMorphismSources.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\privateAddressPredicateProof.test.ts src\lib\qualityThresholdProof.test.ts src\lib\zkProofCompatibility.test.ts src\lib\zkProofRuntime.test.ts
npm run verify:pid-risk
npm run verify:gis:budget
npm run verify:postal-sources
```

Results:

- Lean: passed.
- Related TypeScript tests: 41 passed, 0 failed.
- PID collision-risk budget: passed, birthday-bound upper risk `1.4693679385263966e-15` for `10^12` issued PIDs.
- GIS warning budget: passed, 351 features, 0 errors, 149 warnings within current budget.
- Postal source verification: passed, 281 address format files, 408 registered open-source IDs, 89 unique postal APIs, 0 static issues.

## Necessary Corrections Before Paper Use

1. State the theorem with exact assumptions.

Use:

```text
For a total deterministic resolver that receives only the observation value,
non-injective observation prevents condition-free perfect recovery.
```

Do not imply:

```text
No resolver can ever be useful, probabilistically correct, or improved by
additional context.
```

2. Make the noisy-input theorem separate.

The PDF's chain `E -> O -> U` is correct, but the theorem should be stated as:

```text
If two distinct entities can generate the same input u with positive
probability, then no resolver R : U -> E can be perfectly correct for both
under that input-only observation.
```

3. Define the quotient model carefully.

The expression `Q(u) = C(u) / ~_u` is valid only if `~_u` is an equivalence
relation. If the structural relation is directed or non-transitive, define a
partition or a clustering operator instead of a quotient.

4. Make PID issuance partial.

Replace:

```text
PID(u) = psi(argmin ...)
```

with:

```text
issuePID(u) =
  some(psi(q*)) if admissibility gates pass
  none/ambiguous/unresolved otherwise
```

5. Fix PDF math glyphs.

Rendered pages show some arrows and symbols as missing glyphs. The content is
readable, but the final paper should use a math-safe renderer or embedded
fonts so arrows, composition signs, and inequalities do not corrupt.

## Stronger Paper Wording

Recommended theorem title:

```text
Theorem: Non-Existence of a Condition-Free Perfect Address Resolver under
Non-Injective Observation
```

Recommended consequence:

```text
Ambiguous and unresolved outcomes are not implementation failures. They are
necessary safety states for any address system whose observation map is
non-injective.
```

Recommended AMT positioning:

```text
AMT is a certificate-gated partial resolver. It does not claim to recover a
true address entity from every input. It claims that PID issuance is allowed
only when candidate coverage, score separation, quality, freshness, and risk
conditions are satisfied; otherwise the system must abstain.
```

## Remaining Open Work

- Formalize the noisy-input theorem directly in Lean.
- Formalize the quotient/cluster requirement as either an equivalence relation
  or a bounded clustering operator.
- Add a proof-oriented appendix that maps each theorem to the Lean theorem name.
- Add empirical counterexample tables: same postal code, same coordinate with
  different units, old/new address lineage split, natural-feature ambiguity,
  and multilingual normalization collision.
