# AGID and AOID as Applications of Address Morphism Theory

## A Layered Architecture for Public Geographic Reference, Private Operational Address Identity, QR/NFC Workflows, POS Acceptance, MCP Interfaces, and Agent-Safe Address Disclosure

Application Paper v1.0
Date: 2026-06-07
Status: application architecture and specification draft

---

## Abstract

Address Morphism Theory (AMT) studies how ambiguous, historical, multilingual, and changing address expressions can be mapped to stable address entities, unresolved states, candidate clusters, persistent identifiers, and lineage records. AGID and AOID are application layers built on that semantic foundation. They are not replacements for AMT itself, and they are not a claim that all address truth can be solved by one code.

AGID, the Address Grid Identifier, is the public geographic and public evidence layer. It identifies a deterministic public grid context and attaches public address, building, natural feature, infrastructure, heritage, and source evidence to that context. AGID answers public questions such as where a public place, road, bridge, building, river, lake, island, desert, wetland, glacier, cave, valley, waterfall, ruin, or heritage site is referenced.

AOID, the Address Owner Identifier, is the private operational address layer. It is an owner-managed relation between a public AGID or public address context and private delivery, recipient, authorization, credential, revocation, and consent data. AOID is not a public address code. Its public surface is limited to an opaque handle, linked AGID anchor, status, version, public reference metadata, commitment metadata, and proof-related metadata. Recipient names, phone numbers, unit or room identifiers, private delivery instructions, access instructions, precise private coordinates, owner secrets, device keys, and credential salts remain local-first or owner-encrypted.

This paper defines the AGID/AOID separation principle, the public and private data models, communication boundaries for REST, SDK, QR, NFC, POS terminals, MCP servers, shopping agents, cloud sync, and data packs, and the conformance tests needed for open-source release. It also states what is not yet proven: zero-knowledge soundness, global parity with paid 240-country address validation services, real carrier delivery success, and universal official postal data coverage require separate verification. The core contribution is a disciplined application architecture: public geography can be shared widely, while private operational address identity is controlled by the owner and never becomes a public data-pack artifact.

## Keywords

Address Morphism Theory, AGID, Address Grid Identifier, AOID, Address Owner Identifier, public geographic reference, private operational address identity, address privacy, QR, NFC, POS acceptance, MCP, shopping agent, public-private separation, open-source address infrastructure, zero-knowledge companion protocols.

---

## 1. Purpose and Claim Discipline

This paper has a narrow role. It describes AGID and AOID as applications of Address Morphism Theory. It does not attempt to reprove the full AMT thesis. It also does not attempt to replace the separate zero-knowledge address predicate paper. The goal is to define how the application should behave when real users, maps, postal evidence, QR codes, NFC tags, POS terminals, cloud services, MCP servers, and shopping agents interact with address-derived identifiers.

The design follows three claim levels.

First, there are normative design claims. These are rules the system should obey even before global empirical validation is complete. For example, AGID must not contain recipient names or phone numbers. AOID private payloads must not be exported into public AGID data packs. A public AOID QR must not be treated as ownership proof. These claims are architectural safety constraints.

Second, there are implementation-supported claims. These are claims that can be checked in the repository by policy functions, identifier normalization, redaction code, API contract tests, QR payload tests, or proof-ready envelope tests. They are stronger than ideas, but weaker than full field validation. For example, an implementation can reject AOID handles with reserved patterns and can enforce that public QR payloads omit private fields.

Third, there are validation targets. These are important goals, but they are not treated as established facts in this paper. Examples include matching or beating commercial 240-country address validation APIs, proving zero-knowledge circuit soundness, integrating every official postal source, or demonstrating delivery success across carriers and jurisdictions. These require field studies, official data ingestion, carrier integration, external audit, and jurisdiction-specific evaluation.

The paper therefore uses cautious language. AGID and AOID are useful when they improve public reference, private control, and operational safety. They are not magic. They become trustworthy only when the separation model, source model, validation model, and privacy model are enforced together.

## 2. Problem Statement

Address systems are difficult because they mix several different things under one word. A single address string can contain public geography, administrative hierarchy, postal routing information, building names, unit numbers, recipient names, phone numbers, delivery instructions, historic place names, local aliases, and sometimes emergency or humanitarian context. A public map wants one part of this data. A carrier may need another. A resident may want to disclose almost none of it. A point-of-sale application may only need to know whether delivery is possible. A shopping agent may need to prove eligibility without learning the full address.

Current systems often collapse these layers. A user shares a full address string because it is the only available representation. An application stores the full string because it needs delivery later. A QR code encodes too much because the system does not distinguish a public location reference from a private delivery instruction. A map label becomes confused with a legal address. A public place identifier becomes confused with ownership or residence. A centralized server becomes the default place where address, recipient, history, and delivery state are stored in plaintext.

The AGID/AOID design addresses this by splitting the address application into layers.

AGID handles public geographic reference. It is suitable for public APIs, public QR codes, public data packs, SDK parity vectors, maps, feature search, reverse geocoding, address quality evidence, and open-source geographic source integration.

