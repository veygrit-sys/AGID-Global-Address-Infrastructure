# AddressQL Signed L5 Delivery-Point Contract v1

This contract evaluates a delivery-point commitment without accepting a raw
address, recipient, building location, precise coordinate, carrier credential,
or private key. It does not make a global deliverability claim.

## L4 and L5 separation

| Level | Scope | Input boundary | Result boundary |
| --- | --- | --- | --- |
| L4 | delivery area | country plus postal or area key | whether a carrier dataset covers an area |
| L5 | delivery point | salted delivery-point commitment plus signed carrier assertions | whether the named carriers reached the same point decision |

`POST /v1/postal/validate` with `purpose=delivery` remains L4. It must never
promote a postal or area result to L5. `POST /v1/delivery-points/assess` is the
only practical API route in this release that evaluates L5 assertions.

## Commitment boundary

Create the delivery-point commitment in a client-controlled or authorized
carrier environment. Use a high-entropy random salt and a versioned canonical
preimage. Submit only the resulting `sha256:` commitment.

An unsalted address hash can be dictionary-attacked or linked across requests.
AddressQL does not create the preimage, receive it, store the commitment, log
the commitment, or reflect it in the response.

The TypeScript SDK exposes the same boundary through
`AddressQlApiClient.assessDeliveryPoint()`. Its request type contains the
commitment, service scope, and detached carrier assertions; it has no raw
address or recipient field.

## Carrier trust store

`addressql-carrier-trust-store-v1` contains public Ed25519 keys only. Every key
is bound to one carrier, explicit country scopes, status, and a validity
window. Revoked, rotated, expired, duplicate, non-Ed25519, and private keys are
not eligible.

Configure the API with:

```powershell
$env:ADDRESSQL_L5_CARRIER_TRUST_STORE="carrier-trust-store-v1.json"
npm run serve:addressql-api
```

Protect this file as a deployment trust root. Carrier onboarding and
revocation approval remain deployment responsibilities.

## Offline carrier assertion

Prepare canonical bytes without a private key:

```bash
npm run prepare:addressql-l5-carrier-assertion -- \
  --assertion-id carrier-a-check-20260727 \
  --carrier-id carrier-a \
  --key-id carrier-a-2026 \
  --country-code JP \
  --delivery-point-commitment sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --service-level standard \
  --decision reachable \
  --source-version carrier-source-2026-07 \
  --evidence-digest sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
  --assessed-at 2026-07-27T00:00:00Z \
  --expires-at 2026-07-27T01:00:00Z \
  --output carrier-a.payload.json
```

The carrier signs the exact payload bytes outside AddressQL. Finalize the
public assertion with the detached Base64 signature:

```bash
npm run finalize:addressql-l5-carrier-assertion -- \
  --payload carrier-a.payload.json \
  --signature carrier-a.sig \
  --output carrier-a.assertion.json
```

The validity window cannot exceed 24 hours. The assertion binds carrier, key,
country, commitment, service level, decision, source version, evidence digest,
and time window.

## Decision and conflicts

Submit one assertion per carrier. AddressQL verifies every signature and scope.
All carrier decisions must be identical:

- all `reachable`: `pass`, processing may continue;
- all `unreachable`: `fail`, processing stops;
- all `unknown`: `unknown`, processing stops;
- any disagreement, including `reachable` versus `unknown`: `conflict` with
  `processingDirective=stop_conflict`.

No majority vote or confidence averaging can override a conflict. Resolve the
carrier evidence outside this endpoint and submit a new set of independently
signed assertions.

## Schemas

- `addressql-carrier-trust-store-v1.schema.json`
- `addressql-l5-carrier-assertion-v1.schema.json`
- `addressql-l5-delivery-point-request-v1.schema.json`
- `addressql-l5-delivery-point-decision-v1.schema.json`

## Non-claims

- L4 area coverage is not L5 point reachability.
- L5 reachability is not a delivery guarantee, SLA, route, or delivery event.
- A commitment is not proof of residence, identity, recipient authorization,
  or ownership.
- Synthetic tests do not establish production carrier coverage.
