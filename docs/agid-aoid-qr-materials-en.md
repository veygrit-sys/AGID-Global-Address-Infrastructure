# AGID/AOID QR Materials

Last updated: 2026-06-07

## 1. Position

In this project, QR is not just a visual code. It is a communication surface that enforces the AGID/AOID boundary.

The core rule is:

```text
AGID QR = public geographic reference, public address label, public map-feature reference
AOID public QR = reference only, not ownership proof
AOID private/full QR = private trusted-device transfer
```

AGID is a public location, address, building, and map-feature reference. AOID is a private address layer that may contain recipient, room, phone, access, and delivery instructions. QR payloads must not blur these layers.

## 2. Core Implementation Files

| Role | File |
| --- | --- |
| QR payload build/parse | `src/lib/registeredAddressQr.ts` |
| Public QR redaction | `src/lib/privacyPolicy.ts` |
| AGID/AOID communication boundary and audit | `src/lib/agidAoidGovernance.ts` |
| Public AGID QR private-field validation | `src/lib/agidSecurity.ts` |
| AOID public reference redaction | `src/lib/aoid/records.ts` and AOID modules |
| QR reader action UI | `src/components/modals/QrReaderActionScreen.tsx` |
| QR camera scanner modal | `src/components/modals/QrScannerModal.tsx` |
| Saved QR display | `src/components/SavedLocations.tsx` |
| QR scan/import flow | `src/App.tsx` |
| QR tests | `src/lib/registeredAddressQr.test.ts`, `src/App.registrationQr.test.ts`, `src/components/SavedLocations.qr.test.ts`, `src/components/QrReaderActions.test.ts` |

## 3. QR Payload Format

Registered-address QR payloads use this prefix:

```text
agid:address:
```

The prefix is followed by a URL-encoded JSON payload. The generated payload has this structure:

```json
{
  "version": 1,
  "privacy": "public | full",
  "security": {
    "profile": "AGID security policy id",
    "publicLayer": true
  },
  "audit": {
    "layer": "AGID | AOID",
    "operation": "qr-build",
    "surface": "public-qr | private-qr",
    "payloadClass": "public-agid-reference | aoid-public-reference | ...",
    "outcome": "allowed | blocked",
    "payloadFingerprint": "safe metadata fingerprint"
  },
  "record": {
    "type": "ADDRESS | AOID",
    "id": "AGID or AOID id",
    "agid": "linked AGID if present",
    "address": "public or private address label"
  }
}
```

`buildRegisteredAddressQrPayload(record, { privacy })` builds this payload. With `privacy: 'public'`, the record is redacted for public sharing. With `privacy: 'full'`, the payload may include data needed to restore the registered address.

## 4. QR Types

### 4.1 Public AGID QR

Public AGID QR is a public geographic reference.

Allowed:

- AGID
- country or sea code
- public address label
- public building name
- public labels for roads, bridges, parks, water, mountains, lakes, rivers, waterfalls, islands, wetlands, deserts, grasslands, forests, ruins, heritage sites, and world heritage sites
- source and confidence metadata

Forbidden:

- recipient
- phone
- unit or room
- delivery instructions
- access code
- owner key id
- device key id
- private ownership proof
- opaque encrypted AOID payload

Public AGID QR payloads must be sanitized both when built and when parsed. A malicious QR that claims `privacy: public` but includes private fields must not reintroduce those fields.

### 4.2 Public AOID Reference QR

Public AOID QR is reference-only. It is not ownership proof.

Allowed:

- AOID id
- linked AGID
- public handle
- status/version
- `privacy: public-reference`

Forbidden:

- recipient
- phone
- room
- exact private coordinates
- delivery instructions
- access instructions
- owner-managed flag
- ownership proof

Critical rule:

```text
Scanning a public AOID QR must not register it as an owner-managed AOID.
```

In the current app import flow, an AOID is treated as owner-managed only when `ownerManaged === true` and `privacy !== 'public-reference'`.

### 4.3 Full / Private Registered Address QR

Full QR can restore a registered address. It may include recipient, phone, room, and coordinates, so it must be limited to trusted-device transfer or personal backup.

The current implementation can still treat full QR as a plaintext payload. Therefore, full QR is not suitable for public sharing, social posting, public display, third-party distribution, or permanent printing on public delivery labels.

Desired production properties:

- owner-device encryption
- short-lived challenge
- device binding
- one-time import
- revocation
- scope
- import audit

### 4.4 Drone Mission QR

The app also supports a drone mission QR path. `parseDroneMissionQrPayload` imports mission data, moves the map to the target, and restores the corridor report.

This is separate from registered-address QR, but it is also saved through `saved_qrs`.

## 5. QR Generation Flow

When address registration completes, the app performs:

1. Receives a registered address record from `AddressRegistration`.
2. Calls `buildRegisteredAddressQrPayload(data, { privacy: qrPayloadPrivacy })`.
3. Builds a saved QR record with `buildSavedQrFromRegisteredAddress(data, payload)`.
4. Stores it in `saved_qrs`.
5. Adds AOID records to the AOID list and regular address records to the registered-address list.

`qrPayloadPrivacy` is loaded from `localStorage` key `agid_qr_payload_privacy` and accepts `public` or `full`.

## 6. QR Reading Flow

QR reading is centralized in `handleQrResult(text)`.

Processing order:

1. If the QR is a URL, extract `agid` or `q` from query parameters.
2. Try drone mission QR.
3. Try registered address QR.
4. If the result looks like an AGID, call `jumpToAgid`.
5. Otherwise send it to normal search.

