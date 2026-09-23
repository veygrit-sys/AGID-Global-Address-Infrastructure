# AGID and AOID as Applications of Address Morphism Theory

## Public Geographic Reference and Private Operational Address Identity

Version: application manuscript draft v0.1
Date: 2026-06-06
Author: to be supplied

## Abstract

Address Morphism Theory (AMT) provides a formal model for ambiguous address resolution, unresolved states, address lineage, source governance, and gated persistent identifier issuance. This paper applies AMT to two practical identifier layers: AGID and AOID. AGID is a public geographic and map-feature reference layer. AOID is a private, owner-controlled operational address identity layer. The main design principle is separation: AGID answers "where or what public place is this?", while AOID answers "who can operate, receive, update, delegate, or disclose private delivery information for this address relation?"

The paper defines AGID and AOID as application-layer constructs, not as replacements for AMT's core mathematical objects. AMT supplies reference classes, evidence envelopes, lineage states, quality gates, and PID issuance discipline. AGID and AOID consume those outputs and add product-facing rules for public location encoding, public evidence, private delivery data, QR payloads, SDK conformance, API contracts, optional encrypted sync, revocation, delegation, and open-source release safety.

The resulting architecture supports public address and map-feature search without exposing personal delivery information. Roads, bridges, buildings, parks, rivers, lakes, islands, deserts, wetlands, glaciers, caves, valleys, waterfalls, ruins, heritage sites, and other named public features may be represented in the AGID layer when supported by source evidence. Recipient names, phone numbers, unit numbers, access instructions, private delivery routes, owner keys, and sensitive household details remain in AOID or other private owner-controlled records. This separation makes AGID useful as a public spatial-semantic reference and AOID useful as a private delivery and authority layer.

## Keywords

AGID, AOID, Address Morphism Theory, public address identifier, private address identity, delivery identity, QR privacy, SDK conformance, address governance, map-feature evidence, open-source safety.

## 1. Introduction

Address systems often mix public place information and private recipient information. A building name, road name, park name, island name, or postal locality may be public. A room number, recipient name, phone number, delivery instruction, access code, or household record may be private. When these two classes of information are stored in one identifier, the system becomes hard to share safely.

AGID and AOID separate these responsibilities.

```text
AGID = public geographic, address, building, and map-feature reference
AOID = private owner-controlled operational address identity
```

This paper treats AGID and AOID as applications of AMT. AMT is the underlying theory of address reference, ambiguity, lineage, and PID issuance. AGID and AOID are practical layers that use AMT outputs to create usable standards, APIs, SDKs, QR formats, sync policies, and app workflows.

## 2. Relationship to Address Morphism Theory

AMT defines the semantic substrate:

- address expressions;
- candidate generation;
- structural dissimilarity;
- clustering;
- resolved, ambiguous, unresolved, and rejected states;
- lineage transitions;
- source and quality envelopes;
- PID issuance gates.

AGID and AOID should not redefine these semantics. They should consume AMT results:

```text
AMT:
  expression -> candidates -> cluster/outcome -> lineage/evidence/PID envelope

AGID:
  public geographic/reference layer over AMT-compatible evidence

AOID:
  private operational authority layer linked to public or resolved references
```

This separation prevents AGID from becoming a container for private delivery data and prevents AOID from becoming a public geographic standard.

## 3. Scope and Non-Goals

This paper defines the application architecture and writing structure for AGID/AOID. It does not claim that AGID alone verifies every postal address. It does not claim that AOID is a cryptographic proof system. It does not claim that public map evidence is always complete. It does not claim that a server may rewrite owner-managed address contents.

The paper avoids four overclaims:

- AGID is not a universal postal authority.
- AOID is not public address evidence.
- AGID/AOID do not replace AMT.
- AGID/AOID do not replace zero-knowledge address proofs or credentials.

## 4. Core Definitions

### 4.1 AGID

AGID is a public spatial-semantic reference. It may represent a location cell, public address label, building, facility, road, bridge, park, water feature, natural feature, heritage site, administrative reference, or other public map-feature evidence.

AGID answers:

