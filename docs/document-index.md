# Document Index and Cleanup Plan

Last reviewed: 2026-06-13

## Summary

Repository document inventory found the following active families:

| Family | Count | Status |
| --- | ---: | --- |
| Address Morphism Theory | 37 | Keep, but mark canonical drafts clearly |
| AGID | 14 | Keep, split standard/spec/paper/performance |
| AOID | 2 | Keep, needs English counterpart |
| ZK / Zero-Knowledge | 5 direct, plus related privacy docs | Keep, should remain separate from AMT core and include baseline hardening gates |
| POS / Delivery / Table / Operations / Drone OS | 11 | Keep, implementation-facing |
| Frontend / UX / Dashboard / Portal | 5 | Keep, implementation-facing |
| Crypto business / Web3 integration | 3 | Keep, implementation-facing, must avoid token-first positioning |
| Open core / product strategy | 4 | Keep, implementation-facing, defines OSS/commercial/app/service, free/paid split, and commercial impact forecast |
| OSS donation readiness | 1 | Keep, implementation-facing, defines grant/donation readiness, funder fit, and philosophy guardrails |
| Material governance | 2 | Keep, controls cleanup, archive, and release-material decisions |
| Security / Privacy | 3 | Keep, should be cited from README and papers |
| General / audits / resumes | 19 | Review, some can become archive/reference |
| Chapter verification | 60 | Keep as evidence bundle, not main reading path |

## Canonical Documents

These should be treated as primary or near-primary sources.

| Role | File | Notes |
| --- | --- | --- |
| Project overview | `project-resume.md` | Entry point for repository-level explanation. |
| Japanese AMT master | `address-morphism-theory-ja-v1-master.md` | Japanese source-of-truth candidate. |
| Japanese AMT appendices | `address-morphism-theory-ja-v1-appendices.md` | Mathematical and verification appendices. |
| English AMT paper | `address-morphism-theory-full-paper-en-v3.md` | International-facing draft. |
| Verified AMT resume | `address-morphism-theory-verified-resume.md` | Use for claims already backed by verification notes. |
| Verification boundary | `address-morphism-verification-boundaries.md` | Important for avoiding overclaiming. |
| AGID standard | `agid-standard.md` | Implementation and public specification candidate. |
| AGID spec v0.1 RC | `agid-spec-v0.1-rc.md` | Release-candidate boundary, conformance levels, public/private scope, release gates, and known limitations. |
| AGID/AOID paper | `agid-aoid-application-paper-en-v1.md` | Application layer paper. |
| ZK address paper | `zk-address-predicate-paper-en-v1.md` | Separate paper for zero-knowledge address predicates. |
| ZK address eligibility model | `zk-address-eligibility-model-ja.md` | Japanese implementation model for Ethereum-style ZK address eligibility, delivery proofs, anonymous shipping, nullifiers, and on-chain/off-chain boundaries. |
| ZK baseline hardening | `zk-baseline-hardening-ja.md` | Implementation-facing ZK public-signal, witness, nullifier, fixture, and production-blocker policy. |
| Security/privacy design | `security-privacy-design.md` | Required before public release. |
| Programming language policy | `programming-language-selection-policy-ja.md` | Engineering governance for TypeScript/Rust/SQL/Solidity/Circom/Lean/Python/SDK decisions. |
| Address computer science techniques | `address-computer-science-techniques-ja.md` | Research and implementation map for applying search, NLP, GIS, databases, distributed systems, and privacy engineering to address infrastructure. |
| Address communication engineering theory | `address-communication-engineering-theory-ja.md` | Theory and implementation map for applying DNS, routing, APIs, queues, mobile/near-field communication, secure transport, and zero-trust communication to address infrastructure. |
| Open core product split | `open-core-product-service-split-ja.md` | Canonical OSS/commercial boundary, app partitions, and service catalog. |
| App monetization boundary | `app-feature-monetization-boundary-ja.md` | Canonical app-level free/paid boundary and never-paywalled safety rules. |
| Service monetization boundary | `service-monetization-boundary-ja.md` | Canonical service-level rule: all 12 services have a free baseline; paid only for unavoidable operating costs. |
| Unbuilt app concepts | `unbuilt-app-concepts-ja.md` | Current unfinished-app catalog, maturity order, routes, first milestones, and privacy/free-boundary rules. |
| P0 product maturity execution plan | `p0-product-maturity-execution-plan-ja.md` | Current execution contract for Settings, Portal, Dashboard, Review Console, and Field Handoff App. |
| P1 product maturity execution plan | `p1-product-maturity-execution-plan-ja.md` | Current execution contract for Evidence Vault, Developer Platform, Address Connect Admin, and Carrier Label and Settlement. |
| P2 product maturity execution plan | `p2-product-maturity-execution-plan-ja.md` | Current execution contract for Drone / Locker Operations, device status, access grants, telemetry privacy, incident receipts, and local simulator. |
| POS UI hardening | `pos-ui-hardening-ja.md` | Implementation-facing plan for scan-to-decision clarity, four-stage handoff, trust state, review queue, device diagnostics, and high-risk privacy. |
| Accessibility hardening | `accessibility-hardening-ja.md` | Implementation-facing plan for keyboard-only operation, focus visibility, screen-reader status, contrast, language-direction sync, reduced motion, and high-risk privacy-safe narration. |
| External audit hardening | `external-audit-hardening-ja.md` | Implementation-facing plan for audit packets, release artifact hygiene, no-raw-address review, ZK production claim gates, data-license audit, and public report redaction. |
| Funder brief | `funder-brief-en.md` | Five-page English public-good funding brief for Local Resolver, AGID-S, POS handoff, no-raw-address tests, and audit readiness. |
| Three public demos | `agid-three-demos-ja.md` | Demo scripts for Local Resolver + Address Element, AGID-S high-risk POS handoff, and audit-ready ZK-ready registry flow. |
| Funding channels | `funding-channels-ja.md` | GitHub Sponsors, Open Collective, and Gitcoin setup guide with funding guardrails. |
| Open source donation readiness | `open-source-donation-readiness-ja.md` | Current OSS donation/grant readiness assessment by area, profession, funding program, and non-negotiable philosophy. |
| Commercial impact forecast | `commercial-impact-forecast-ja.md` | Current commercial ARR and impact scenario forecast, with no-data-resale and no-token-first guardrails. |
| Material governance audit | `material-governance-audit-2026-06-18.md` | Current keep/update/delete decision record for root materials, docs, generated outputs, and evidence notes. |
| Unorganized area policy | `unorganized-area-policy-2026-06-24-ja.md` | Current cleanup policy for source layout, generated data, SDKs, docs, heavy geo packs, route families, and Caucasus canonical placement. |

