# Address Morphism Theory v2 Restructure Decision

Status: draft decision

## Decision

The current 29-chapter structure is too large for the main readable paper.
It is useful as a reference archive, but it fragments the argument for
researchers, implementers, grant reviewers, and open-source maintainers.

The v2 paper should be rewritten as a 12-chapter core manuscript, but this is a
lossless reorganization rather than a deletion or simplification. The v2 paper
must preserve every current claim, definition, axiom, theorem, counterexample,
mathematical model, implementation boundary, safety boundary, and non-claim from
the current 29 chapters.

The 29 existing chapters remain authoritative source material until a v2 chapter
has an explicit compatibility note. They should be treated as:

- source material;
- detailed notes;
- future appendices;
- companion papers;
- executable model documentation.

The proposed chapters 30-33 should not be promoted as new main chapters yet.
Their material should first be folded into privacy, governance, learning, and
cross-domain sections inside the 12-chapter v2 plan or moved to appendices.

## Why 12 Chapters

Twelve chapters is long enough to preserve the mathematics, but short enough to
make the central thesis visible:

> Address Morphism Theory defines addresses as computable, evidence-backed,
> purpose-relative references to entities, not merely strings or coordinates.

The old structure separated many concepts too early. For example, registration,
surface expressions, candidate generation, equivalence classes, safe resolution,
history, PID issuance, quality, and governance were split across many files.
That is good for engineering, but weak for a paper reader who needs one clear
line of argument. The v2 structure therefore changes order and grouping, not
substance.

## Editorial Rules

1. One chapter should answer one main question.
2. Every chapter should contain a claim, definitions, at least one model hook,
   and a short non-claim.
3. The main paper should not be a catalog of applications.
4. Applications move to case studies or appendices unless they change the core
   theory.
5. ZK, Web3, payment rails, XR, postal generation, and Address Login remain
   connected layers, not replacements for AMT.
6. The paper must preserve refusal, ambiguity, and source-limit language.
7. Every mathematical claim should eventually connect to a theorem registry,
   fixture, or executable model.
8. Every v2 chapter must name the current 29-chapter sources it preserves.
9. Material may move to an appendix, companion paper, or executable model only
   with an explicit migration note.
10. No main-paper compression may remove a safety boundary or non-claim.

## Mapping From The Current 29 Chapters

| v2 chapter | v2 role | current source chapters |
| --- | --- | --- |
| 1 | problem, thesis, scope | 1, 2, 6, 25 |
| 2 | prior work and non-claims | 2, 21, 23, 25 |
| 3 | address ontology | 3, 4, 16 |
| 4 | axioms and notation | 5, 29, appendices A/B/H |
| 5 | candidate generation and evidence | 8, 10, 21 |
| 6 | structural distance and equivalence | 7, 9, 29 |
| 7 | finite estimation and safe resolution | 6, 11, 14, 29 |
| 8 | history, PID, and conservation | 12, 13, 19 |
| 9 | probability, quality, and decision | 14, 15, 17, 29 |
| 10 | natural, cultural, vertical, and cross-domain references | 16, 24, proposed 33 |
| 11 | protocol, privacy, governance, and abuse boundaries | 18, 20, 22, 27, 28, proposed 30/31 |
| 12 | verification, benchmarks, limitations, and conclusion | 21, 23, 24, 25, 26 |

## Material To Move To Appendices

- full notation table;
- theorem and proof registry;
- counterexamples;
- validation map;
- related work comparison matrix;
- executable fixture index;
- chapter-by-chapter migration notes.

## Material To Move To Companion Repositories

- ZK Address Predicates;
- Address Privacy Proof Protocol;
- postal-code generation theory;
- Address Login SDK/API;
- country, continent, ocean, and gazetteer packs;
- commercial platform plans such as Playlist Commerce.

## Immediate Writing Plan

Write v2 one chapter at a time:

1. Write chapter 1 from scratch.
2. Review whether it introduces every later concept without overloading the
   reader.
3. Only then write chapter 2.
4. Repeat until all 12 chapters are coherent.

This avoids another large but thin paper.
