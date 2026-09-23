# AGID / Address Morphism Documentation Index

This directory contains research notes, papers, verification notes, design documents, and operational references for AGID, AOID, AGID-S, ZK address predicates, POS, delivery, and address validation.

## Canonical Reading Order

1. `project-resume.md`
2. `address-morphism-theory-ja-v1-master.md`
3. `address-morphism-theory-ja-v1-appendices.md`
4. `address-morphism-theory-full-paper-en-v3.md`
5. `address-morphism-theory-verified-resume.md`
6. `address-morphism-verification-boundaries.md`
7. `agid-standard.md`
8. `agid-aoid-application-paper-en-v1.md`
9. `zk-address-predicate-paper-en-v1.md`
10. `zk-baseline-hardening-ja.md`
11. `security-privacy-design.md`

## Main Document Families

- Address Morphism Theory: core mathematical theory, Japanese master draft, English draft, verification notes.
- AGID / AOID: application layer papers, identifiers, QR/NFC, performance, and ER diagrams.
- AGID-S: encrypted AGID QR and safe sharing layer.
- ZK Address Predicates: private residence, delivery eligibility, AOID ownership, nullifiers, revocation, freshness, and proof bundles.
- ZK Baseline Hardening: public signal allowlist, witness hygiene, domain-separated nullifiers, fixture/production separation, and production-blocker wording rules.
- POS / Delivery: POS simulation, delivery database, external delivery API integration, waybill QR, printer/cash drawer/barcode reader operations.
- POS UI Hardening: scan-to-decision clarity, four-stage handoff, trust strip, review queue, device diagnostics, settings policy, and privacy-safe reports.
- Accessibility Hardening: keyboard-only operation, focus visibility, screen-reader status, contrast, language-direction sync, reduced motion, and high-risk privacy-safe narration.
- External Audit Hardening: audit packets, release artifact hygiene, no-raw-address review, ZK production claim gates, data-license audit, and public report redaction.
- OSS Launch Package: five-page funder brief, three public demos, AGID spec v0.1 release candidate, funding channels, no-raw-address tests, and pre-audit secret scan.
- Frontend Ecosystem: map, registration, Address Element, POS, Portal, Dashboard, Review Console, Developer Console, and settings/policy surface planning.
- Unbuilt App Concepts: unfinished app inventory, app split decisions, first milestones, and privacy/free-boundary rules for Portal, Console, Review, Evidence, Developer, Field, Carrier, and Drone/Locker apps.
- P0 Product Maturity: execution order, routes, shared policy schema, state contracts, tests, and free/commercial boundary for Settings, Portal, Dashboard, Review, and Field.
- P1 Product Maturity: execution order, evidence vault, developer platform, organization trust, carrier labels, settlement, tests, and free/commercial boundary.
- P2 Product Maturity: Drone / Locker Operations future-app contract, device schema, access grants, telemetry privacy, incident receipts, and local simulator.
- Crypto Business Development: contribution tracks for exchanges, wallets, custodians, payment processors, ZK providers, relayers, auditors, and POS/carrier integrators.
- Open Core Product Strategy: OSS/commercial feature boundaries, app partitions, service offerings, and MVP service count.
- App Monetization Boundary: free, self-hosted, paid, enterprise, and never-paywalled app feature rules.
- Service Monetization Boundary: free baseline for all twelve services, with paid exceptions only for unavoidable operating costs.
- Open Source Donation Readiness: donation/grant readiness by OSS area, professional role, funder fit, and philosophy guardrail.
- Commercial Impact Forecast: commercial revenue scenarios, impact priorities, pricing hypotheses, and no-data-resale guardrails.
- Material Governance: keep/update/delete decisions for papers, verification notes, generated outputs, logs, screenshots, and release materials.
- Organization Policy: current unorganized-area inventory, canonical placement rules, generated/source boundaries, and staged cleanup order.
- World Address Repository Architecture: multi-repository split rules for country, territory, state/province, megacity, disputed-area, postal-zone, and external GIS data packs.
- Global Entity Research: coverage plan for every country, overseas territory, autonomous territory, disputed area, polar area, maritime area, and no-postal-code area.
- AGID Core Data Production Loop: local ledger loop for choosing the next country/territory/child repository unit and recording remaining production counts.
- Address Breadcrumb Reconstruction Compatibility: mathematical rule for when breadcrumb restoration is optimal, merely compatible, manually reviewed, or incompatible with AGID.
- Multi-Cloud Compatibility: local/Azure/GCP/AWS workload matrix, privacy boundaries, and adapter parity planning.
- Transport Modes: land, sea, and air transport feature requirements, multimodal intent design, and mode-specific document/compliance profiles.
- Address Validation: official source coverage, standard library resolution, external validators, geocoding/reverse geocoding quality.
- Security / Privacy: surveillance resistance, privacy leakage analysis, safe modes, and threat-sensitive operation.

## Supporting Index Files

