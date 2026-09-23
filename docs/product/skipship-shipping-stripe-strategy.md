# Skipship Shipping Stripe Strategy

Version: skipship-stripe-strategy-v0.1

## Thesis

Skipship is not only a shipping-rate comparison or label-printing wrapper.

Skipship is the address-native shipping infrastructure layer: developers use one API while recipient identity, wallet consent, AddressQL validation, carrier allocation, labels, tracking, returns, evidence, and settlement stay behind safe boundaries.

## Market Position

Existing multi-carrier shipping APIs already cover rates, labels, tracking, address validation, and returns. Skipship must compete on a different axis:

```text
shipping API + recipient identity + address wallet + consent + AddressQL + carrier connect + settlement
```

The core product is not "compare carriers." The core product is:

```text
ship without exchanging raw addresses by default
```

## Product Layers

| Layer | Boundary | First artifact |
| --- | --- | --- |
| Shipping API | shared contract | OpenAPI, SDK, sandbox carrier fixture |
| Recipient Identity | shared contract | recipient_id, wallet permission, carrier handoff ref |
| Address Wallet | commercial managed | friend delivery approval, QR passes, Address Login |
| Carrier Connect | commercial managed | sandbox adapter, capability registry, manual ops adapter |
| AddressQL Layer | OSS | PostgreSQL, DuckDB, schemas, synthetic fixtures |
| Merchant Console | commercial managed | API keys, webhooks, billing, evidence |
| Settlement Ops | commercial managed | label intent ledger, billing export, disputes |
| Evidence / Risk | commercial managed | redacted receipts, non-claim profiles, risk reason codes |

## Stripe Analogy

| Stripe | Skipship |
| --- | --- |
| PaymentIntent | ShipmentIntent |
| Customer | Recipient / Wallet User |
| Payment Method | Delivery Method / Carrier Option |
| Checkout | Shipping Checkout |
| Connect | Carrier Connect |
| Webhook Event | Shipment Lifecycle Event |
| Radar | Address / Delivery Risk |
| Billing | Label / Carrier Settlement |
| Identity | Address Login / Address Credential |

## Commerce Integration Placement

The Stripe-like delivery plan should let a merchant choose where Veygrit is
introduced. This is one integration family, but two distinct product placements.

| Placement | Install target | Start point | Product question | Login button |
| --- | --- | --- | --- | --- |
| Playlist Commerce | Veygrit app | Veygrit | which EC to use | not required to shop |
| EC Social Login | merchant EC plugin or SDK | merchant EC site | how to buy at that EC | Continue with Veygrit required |

Playlist Commerce is for discovery, Topics, Discover, My Stores, saved products,
and wallet-side address reuse. Users must be able to choose stores and start
shopping without pressing a login button.

EC Social Login is for checkout conversion on Shopify, WooCommerce, EC-CUBE, or
custom storefronts. When the EC wants Address Wallet reuse, address autofill,
friend delivery, or carrier handoff, the EC shows `Continue with Veygrit`.

The Merchant Console should expose three choices:

- enable only Playlist Commerce for Veygrit discovery traffic
- enable only EC Social Login for checkout address autofill
- enable both for discovery plus EC-side Address Login conversion

## API Primitives

```ts
skipship.shipmentIntents.create()
skipship.recipients.resolve()
skipship.rates.create()
skipship.labels.create()
skipship.tracking.retrieve()
skipship.returns.create()
```

The first public SDK can keep the smaller facade:

```ts
skipship.createShipment({
  recipientId: "recp_sandbox_...",
  parcelProfileRef: "parcel_profile_...",
  walletConsentRef: "consent_...",
  servicePreference: "fastest"
})
```

## Differentiation

1. Recipient is an ID or wallet friend, not raw address by default.
2. Wallet approval controls disclosure.
3. AddressQL validates country, postal, source, and result boundaries.
4. Carrier Connect keeps carrier credentials server-side.
5. Merchant sees safe refs, not raw carrier payloads.
6. Evidence Vault stores redacted receipts and non-claim profiles.
7. Settlement links label purchase, adjustment, refund, dispute, and invoice.

## OSS / Commercial Boundary

OSS:

- OpenAPI contracts
- SDK skeletons
- AddressQL schemas and adapters
- synthetic fixtures
- webhook schemas
- carrier adapter interfaces
- no-raw-address tests

Commercial:

- hosted wallet
- hosted recipient registry
- live carrier credentials
- label purchase
- tracking ingestion
- settlement
- evidence vault
- merchant console
- support and SLA

## Roadmap

| Phase | Title | Exit criteria |
| --- | --- | --- |
| v0.1 | Safe Contract Foundation | OpenAPI, SDK skeleton, synthetic fixtures, no raw-address gate |
| v0.2 | Shipment Intent / Rates / Tracking | shipment intent, rates, tracking webhook, sandbox carrier |
| v0.3 | Address Wallet Friend Delivery | SSO, friend approval, recipient handoff ref |
| v0.4 | Commerce Integrations | Shopify-like, WooCommerce-like, custom EC SDK |
| v0.5 | Carrier Connect Beta | three adapter profiles, capability matrix, label ledger |
| v1.0 | Managed Shipping Network | production contracts, billing, evidence vault, SLA |

## Webhook event idempotency

Tracking webhooks must behave like infrastructure, not best-effort callbacks.

Minimum production policy:

- use `eventId` as the event idempotency key
- compute the event fingerprint from the signed normalized body
- ACK exact replays of the same event
- reject the same `eventId` with a different signed body
- enforce a 300 second timestamp replay window
- retain idempotency records for at least 30 days
- send repeated delivery or verification failures to a dead-letter queue after 12 attempts
- store only redacted audit fields such as `eventFingerprint`, status, and safe refs
- never persist raw address, recipient contact, carrier secret, proof witness, or raw carrier payload in public fixtures

## Non-Claims

- Skipship is not a guarantee that every carrier supports every feature.
- Recipient ID, wallet friendship, or checkout login is not proof of residence.
- Rate and ETA outputs are estimates, not carrier SLA guarantees.
- Public fixtures must not include raw private address, recipient, witness, private-key, proof-secret, production credential, or production carrier material.