```text
Where is this?
What public place, feature, building, or address evidence is associated with it?
```

AGID should be deterministic where the standard requires deterministic encoding. It should be usable by SDKs, devices, servers, GIS tools, logistics tools, and offline workflows.

### 4.2 AOID

AOID is an owner-controlled private operational identity for an address relation. It may be linked to one or more AGIDs or resolved AMT references, but it stores or controls private delivery and authority information.

AOID answers:

```text
Who can operate this address relation?
Who can receive, update, delegate, share, revoke, or disclose private address details?
```

AOID may include, under owner control:

- recipient;
- organization or household relation;
- unit, room, floor, tower, or private entrance;
- phone number;
- delivery instruction;
- access instruction;
- temporary relocation;
- disaster recovery note;
- delegation or consent state.

### 4.3 PID

PID remains an AMT core output. It is issued only when AMT gates pass. AGID and AOID may reference a PID or an AMT envelope, but they should not weaken PID issuance rules.

## 5. AGID/AOID Separation Principle

The central rule is:

```text
Public facts belong to AGID.
Private recipient and delivery-control facts belong to AOID.
```

| Dimension | AGID | AOID |
| --- | --- | --- |
| Default visibility | Public or locally shareable | Private by default |
| Main object | Place, public address, building, feature | Owner-controlled address relation |
| Personal data | Forbidden | Allowed only under owner control |
| Unit/room | Usually excluded unless public/non-sensitive | Allowed |
| Recipient | Forbidden | Allowed |
| Phone number | Forbidden | Allowed |
| Delivery instruction | Forbidden | Allowed |
| Update authority | Standard/operator for public spec and source packs | Owner or delegated authority |
| QR default | Public reference | Reference-only unless trusted private transfer |
| Data packs | Public evidence only | Excluded |

## 6. AGID Public Evidence Model

AGID may contain or link to public evidence when it is source-backed and non-personal. Evidence classes include:

- public postal or address labels;
- public building names;
- roads and bridges;
- parks and gardens;
- rivers, streams, canals, lakes, ponds, reservoirs, bays, beaches, coastlines, springs, reefs, waterfalls;
- islands, peninsulas, capes, valleys, mountains, volcanoes, caves, glaciers, ice fields;
- deserts, drylands, grasslands, forests, wetlands, salt lakes, marshes, wilderness areas;
- ruins, archaeological sites, shrines, temples, monuments, heritage and world-heritage sites;
- administrative areas, localities, blocks, public facilities, stations, ports, airports;
- disaster shelters, temporary public facilities, and logistics hubs when publicly designated.

AGID should retain source metadata:

```text
Source = (authority, provider, license, jurisdiction, freshness, coverage, reliability, allowedUse)
```

Low-quality or stale evidence should reduce confidence, trigger warning or revalidation policy, or stay hidden from public display when the product requires that behavior.

## 7. AOID Private Data Model

AOID private records should be local-first. A minimal AOID private record may include:

```text
AOIDRecord =
  (aoid_id,
   linked_agid_or_pid,
   owner_key_id,
   device_key_id,
   encrypted_private_payload,
   status,
   version,
   consent_scope,
   updated_by_owner_at)
```

The plaintext payload may include:

```text
recipient
phone
unit
room
floor
building detail
access instruction
delivery instruction
temporary relocation
private note
```

The public payload must not include these plaintext fields.

## 8. Communication Boundary

AGID and AOID use different communication surfaces.

| Surface | AGID behavior | AOID behavior |
| --- | --- | --- |
| REST/OpenAPI | Public encode/decode, source evidence, quality, search | Public reference handle only; private sync is encrypted |
| SDK | Offline encode/decode/cell bounds and public evidence helpers | Local creation, decryption, private owner workflows |
| QR | Public AGID card or redacted public reference | Public reference-only or private trusted-device transfer |
| Sync | Public saved references and source-pack updates | Owner-consented encrypted sync only |
| Realtime/SSE | Public job status and quality progress | Sync status only, no plaintext private fields |
| Data packs | Public source-backed evidence | Excluded |

Allowed AGID payloads:

- AGID;
- public coordinate or cell information when needed;
- public address label;
- public building or feature label;
- source class;
- confidence metadata;
- public quality state.

Forbidden AGID payloads:

- recipient;
- phone;
- unit or room;
- access instruction;
- delivery instruction;
- private owner key;
- exact private household data.

Allowed AOID public payloads:

- AOID id;
- linked AGID or PID;
- public handle;
- status;
- version;
- opaque encrypted envelope metadata.

Forbidden AOID public payloads:

- plaintext recipient;
- plaintext phone;
- plaintext unit or room;
- plaintext delivery instruction;
- private address text;
- exact private coordinates;
- owner secret material.

## 9. Registration and Update Model

AGID registration is not owner registration in the ordinary personal-data sense. It is public reference creation, lookup, or evidence association under a standard.

AOID registration is owner-controlled private address relation creation.

### 9.1 AGID Workflow

```text
location or public feature
  -> AGID encode/search
  -> public source evidence
  -> quality policy
  -> public reference output
```

### 9.2 AOID Workflow

```text
owner action
  -> linked AGID/PID selection
  -> private payload creation
  -> local encryption
  -> optional encrypted sync
  -> owner-controlled QR/share/update/revoke
```

### 9.3 Update Authority

Operators may govern:

- AGID specification;
- reserved ranges;
- deprecated ranges;
- source-pack versions;
- quality-pack versions;
- public evidence policy.

Owners govern:

- AOID private content;
- AOID QR regeneration;
- AOID revocation;
- delegation;
- consent scope;
- encrypted sync participation.

The operator must not silently rewrite private AOID contents.

## 10. QR Model

QR payloads require strict separation.

### 10.1 Public AGID QR

A public AGID QR may include:

- AGID;
- public address or feature label;
- approximate public reference;
- source class;
- confidence or version;
- link to public evidence.

It must not include private AOID content.

### 10.2 Public AOID Reference QR

A public AOID QR should be reference-only:

```text
(aoid_id, linked_agid_or_pid, public_handle, status, version)
```

Scanning this QR must not prove ownership. It may save a reference or request access, but it must not create an owner-managed private AOID record on the scanning device.

### 10.3 Full AOID Transfer QR

A full AOID QR is private trusted-device transfer. It may contain encrypted private payloads or recovery material, but only under explicit user action and strong warnings.

## 11. Standard and Conformance

AGID should be readable as an independent standard, not only as a web app feature.

Canonical artifacts:

- normative AGID spec JSON;
- SDK test vectors;
- SDK README;
- OpenAPI v1 contract;
- source license policy;
- AGID security policy;
- checksums or detached signatures for release artifacts.

Conformance levels:

| Level | Requirement |
| --- | --- |
| Core SDK | `encode`, `decode`, and `cellBounds` pass parity vectors. |
| API | Versioned OpenAPI exposes public integration contract. |
| Data | Source metadata includes URL, provider, license/terms, coverage, freshness. |
| App | UI behavior does not redefine the standard. |
| Security | Public AGID artifacts reject private AOID fields and invalid IDs. |

## 12. Security and Privacy

| Risk | Example | Mitigation |
| --- | --- | --- |
| AGID private-data contamination | Public source pack includes room or phone. | Public payload sanitizer and conformance tests. |
| AOID ownership confusion | Scanner treats public QR as owner proof. | Public AOID QR is reference-only. |
| Plaintext sync leakage | Server stores private delivery instructions. | Owner-device encryption and no plaintext persistence. |
| Open-source secret leakage | Test vectors include real addresses. | Generated fixtures and redaction. |
| Source poisoning | Public map feature is maliciously edited. | Source trust tiers and multi-source validation. |
| False update | Operator rewrites owner private contents. | Owner-only update authority. |
| Over-broad disclosure | Merchant receives full address too early. | Scoped disclosure and optional ZK companion protocol. |

## 13. Integration with ZK Companion Protocols

AGID/AOID can be used with zero-knowledge address proof protocols, but they are not ZK systems by themselves.

The clean relationship is:

```text
AMT: semantic resolution and PID envelope
AGID: public geographic and evidence layer
AOID: private operational authority layer
ZK companion: selective proof of address-derived predicates
```