- `document-index.md`: categorized list of current repository documents and recommended status.
- `pdf-source-inventory.md`: inventory policy for PDFs stored outside the repository, especially Downloads.
- `../LICENSE_POLICY.md`: repository-level license split and open-core boundary.
- `../DATA_LICENSES.md`: top-level data-license index for external evidence layers.
- `data-licenses.md`: detailed source-data license and attribution policy.
- `programming-language-selection-policy-ja.md`: project-wide rule for choosing TypeScript, Rust, SQL, Solidity, Circom, Lean, Python, or generated SDKs.
- `zk-baseline-hardening-ja.md`: implementation-facing ZK baseline hardening plan, public signal policy, production blockers, and verification commands.
- `frontend-ecosystem-research-ja.md`: frontend surface research, feature map, correlation diagrams, ecosystem planning, and implementation-preparation entry points.
- `unbuilt-app-concepts-ja.md`: unfinished app concept catalog, maturity plan, app split policy, implementation order, and test policy.
- `p0-product-maturity-execution-plan-ja.md`: P0 execution contract for Settings and Policy Center, Address Portal, Dashboard, Review Console, and Field Handoff App.
- `p1-product-maturity-execution-plan-ja.md`: P1 execution contract for Evidence Vault, Developer Platform, Address Connect Admin, and Carrier Label and Settlement.
- `p2-product-maturity-execution-plan-ja.md`: P2 execution contract for Drone / Locker Operations, device status, access receipts, telemetry privacy, and local simulation.
- `pos-ui-hardening-ja.md`: POS UI strengthening plan, state contracts, P0/P1/P2 improvements, and test policy.
- `accessibility-hardening-ja.md`: accessibility strengthening plan, release gates, P0/P1/P2 improvements, global CSS baseline, and test policy.
- `external-audit-hardening-ja.md`: external audit readiness plan, audit packets, P0/P1/P2 gates, ZK production claim blockers, and public report redaction rules.
- `funder-brief-en.md`: five-page English funder brief for local-first, no-raw-address, AGID-S, POS, and audit-ready OSS funding.
- `agid-three-demos-ja.md`: public demo scripts for Local Resolver + Address Element, AGID-S POS handoff, and audit-ready ZK-ready registry flow.
- `agid-spec-v0.1-rc.md`: AGID specification v0.1 release-candidate boundary, conformance levels, release gates, and known limitations.
- `funding-channels-ja.md`: GitHub Sponsors, Open Collective, and Gitcoin setup guide and funding philosophy guardrails.
- `crypto-business-development-guide-ja.md`: development guide for crypto businesses, including registry, wallet, payment, ZK, relayer, SDK, and audit contribution boundaries.
- `open-core-product-service-split-ja.md`: open-source vs commercial feature split, app partitioning, service offering catalog, and MVP order.
- `app-feature-monetization-boundary-ja.md`: app-level free/paid boundary, never-paywalled safety features, and tier rules.
- `service-monetization-boundary-ja.md`: service-level free baseline and paid-exception rules for Resolver, Validation, Element, POS, Portal, Console, Registry, Review, Evidence, Radar, ZK, and Payment/Carrier services.
- `open-source-donation-readiness-ja.md`: donation/grant readiness assessment, funder-fit forecast, professional-role review, and non-negotiable OSS philosophy guardrails.
- `commercial-impact-forecast-ja.md`: commercial impact and ARR scenarios for hosted registry, POS fleet, dashboard, review, evidence, ZK, support, private deployment, and carrier/payment services.
- `material-governance-audit-2026-06-18.md`: current keep/update/delete decision record for documents, generated outputs, root logs, screenshots, and evidence materials.
- `unorganized-area-policy-2026-06-24-ja.md`: current cleanup policy for `src/lib`, address formats, SDK generation, docs families, heavy data packs, server routes, and Caucasus placement.
- `product/world-address-repository-architecture.md`: default AGID world-address multi-repository architecture, GitHub data boundary, external storage boundary, quality gates, maintainer model, and expansion rules.
- `product/global-country-territory-research-plan.md`: research coverage plan for countries, territories, autonomous regions, disputed areas, polar areas, maritime areas, and postal-model classes.
- `product/agid-core-data-production-loop.md`: core data production loop, remaining-count ledger, completion policy, and no-raw-address data boundary.
- `product/address-breadcrumb-reconstruction-compatibility.md`: breadcrumb reconstruction compatibility model, AGID relation rule, fallback conditions, and implementation hook.
- `multi-cloud-compatibility-ja.md`: local/Azure/GCP/AWS compatibility plan, workload matrix, and cloud data-safety boundaries.
- `aws-service-integration.md`: AWS adapter safety rules for Cognito/IAM Identity Center, KMS, Location, Textract, EventBridge, SQS, Lambda, S3, RDS, DynamoDB, API Gateway, IoT Core, SNS, and SES.
- `cloud-service-expansion-ja.md`: extended cloud/edge/PaaS/DBaaS provider catalog for Cloudflare, OCI, Alibaba Cloud, Tencent Cloud, Huawei Cloud, IBM Cloud, DigitalOcean, Vercel, Supabase, MongoDB Atlas, Snowflake, and Databricks.
- `chapter-verification/`: chapter-by-chapter verification notes and edit addenda for the Japanese v1 paper.

## Hygiene Rules

- Keep canonical papers and implementation-facing specs in `docs/`.
- Do not commit personal resumes, job documents, interview files, or unrelated business PDFs.
- Do not move source PDFs into the repository unless they are licensed, project-relevant, and scrubbed of private metadata.
- Prefer English filenames for reusable public documentation.
- Keep Japanese manuscripts when the Japanese text is the source of truth.
- Treat generated PDFs as build artifacts unless the PDF is a manually reviewed release candidate.

## Current Safe Organization Policy

The repository is in a heavily modified state. To avoid broken references, this pass does not move or delete existing files. It adds an index and classification layer first. Physical file moves should happen in a later pass after references and publication targets are confirmed.
