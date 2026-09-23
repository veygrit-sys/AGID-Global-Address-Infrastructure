# Material Governance Audit

Date: 2026-06-18

This audit records the practical keep/update/delete decision for repository materials. It complements `document-index.md` and the generated `unused-file-material-audit-2026-06-07.md`.

## Scope

Reviewed material classes:

- Root documentation and policy files.
- `docs/**/*.md`, including papers, verification notes, product/service plans, security/privacy notes, and app/service split documents.
- Generated screenshots and runtime logs in the workspace root.
- Build/test output directories.
- Ignored generated output folders such as `output/`, `outputs/`, `artifacts/`, and `tmp/`.

Current material snapshot after cleanup:

| Class | Count / State | Decision |
| --- | ---: | --- |
| Markdown documents under `docs/` | 198 | Keep, index, and classify. Do not mass-delete. |
| Root material files | 8 | Keep public governance files; delete runtime logs and temporary screenshots. |
| Runtime logs | 0 remaining | Deleted. |
| `dist/` | absent | Deleted; reproducible by build. |
| `test-results/` | absent | Deleted; reproducible by test run. |
| Root `tmp-*` screenshots | absent | Deleted and ignored. |

## Deleted In This Pass

These were high-confidence generated or temporary artifacts:

- `.codex-pos-dev.log`
- `.codex-vite.err.log`
- `.codex-vite.out.log`
- `agid-dev.err.log`
- `agid-dev.log`
- `agid-pos-3001.err.log`
- `agid-pos-3001.log`
- `agid-pos-3100.err.log`
- `agid-pos-3100.log`
- `agid-pos-3102.err.log`
- `agid-pos-3102.log`
- `agid-pos-3103.err.log`
- `agid-pos-3103.log`
- `agid-pos-3104.err.log`
- `agid-pos-3104.log`
- `agid-pos-prod-3106.err.log`
- `agid-pos-prod-3106.log`
- `dev-server.err.log`
- `dev-server.out.log`
- `tmp-address-dashboard-screenshot.png`
- `dist/`
- `test-results/`

## Updated In This Pass

- `.gitignore`: added `tmp-*` to prevent root temporary screenshots and scratch files from reappearing.
- `docs/README.md`: updated documentation index to include material governance and monetization boundary documents.
- `docs/document-index.md`: updated the product strategy family count and added material governance.
- `docs/material-governance-audit-2026-06-18.md`: this decision record.

## Keep As Canonical Or Near-Canonical

These documents should remain part of the main reading path or public-facing repository story:

| Class | Keep Examples | Reason |
| --- | --- | --- |
| Project overview | `project-resume.md`, root `README.md` | Entry points. |
| Core AMT papers | `address-morphism-theory-ja-v1-master.md`, `address-morphism-theory-full-paper-en-v3.md` | Main theory drafts. |
| Verification boundaries | `address-morphism-verification-boundaries.md`, `address-morphism-theory-verified-resume.md` | Prevent overclaiming. |
| AGID/AOID specs | `agid-standard.md`, `agid-aoid-application-paper-en-v1.md` | Public application layer. |
| ZK paper | `zk-address-predicate-paper-en-v1.md` | Separate from AMT core. |
| Security/privacy | `security-privacy-design.md`, `privacy-design.md`, `public-private-separation.md` | Required for OSS trust. |
| Open-core strategy | `open-core-product-service-split-ja.md`, `app-feature-monetization-boundary-ja.md`, `service-monetization-boundary-ja.md` | Business boundary and anti-lock-in rules. |
| Language/platform policy | `programming-language-selection-policy-ja.md`, `documentation-bilingual-policy.md` | Engineering and documentation governance. |

## Keep As Evidence, Not Main Reading Path

These should usually stay, but should be cited or archived rather than shown as primary docs:

| Class | Examples | Reason |
| --- | --- | --- |
| Chapter verification | `docs/chapter-verification/**` | Evidence bundle for the Japanese v1 paper. |
| Theorem evaluations | `address-reference-impossibility-theorem-evaluation.md`, `address-entropy-evaluation.md`, `zk-address-theorem-evaluation.md` | Supports claims, not user onboarding. |
| Editorial audits | `address-morphism-paper-expression-audit.md`, `address-morphism-paper-model-diagram-gap-audit.md`, `address-morphism-theory-paper-omission-check.md` | Keep for provenance until merged. |
| Performance checks | `agid-performance-check-2026-06-07.md`, `aoid-performance-check-2026-06-07.md`, `agid-aoid-strict-performance-benchmark-2026-06-07.md` | Evidence for performance claims. |
| Generated moodboard/visual outputs | `outputs/**` | Visual design evidence; ignored as generated output. |

## Keep As Implementation-Facing Design

These are not theoretical papers, but they guide implementation and should remain discoverable:

- Address Resolution System / DNS / Federated Resolver docs.
- POS, delivery, waybill, payment, carrier, and handoff docs.
- Evidence Vault, Radar, Review Console, Portal, Console, and Address Element docs.
- Cloud, DB, Microsoft/Google/AWS/Adobe/Cisco/COSCO integration notes.
- Transport mode docs: land, sea, air, drone, locker, Operations, Table.
- Data-source docs: fully-free data, tax, trade compliance, data licenses.

## Do Not Delete Automatically

Do not delete these without a later focused pass:

- Any `docs/**/*.md` paper draft or verification note.
- `docs/chapter-verification/**`.
- `output/` and `outputs/` release/visual artifacts until publication targets are confirmed, even though they are ignored generated outputs.
- `reports/**` visual audit artifacts.
- `data/postal_codes/*.txt`, because normalized postal datasets are used for local/offline behavior.
- SDK directories and generated test vectors.

## Remaining Cleanup Candidates

These need a later focused decision:

| Candidate | Suggested Action |
| --- | --- |
| Superseded AMT drafts | Archive under a date-stamped evidence folder after final paper references are checked. |
| Old editorial addenda | Merge into master paper or move to `docs/archive/`. |
| Generated PDFs/images | Keep only release candidates; regenerate previews on demand. |
| `unused-file-material-audit-2026-06-07.md` | Keep as detailed generated audit until a newer audit script/report replaces it. |
| Postal ZIP deletion status | Keep normalized `.txt`; do not restore `.zip` unless provenance requires it. |

## Rule Going Forward

Delete immediately only when all are true:

1. The file is generated, temporary, or reproducible.
2. It is ignored by `.gitignore` or should be ignored.
3. It is not a source manuscript, source dataset, test vector, spec, or evidence note.
4. Deletion does not remove the only record for a claim in a paper or README.

Everything else should be reclassified, merged, or archived rather than deleted.
