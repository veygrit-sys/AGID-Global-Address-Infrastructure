# AGID and AOID Design Principles

Last updated: 2026-07-27

## Summary

AGID and AOID are separate identity layers.

- **AGID (Address Grid ID)** is the public location, address, building, and public map-feature layer. It answers **where** and **what public address/building/map feature is there**.
- **AOID (Address Owner ID)** is the private address layer. It answers **who receives** and **how delivery reaches them**.

The system should never blur these two layers. AGID can be public and portable, and it can carry public address labels, building names, public road/bridge/park/water/natural-feature labels, heritage or ruins labels, landmarks, and open-source geographic evidence. AOID is owner controlled and may contain private delivery data.

```text
AGID = Public Location / Address / Building Layer
AOID = Private Address Layer
```

## Normative Role Contract

AGID is a stable, public reference to a non-personal geographic entity. AOID is
an owner-editable private delivery or residence destination that must reference
an AGID. A human-readable value such as `JP-13-TKY-CHIYODA-001` can be used as
an illustrative public alias, while the existing canonical 12-character AGID
machine format remains unchanged for compatibility.

```text
AOID private body
 ├─ AGID
 ├─ Building
 ├─ Floor
 ├─ Room
 ├─ Recipient
 ├─ Delivery Options
 ├─ Intercom
 ├─ Access Policy
 ├─ Validity
 └─ Metadata
```

| Item | AGID | AOID |
| --- | --- | --- |
| Purpose | Public geographic identifier | Private delivery/residence identifier |
| Editing | Stable public reference | Owner editable |
| Scope | Region, block, building, or other public geographic entity | Building, floor, room, recipient, and delivery method |
| Privacy | Public and non-personal | Private, local-first, or owner-device encrypted |
| Holder | System-governed specification and public references | User owned and managed |
| Cardinality | Normally one canonical reference per geographic entity | Multiple per owner, purpose, or validity period |
| Relationship | Referenced by AOID | Must reference AGID |

Changing a room, recipient, delivery option, access policy, or validity period
updates the AOID private body. It does not rewrite AGID. When the referenced
geographic entity itself is replaced or no longer represents the intended
place, the owner moves the AOID to the new AGID and records the transition.

## Comparison

| Item | AGID | AOID |
| --- | --- | --- |
| Visibility | Public | Private |
| Target | Place, public address, public building | Person, family, company, organization, facility |
| Represents | Geographic space, public address label, building/place/map-feature evidence | Delivery destination and private delivery data |
| Address | Public address label can be included | Owner-managed delivery address can be included |
| Building name | Public building/place name can be included | Owner-managed building detail can be included |
| Unit or room | Not included | Can be included |
| Personal data | Not included | May be included |
| Update authority | Operator controls the specification only | Owner only |
| QR update | Immutable public location identity | Owner only |
| Primary use | Location identity, virtual postal code | Address management, recipient management |

## Communication Function Boundary

AGID and AOID use different communication paths because they protect different things.

| Communication surface | AGID | AOID |
| --- | --- | --- |
| Default mode | Public or local | Local-first private |
| REST / OpenAPI | Public grid, postal, geocoding, building, evidence, and quality endpoints | Public endpoint can expose only an AOID reference handle plus linked AGID |
| SDK | Offline encode, decode, cell bounds, and optional public source-pack reads | Owner apps may create or read private payloads locally; SDK access does not prove ownership |
| QR | Public AGID card or public address reference | Public QR is reference-only; full QR is private trusted-device transfer |
| Sync | Saved public AGID references and public descriptors | Owner-consented owner-device encrypted envelope only |
| Realtime / SSE | Job status and public quality progress events | Sync status only; no plaintext private AOID fields |
| Cache / data packs | Public evidence may use read-through cache or versioned data packs | No public cache, no public data-pack export, no plaintext server persistence |

Allowed AGID network payloads are AGID, coordinates needed for public evidence lookup, country or sea code, public address label, public building/place/map-feature name, source labels, and confidence metadata.

