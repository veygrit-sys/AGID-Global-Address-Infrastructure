# Address Operations

Address Operations is the Stripe-style operational layer around AGID/AOID. It does not store plaintext addresses, raw AGID, raw AOID, passkey secrets, proof codes, or API keys.

## Surfaces

| Surface | Purpose | Public API input |
| --- | --- | --- |
| Address Identity | Verify address ownership, residence, and delivery eligibility. | AOID credential refs, passkey challenge hash, issuer credential refs, issuer/freshness/revocation roots. |
| Address Webhooks | Emit operational events. | Topic, endpoint id, payload fingerprint, public refs. |
| Address Disputes | Review misdelivery, address conflicts, same-address claims, PID merge/split disputes. | Evidence refs, handoff receipt refs, PID commitments. |
| Address Tax / Customs | Connect cross-border delivery, POS, and shopping-agent flows to HS/tariff/tax support data. | Country codes, HS code, declared value, currency, risk flags, private-address-proof flags. |
| Address Dashboard | Aggregate logs, audit, API keys, terminals, issuers, webhooks, review queue, disputes, tax/customs. | Counts and public operational status only. |

## Webhook Topics

The default event set includes:

- `address_intent.verified`
- `handoff.completed`
- `credential.revoked`
- `qr.used`
- `dispute.opened`
- `dispute.resolved`
- `identity.verified`
- `customs.review.required`

## Privacy Rule

The public operational layer accepts commitments, references, roots, fingerprints, aliases, and counts. Raw address material stays in local UI, encrypted owner storage, carrier systems, or issuer systems according to explicit scope.

If a request includes private material, the API rejects it and returns a structured error. This is intentional: Address Operations is an operational control plane, not a personal address database.

## API Endpoints

- `GET /api/v1/address-operations/capabilities`
- `POST /api/v1/address-identity/verify`
- `POST /api/v1/address-webhooks/event`
- `POST /api/v1/address-disputes/case`
- `POST /api/v1/address-tax-customs/context`
- `POST /api/v1/address-dashboard/snapshot`
