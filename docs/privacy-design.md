# AGID Privacy Design

Last updated: 2026-06-03

AGID handles locations, registered addresses, QR payloads, and search text. The privacy design is local-first by default and separates deterministic grid identity from private address records.

Front-door posture:

- **Ethereum optional:** wallets, gas, public ledgers, and crypto payments are not required for local AGID generation, address display, AGID-S decryption, QR/NFC intake, basic POS handoff, export, deletion, revocation, or high-risk safety.
- **Local-first:** private address drafts, evidence/OCR drafts, AOID details, proof preparation, POS decisions, and offline queues stay on the device whenever feasible.
- **No raw address by default:** public payloads, registry records, audit exports, Address DNS, Ethereum records, examples, and logs use commitments, aliases, roots, nullifiers, tails, and redacted evidence instead of raw address material.

## Principles

- **AGID is public by nature; registered addresses are private by default.**
- **AGID can carry public address/building/map-feature evidence:** public building names, landmarks, public natural-feature and heritage labels, public address labels, and open-source geographic evidence can belong to AGID.
- **AOID is private and owner controlled:** room, recipient, phone, private access notes, and delivery instructions belong to AOID or private registered-address records, not to public AGID.
- **Private address predicates are preferred over full disclosure:** where a service only needs "resident in Japan", "inside Tokyo", "inside a delivery zone", or "same address resident", AGID/AOID should support ZK or selective-disclosure proofs instead of exposing the full address.
- **AOID is not a public tracking identifier:** external flows should use purpose-specific commitments and domain-separated nullifiers, not a reusable AOID body that can link a person across delivery, residence, identity, marketing, and agent workflows.
- **Local first:** saved locations, registered addresses, saved QR records, AOIDs, search history, and home location stay in browser storage unless the user explicitly shares or syncs them.
- **AOID sync is encrypted opt-in:** server/cloud storage can hold AOID records only as opaque owner-device encrypted payloads with owner and device key ids. Plain AOID records remain local.
- **No central plaintext address store:** central servers must not persist plaintext addresses, AOID bodies, private address history, raw candidates, raw clusters, or proof witnesses.
- **External evidence is optional:** postal-code completion, reverse geocoding, building names, nearby features, terrain, and map evidence can require public/open-source external APIs. The app exposes a switch to disable external address data and fall back to AGID-only local display.
- **QR sharing has two privacy levels:** full payloads can restore a registered address on trusted devices; public AOID payloads are reduced to a reference handle and linked AGID, and cannot become owner-managed AOIDs just by being scanned.
- **Server logs are redacted:** coordinate pairs, address-like query text, postal-code parameters, and lat/lon query parameters are hidden before logging.
- **API responses are not browser-cacheable:** API routes send no-store/no-cache headers to reduce accidental storage of address results.

## Data Classes

| Class | Examples | Default storage | Sharing behavior |
| --- | --- | --- | --- |
| Public grid identity | AGID, region code, sea code | In memory / saved if user saves | Safe to share |
| Private address record | recipient, phone, room, registered address | LocalStorage + IndexedDB | Full QR only |
| Reduced public QR record | AGID, country, address label, purpose-bound AOID commitment or one-time handle | Local QR list | Public QR |
| Encrypted AOID sync record | AOID id, linked AGID, opaque encrypted payload, owner/device key ids | Optional server/cloud | Owner opt-in only |
| ZK/selective-disclosure proof | predicate id, scope, challenge, issuer trust root, revocation/freshness root, commitment/nullifier | Public proof registry only after witness stripping | Reveals only the scoped predicate |
| Search history | typed queries, AGIDs | LocalStorage | Not shared |
| External evidence | postal/geocoding/building/map-feature results | transient cache/UI | sent only when external data is enabled |

## Communication Privacy Boundary

| Function | AGID behavior | AOID behavior |
| --- | --- | --- |
| Public API | Can request public evidence for coordinates, AGID, country, sea, building, or postal context | Must expose only reference handle and linked AGID |
| SDK/offline | Can encode, decode, and calculate bounds without network | Can support owner-local payload handling, but cannot prove or transfer ownership by itself |
| QR | Public cards and public address references are safe to share | Public QR is reference-only; full QR is private use for trusted devices |
| Sync | Public saved-grid references can be queued as public descriptors | Plain private fields are redacted or rejected; encrypted owner-device envelope is required |
| Realtime | Public quality/job progress only | Sync status only; no plaintext recipient, phone, room, or delivery instruction |
| Cache | Public/open evidence may be cached under privacy-safe API headers | No public cache, no public data-pack export, and no plaintext server persistence |

## User Controls

- Location permission is explicit and can be denied without blocking AGID use.
- External address data can be disabled.
- QR payload privacy can be set to `public` or `full`.
- Private data clear removes saved locations, saved QRs, registered addresses, AOIDs, search history, home location, and pending sync data.

## Implementation Notes

- QR sanitization and log redaction live in `src/lib/privacyPolicy.ts`.
- AOID public references and encrypted sync envelopes live in `src/lib/aoid.ts`.
- Registered-address QR generation accepts `{ privacy: 'public' | 'full' }`.
- App settings persist `agid_external_address_data_enabled` and `agid_qr_payload_privacy`.
- Server console output is wrapped by a privacy-safe redactor unless `AGID_LOG_REDACTION=off`.
- Anti-surveillance invariants and ZK proof disclosure boundaries live in `src/lib/securityPrivacyDesign.ts`.
- Public proof systems should support self-hosting, offline issuance/presentation, mirror distribution, and onion-friendly deployment where feasible.

## Remaining Work

- Add encrypted local storage for high-risk address records.
- Add per-record privacy labels for humanitarian/disaster workflows.
- Add a sync consent screen before any central database integration sends encrypted private records.
- Add privacy-focused E2E tests for QR generation and private-data clearing.