Forbidden AGID network payloads are recipient, phone, unit or room, private delivery instruction, and private ownership proof.

Allowed AOID network payloads are an AOID commitment or scoped reference,
linked public AGID when policy permits, status/version, opaque encrypted
payload, owner key id, and device key id. The complete AOID private body is not
a public API payload.

Forbidden AOID network payloads are plaintext recipient, plaintext phone, plaintext unit/room, plaintext delivery instruction, exact private coordinates in public payloads, and public update timestamps.

## AGID

AGID is a deterministic public geography identifier with public address and building evidence. It is generated from location and grid rules, not from a user profile.

AGID can be used as:

- a virtual postal code in regions without reliable postal codes,
- a virtual address anchor when ordinary addresses are weak or missing,
- a public building, landmark, or place-name reference when evidence exists,
- a public map, logistics, disaster response, or SDK reference,
- an offline-capable location identity.

AGID can contain public, non-personal evidence such as:

- public building names,
- public landmark or facility names,
- public road, bridge, park, river, lake, pond, bay, water body, waterfront, mountain, grassland, desert, forest, wetland, beach, island, cave, valley, waterfall, glacier, reef, spring, ruins, heritage/world-heritage, street, block, locality, postal, administrative, sea, or natural-feature labels,
- source-backed public address labels.

AGID must not contain private delivery data such as:

- recipient names,
- phone numbers,
- unit or room numbers,
- delivery instructions,
- private ownership records.

Users can use AGID, save AGID, and share AGID, but they cannot rewrite the AGID itself. The operating body can govern the specification, reserved ranges, deprecated ranges, and versioned quality packs, but not change the meaning of one user's private address.

## AOID

AOID is an owner-managed private address identity. It sits on top of one or more AGIDs and can include delivery-specific details that are not safe as public AGID evidence.

AOID can contain:

- building name,
- building block or tower,
- floor,
- room or unit,
- delivery access kind (`standard`, `auto-lock`, `po-box`, `locker`, `front-desk`, or `unknown`),
- carrier review flag for auto-lock and PO Box destinations,
- recipient,
- phone number,
- delivery instructions,
- temporary relocation or disaster recovery notes.
- an explicit validity period and scoped access policy.

The executable private-body schema is `aoid-private-body-v1`. New AOID
registration requires a valid linked AGID. Older locally stored AOIDs without
that link may still be read for migration, but they do not satisfy current
registration readiness.

AOID exists for cases where the public place, address, or building label alone is not enough. Delivery often needs the AGID plus the recipient, room, access route, or current owner-managed instruction.

Only the AOID owner can update AOID contents or regenerate an AOID QR payload. Central services may assist only after explicit owner consent.

### AOID Delivery Access Requirement

When a destination is an auto-lock building or a PO Box, AOID registration must explicitly record the delivery access profile. The minimum profile is:

```ts
deliveryAccess: {
  kind: 'auto-lock' | 'po-box' | 'standard' | 'locker' | 'front-desk' | 'unknown';
  autoLock: boolean;
  poBox: boolean;
  locker: boolean;
  frontDesk: boolean;
  carrierReviewRequired: boolean;
  confirmedAt?: number;
  instructionCommitment?: string;
}
```

This profile lets a carrier reject or review labels for PO Box, auto-lock, address-defect, or undeliverable-region cases without exposing the full AOID body. Any private access instruction should be stored as an encrypted payload or commitment, not as public text.

### AOID Identifier Rule

The current AOID public identifier is a 9- to 16-character unambiguous Base32
handle using the AGID hash alphabet:

```text
0123456789ABCDEFGHJKMNPQRSTVWXYZ
```

When an AOID is linked to an AGID, the AOID id must contain the AGID 10-character
hash anchor. The two-character AGID prefix is not used as the anchor because
prefixes are routing/display hints and can change governance meaning more easily
than the coordinate hash.

Reserved-pattern rejection:

- 16 identical characters are rejected.
- Any four-character consecutive run in the Base32 alphabet is rejected.