## Address Morphism Theory Documents

### Core Drafts

- `address-morphism-theory-ja-v1-master.md`
- `address-morphism-theory-ja-v1-master-frontmatter.md`
- `address-morphism-theory-ja-v1-outline.md`
- `address-morphism-theory-ja-v1-chapters-1-6.md`
- `address-morphism-theory-ja-v1-chapters-7-12.md`
- `address-morphism-theory-ja-v1-chapters-13-18.md`
- `address-morphism-theory-ja-v1-chapters-19-26.md`
- `address-morphism-theory-ja-v1-appendices.md`
- `address-morphism-theory-professional-paper-ja-v1.md`
- `address-morphism-theory-full-paper-en-v3.md`

### Editorial / Gap Review

- `address-morphism-theory-paper-draft.md`
- `address-morphism-theory-paper-professional-draft.md`
- `address-morphism-theory-paper-professional-draft-ja.md`
- `address-morphism-theory-paper-revision-patch.md`
- `address-morphism-theory-paper-omission-check.md`
- `address-morphism-paper-expression-audit.md`
- `address-morphism-paper-model-diagram-gap-audit.md`
- `address-morphism-theory-ja-v1-prepdf-editorial-pass.md`
- `address-morphism-theory-ja-v1-appendix-structure-review.md`

### Mathematical / Verification Notes

- `address-morphism-lean-gis-cross-verification.md`
- `address-morphism-executable-expectations.md`
- `address-morphism-expectation-verification-report.md`
- `address-morphism-theory-full-paper-math-inventory.md`
- `address-morphism-theory-hypotheses-verification-matrix.md`
- `address-morphism-theory-challenging-hypotheses-validation.md`
- `address-morphism-theory-unverified-items.md`
- `address-morphism-theory-verified-resume.md`
- `address-morphism-verification-boundaries.md`
- `executable-unverified-verification-report-2026-06-07.md`

### Theorem Evaluation Notes

- `address-reference-impossibility-theorem-evaluation.md`
- `address-reference-conservation-law-evaluation.md`
- `address-equivalence-class-stability-evaluation.md`
- `address-entropy-evaluation.md`
- `address-relativity-principle-evaluation.md`
- `zk-address-theorem-evaluation.md`

## AGID / AOID Documents

### AGID

- `agid-standard.md`
- `agid-detailed-paper-ja.md`
- `agid-math-model-resume.md`
- `agid-er-diagrams.md`
- `agid-security.md`
- `agid-performance-check-2026-06-07.md`
- `agid-aoid-strict-performance-benchmark-2026-06-07.md`
- `agid-s-secure-agid-qr-ja.md`
- `agid-s-secure-agid-qr-en.md`

### AOID

- `aoid-detailed-paper-ja.md`
- `aoid-performance-check-2026-06-07.md`

### Combined Application Layer

- `agid-aoid-design.md`
- `agid-aoid-application-paper-draft.md`
- `agid-aoid-application-paper-en-v1.md`
- `agid-aoid-qr-materials-ja.md`
- `agid-aoid-qr-materials-en.md`

## ZK / Privacy / Web3 Documents

