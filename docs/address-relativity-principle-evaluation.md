# Address Relativity Principle - evaluation and verification

Source PDF: `C:/Users/kitau/Downloads/住所相対性原理.pdf`

## Verdict

The Address Relativity Principle is useful and should be kept.  It gives AMT a
clean explanation for why the same reference class or PID must produce different
outputs for delivery, emergency response, cadastral registration, drone routing,
and ZK disclosure.

Recommended score:

| Axis | Score | Reason |
| --- | ---: | --- |
| Conceptual value | 9.0 / 10 | It unifies AGID, AOID, PID, address rendering, and ZK selective disclosure. |
| Mathematical precision in the current PDF | 7.0 / 10 | The direction is right, but "absolute address does not exist" is too strong unless it is made conditional. |
| Implementation fit | 9.0 / 10 | Current code already contains purpose-aware rendering, ZK predicates, region membership, and quality proofs. |
| Paper readiness after revision | 8.5 / 10 | Strong if rewritten as a context-dependent optimal-rendering theorem. |

## What was verified

| Claim | Verification result | Evidence |
| --- | --- | --- |
| A single address rendering is not always optimal for conflicting contexts. | Formally verified in Lean as a conditional theorem. | `formal/AMTCore.lean`, `conflicting_context_optima_prevent_absolute_address`. |
| Different contexts can share the same reference class/PID while producing different renderings. | Formally modeled as PID invariance under purpose-specific rendering. | `formal/AMTCore.lean`, `relative_rendering_preserves_class_pid`. |
| The implementation already supports purpose-scoped ZK and quality proofs. | Verified by tests. | `privateAddressPredicateProof`, `regionMembershipProof`, `qualityThresholdProof`, `zkProofCompatibility`. |
| Address rendering already separates domestic/international/purpose-sensitive output. | Verified by rendering tests. | `addressRenderingEnglish.test.ts`. |
| Natural geography and GIS warning budgets remain valid. | Verified. | `npm run verify:gis:budget` passed. |
| PID collision risk remains inside the configured budget. | Verified. | `npm run verify:pid-risk` passed. |

Commands run:

```powershell
lean formal\AMTCore.lean
npx tsx --test src\lib\privateAddressPredicateProof.test.ts src\lib\regionMembershipProof.test.ts src\lib\qualityThresholdProof.test.ts src\lib\zkProofCompatibility.test.ts src\lib\addressRenderingEnglish.test.ts src\lib\addressMorphism.test.ts
npm run verify:pid-risk
npm run verify:gis:budget
```

Results:

- Lean passed with no warnings after revision.
- 46 targeted TypeScript tests passed.
- PID risk budget passed.
- GIS warning budget passed: 351 features, 0 errors, 149 warnings within budget, 408/408 registered sources.
- The PDF rendered cleanly on sampled pages 1, 6, 12, and 16.  The text is readable, with no visible clipping.

## Strongest safe formulation

Use a reference class rather than a raw entity or a raw address string:

```text
q in Q                  reference class
c = (o, p, t, policy)   observer, purpose, time, and policy context
A                       admissible address/rendering space
C_c(a, q)               context-specific cost
rho(q, c) = argmin_a C_c(a, q)
```

Then state:

```text
Address Relativity Principle.
An address representation is not a unique string fixed to an entity.
It is a rendering of a stable reference class under a context consisting of
observer, purpose, time, jurisdiction, risk policy, and disclosure policy.
```

The theorem version should be conditional:

```text
Context-Conflict Theorem.
If two contexts c1 and c2 have certified optimal renderings a1 and a2 for the
same reference class q, and a1 != a2, then no single address representation a*
can be simultaneously equal to both context-optimal renderings.
```

This is stronger and safer than saying that an absolute address never exists.

## Necessary corrections

1. Do not state "absolute address does not exist" without qualification.

Safer:

```text
A condition-free, universally optimal address rendering does not exist when
the relevant contexts impose incompatible optimality conditions.
```

2. Replace `Addr(e,o,p)` with `rho(q,o,p,c)`.

Reason: AMT already treats the stable layer as an equivalence class or PID, not
as a raw entity.  This also prevents confusing the public AGID anchor with the
private AOID delivery layer.

3. Define "optimal" using a cost or utility function.