AOID handles private operational address identity. It is suitable for owner-managed delivery information, recipient context, private unit or room information, consent, revocation, delegation, encrypted sync, private QR transfer, credential references, and proof-ready metadata.

The split is not merely a privacy feature. It is also a correctness feature. Public geography, postal validation, residence, ownership, deliverability, and delivery authorization are different predicates. Treating them as the same object creates both security risk and semantic error.

## 3. Relationship to Address Morphism Theory

AMT is the semantic foundation. It studies address expressions as observations and maps them through candidate generation, clustering, unresolved judgment, history update, and persistent identifier issuance.

At a high level, an AMT pipeline can be represented as:

```text
address expression x_t
  -> parse and expand
  -> candidate set C_t(x_t)
  -> structural distance and clustering
  -> resolved entity, unresolved state, or ambiguity set
  -> history update
  -> PID or evidence envelope
```

AGID and AOID consume the outputs of this semantic process, but they do not replace it.

AGID can be used as public evidence inside candidate generation, reverse geocoding, feature recognition, boundary reasoning, and quality scoring. It can also attach public source metadata to a location context. However, AGID does not by itself decide that an ambiguous address has been fully resolved. It is a public geographic reference layer.

AOID can be linked to a PID, an AGID, or a public address context. It can help represent owner-managed operational relations such as delivery, delegation, revocation, and credential binding. However, AOID does not by itself prove address truth, ownership, residence, or deliverability. It is a private operational relation layer.

Zero-knowledge address predicates can use AMT, AGID, and AOID as inputs. For example, a private proof may state that a committed AOID belongs to a delivery-eligible region associated with an AGID. That proof layer is a companion framework, not the same as AGID or AOID.

The intended relationship is:

```text
Address Morphism Theory
  semantic resolution, unresolved states, history, PID

AGID
  public geographic cell and public evidence layer

AOID
  owner-managed private operational address relation

ZK Address Predicates
  selective disclosure proofs over AMT, AGID, AOID, credentials, and policies
```

## 4. Core Definitions

Let time be indexed by t. Let X_t be the set of address observations at time t. Let E_t be the set of address entities or entity hypotheses under AMT. Let P_t be the set of persistent identifier states. Let G_t be the set of public AGID contexts. Let A_t be the set of AOID records. Let S_t be the set of source and evidence records.

Definition 1, AMT observation. An AMT observation is any input expression, coordinate, feature label, postal token, administrative token, map object, delivery event, or historical record that can contribute to address resolution.

Definition 2, public AGID context. A public AGID context g in G_t is a public geographic reference with a deterministic identifier, public cell or geometry state, public evidence labels, source metadata, confidence metadata, and freshness metadata.

Definition 3, private AOID record. A private AOID record a in A_t is an owner-managed relation:

```text
a = (i, alpha, g, p, o, k, sigma, rho, eta, tau)
```

where i is an AOID handle, alpha is the linked AGID anchor when present, g is a public AGID or public context, p is an optional PID or AMT evidence envelope, o is an owner or owner device context, k is key and credential metadata, sigma is private operational payload, rho is consent and purpose scope, eta is encrypted sync metadata, and tau is lifecycle state.

Definition 4, public projection. The public projection of an AOID is:

```text
Pub(a) = (i, alpha, linked_agid_hint, public_handle, status, version,
          commitment_metadata, proof_metadata)
```

It intentionally excludes plaintext recipient, phone number, unit, room, private delivery instruction, access instruction, exact private coordinate, owner secret, device secret, credential private salt, and private update timestamp.

Definition 5, private witness. The private witness of an AOID is:

```text
Wit(a) = (recipient, phone, unit_or_room, private_delivery_instruction,
          access_instruction, owner_secret, device_secret,
          credential_private_salt, private_history, private_coordinates?)
```

The private witness may exist only on the owner device or inside an owner-encrypted envelope. A server may store an encrypted envelope only after explicit owner consent.

Definition 6, public source envelope. A public source envelope is:

```text
Source = (authority, provider, dataset, license, jurisdiction,
          coverage, freshness, quality, allowed_use, integrity)
```

The source envelope supports public AGID evidence and address validation. It is not evidence of private ownership or residence unless a separate credential or proof system says so.

Definition 7, capability surface. A capability surface is any interface that can expose, transform, store, or transmit address-related data. Examples include REST, OpenAPI, SDK, QR, NFC, POS terminal, MCP, shopping agent, cloud sync, cache, data pack, worker, IndexedDB, log, and audit export.

## 5. Layered Architecture

The application model is a layered identity system:

```text
L_t = (AMT_t, AGID_t, AOID_t, Credential_t, Proof_t, Surface_t)
```

AMT_t contains semantic resolution and history. AGID_t contains public geographic identifiers and public evidence. AOID_t contains private owner-managed operational address relations. Credential_t contains issuer statements, residence credentials, delivery credentials, and revocation/freshness roots. Proof_t contains proof-ready envelopes and optional zero-knowledge proof bundles. Surface_t contains interfaces that expose or consume the previous layers.

The central design rule is that data may move from private to public only through explicit projection, consent, or proof. It must not move by accident.