For registered-address QR:

1. Parse with `parseRegisteredAddressQrPayload(result)`.
2. Save the parsed record into `saved_qrs`.
3. Add to AOID list only when it is an owner-managed private AOID record.
4. Do not turn public-reference AOID into owner-managed AOID.
5. Move the map only when the parsed record includes lat/lon.

## 7. Storage and UI

Saved QR records are stored in `saved_qrs`. The `qr` tab in `SavedLocations.tsx` supports search, display, deletion, and map jump.

QR display has two paths:

- If `imageData` exists, the existing QR card image is displayed and can be downloaded.
- If `payload` exists, `QRCodeCanvas` regenerates a QR for display.

The QR reader is available from the saved QR tab and the search sidebar. `QrReaderActionScreen` separates camera scan from image import.

## 8. Security Boundary

### 8.1 Build-Time Protection

For public QR, `buildRegisteredAddressQrPayload`:

- redacts private fields through `sanitizeRegisteredAddressForPublicQr`;
- validates forbidden fields through `validatePublicAgidPayload`;
- creates a QR build audit event through `buildAgidAoidAuditEvent`;
- refuses payload creation when governance blocks it.

### 8.2 Parse-Time Protection

`parseRegisteredAddressQrPayload`:

- ignores payloads without the `agid:address:` prefix;
- returns null on JSON decode failure;
- rejects records unless `type` is `ADDRESS` or `AOID`;
- validates AGID format when an AGID is present;
- re-redacts AOID public QR through `redactAOIDForPublicUse`;
- re-sanitizes public ADDRESS QR through `sanitizeRegisteredAddressForPublicQr`;
- rejects payloads when the governance decision is not allowed.

### 8.3 Audit

QR build/parse connects to the `agidAoidGovernance` audit model. Audit events store safe metadata and fingerprints, not raw private payloads.

## 9. Existing Test Coverage

Existing tests verify:

- registered address records round-trip through QR payloads;
- ADDRESS records keep AGID id and coordinates;
- AOID records keep AOID id and linked AGID;
- public AOID QR parses as a public reference and cannot become owner-managed AOID;
- public AOID QR removes recipient, phone, room, lat, and lon;
- malformed AOID QR payloads are rejected before registration;
- public AGID QR is re-sanitized during parse;
- registered addresses create saved QR entries;
- the app parses registered-address QR before falling back to AGID or search;
- QR reader action UI provides camera scan and image import.

## 10. Current Strengths

- Supports public/full privacy modes.
- Public QR is sanitized both at build time and parse time.
- AGID/AOID governance controls allowed and blocked payloads by surface.
- Tests prevent public AOID QR from being confused with ownership proof.
- Saved QR storage is local-first and aligned with the privacy design.
- The AGID public / AOID private boundary exists in both docs and code.

## 11. Remaining Weaknesses

1. Full/private QR is not guaranteed to be encrypted.
2. Full QR does not yet have short-lived challenge, one-time import, or device binding.
3. QR payload schema is not yet fixed as an explicit JSON Schema.
4. Version migration rules are still thin.
5. UI can make the public/full QR risk difference more visible.
6. Saved QR encrypted local storage is not complete.
7. Payload size limits, compression, and canonical JSON encoding are not fully documented.
8. Import audit exists, but the user-facing confirmation screen could show whether the incoming QR is public reference or private full transfer.

## 12. Recommended Improvements

Priority S:

- Make full/private QR an owner-device encrypted envelope instead of plaintext.
- Add one-time challenge and expiry to private QR import.
- Show `Reference only` for public AOID QR and never expose ownership registration actions from it.
- Create a QR payload JSON Schema and lock it as version 1.
- Expand forbidden-field tests for both AGID and AOID public QR.

Priority A:

- Create a dedicated QR threat model document.
- Add a QR import confirmation screen that displays the incoming data class.
- Add encrypted local storage for saved QR records.
- Add stronger warnings when full QR is downloaded or shared.
- Add canonical encoding for QR payloads to stabilize signatures and fingerprints.

Priority B:

- Consider compact or compressed QR payloads.
- Add multilingual UI strings for `public reference`, `private transfer`, and `owner-managed`.
- Add safe undo/revoke flow after QR import.
- Improve fallback behavior when mobile camera permission fails.

## 13. Paper and Specification Wording

Recommended English wording:

> QR is a communication surface, not an ownership primitive. Public AGID QR codes carry only public location and public evidence. Public AOID QR codes carry only a reference handle and linked AGID, and do not prove ownership. Full AOID or registered-address QR codes are private trusted-device transfer payloads and must be encrypted, scope-bound, and revocable in production deployments.

Recommended Japanese wording:

> QR は所有権そのものではなく通信 surface である。公開 AGID QR は公開位置・公開住所・公開地物根拠のみを運ぶ。公開 AOID QR は参照ハンドルと紐付く AGID だけを運び、所有証明にはならない。full AOID または登録住所 QR は、信頼端末間の私的移行 payload であり、本番運用では暗号化、用途スコープ、失効、短命 challenge を備える必要がある。

## 14. Short Specification

```text
1. AGID QR may be public.
2. AOID public QR is reference-only and is not ownership proof.
3. AOID private/full QR is trusted-device transfer only.
4. Public QR must not include recipient, phone, room, delivery instructions, or exact private coordinates.
5. Public QR must be sanitized both during build and parse.
6. Malformed AOID QR must be rejected before registration.
7. Scanning a public AOID QR must not save it as owner-managed AOID.
8. Full/private QR should become encrypted, short-lived, and one-time in production.
```