Without `Cost_c`, the statement "best address differs by purpose" is intuitive
but not mathematical.  With `Cost_c`, it becomes testable.

4. Add existence conditions for `argmin`.

For example:

```text
If A is finite, or if A is compact and Cost_c is lower semicontinuous, an
optimal rendering exists.
```

For the implementation paper, the finite case is enough because renderers can
produce a finite candidate set of admissible outputs.

5. Treat ZKP output as a predicate projection, not as a normal address string.

Use:

```text
phi_p(q) in {true,false}
```

Examples: `inJapan(q)`, `inDeliveryArea(q)`, `qualityAboveThreshold(q)`.

6. Distinguish AGID, AOID, PID, and address rendering.

Recommended wording:

```text
AGID is a public reference anchor.
PID is a stable identifier for a reference class or certified entity.
AOID is a private owner-controlled address layer.
Address output is a purpose-specific rendering or proof projection.
```

7. Do not collapse Address Relativity and Address No Free Lunch.

Address Relativity is about context-dependent rendering of the same reference.
Address No Free Lunch is about the nonexistence of one resolver/scoring function
that is optimal across all countries, purposes, and data regimes.

## Counterexamples to mention

| Over-strong claim | Counterexample | Revision |
| --- | --- | --- |
| "There is no absolute address." | A simple detached house can have the same useful string for mail, taxi, and ordinary delivery. | Say no condition-free universal optimum exists under conflicting contexts. |
| "Different purposes always produce different addresses." | Delivery and tax administration may both use the same official address label. | Say they may differ, and generally differ when cost functions or required attributes conflict. |
| "AGID is absolute address." | AGID is a reference anchor; it is not enough for private delivery, room, recipient, or ZK disclosure. | AGID anchors; AOID and renderers produce purpose-specific outputs. |
| "ZKP is just another address." | A ZK proof may reveal only a Boolean predicate and no address text. | ZKP is a predicate projection from a hidden address/reference. |
| "A full detailed address is best for every purpose." | It is bad for privacy, unnecessary for country-residence proof, and may be too late-stage for anonymous checkout. | Optimize under purpose-specific disclosure and risk constraints. |

## Suggested chapter placement

Place this after the chapters on reference classes and PID stability, and before
ZK Address Proof.

Best order:

1. Address Reference Impossibility
2. Address Equivalence Classes
3. PID / AGID / AOID Layering
4. Address Relativity Principle
5. Address Entropy and Minimal Disclosure
6. ZK Address Proof / Residence Proof / Delivery Eligibility

Reason: relativity depends on a stable reference class.  Once that stable layer
exists, the paper can explain why multiple address renderings and ZK predicates
are not contradictions but purpose-specific projections.

## Paper-ready wording

```text
Address Relativity Principle.
Let Q be the set of stable address reference classes and let C be a set of
contexts containing observer, purpose, time, jurisdiction, risk policy, and
disclosure policy.  An address representation is a context-dependent rendering

    rho : Q x C -> A.

Thus an address is not a unique string attached to an entity.  It is a
projection of a stable reference class into an admissible representation space
under a specified context.
```

```text
Context-Conflict Theorem.
Let c1 and c2 be two contexts for the same reference class q.  Suppose the
certified optimal renderings are a1 and a2, and a1 != a2.  Then no single
address representation a* can be simultaneously equal to both certified
context-optimal renderings.

Proof.
Assume such an a* exists.  Then a* = a1 and a* = a2.  By transitivity of
equality, a1 = a2, contradicting a1 != a2.  Therefore no such a* exists.
```

```text
Operational consequence.
AMT should not expose a single "correct address" API.  It should expose a
reference anchor plus purpose-scoped renderers and proof projections:

    AGID/PID/AOID -> policy engine -> purpose selector -> renderer/prover.
```

## Implementation recommendation

Add a small purpose-rendering API if it is not already exposed publicly:

```text
renderAddress(reference, {
  purpose: "carrier_delivery" | "emergency" | "registration" |
           "drone" | "zk_region_proof" | "display",
  audience,
  locale,
  disclosurePolicy,
  riskPolicy
})
```

The output should be either:

- a formatted address string;
- a structured delivery object;
- an emergency route/access object;
- a drone/robotics 3D reference object;
- a public ZK proof envelope;
- or an unresolved/insufficient-permission result.

This makes the theory directly testable and prevents accidental over-disclosure.
