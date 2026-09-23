# AGID-S: Secure AGID QR Envelope

## 1. Definition

AGID-S is an authenticated-encryption envelope for safely sharing a public AGID through QR codes, NFC tags, links, and printed media.

The minimal definition is:

```text
AGID-S = AEAD_Encrypt(key, AGID + expiry + purpose)
```

AGID is a public location code. AGID-S is an encrypted AGID that can be opened only by a holder of the intended key. AGID-S is not AOID. It does not model ownership, room numbers, names, phone numbers, or delivery instructions. It is a secure sharing layer for AGID.

## 2. Three-Layer Separation

| Layer | Role | Visibility | Main use |
|---|---|---|---|
| AGID | Public location identifier | public | maps, virtual postal code, public address reference |
| AGID-S | Encrypted AGID envelope | key-gated | aid, evacuation, delivery, sharing under surveillance risk |
| AOID | Owner-controlled address and delivery identifier | private owner-controlled | ownership, authorization, credentials, redaction |

This separation keeps AGID public, AOID private, and AGID-S limited to safe sharing.

## 3. Token Format

The external representation is:

```text
AGIDS1-{BASE32_ENCODED_ENVELOPE}
```

The internal envelope is:

```json
{
  "v": 1,
  "alg": "A256GCM",
  "kid": "delivery-key-1",
  "n": "BASE32_NONCE",
  "c": "BASE32_CIPHERTEXT",
  "t": "BASE32_AUTH_TAG"
}
```

The encrypted payload is:

```json
{
  "agid": "JP05AV8TJGHD",
  "exp": 1780830000,
  "purpose": "delivery",
  "precision": "coarse",
  "iat": 1780826400,
  "jti": "RANDOM_NONCE_ID"
}
```

## 4. Security Rules

AGID-S requires:

- authenticated encryption such as AES-GCM;
- a fresh random nonce for each token;
- mandatory expiry;
- no permanent exact-location QR codes;
- no universal shared key;
- no recipient, phone, room, building, or delivery instruction fields;
- a `key_id` that identifies a decryption key slot, not the key itself;
- revocation, used-status, and purpose-scope checks when replay resistance is required.

## 5. Ethereum / L2 / Registry Boundary

The AGID-S body should not be published on-chain. If a chain or registry is used, it should store only public verification metadata:

- issuer registry;
- credential hash;
- revocation status;
- nullifier;
- used status;
- payment, donation, or delivery-support metadata.

Recommended separation:

```text
AGID-S QR body: off-chain
AGID plaintext: visible only after decryption
Chain / registry: revocation, freshness, issuer trust, used status only
```

## 6. Current Implementation

The implementation lives in [src/lib/agidSecureShare.ts](../src/lib/agidSecureShare.ts).

Implemented invariants:

- an AGID-S token has the `AGIDS1-` prefix;
- the encrypted payload contains only a valid public AGID;
- the payload includes `exp`, `iat`, and `jti`;
- the same AGID produces different tokens because nonce and jti are random;
- expired tokens, wrong keys, wrong key ids, purpose mismatches, and tampering are rejected;
- POS/NFC acceptance recognizes AGID-S but does not reveal AGID without an authorized decryption key.

Tests are in [src/lib/agidSecureShare.test.ts](../src/lib/agidSecureShare.test.ts) and [src/lib/posAcceptance.test.ts](../src/lib/posAcceptance.test.ts).

## 7. Open Issues

Remaining implementation work:

- POS terminal key-management UI;
- an async POS flow that decrypts AGID-S and then accepts the recovered AGID as a normal AGID record;
- integration with issuer trust, revocation, freshness, and used-status registries;
- mobile/browser QR scan and Web NFC measurements;
- key rotation and multi-recipient envelopes.