```text
private AOID witness
  -> owner consent or encryption
  -> public projection, credential, or proof statement
  -> QR/NFC/POS/API/MCP/Agent surface
```

The separation is enforceable only if each surface has an allowlist. A public surface should not rely on a best-effort "do not leak" convention. It should have a policy that rejects fields by class.

For example, a public AGID API can expose:

```text
agid, prefix, hash, cell state, approximate bounds, public labels,
feature type, source metadata, quality, freshness, license
```

It must reject:

```text
recipient, phone, unit, room, private delivery instruction,
access code, exact private coordinate, AOID private payload,
owner key, device key, credential private salt
```

Similarly, a public AOID reference can expose:

```text
aoid id, linked AGID anchor, public handle, status, version,
commitment metadata, proof metadata
```

It must reject:

```text
plaintext recipient, phone, unit, room, private delivery instruction,
private address text, exact private coordinate, owner secret,
device secret, credential private salt, public update timestamp
```

## 6. AGID Public Geographic Reference Model

AGID is designed to be public. It can be used by maps, SDKs, search engines, reverse geocoders, address validation systems, public QR codes, NFC tags, POS terminals, robotics applications, emergency tools, humanitarian tools, and open-source source packs.

An AGID should represent a public geographic context, not a person. It can attach public evidence for:

- administrative areas, countries, regions, cities, towns, villages, islands, and special territories;
- postal labels, public address labels, and jurisdictional labels;
- buildings, public facilities, landmarks, campuses, terminals, stations, ports, airports, lockers, and shelters;
- roads, bridges, tunnels, routes, railways, public access paths, and named infrastructure;
- rivers, waterfalls, lakes, ponds, wetlands, salt lakes, coastlines, bays, seas, and ocean features;
- mountains, hills, valleys, deserts, grasslands, forests, wilderness areas, ice fields, glaciers, caves, and named natural features;
- ruins, monuments, archaeological sites, world heritage sites, temples, historic districts, and protected cultural places.

This breadth is important. Many real delivery and navigation situations are not ordinary street-address cases. A person may need to reference a bridge, ferry terminal, lake shore, desert camp, Antarctic station, mountain hut, island, cave entrance, ruin, field station, or disaster shelter. AGID can make those references more systematic by treating public named features as public evidence.

The AGID model should still avoid overclaiming. A public feature name may not be unique. A public source may be stale. A national boundary may be disputed. A natural feature may have fuzzy geometry. A cell may be correct while the address label is incomplete. Therefore AGID evidence is a tuple of identifier, geometry, label, source, quality, freshness, and uncertainty, not a naked assertion of truth.

The AGID public evidence function may be represented as:

```text
Ev_G(g, t) = {s in S_t | s is public, licensed, and relevant to g}
```

The AGID quality state may be represented as:

```text
Q_G(g, t, u) = q
```

where u is the use case, such as public map display, postal validation, delivery routing, disaster response, or legal-risk-sensitive use. The same AGID can be high quality for approximate map display and low quality for legal delivery validation.

## 7. AOID Private Operational Address Model

AOID is private by default. It exists because public geography is often insufficient for real operations. A building can contain many recipients. A single public address can contain multiple units, rooms, entrances, floors, lockers, companies, households, warehouses, or temporary shelters. A person may need different delivery instructions for different carriers or purposes. A business may need revocation, delegation, inheritance, and auditability. A disaster shelter may need a temporary operational address without exposing vulnerable persons.

AOID models these cases as an owner-managed relation rather than as a public code.

An AOID record can be represented as:

```text
AOIDRecord =
  (id, linked_agid_anchor, linked_pid, owner_key_id, device_key_id,
   public_handle, encrypted_private_payload, status, version,
   consent_scope, proof_metadata, created_at_policy, updated_at_policy)
```

The public part is small. The private part is controlled by the owner. A central service may help with sync, recovery, or validation, but only by storing opaque encrypted envelopes or public references. It should not become a plaintext AOID database.

The AOID identifier rule is:

```text
alphabet = 0123456789ABCDEFGHJKMNPQRSTVWXYZ
9 <= len(aoid) <= 16
standard generated length = 16
```

If linked to an AGID, the AOID must include the 10-character AGID hash anchor. The two-character AGID prefix is not the anchor because the prefix is a routing and display hint that can change governance meaning more easily than the hash portion.

Reserved patterns are rejected:

```text
reject 16 identical characters
reject any ascending four-character consecutive run in the Base32 alphabet
reject any descending four-character consecutive run in the Base32 alphabet
```

This makes AOID handles easier to distinguish from obvious test strings, accidental entries, and visually suspicious patterns. It does not make the AOID a cryptographic secret. A public AOID reference is a handle, not proof of ownership, residence, deliverability, or address truth.

## 8. Public-Private Separation Principle

The AGID/AOID separation principle is the central safety claim of the application.

Principle. Public surfaces may expose AGID public evidence and AOID public projections. Private AOID witnesses must remain local, encrypted, consent-gated, or proof-transformed.

This principle has an immediate theorem.

Theorem 1, public projection non-disclosure. Suppose every public surface exposes AOID data only through Pub(a), and suppose Pub(a) excludes all fields in Wit(a). Then no public surface that obeys this policy directly reveals a private witness field.