The standard generator emits a 16-character AOID. Shorter 9- to 15-character
forms are accepted only when they satisfy the same normalization and reserved
pattern rules. The AOID id is a reference handle, not a proof of ownership,
residence, deliverability, or address truth.

### Optimized AOID Storage and Sync

AOID should not be forced into either device-only storage or server-only registration. The optimized model is:

1. **Local first:** the owner device is the primary place where AOID contents are created, edited, and decrypted.
2. **Encrypted optional sync:** cloud/server sync is allowed only after explicit owner consent and only as an opaque owner-device encrypted payload with owner and device key ids.
3. **Public reference only:** public AOID QR payloads expose only the AOID id, linked AGID, status, version, and public handle. They do not expose recipient, phone, room, private delivery instructions, exact coordinates, update timestamps, or private address text.
4. **Public QR is not ownership proof:** scanning a public AOID reference can save a QR/search reference, but it must not register that AOID as an owner-managed private record on the scanning device.
5. **Owner revocation:** the owner can revoke or rotate an AOID. Central services may store the revoked/rotated state, but cannot rewrite private AOID contents.
6. **No public data-pack export:** AOID contents must never be included in AGID public source packs, SDK parity vectors, open data exports, or public address evidence caches.

This gives AGID a public, reusable address/building/map-feature layer while giving AOID a private, recoverable delivery layer.

## Centralized and Distributed Model

AGID should be a hybrid system:

| Layer | Centralized role | Distributed role |
| --- | --- | --- |
| AGID core | Govern spec, versioning, reserved/deprecated ranges, public quality packs | SDK/device encode, decode, cell bounds, offline use |
| Postal and geo evidence | Improve quality, cache public/open-source evidence, run validation jobs | Local data packs, local cache, manual confirmation |
| AOID private records | Optional private sync, recovery, quality assistance after explicit consent | Owner device storage, owner QR, owner-controlled updates |
| SDKs | Publish reference spec and parity vectors | Independent use in apps, terminals, drones, carriers, offline tools |

This means the central server improves quality, but the central server is not required to create or decode AGID.

## Rules

1. AGID is public. AOID is private by default.
2. AGID identifies a place, public address, and public building/place/map-feature evidence. AOID identifies an owner-controlled delivery destination.
3. AGID never stores personal address details.
4. AOID may store private address details and must stay owner controlled.
5. AGID encode/decode/cell bounds must run in SDKs and on devices without central approval.
6. Central services may improve postal, geographic, building, and confidence evidence.
7. AOID sync must be opt-in and private. It must not publish private records into public data packs.
8. Public QR payloads must prefer AGID and redacted address labels. Full AOID QR payloads are private use only.
9. Operators can govern the AGID specification, but cannot rewrite owner AOID content without consent.

## Implementation Mapping

- `src/lib/addressIdentity.ts` defines the AGID/AOID boundary policy.
- `src/lib/agidSecurity.ts` defines AGID public-layer validation, open-source release controls, and public QR private-field checks.
- `src/lib/aoid.ts` defines AOID normalization, public references, encrypted sync envelopes, revocation, and local-first policy.
- `src/lib/hybridArchitecture.ts` maps workflows to AGID, AOID, evidence, or settings layers.
- `src/lib/privacyPolicy.ts` redacts public QR payloads and sensitive logs.
- `src/lib/registeredAddressQr.ts` supports full and public QR payload modes.
- `src/lib/syncQueue.ts` maps saved AGIDs to public AGID policy and AOID records to private sync policy.
- `docs/privacy-design.md` describes the storage and sharing rules.
- `docs/hybrid-architecture.md` describes the central/device/SDK/open-data-pack split.

## Practical Product Rule

When the app displays a public map cell, public code, public address label, building name, landmark, or open-source place evidence, use AGID.

When the app displays a recipient, unit, room, phone, delivery instruction, access instruction, or owner-managed QR, use AOID or a private registered-address record.

This keeps AGID useful as a global public position, address, building, and public map-feature layer while keeping AOID useful as a private delivery layer.
