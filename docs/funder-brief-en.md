# AGID/AOID Funder Brief

Release target: AGID OSS public-good package
Version: 2026-06-18 draft
Length target: five-page brief

## Page 1: Executive Summary

AGID/AOID is an open-source address infrastructure project for privacy-preserving
address resolution, delivery handoff, and address-derived verification.

Its public-good posture is deliberately simple:

- **Ethereum optional:** wallets, gas, public ledgers, and crypto payments are not required for core use.
- **Local-first:** address resolution, AGID-S decryption, POS handoff, and high-risk safety can work without a central tracking server.
- **No raw address by default:** public records and audit artifacts use commitments, aliases, roots, nullifiers, and redacted evidence instead of raw address material.

The project starts from a practical problem: addresses are necessary for delivery,
aid, identity, administration, and commerce, but raw addresses are dangerous when
they are copied into every shop, courier, agent, database, QR code, and support log.
The result is fragile logistics, poor inclusion for under-addressed areas, and a
surveillance risk for people in sensitive contexts such as disaster evacuation,
domestic violence, refugee support, and humanitarian field operations.

AGID separates the address stack into layers:

- **AGID**: a public, non-personal location and address reference.
- **AOID**: a private, owner-controlled address object for detailed address,
  authority, redaction, and credentials.
- **AGID-S**: an encrypted AGID QR/NFC/link format for safe sharing.
- **Local Resolver**: offline-capable address display, postal assistance, language
  tabs, and basic validation without a central tracking server.
- **Optional ZK / Registry layers**: proof, revocation, freshness, nullifier, and
  audit layers that remain optional and do not replace the local-first baseline.

The open-source goal is not to build another proprietary geocoding API. It is to
create a public, inspectable, self-hostable address toolkit where the safe default is:

> resolve and validate as much as possible locally, disclose only the minimum fact
> required, and never make raw address storage a condition of basic use.

## Page 2: Problem and Public-Interest Need

Existing address and map systems solve many navigation problems, but they usually
optimize for convenience and central APIs. They are weaker for privacy-preserving
handoff, offline operation, public auditability, and user-controlled disclosure.

Key problems:

1. **Raw address over-collection**
   Merchants, agents, dashboards, receipts, support systems, and logs often store
   the full address even when they only need "delivery eligible", "inside a service
   area", or "valid recipient proof".

2. **Unreliable address display across countries and languages**
   Address systems differ by country, script, postal code rules, rural coverage,
   islands, PO boxes, buildings, roads, natural features, and informal delivery
   points. A single English-centric form is not enough.

3. **Under-addressed and high-risk contexts**
   Disaster sites, temporary shelters, informal settlements, remote islands,
   maritime/coastal areas, polar regions, and humanitarian field sites often need
   usable address references without exposing exact personal locations.

4. **Weak auditability without privacy**
   Delivery and assistance workflows need receipts, revocation, freshness, and
   double-use prevention. But publishing raw addresses or global identifiers creates
   tracking infrastructure.

5. **Vendor lock-in**
   Many strong address APIs are proprietary. AGID keeps the core resolver, SDK,
   tests, specs, and basic POS/Address Element open-source and self-hostable.

AGID's public-interest value is strongest when scoped narrowly:

- Local Resolver and Address Element for address display and correction.
- AGID-S high-risk sharing for encrypted QR/NFC/link handoff.
- POS offline handoff for stores, warehouses, and humanitarian field work.
- No-raw-address tests and external audit readiness for public trust.

## Page 3: Open-Source Deliverables and Three Demos

The first fundable open-source package should ship three demos.

### Demo 1: Local Resolver and Address Element

Purpose:

- Show address entry, language tabs, postal-code assistance, AGID lookup, and
  correction feedback without requiring a hosted registry.

What it proves:

- AGID can improve address display and validation while preserving Mode 0 Local Only.
- The host page receives redacted quality state and next action, not raw private
  address material.

Success criteria:

- runs locally
- supports language switching
- shows partial/verified/needs-review decisions without exposing internal score
- passes no-raw-address payload tests