Proof sketch. By definition, Pub(a) is a projection from AOIDRecord to a tuple that does not contain any field in Wit(a). A policy-obeying public surface is allowed to output only Pub(a) and public AGID evidence. Therefore a direct public output cannot contain a field that was removed by the projection. The theorem is about direct field disclosure. It does not eliminate side channels, source correlation, timing leakage, or inference risk; those require additional mitigations.

Corollary 1, public AOID QR is not a private address. If a QR payload contains only Pub(a), scanning it gives a public reference to an AOID, not the recipient, unit, phone number, delivery instruction, or ownership proof.

Corollary 2, AGID data packs do not contain AOID private payloads if the data-pack builder accepts only AGID public evidence and rejects AOID private witness fields.

The theorem is simple, but useful. Many privacy failures occur not because cryptography fails, but because the system never formally separated public projection from private witness. The separation principle makes the application testable.

## 9. Communication Boundary

Each communication surface must declare its allowed data. The following table is the application-level policy.

| Surface | AGID behavior | AOID behavior |
| --- | --- | --- |
| REST / OpenAPI | Public grid, public evidence, source metadata, quality, geocoding, reverse geocoding, validation status | Public AOID reference only; no plaintext private payload |
| SDK | Offline encode, decode, cell bounds, source-pack reads, quality scoring | Local owner operations; private payload readable only in owner context |
| QR | Public AGID card, public feature reference, public address reference | Public reference QR or private trusted transfer QR, never confused |
| NFC | Tap-to-read public AGID reference, POS acceptance, facility reference | Tap-to-present AOID public reference or consented private transfer |
| POS | Check scannable reference, delivery eligibility, carrier policy, public acceptance status | Accept public reference or proof statement, not plaintext address by default |
| MCP | Tool calls for public geocoding, validation, redacted descriptors, proof statements | No plaintext AOID witness returned to agents |
| Shopping Agent | Ask for address capability and delivery eligibility | Receive scoped proof or redacted handle, not full address unless user consents |
| Cloud sync | Public saved references and public quality cache | Owner-encrypted envelopes only after consent |
| Data pack | Public AGID source evidence and parity vectors | No AOID private records, no private sync export |
| Logs | Public job status and aggregate diagnostics | Redacted identifiers and no private witness fields |

The system should prefer allowlists over blocklists. A blocklist can miss a new sensitive field. An allowlist defines exactly what may cross a boundary.

## 10. QR, NFC, and POS Acceptance

QR and NFC workflows make the separation problem concrete. A code is easy to scan and easy to copy. Therefore it should be assumed public unless explicitly created for a trusted private transfer.

There are three main payload classes.

Class 1, public AGID payload. This is suitable for signs, public maps, facility labels, field stations, disaster shelters, lockers, landmarks, bridges, islands, public facilities, and natural features. It may contain the AGID, public label, feature class, source metadata, quality metadata, version, and optional URL or API route.

Class 2, public AOID reference payload. This is suitable when a user wants a compact reference to an owner-managed address relation without disclosing the private payload. It may contain AOID id, linked AGID anchor, status, version, public handle, and proof metadata. It must not contain recipient, phone, unit, room, access instruction, private delivery instruction, owner secret, or credential salt.

Class 3, private AOID transfer payload. This is suitable only for explicit owner-controlled transfer between trusted devices or trusted contexts. It may contain encrypted private payload material, key agreement metadata, or recovery information. It must be labeled and handled as private. It should not be printed on public labels or exposed through ordinary POS scanning.

NFC follows the same model. A public NFC tag attached to a shop entrance should behave like a public AGID payload. A user tapping a device at a POS terminal should disclose only the minimum required statement, such as "delivery eligible", "same public pickup context", or "AOID public reference accepted". A private AOID transfer should require explicit user action and a trusted channel.

POS acceptance can be modeled as:

```text
Accept(surface, payload, policy, t) -> decision
```

where decision is one of accept, reject, request proof, request consent, or unresolved. A POS terminal should not silently upgrade a public AOID reference into a private registration. It may save a transaction-scoped public reference, but it should not claim ownership or residence from the scan alone.

## 11. MCP and Shopping Agent Interfaces

AGID/AOID should support machine clients, but machine clients are also a privacy risk. MCP servers and shopping agents can accidentally request or retain more address information than necessary.

The agent-safe model is capability-based. The agent should ask for a task-specific capability, not for the full address. Examples:

```text
Can this order be delivered to an eligible region?
Is this user inside Japan?
Is this AOID currently active?
Does this public AGID match the selected pickup point?
Can the carrier receive a scoped delivery token?
```

The agent should not ask:

```text
Give me the user's full address.
Give me the recipient phone number.
Give me the private delivery instruction.
Give me all AOID history.
```

The MCP layer should expose tools that return public evidence, redacted descriptors, policy decisions, or proof-ready envelopes. It should not expose tools that dump AOID private witnesses. Where a private disclosure is truly required, the user should perform an explicit consent step, and the disclosure should be limited by purpose, recipient, expiration, and audit metadata.

The application-level rule is:

```text
AgentAccess(a, purpose) <= min_required(Pub(a), proof_statement, consented_disclosure)
```

This is not a cryptographic theorem. It is a product and API design requirement. The cryptographic companion layer can later replace some consented disclosures with zero-knowledge proofs.

## 12. Registration and Lifecycle

AGID registration and AOID registration mean different things.

AGID registration is public evidence registration. A system may ingest public source data, official postal data, open map data, public building labels, feature names, public quality metrics, and cell geometry. It may update source freshness, confidence, and coverage. It should not attach private recipients or private delivery instructions to AGID evidence.

AOID registration is owner-controlled private relation creation. A user or organization creates an AOID, optionally links it to an AGID anchor or PID, stores private payload locally, optionally creates an owner-encrypted sync envelope, and optionally creates proof-ready commitments or credentials.

The AOID lifecycle can be represented as:

```text
created
  -> active
  -> delegated
  -> rotated
  -> revoked
  -> archived
```

Not every transition is always allowed. A delegated AOID may need a delegation credential. A rotated AOID may need an old-to-new binding. A revoked AOID should fail freshness checks. An inherited AOID may require legal or organizational proof outside the application itself.

The update authority rule is:

```text
UpdateAOID(a, actor, change) is valid only if actor has an owner,
delegate, recovery, or policy credential for that change.
```

Central operators may manage public AGID specifications, reserved ranges, deprecated ranges, source packs, and quality packs. They must not rewrite private AOID contents without owner authority.

## 13. Source, Postal, and Geographic Evidence

The application aims to use official and open sources where possible. Public source integration is necessary for address validation, reverse geocoding, feature recognition, postal-code checks, natural-feature names, islands, Antarctic stations, wetlands, deserts, lakes, rivers, waterfalls, heritage sites, and disaster locations.

However, sources differ by jurisdiction and use case. Some countries publish official postal code files. Some provide APIs. Some provide only partial or stale data. Some official sources are free for lookup but restricted for redistribution. OpenStreetMap, NASA data, space agency data, national mapping agencies, postal authorities, and open government portals each have different licenses and coverage. Therefore the application should not treat "source imported" as "truth solved".

The source model should track:

```text
source_id
authority_type
provider
jurisdiction
coverage_area
coverage_class
license
redistribution_allowed
freshness_date
update_frequency
quality_score
known_gaps
use_case_allowed
integrity_hash
```

A source can be strong for one use case and weak for another. A national park boundary may be useful for public map display but insufficient for mail delivery. A postal code file may be useful for address validation but insufficient for named river recognition. A NASA land-cover dataset may help classify deserts or wetlands, but it does not validate a residential address. The application must combine sources without collapsing their meanings.

## 14. Address Validation Engine Boundary

The address validation engine is related to AGID and AOID, but not identical.

Address validation asks whether an address expression is syntactically plausible, source-supported, postal-code-compatible, jurisdictionally coherent, deliverable, or normalized under a given country's rules. AGID can provide a public geographic context. AMT can manage candidate generation, clustering, unresolved state, and history. AOID can store private operational context. But validation is still a separate function.

The validation function may be represented as:

```text
Validate(x, jurisdiction, use_case, source_policy, t)
  -> (status, candidates, explanation, quality, unresolved_reason)
```

The status should include values such as valid, likely_valid, incomplete, ambiguous, unsupported_region, source_missing, postal_mismatch, boundary_uncertain, non_address_feature, private_data_required, and unresolved.

This matters for commercial comparison. Paid address validators often have proprietary postal data, delivery-point files, carrier history, and country-specific normalization rules. An open-source AGID/AOID application can aim for commercial-grade quality, but it should measure that claim country by country, source by source, and use case by use case. The paper should not claim parity until benchmark data supports it.

## 15. Optional Zero-Knowledge Companion Boundary

Zero-knowledge proofs are important, but they belong to a companion paper. This application paper defines the semantic and interface boundary needed for those proofs.

Examples of companion proof statements include:

- ZK Address Proof: prove that a committed address lies in Japan, Tokyo, the EU, or another public region without revealing the address.
- ZK Residence Proof: prove residence eligibility based on a credential, issuer trust, revocation, and freshness.
- ZK Delivery Eligibility: prove that a committed AOID or address is inside a delivery-supported region and satisfies carrier policy.
- AOID Ownership Proof: prove that the user controls the AOID secret or credential without revealing private address details.
- Duplicate Prevention: prove non-duplication with a nullifier scoped by region, purpose, and AOID without revealing identity.
- PID Issuance Audit Proof: prove that the AMT process passed candidate generation, clustering, unresolved judgment, history update, and PID issuance rules without revealing the input address.
- Quality Threshold Proof: prove that quality is above a policy threshold without disclosing the full evidence set.

The boundary rule is simple:

```text
AMT gives semantic structure.
AGID gives public geographic context.
AOID gives owner-managed private relation.
ZK gives selective disclosure over committed inputs.
```

ZKP alone cannot guarantee that an address is true. It can only prove a statement about committed data, credentials, public roots, and circuit rules. AMT alone cannot guarantee cryptographic privacy. AGID alone cannot prove residence. AOID alone cannot prove ownership unless paired with keys, credentials, or proofs.

