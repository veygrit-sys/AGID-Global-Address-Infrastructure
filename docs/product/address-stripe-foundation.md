# Address Stripe Foundation

Version: address-stripe-foundation-v0.1

This note prepares the first build slice for the address-version of Stripe.
The goal is not to launch production shipping yet. The goal is to create a
ref-first contract that lets developers, EC systems, Address Wallet, AddressQL,
Delivery Gateway, Carrier Connect, and Evidence Vault begin implementation
without raw private address material or production carrier traffic.

## Core Principle

Address Stripe starts with references, not addresses.

An EC integration should be able to create a shipment intent from:

- `walletUserRef`
- `recipientTokenRef`
- `parcelProfileRef`
- `servicePreference`
- `addressValidationRef`
- `walletConsentRef`

The merchant should not receive raw recipient address data by default. A carrier
adapter may receive scoped handoff material only after wallet consent, AddressQL
validation, carrier capability checks, and allocation policy pass.

## First Primitives

| Primitive | Stripe analogy | Owner layer | Purpose |
| --- | --- | --- | --- |
| Address Login Session | Checkout Session | Address Login | Authenticate the buyer once and return safe checkout refs. |
| Recipient Token | Customer / PaymentMethod token | Address Wallet | Represent recipient or friend delivery permission without exposing address. |
| AddressValidationRef | Risk check / verification result | AddressQL | Expose source-versioned country, postal, and address validation results. |
| ShipmentIntent | PaymentIntent | Delivery Gateway | Capture a shipping request before rate, carrier, label, or settlement. |
| RateQuote | Quote | Delivery Gateway | Normalize fastest, cheapest, balanced, or risk-minimized options. |
| CarrierAllocation | Processor routing | Delivery Gateway | Select a carrier under consent, merchant policy, carrier support, and risk. |
| CarrierHandoff | Capture / processor handoff | Delivery Gateway | Pass scoped delivery material to a server-side carrier adapter. |
| DeliveryWebhook | Webhook Event | Delivery Gateway | Send idempotent, redacted lifecycle events to merchants. |
| EvidenceReceipt | Receipt / dispute evidence | Evidence Vault | Store redacted evidence refs for audit, proof, dispute, and settlement review. |

## Build Gates

1. No raw address by default.
2. Wallet consent required for friend and recipient-token delivery.
3. Carrier credentials stay server-side.
4. Initial fixtures are synthetic only.
5. AddressQL validation stays bounded.
6. Webhooks are idempotent, signed, and replay-safe.
7. Label and evidence records do not claim final settlement.

## AddressQL Boundary

AddressQL can provide:

- country profile refs
- postal format checks
- postal existence status when source data exists
- address validation confidence
- source evidence refs
- non-claims

AddressQL validation is not wallet consent, legal KYC, proof of residence,
carrier support, fastest-route truth, delivery guarantee, or settlement.

## First SDK Shape

```ts
await addresses.addressLogin.start({
  clientId,
  redirectUri,
  scope: ['address_login', 'ship_to_friend'],
});

await addresses.recipients.requestConsent({
  walletUserRef,
  friendRef,
  deliveryPurpose: 'gift_delivery',
});

await skipship.shipmentIntents.create({
  recipientTokenRef,
  parcelProfileRef,
  servicePreference: 'cheapest',
});
```

## Next Executable Step

Create JSON schemas for:

- `ShipmentIntent`
- `RateQuote`
- `CarrierAllocation`
- `CarrierHandoff`
- `DeliveryWebhook`
- `EvidenceReceipt`

The first sandbox-only `createShipmentIntentSandbox` function now creates a
schema-compatible `ShipmentIntent` from refs and rejects `rawAddress`,
`recipientPhone`, `carrierApiKey`, `carrierCredential`, `proofWitness`,
`privateKey`, and `proofSecret`.

The next executable step is to expose the same contract through an OpenAPI
operation and a tiny SDK method.

## Non-Claims

- Address Stripe is not production carrier operations until carrier contracts,
  credentials, settlement, incident handling, and support exist.
- Recipient tokens are not proof of residence or legal identity.
- RateQuote is an estimate, not a carrier SLA.
- CarrierAllocation is not label purchase.
- EvidenceReceipt is not final proof of delivery or financial settlement.
