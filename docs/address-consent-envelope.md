# Address Consent Envelope

`Address Consent Envelope` is a signed, purpose-bound consent object for AGID/AOID workflows.
It is inspired by electronic-signature envelope patterns: a container binds parties,
required signatures, a purpose, fields/scopes, timing, and an audit trail. Docusign's
eSignature API describes envelopes as resources that can be created with documents,
recipients, and tabs; AGID adapts that idea without storing raw address documents in
the public consent object.

Reference: https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/

## What It Covers

The envelope can represent:

- address disclosure consent
- delivery delegation
- proxy pickup
- disaster or humanitarian aid receipt
- return-label consent
- customs-clearance consent
- identity-verification consent
- evidence-review consent
- audit-access consent

The model answers:

- who granted consent
- who may use it
- for which purpose
- which address attributes or scopes may be used
- when it becomes valid
- when it expires
- how it can be revoked
- which signatures are required
- which commitments are safe to log

## Privacy Boundary

The envelope must not contain:

- raw address text
- raw AGID
- raw AOID
- precise coordinates
- recipient phone or email
- private delivery instructions
- raw terms text containing address material
- proof codes or secrets

Instead it stores:

- `subjectCommitment`
- `addressCommitment`
- `aoidCommitment`
- `agidSCommitment`
- `waybillCommitment`
- `evidenceCommitment`
- `revocationHandle`
- `nullifier`
- `termsCommitment`
- signatures over the canonical payload hash

This makes the envelope useful for audit and authorization while keeping the address
itself outside the public or shared record.

## Signature Model

The current implementation uses HMAC-SHA-256 for local deterministic verification in
tests and local/server modes. Production deployments should bind this interface to a
real signing backend such as:

- WebAuthn/passkey signatures
- Ed25519/JWS signatures
- hardware-backed POS terminal keys
- issuer or NGO field-worker keys
- managed enterprise key custody

The signing payload is canonicalized and hashed. Each signature records:

- signer role
- signer id
- signing time
- payload hash
- signature value

If the envelope is tampered after signing, verification fails because the payload hash
changes.

## Required Signer Patterns

Default requirements:

- `address-disclosure`: grantor
- `delivery-delegation`: grantor
- `proxy-pickup`: grantor and delegate
- `aid-receipt`: grantor and NGO/field organization
- `audit-access`: grantor and auditor

The caller may override `requiredSignerRoles` for stricter workflows.

## High-Risk Mode

High-risk mode is intended for disaster, DV, refugee, humanitarian, or surveillance-risk
contexts. It adds:

- short TTL cap
- one-time nullifier
- post-use revocation recommendation
- no raw history
- no external disclosure by default
- ZK-ready public statement control when used with ZK modes

The module caps high-risk consent TTL to ten minutes by default.

## State Model

Possible statuses:

- `draft`
- `awaiting-signature`
- `active`
- `requires-review`
- `expired`
- `revoked`
- `rejected`

Typical flow:

```text
create envelope
  -> awaiting-signature
  -> all required signatures collected
  -> active
  -> used/revoked/expired
```

Rejected envelopes are created when private address material is detected in public
inputs. This allows the UI to show a clear error without storing the sensitive payload.

## Relationship To Existing Modules

`Address Access / Address Auth` decides whether a request should be allowed,
challenged, reviewed, or denied.

`Address Consent Envelope` is the signed consent artifact that can satisfy controls
such as `consent-proof`, `purpose-bound-token`, `audience-bound-token`, and
`domain-separated-nullifier`.

`Carrier Label Intent` can reference the envelope for delivery delegation, proxy pickup,
and handoff completion.

`Address Evidence Vault` can reference the envelope for evidence review consent, while
keeping photos, PDFs, and OCR drafts encrypted and local-first.

## Implementation

Code:

- `src/lib/addressConsentEnvelope.ts`
- `src/lib/addressConsentEnvelope.test.ts`

Main exports:

- `createAddressConsentEnvelope`
- `signAddressConsentEnvelope`
- `verifyAddressConsentEnvelope`
- `stripPrivateAddressConsentEnvelopeMaterial`
- `validateAddressConsentEnvelope`

The tests cover:

- signed delivery consent
- proxy pickup with delegate signature
- high-risk aid receipt with short TTL and one-time nullifier
- rejection of raw address/contact/private terms
- signature tamper detection