## 16. Security and Privacy Analysis

The main security risks are not only cryptographic. They are boundary risks.

Private-data contamination. A public AGID payload, source pack, QR code, log, or API response may accidentally include recipient, phone, unit, room, private delivery instruction, access code, owner key, device key, or AOID private payload. Mitigation: allowlist public fields, test redaction, reject sensitive payload classes, scan fixtures, and keep public data-pack builders separate from AOID private sync code.

QR ownership confusion. A public AOID QR can be mistaken as proof of ownership. Mitigation: define public AOID QR as reference-only, require ownership proof or private credential for update and registration, and label private transfer QR separately.

Plaintext sync. A server may store AOID private payloads in plaintext. Mitigation: local-first storage, owner-device encryption, explicit sync consent, no public data-pack export, key rotation, and private payload redaction in logs.

Cross-purpose linkability. The same AOID, commitment, or nullifier may allow tracking across services. Mitigation: domain separation by purpose, carrier, region, issuer, and time window; separate public handles; avoid global nullifiers unless intentionally public.

Source poisoning. Public source data may be incorrect, maliciously edited, stale, or license-incompatible. Mitigation: source metadata, integrity hashes, provider trust tiers, freshness checks, conflict handling, and unresolved states.

Agent over-disclosure. A shopping agent or MCP tool may request full address data when a capability proof would suffice. Mitigation: tool-level minimization, consent gates, proof-ready endpoints, and no plaintext AOID witness return.

Immutable public-chain leakage. If public chains or permanent logs store AOID private data, the leak cannot be undone. Mitigation: store only commitments, anchors, revocation roots, freshness roots, or public metadata; never store plaintext private address data on chain.

Inference from public context. Even if private fields are removed, public AGID and public AOID metadata may allow inference in sparse rural areas, islands, remote stations, or single-building regions. Mitigation: coarser proof regions, k-anonymity-inspired policy, delayed publication, optional no-public-reference mode, and user consent for sensitive contexts.

## 17. Open-Source Safety

The application should be safe to open source. This requires more than removing secrets from the repository.

Open-source safety requirements:

1. No real user addresses, phone numbers, private delivery instructions, AOID private payloads, owner secrets, device secrets, credential salts, or private recovery tokens in test fixtures.
2. Synthetic fixtures must be clearly synthetic.
3. Public AGID vectors must contain only public coordinates, public labels, or known sample points.
4. AOID private tests must use generated dummy payloads.
5. QR and NFC examples must distinguish public reference payloads from private transfer payloads.
6. Logs, screenshots, PDFs, and benchmark exports must be redacted before release.
7. Source packs must include license and redistribution metadata.
8. Build outputs should not contain private local caches.
9. Security tests should cover public/private boundary violations.
10. Documentation should state that the system is designed not to become a surveillance address database.

The open-source posture should be written into the README, paper, privacy design, source-pack rules, test policy, and contribution guide. A contributor should know where public geographic evidence belongs and where private AOID payloads must never go.

## 18. Performance and Benchmark Plan

Performance should be measured by component. A single average number is not enough, especially because WebCrypto is asynchronous and mobile devices may have large p95 and p99 latency spikes.

The benchmark plan should split:

```text
single-item processing:
  AGID encode/decode
  AOID id generation and normalization
  descriptor generation
  redaction
  QR payload generation
  QR image generation

cryptographic processing:
  key generation
  signing
  verification
  credential issuing
  nullifier generation
  proof-ready envelope generation
  actual proof generation when implemented

real UI processing:
  QR Canvas/SVG rendering
  NFC read/write flow
  address card rendering
  IndexedDB save
  sync queue enqueue
  worker round trip
  mobile-device execution

large batch processing:
  1 item
  100 items
  1,000 items
  10,000 items
```

For each benchmark, the application should report mean, median, p95, p99, min, max, sample size, runtime, browser or Node version, device class, cold-start flag, and whether WebCrypto or a WASM/native path was used.

This also informs language choice. TypeScript is suitable for UI, API contracts, orchestration, and browser SDKs. Rust or C++ may be better for heavy geometry kernels, cryptographic primitives, ZK witness generation, large geospatial indexing, or high-throughput source-pack processing. A mixed-language architecture is acceptable if parity tests, bindings, and reproducible builds are maintained.

## 19. Verification Plan

The paper distinguishes verification categories.

Lean or formal verification can check abstract statements such as projection non-disclosure, deterministic composition under fixed functions, finite identifier predicates, nullifier domain-separation models, and simple impossibility theorems inherited from AMT. It cannot by itself prove that a real postal source is current or that a carrier can deliver to a location.

GIS and data verification can check cell boundary behavior, polar regions, antimeridian handling, maritime locations, border regions, island recognition, named natural feature recognition, source coverage, and reverse-geocoding quality. It cannot by itself prove private witness protection unless combined with policy tests.

Implementation tests can check AOID identifier rules, reserved pattern rejection, public/private payload boundaries, QR redaction, NFC payload class separation, API schemas, source-pack exclusion, sync encryption envelope shape, and POS acceptance behavior.