### Demo 2: AGID-S High-Risk Sharing + POS Offline Handoff

Purpose:

- Show encrypted AGID QR/NFC handoff where the POS can scan, check expiry/used state,
  request recipient proof, complete handoff, and print a redacted receipt.

What it proves:

- A QR can support delivery or aid handoff without making precise location public.
- Offline queue and deferred sync can work for field settings.

Success criteria:

- AGID-S is treated as an envelope, not AOID
- copied/stale QR is review or reject
- high-risk mode hides raw address, raw AGID/AOID, phone, proof code
- completion receipt is redacted and auditable

### Demo 3: Audit-Ready Registry and ZK-Ready Predicate Flow

Purpose:

- Show issuer, revocation, freshness, nullifier, and proof-bundle records using
  commitments and public signals only.

What it proves:

- The registry can verify status and double-use prevention without becoming a
  public address database.
- ZK claims remain clearly labeled as "ZK-ready" until externally audited circuits
  exist.

Success criteria:

- no raw address in registry records
- nullifiers are domain-separated
- public signals are allowlisted
- production-grade wording is blocked until audit status is external-reviewed

## Page 4: Safety, Privacy, and Audit Posture

AGID/AOID has a non-negotiable safety position:

- Do not require Ethereum, ZK, hosted registry, or paid services for basic operation.
- Do not store raw addresses, AOID plaintext, AGID-S payloads, proof witnesses, or
  recipient secrets in public logs or public artifacts.
- Do not make revocation, deletion, export, local decryption, high-risk mode, or
  security fixes paid-only.
- Do not market AGID/AOID as a token-first crypto project.

The project has implementation-facing controls for:

- public/private separation
- no-raw-address tests
- external audit gates
- accessibility hardening
- ZK baseline hardening
- data-license separation
- material governance

Before a public release, the project should pass:

```bash
npm run verify:external-audit
npm run verify:no-raw-address
npm run verify:preaudit-secrets
npm run verify:a11y
npm run lint
```

Before any production-grade ZK claim, the project requires:

- circuit id
- public signal schema
- witness hygiene policy
- nullifier domain-separation analysis
- verifier key reference
- external cryptography audit

Before any hosted production claim, the project requires:

- OpenAPI and webhook signature review
- tenant isolation review
- log redaction review
- hosted registry/API penetration test
- incident response runbook

## Page 5: Milestones, Funding Fit, and Use of Funds

### Six-Month Milestones

Milestone 1: Public release candidate

- AGID spec v0.1 release candidate
- test vectors
- SECURITY.md
- no-raw-address release scan
- pre-audit secret scan
- data license manifest update

Milestone 2: Three public demos

- Local Resolver + Address Element
- AGID-S high-risk POS handoff
- Audit-ready registry and ZK-ready predicate flow

Milestone 3: External review preparation

- threat model review
- accessibility review
- external security review packet
- ZK audit-status table
- public funder report with no private address material

### Funding Fit

Good first funding targets:

- NLnet: Local Resolver, Address Element, no-raw-address conformance.
- Open Technology Fund: anti-surveillance address sharing, AGID-S, high-risk mode,
  offline field handoff.
- Gitcoin: public-good demos and community maintenance.
- Digital Public Goods Alliance: recognition and public-good validation.
- Web3 Foundation / Ethereum ESP: only for narrow optional ZK/registry work that
  does not put addresses on-chain.

### Use of Funds

Funding should support:

- resolver quality and country/language coverage
- accessibility improvements
- release engineering and reproducible artifacts
- security and privacy review
- data-license documentation
- local-first demo polish
- documentation and onboarding

Funding should not incentivize:

- centralizing raw address data
- proprietary API lock-in as the core path
- token-first positioning
- surveillance analytics
- paywalling safety controls

The requested outcome is a trustworthy open address toolkit: useful for ordinary
commerce, safe enough for high-risk handoff, and honest about which claims are
implemented, internally tested, externally reviewed, or future work.
