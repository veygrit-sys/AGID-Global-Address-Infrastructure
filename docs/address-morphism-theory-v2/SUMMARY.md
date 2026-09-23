# Address Morphism Theory v2 Summary

Status: 12-chapter verified-model draft

AMT v2 is a lossless 12-chapter reorganization of the current 29-chapter
Address Morphism Theory paper. Each main chapter now has a dedicated executable
model, test file, and formal-model registry entry.

Run the full compatibility and model check:

```bash
npm run verify:address-morphism-v2-compatibility
```

Latest local verification target:

```text
tests 146
pass 146
fail 0
```

## Reader Contract

AMT v2 does not ask the reader to trust broad claims. Each chapter must expose:

- the claim it makes;
- the mathematical or policy model behind the claim;
- the fixture or test hook that checks it;
- the counterexample or failure mode that limits it;
- the non-claim that prevents overstatement.

## Chapter Map

| chapter | document | executable model | test |
| ---: | --- | --- | --- |
| 1 | `01-why-address-registration-is-hard.md` | `src/lib/addressMorphismV2Chapter1RegistrationProblem.ts` | `src/lib/addressMorphismV2Chapter1RegistrationProblem.test.ts` |
| 2 | `02-prior-work-and-the-missing-object.md` | `src/lib/addressMorphismV2Chapter2PriorWorkBoundary.ts` | `src/lib/addressMorphismV2Chapter2PriorWorkBoundary.test.ts` |
| 3 | `03-address-objects-and-registrable-entities.md` | `src/lib/addressMorphismV2Chapter3Model.ts` | `src/lib/addressMorphismV2Chapter3Model.test.ts` |
| 4 | `04-axioms-notation-and-safe-abstention.md` | `src/lib/addressMorphismV2Chapter4Axioms.ts` | `src/lib/addressMorphismV2Chapter4Axioms.test.ts` |
| 5 | `05-candidate-generation-and-evidence-policy.md` | `src/lib/addressMorphismV2Chapter5CandidatePolicy.ts` | `src/lib/addressMorphismV2Chapter5CandidatePolicy.test.ts` |
| 6 | `06-structural-distance-and-equivalence-classes.md` | `src/lib/addressMorphismV2Chapter6StructuralEquivalence.ts` | `src/lib/addressMorphismV2Chapter6StructuralEquivalence.test.ts` |
| 7 | `07-finite-estimation-and-safe-resolution.md` | `src/lib/addressMorphismV2Chapter7SafeResolution.ts` | `src/lib/addressMorphismV2Chapter7SafeResolution.test.ts` |
| 8 | `08-history-graphs-pid-conservation-and-social-continuity.md` | `src/lib/addressMorphismV2Chapter8HistoryGraph.ts` | `src/lib/addressMorphismV2Chapter8HistoryGraph.test.ts` |
| 9 | `09-probability-quality-entropy-and-decision.md` | `src/lib/addressMorphismV2Chapter9Decision.ts` | `src/lib/addressMorphismV2Chapter9Decision.test.ts` |
| 10 | `10-natural-cultural-vertical-and-cross-domain-references.md` | `src/lib/addressMorphismV2Chapter10CrossDomain.ts` | `src/lib/addressMorphismV2Chapter10CrossDomain.test.ts` |
| 11 | `11-protocol-privacy-governance-and-abuse-boundaries.md` | `src/lib/addressMorphismV2Chapter11ProtocolPrivacy.ts` | `src/lib/addressMorphismV2Chapter11ProtocolPrivacy.test.ts` |
| 12 | `12-verification-benchmarks-limits-and-conclusion.md` | `src/lib/addressMorphismV2Chapter12Verification.ts` | `src/lib/addressMorphismV2Chapter12Verification.test.ts` |

## Cross-Chapter Guards

AMT v2 also includes two cross-chapter reinforcement audits:

| scope | model | purpose |
| --- | --- | --- |
| chapters 1-7 | `src/lib/addressMorphismV2EarlyChapterReinforcement.ts` | Ensures the theory foundation has invariants, failure modes, counterexamples, fixture hooks, and non-claims. |
| chapters 8-12 | `src/lib/addressMorphismV2LateChapterReinforcement.ts` | Ensures application-facing chapters do not overstate history, probability, cross-domain references, privacy proofs, or benchmarks. |

## Core Non-Claims

AMT v2 does not claim:

- global completeness for all addresses;
- that normalization, coordinates, postal codes, Place IDs, DID, VC, ZK, or
  commercial APIs are AMT safe referents by themselves;
- that candidate generation proves identity;
- that small structural distance proves identity without comparability and
  evidence gates;
- that a minimum-energy candidate automatically permits resolution or PID
  issuance;
- that ZK proofs repair bad address resolution;
- that a benchmark plan or case study is a victory declaration;
- that raw address, recipient, witness, private-key, or proof-secret material
  belongs in public fixtures.

## Canonical Companion Files

- `table-of-contents.md` explains reading order.
- `compatibility-map.md` preserves the 29-chapter-to-12-chapter migration.
- `formal-model-registry.md` links chapters to executable models and tests.
- `commutative-diagrams.md` defines strict, weak, conditional, and
  intentionally non-commutative AMT diagrams, including the privacy diagrams
  that must not invert public outputs into private address material.
- `address-communication-semantics.md` defines the Address Communication Object,
  ValidComm predicate, receiver capability negotiation, semantic ACK states,
  revocation safety, and failure taxonomy for treating addresses as
  least-disclosure communication objects.