Examples:

- prove that an AOID owner controls a linked address relation;
- prove that a hidden AGID/PID is inside a delivery zone;
- prove non-duplicate registration with a scoped nullifier;
- prove delivery eligibility before full carrier disclosure.

These proofs belong to the ZK companion paper.

## 14. Use Cases

### 14.1 Public Place Search

A user searches for a road, bridge, park, lake, island, mountain, waterfall, cave, ruin, or heritage site. AGID can expose public evidence and source confidence without private recipient data.

### 14.2 E-Commerce Delivery

A merchant can work with a public AGID or delivery-zone classification, while AOID controls recipient, unit, phone, and access instructions. Full disclosure can be delayed until the carrier needs it.

### 14.3 Disaster and Humanitarian Addressing

AGID can represent shelters, temporary logistics hubs, and public disaster support points. AOID can hold private relocation or recipient data under owner control.

### 14.4 Offline SDK and Robotics

Devices can encode/decode AGID and compute cell bounds offline. AOID private payloads remain unavailable unless the owner grants access.

### 14.5 Enterprise and Facility Management

AGID can identify the public facility or building. AOID can represent private delivery desks, internal rooms, delegated receiving authorities, or temporary instructions.

## 15. Verification Plan

Implementation validation should check:

- AGID encode/decode parity vectors;
- AGID cell bounds;
- public QR private-field rejection;
- AOID public QR reference-only behavior;
- AOID encrypted sync envelope behavior;
- no AOID private content in public source packs;
- source metadata completeness;
- OpenAPI standard extension metadata;
- public evidence quality policy;
- release artifact checksums.

AMT validation remains separate:

- candidate generation;
- clustering;
- unresolved gates;
- lineage;
- PID issuance.

ZK validation remains separate:

- circuit or credential protocol soundness;
- nullifier domain separation;
- revocation/freshness roots;
- proof-bundle compatibility.

## 16. Limitations

First, AGID does not guarantee postal deliverability by itself. Deliverability may require carrier data, access constraints, local practice, or AOID private instructions.

Second, AOID privacy depends on implementation discipline. If plaintext private payloads are logged or synced, the conceptual separation fails.

Third, public source evidence can be incomplete, stale, biased, or poisoned. AGID should expose source quality and warning policy rather than hiding uncertainty.

Fourth, deterministic public geographic identifiers may still reveal approximate location. If approximate location is sensitive, an AOID or ZK companion flow may be required.

Fifth, AGID/AOID should not be described as the whole of AMT. They are applications of AMT.

## 17. Conclusion

AGID and AOID are best understood as applied identifier layers built on Address Morphism Theory. AMT supplies the semantic discipline: address resolution under uncertainty, lineage, quality, unresolved states, and PID issuance. AGID turns public geographic, address, building, and map-feature evidence into a shareable reference layer. AOID protects private owner-controlled delivery and authority data.

The separation is the main contribution. Public location evidence becomes useful without becoming personal data. Private delivery information becomes manageable without being forced into public maps or source packs. This makes AGID suitable for open standards and SDKs, and AOID suitable for owner-controlled delivery, sharing, revocation, and consent.

## Appendix A. Proposed Final Title Options

1. **AGID and AOID as Applications of Address Morphism Theory**
2. **Applied Address Morphism Theory: AGID and AOID**
3. **Public Geographic Reference and Private Operational Address Identity**
4. **AGID/AOID: A Layered Identifier Architecture for Address Morphism Theory**

Recommended title:

```text
AGID and AOID as Applications of Address Morphism Theory
```

Recommended subtitle:

```text
Public Geographic Reference and Private Operational Address Identity
```

## Appendix B. References To Complete

The final bibliography should include sources on:

- postal addressing and address standards;
- coordinate coding and spatial indexing;
- GIS source governance;
- OpenStreetMap and open geodata licensing;
- privacy by design;
- QR payload security;
- decentralized or owner-controlled identity;
- logistics and delivery address handling;
- Address Morphism Theory core paper;
- ZK Address Proof companion paper.
