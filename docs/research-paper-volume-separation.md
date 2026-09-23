# Research Paper Volume Separation for AMT, AGID/AOID, and ZK Address Predicates

Status: editorial and implementation policy
Version: research-paper-volume-separation-v1

## Core Decision

The research program must be split into three manuscripts.

1. **AMT Core Paper**
   Address Morphism Theory is the semantic and mathematical theory of address reference, uncertainty, lineage, clustering, abstention, and persistent identifier issuance.

2. **AGID/AOID Application Paper**
   AGID and AOID are application identifiers and operational protocols built on AMT. They define public geographic reference, private operational address control, AGID-S, QR/NFC, POS, SDK, APIs, local-first modes, and conformance behavior.

3. **ZK Address Predicate Paper**
   ZK Address Predicate is the cryptographic and credential companion. It defines witness/public statement models, commitments, nullifiers, freshness, revocation, issuer trust, and proof-bundle compatibility for private address-derived predicates.

The boundary is simple:

```text
AMT = semantic theory.
AGID/AOID = application identifier and operations layer.
ZK Address Predicate = selective-disclosure cryptographic layer.
```

The papers may cite each other, but only through explicit bridge paragraphs. They must not silently absorb each other's proof burden.

## Why This Matters

If these layers remain mixed, the claims become hard to defend.

- A reader may think AMT proves cryptographic privacy. It does not.
- A reader may think AGID/AOID is the AMT theorem itself. It is not.
- A reader may think ZK proves that an address is true. It does not.
- A reader may think POS, QR, registry, and API behavior are mathematical results. They are implementation contracts.

The separation protects the project from overclaiming and makes each manuscript stronger.

## Volume Boundary Table

| Volume | Primary question | May include | Must exclude | Bridge rule |
| --- | --- | --- | --- | --- |
| AMT Core | When is an address reference resolvable, ambiguous, unresolved, rejected, or eligible for PID issuance? | Observation maps, non-injectivity, candidate generation, structural dissimilarity, clustering, unresolved gates, PID gates, lineage, context, entropy, validation taxonomy. | AGID encoding, AOID private records, AGID-S QR payloads, POS workflows, SDK/API specs, ZK circuit details, nullifier construction, Ethereum registry details. | AGID/AOID and ZK may appear only as companion papers or boundary examples. |
| AGID/AOID Application | How should public geographic references and private operational address authority be implemented? | AGID, AOID, AGID-S, public/private separation, QR/NFC, POS, SDK, OpenAPI, resolver modes, registry modes, conformance vectors, security defaults. | Reproving AMT theorems, proving ZK soundness, making AOID a public tracking ID, making Ethereum mandatory. | AMT is imported as the semantic foundation; ZK is an optional companion privacy layer. |
| ZK Address Predicate | Which AMT-derived facts can be proven without revealing the underlying address or AOID body? | Witnesses, public statements, commitments, nullifiers, revocation, freshness, issuer trust, purpose scope, proof-bundle compatibility, circuit audit plan. | Redefining AGID encode/decode, AOID QR sync, POS UI, SDK conformance, or claiming ZK proves real-world address truth. | AMT supplies the semantic envelope; AGID/AOID supply optional witness/application context. |

## Existing File Routing

| Existing file | Recommended role |
| --- | --- |
| `docs/address-morphism-theory-paper-professional-draft.md` | AMT Core Paper. Keep theory, examples, validation taxonomy, and boundary paragraphs. Move implementation detail out. |
| `docs/address-morphism-theory-full-paper-en-v3.md` | AMT Core expansion source. Tighten any AGID/AOID/ZK material into short bridge sections. |
| `docs/address-morphism-theory-paper-omission-check.md` | Editorial audit. Keep as a checklist, but treat this document as the enforceable separation policy. |
| `docs/agid-aoid-application-paper-en-v1.md` | AGID/AOID Application Paper. Keep implementation architecture, public/private separation, QR/NFC, POS, SDK, and conformance. |
| `docs/agid-aoid-application-paper-draft.md` | Application paper source material. Merge carefully into the application paper, not AMT core. |
| `docs/zk-address-predicate-paper-en-v1.md` | ZK Address Predicate Paper. Keep witness/public statement, commitments, nullifiers, scope, revocation, freshness, and proof-bundle model. |
| `docs/zk-address-proofs-and-address-morphism-theory-paper-draft.md` | ZK companion source material. Keep only if it separates semantic AMT assumptions from cryptographic proof claims. |
| `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md` | ZK companion manuscript candidate. Align with `docs/zk-address-predicate-paper-en-v1.md`. |

## Surgical Rewrite Rules

1. In the AMT Core Paper, replace detailed AGID/AOID mechanics with:

   ```text
   AGID and AOID are application identifiers that may consume AMT outputs.
   Their encoding, QR/NFC, POS, registry, and conformance behavior are defined
   in a separate application paper.
   ```

2. In the AMT Core Paper, replace detailed ZK mechanics with:

   ```text
   AMT envelopes may become witnesses or committed inputs for a separate
   privacy protocol. Zero-knowledge soundness, nullifier design, revocation
   roots, freshness roots, issuer trust, and proof-bundle compatibility are not
   established by AMT itself.
   ```

3. In the AGID/AOID Application Paper, keep only a short AMT dependency:

   ```text
   This paper imports AMT as the semantic model for candidate generation,
   unresolved states, lineage, source evidence, and PID envelopes. It does not
   reprove AMT's impossibility or lineage results.
   ```

4. In the ZK Address Predicate Paper, keep only a short AMT interface:

   ```text
   The proof system assumes an AMT-derived semantic envelope or credential.
   It proves relations about committed data under issuer, freshness, source,
   and proof-system assumptions. It does not prove real-world address truth by
   cryptography alone.
   ```

5. Use claim labels consistently:

   ```text
   formal theorem
   implementation contract
   empirical hypothesis
   governance assumption
   future cryptographic audit target
   ```

## Required Tests

The implementation-facing boundary is enforced by:

```text
src/lib/researchPaperVolumeSeparation.ts
src/lib/researchPaperVolumeSeparation.test.ts
```

The tests intentionally fail when:

- AMT Core contains AGID-S payload, AOID sync, POS workflow, Ethereum registry, or ZK circuit construction as core theory.
- AGID/AOID Application claims to reprove AMT or prove ZK soundness.
- ZK Address Predicate redefines AGID/AOID application specs or claims that ZK proves real-world address truth.

This is not a full natural-language reviewer. It is a release guardrail that catches the most dangerous boundary violations.

## Editorial Next Steps

1. Treat `docs/address-morphism-theory-paper-professional-draft.md` as AMT I.
2. Treat `docs/agid-aoid-application-paper-en-v1.md` as the application paper.
3. Treat `docs/zk-address-predicate-paper-en-v1.md` as AMT II / ZK Address Predicate.
4. Move detailed implementation material out of AMT I.
5. Move cryptographic soundness claims out of AGID/AOID.
6. Move POS, SDK, QR/NFC, and registry specifications out of ZK.
7. Keep one bridge paragraph in each paper and no more than necessary.

## Final Principle

The strongest publication strategy is not one giant paper. It is a disciplined trilogy:

```text
AMT I explains what an address reference is and why perfect resolution is impossible.
AGID/AOID explains how to build useful public and private address identifiers safely.
AMT II / ZK Address Predicate explains how to prove scoped address-derived facts without revealing the address.
```

That division is more credible for researchers, safer for users, and easier to implement.
