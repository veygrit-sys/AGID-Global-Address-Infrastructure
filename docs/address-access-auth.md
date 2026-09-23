# Address Access / Address Auth

Address Access / Address Auth is the authorization layer for AGID, AOID, AGID-S, Address Link, POS, and server registry flows. It is intentionally modeled like a scope-based identity system: a caller must have the right scope, purpose, actor role, resource, freshness, revocation state, and device or recipient proof before address-derived information can be used.

This layer does not replace consent proofs, ZK proofs, issuer trust, or AGID-S encryption. It decides whether a requested operation may proceed.

## Core Idea

An address token or credential is not globally reusable. It is bound to:

- actor: merchant, carrier, POS staff, recipient, NGO, municipality, issuer, auditor, shopping agent, warehouse, delivery agent, drone operator, system
- purpose: delivery, return, aid, identity, customs, audit, support, emergency, registration, agent
- scope: `delivery:read`, `recipient:verify`, `return:label`, `aid:eligibility`, and related scopes
- resource: public AGID, AGID-S envelope, AGID-S plaintext, AOID commitment, raw address, handoff, label, revocation status, audit report
- controls: consent proof, freshness, revocation, issuer trust, audience binding, device trust, live recipient challenge, domain separation, signed receipt, no plaintext persistence

## Initial Scope Set

| Scope | Main Use | Never Implies |
| --- | --- | --- |
| `delivery:eligible` | Delivery eligibility or zone predicate | Raw address disclosure |
| `delivery:read` | Minimum routing material for a carrier/POS handoff | AOID private body or recipient personal data |
| `recipient:verify` | Recipient proof / passkey / NFC / credential check | Storing proof code or recipient secret |
| `return:label` | Return-label or waybill alias generation | Persistent raw address sharing |
| `aid:eligibility` | Humanitarian/disaster eligibility | Exact location or address history |
| `region:coarse` | Country/city/zone-level claim | Precise coordinates |
| `address:quality` | Internal quality decision | Underlying address text |
| `agid-s:decrypt` | Decrypt AGID-S for the intended recipient | Server-side plaintext persistence |
| `aoid:commitment` | AOID commitment/nullifier use | AOID body disclosure |
| `aoid:private-read` | Owner/admin private AOID access | Merchant/carrier access |
| `revocation:read` | Credential/QR/nullifier revocation lookup | Address history disclosure |
| `issuer:trust-read` | Issuer trust metadata lookup | Credential body disclosure |
| `handoff:complete` | Final signed handoff | Raw proof material logging |
| `audit:read` / `audit:write` | Redacted audit reports | Raw address, AOID, or proof secret logging |

## Decision States

- `allow`: operation can proceed.
- `challenge`: the caller must provide a missing proof, recipient challenge, device trust, freshness, revocation check, or audience binding.
- `review`: human/admin review or break-glass approval is required.
- `deny`: the request is incompatible with the actor, purpose, resource, scope, token time window, or privacy boundary.

## Important Safety Rules

1. `delivery:read` is not `agid-s:decrypt`.
   A carrier may receive an AGID-S envelope under `delivery:read`, but plaintext AGID-S requires `agid-s:decrypt` plus audience binding, device trust, freshness, revocation, encrypted channel, and no plaintext persistence.

2. `recipient:verify` is not address disclosure.
   It verifies recipient control and should expose only a proof result, fingerprint, receipt, or nullifier.

3. `aid:eligibility` is coarse and high-risk by default.
   In high-risk mode it requires ZK proof, live recipient challenge, short TTL, and manual review.

4. `aoid:private-read` is owner/admin-only.
   Merchants and carriers should use `aoid:commitment`, `recipient:verify`, or `delivery:eligible` instead.

5. Raw address and AOID plaintext are exceptional.
   They are never available from ordinary delivery, return, aid, or shopping-agent scopes.

## Code

The implementation lives in:

- `src/lib/addressAccessAuth.ts`
- `src/lib/addressAccessAuth.test.ts`

The main entrypoint is:

```ts
evaluateAddressAccess({
  actor: 'carrier',
  purpose: 'delivery',
  resource: 'agid-s-envelope',
  requestedScopes: ['delivery:read'],
  hasConsentProof: true,
  hasFreshness: true,
  hasRevocationCheck: true,
  hasDeviceTrust: true,
  hasApiKeyScope: true,
});
```

The result returns:

- allowed and denied scopes
- required and missing controls
- forbidden disclosures
- TTL and one-time-use recommendation
- privacy flags for raw address, AOID private body, and AGID-S plaintext

## Relationship to Existing Modules

- Address Link: user-facing permission grant and public claims.
- Address Item: one connected address credential or connection unit.
- Address Portal: user-facing management/revocation of granted connections.
- Address Access/Auth: runtime authorization decision for using a resource.
- Consent Purpose Scope Proof: proof that a consent grant exists for a purpose and data scope.
- AGID-S: encrypted AGID transport; Access/Auth decides whether it may be decrypted.
- Address Radar: risk scoring; Access/Auth can consume Radar outputs as device trust, challenge, freshness, revocation, or review controls.