Security review can check threat models, attack paths, private-data leakage, replay, linkability, malicious issuer behavior, malicious agent behavior, source poisoning, logging risk, and open-source fixture risk.

Field validation can check delivery success, carrier acceptance, official postal compatibility, user comprehension, POS operational reliability, mobile NFC performance, and benchmark parity with commercial services.

The implementation mapping should be audited regularly. Relevant modules include AGID core encoding, grid geometry, public security policy, AOID normalization, AOID privacy and records, QR payload construction, privacy policy, POS runtime policy, MCP server tooling, credential envelope modules, nullifier modules, ownership proof modules, quality threshold proof modules, proof bundle registry, OpenAPI specification, server routes, and native core bindings.

## 20. Conformance Requirements

A conforming AGID/AOID application should satisfy the following requirements.

R1. Public AGID surfaces must not expose private AOID witness fields.

R2. Public AOID references must expose only the allowed public projection fields.

R3. Public AOID QR and NFC payloads must be reference-only unless explicitly marked and handled as private trusted transfer payloads.

R4. AOID public identifiers must use the unambiguous Base32 alphabet and satisfy the 9-to-16-character validity rule.

R5. Generated AOIDs should use 16 characters.

R6. Linked AOIDs must include the linked AGID hash anchor according to the current specification.

R7. AOIDs with 16 identical characters or four-character consecutive runs must be rejected.

R8. AOID private payload sync must be opt-in and owner-encrypted.

R9. Public AGID source packs must not include AOID private payloads.

R10. MCP and agent-facing tools must not return plaintext AOID private witness fields.

R11. POS terminals must distinguish reference scan, proof scan, consented disclosure, and private transfer.

R12. Logs and benchmark outputs must be redacted.

R13. Source metadata must include license, freshness, jurisdiction, coverage, and allowed-use fields.

R14. Validation status must preserve unresolved, ambiguous, unsupported, and source-missing states instead of forcing false precision.

R15. Documentation must state the system's non-goals, including that AGID is not residence proof and AOID is not address truth proof.

## 21. Use Cases

Public place search. A user can search for roads, bridges, rivers, lakes, islands, parks, buildings, ruins, world heritage sites, deserts, wetlands, caves, valleys, glaciers, waterfalls, and other named features. AGID supplies a public reference and source metadata. AOID is not needed unless a private operation is attached.

E-commerce delivery. A merchant can request delivery eligibility without storing the full address. The user can provide an AOID public reference, a scoped credential, or a future ZK delivery proof. The carrier can receive the minimum required delivery data through a consented channel.

POS acceptance. A store terminal can scan QR or NFC. It can accept a public AGID for pickup, an AOID public reference for an owner-managed destination, or a proof-ready envelope for delivery eligibility. It should not silently collect plaintext address data.

Disaster and humanitarian identity. AGID can represent public shelters, field stations, evacuation points, temporary camps, island facilities, and remote support points. AOID can represent private temporary delivery relations. ZK companion protocols can later support aid eligibility without exposing vulnerable persons.

Robotics and offline SDKs. Drones, robots, and field tools can use AGID encode/decode, cell bounds, public source packs, and public feature labels offline. AOID private instructions require owner authorization.

Enterprise and facility management. A campus, warehouse, hospital, or port can publish AGIDs for public locations and use AOIDs for private rooms, lockers, access policies, delegations, and revocations.

Shopping agents. A user's agent can prove or request delivery eligibility while avoiding direct address disclosure. The agent can interact with MCP tools that expose capabilities rather than private witness fields.

## 22. Limitations and Non-Goals

AGID is not a legal land registry, not a residence proof, not an ownership proof, not a universal postal validator, not a guarantee of delivery, and not a private address store.

AOID is not a public address code, not a proof of ownership by itself, not a proof of residence by itself, not a proof of deliverability by itself, and not safe to publish as a full private payload.

The address validation engine is not guaranteed to beat paid services until country-by-country and use-case-specific benchmark evidence exists. Official postal sources and open data sources must be integrated under their licenses and measured by coverage and freshness.

Zero-knowledge address predicates are not proven merely because the application has proof-ready metadata. Actual circuit design, soundness, zero-knowledge, issuer trust, revocation, freshness, and auditability require a separate paper and external security review.

A public-private projection theorem prevents direct field disclosure only when policies are obeyed. It does not eliminate inference attacks, sparse-region identification, timing leaks, malicious agents, malicious issuers, compromised devices, or social engineering.

AGID cell geometry is useful for public reference, but edge cases such as polar regions, antimeridian boundaries, maritime zones, border regions, dense high-rise buildings, and fuzzy natural features require GIS validation and uncertainty handling.

## 23. Conclusion

AGID and AOID turn Address Morphism Theory into an application architecture. AGID gives the system a public geographic reference layer. AOID gives the system an owner-controlled private operational address layer. The two must remain separate.

This separation enables safer QR, NFC, POS, MCP, agent, cloud, and open-source workflows. It allows public geography and public source evidence to be shared widely while keeping recipient identity, unit details, phone numbers, delivery instructions, access instructions, owner secrets, device keys, credential salts, and private history under owner control.