- `address-morphism-theory-ii-zero-knowledge-address-predicates.md`
- `address-morphism-theory-ii-zero-knowledge-address-predicates-ja-v1.md`
- `zk-address-predicate-paper-en-v1.md`
- `zk-address-eligibility-model-ja.md`
- `zk-address-proofs-and-address-morphism-theory-paper-draft.md`
- `zero-knowledge-address-proofs-from-address-morphism-theory-ja.md`
- `zk-address-proof-materials-roadmap-ja.md`
- `zk-baseline-hardening-ja.md`
- `web3-zk-sdk-usage-plan.md`
- `crypto-business-development-guide-ja.md`
- `open-core-product-service-split-ja.md`
- `app-feature-monetization-boundary-ja.md`
- `service-monetization-boundary-ja.md`
- `unbuilt-app-concepts-ja.md`
- `p0-product-maturity-execution-plan-ja.md`
- `open-source-donation-readiness-ja.md`
- `commercial-impact-forecast-ja.md`
- `material-governance-audit-2026-06-18.md`
- `privacy-design.md`
- `privacy-leakage-role-verification-ja.md`
- `security-privacy-design.md`
- `external-audit-hardening-ja.md`
- `funder-brief-en.md`
- `agid-spec-v0.1-rc.md`
- `agid-three-demos-ja.md`
- `funding-channels-ja.md`

## POS / Delivery / Table / Operations / Drone OS Documents

- `delivery-pos-database-ja.md`
- `delivery-pos-simulation-ja.md`
- `pos-ui-hardening-ja.md`
- `accessibility-hardening-ja.md`
- `land-sea-air-transport-feature-research-ja.md`
- `table.md`
- `drone-os.md`
- `frontend-ecosystem-research-ja.md`
- `p0-product-maturity-execution-plan-ja.md`
- `p1-product-maturity-execution-plan-ja.md`
- `p2-product-maturity-execution-plan-ja.md`
- `unbuilt-app-concepts-ja.md`
- `multi-cloud-compatibility-ja.md`
- `aws-service-integration.md`
- `cloud-service-expansion-ja.md`
- `cross-border-pos-shopping-agent-data-layer.md`
- `trade-compliance-data-integration-plan.md`
- `cloud-db-integration-design.md`
- `hybrid-architecture.md`
- `address-system-connection-method.md`
- `address-communication-engineering-theory-ja.md`
- `address-verification-competitor-comparison.md`
- `search-language-design.md`
- `address-computer-science-techniques-ja.md`
- `data-licenses.md`

## Chapter Verification Evidence

The `chapter-verification/` directory is evidence, not the primary paper. Keep it separate from canonical reading flow.

Recommended interpretation:

- `*-verification.md`: evidence and validation notes.
- `*-edit-addendum.md`: proposed changes and addenda.
- `*-appendix-*.md`: appendix-specific verification and mathematical catalogs.
- `*-cross-chapter-evidence-map.md`: cross-chapter dependency map.
- `*-chapters-02-26-verification-bundles.md`: bundled review record.

## Recommended Later File Moves

Do these only after references are checked.

| Current pattern | Proposed folder | Rationale |
| --- | --- | --- |
| `address-morphism-theory-ja-v1-*` | `docs/papers/address-morphism-theory/ja/` | Separate source manuscript from support notes. |
| `address-morphism-theory-full-paper-*` | `docs/papers/address-morphism-theory/en/` | International paper drafts. |
| `*-evaluation.md` | `docs/evidence/evaluations/` | Keep theorem evaluation evidence discoverable. |
| `chapter-verification/*` | keep as-is for now | Already well grouped. |
| `agid-*` | `docs/specs/agid/` | Specification and performance docs. |
| `aoid-*` | `docs/specs/aoid/` | AOID-specific docs. |
| `zk-*`, `zero-knowledge-*` | `docs/papers/zk-address-predicates/` | Keep ZK paper separate from AMT core. |
| `delivery-*`, `cross-border-*`, `trade-*` | `docs/operations/` | Implementation-facing POS and logistics docs. |

## Cleanup Candidates

These should not be deleted automatically, but should be reviewed:

- Drafts superseded by canonical master files.
- Duplicate resumes and partial chapter resumes after they are merged.
- Generated PDFs that can be rebuilt from Markdown/LaTeX.
- External PDFs in Downloads with personal information.
- Any document whose claims are not tied to `address-morphism-verification-boundaries.md` or chapter verification notes.

## Release Rules

Before publishing or open-sourcing:

1. Ensure every public-facing Japanese document has an English counterpart when it is part of the public spec.
2. Keep zero-knowledge claims in a separate paper from core Address Morphism Theory.
3. Keep AGID/AOID as applications of AMT, not as replacements for AMT.
4. Do not publish personal PDFs, resumes, interview files, or private employment documents.
5. Scrub metadata from any PDF/DOCX release candidate.
6. Prefer source Markdown/LaTeX in Git; treat generated PDF as release artifact.