The most important result is not a single identifier. It is a discipline: address applications should expose the minimum public reference, preserve unresolved states, track source quality, and transform private address information only through consent, encryption, credentials, or proofs. With that discipline, AGID/AOID can support public maps, delivery, disaster response, field logistics, POS terminals, and agent workflows without turning into a public surveillance database.

---

## Appendix A. Layer Boundary Summary

| Layer | Main object | Public? | Private? | Main risk |
| --- | --- | --- | --- | --- |
| AMT | address semantics, candidates, clusters, history, PID | partly | partly | false resolution |
| AGID | public geographic cell and public evidence | yes | no | overclaiming public evidence |
| AOID | owner-managed operational address relation | projection only | yes | private-data leakage |
| Credential | issuer statement and status | selective | witness private | issuer trust and revocation |
| Proof | public predicate statement | yes | witness private | circuit and linkability risk |
| Surface | API, QR, NFC, POS, MCP, agent, sync | depends | depends | boundary confusion |

## Appendix B. Mathematical Summary

Basic sets:

```text
X_t  address observations
E_t  AMT entities or entity hypotheses
P_t  persistent identifier states
G_t  public AGID contexts
A_t  AOID records
S_t  source and evidence records
U    use cases
M    communication surfaces
```

AGID evidence:

```text
Ev_G(g, t) = {s in S_t | public(s) and relevant(s, g)}
Q_G(g, t, u) = quality score for AGID g at time t and use case u
```

AOID record:

```text
a = (i, alpha, g, p, o, k, sigma, rho, eta, tau)
```

Public projection:

```text
Pub(a) = (i, alpha, linked_agid_hint, public_handle, status,
          version, commitment_metadata, proof_metadata)
```

Private witness:

```text
Wit(a) = private AOID fields excluded from Pub(a)
```

Validation:

```text
Validate(x, jurisdiction, use_case, source_policy, t)
  -> (status, candidates, explanation, quality, unresolved_reason)
```

POS acceptance:

```text
Accept(surface, payload, policy, t)
  -> accept | reject | request_proof | request_consent | unresolved
```

Agent minimization:

```text
AgentAccess(a, purpose)
  <= min_required(Pub(a), proof_statement, consented_disclosure)
```

## Appendix C. Public Payload Allowlist

Public AGID payloads may include:

- AGID string.
- Prefix and hash.
- Public cell state and approximate bounds.
- Public address label.
- Public building, place, map-feature, natural-feature, or heritage label.
- Feature class.
- Source labels and source metadata.
- Confidence, quality, freshness, license, and version.

Public AOID reference payloads may include:

- AOID id.
- Linked AGID anchor.
- Public handle.
- Status and version.
- Commitment metadata.
- Proof metadata.

## Appendix D. Public Payload Denylist

Public AGID and public AOID reference payloads must not include:

- Recipient name.
- Phone number.
- Unit or room.
- Private delivery instruction.
- Access instruction or access code.
- Exact private coordinate.
- Private address text.
- Owner private key.
- Device secret.
- Credential private salt.
- Private history.
- Plaintext encrypted-payload contents.
- Private update timestamp when it enables tracking.

## Appendix E. Implementation Mapping Checklist

The following repository areas should be mapped to this paper during implementation review:

- AGID core encoding and decoding.
- Grid geometry and edge validation.
- AGID security policy.
- AGID public source evidence.
- AOID identifier normalization.
- AOID public projection and private witness separation.
- AOID records and encrypted sync.
- Privacy policy and redaction.
- QR payload builder.
- NFC payload class handling.
- POS acceptance and POS runtime policy.
- MCP server tools.
- OpenAPI specification.
- Address credential modules.
- Duplicate nullifier modules.
- AOID ownership proof modules.
- Quality threshold proof modules.
- Revocation and freshness root anchoring.
- ZK proof bundle registry.
- Server routes for public, private, POS, and proof-ready workflows.
- Native or WASM geometry and cryptographic bindings.

Each mapped module should have tests that assert the public/private boundary.

## Appendix F. Verification Status Template

Each future release should publish a table with these fields:

```text
claim
claim_level = normative | implementation_supported | field_validated
module_or_document
test_or_evidence
known_gaps
last_verified_at
```

This prevents the paper from becoming stronger than the evidence. A claim can move from target to implementation-supported to field-validated only when the evidence changes.

## Appendix G. Recommended Next Work

1. Build a public-private boundary test suite that enumerates every public surface.
2. Add QR and NFC conformance vectors for public AGID, public AOID reference, and private AOID transfer.
3. Add POS acceptance tests for accept, reject, request proof, request consent, and unresolved.
4. Add MCP tool tests that reject plaintext AOID witness output.
5. Add official-source metadata schemas for postal and geographic sources.
6. Publish address validation benchmark methodology before making paid-service comparison claims.
7. Separate ZK circuit claims into the companion paper and mark proof-ready code separately from proof-producing code.
8. Add mobile p95 and p99 benchmarks for QR, NFC, crypto, sync, and rendering.
9. Add open-source fixture scans for private address leakage.
10. Add README language that the design is not intended to become a surveillance or censorship infrastructure.
