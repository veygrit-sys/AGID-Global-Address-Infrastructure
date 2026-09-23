# Address Wallet Recipient ID

Address Wallet Recipient ID is the first delivery primitive for the Vey / Hexaship ecosystem.

The core rule is simple: EC sites, apps, and SDKs should reference a delivery target by ID, not by storing a raw address.

日本語で言えば、配送先を住所ではなく `recipient_id` として扱う設計です。

## Purpose

Address Wallet Recipient ID turns a person, friend, organization, or locker into a scoped delivery reference.

Examples:

- `aw_rec_self_...` for the logged-in buyer
- `aw_rec_friend_...` for Address Wallet friend delivery
- `aw_rec_org_...` for business or workplace delivery
- `aw_rec_locker_...` for future locker and PUDO delivery

The ID can be stored by an EC site or passed to Hexaship. It is not itself a shipping address.

## First API Surface

```http
POST /v1/wallet/recipients
```

Safe inputs:

- `walletSubjectAlias`
- `relationshipRef`
- `deliveryPurpose`
- `recipientKind`
- `consentPolicyRef`
- `expiresAt`

Safe outputs:

- `recipient_id`
- `status`
- `required_next_action`
- `consent_policy_ref`

Blocked material:

- `rawAddress`
- `addressLine1`
- `recipientName`
- `recipientPhone`
- `proofWitness`
- `proofSecret`
- `privateKey`
- `carrierApiKey`
- `carrierCredential`

## ShipmentIntent Bridge

The recipient ID becomes the input to the Address Stripe / Hexaship shipment layer:

```ts
createShipmentIntent({
  merchantRef: 'merchant_ref_synthetic_ec_001',
  recipientTokenRef: 'aw_rec_friend_12345678',
  parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_001',
  addressValidationRef: 'address_validation_ref_synthetic_jp_001',
  walletConsentRef: 'wallet_consent_policy_synthetic_gift_001',
});
```

This means the first developer experience can be:

```ts
hexaship.shipments.create({
  recipientId: 'aw_rec_friend_12345678',
  parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_001',
  servicePreference: 'fastest',
});
```

The EC stores the recipient ID and shipment refs. It does not need to store the recipient's full address by default.

## DHL/UPS MVP Boundary

For the first DHL/UPS MVP, carrier connectors should sit behind the Delivery Gateway.

```text
EC / App
  -> Hexaship SDK
  -> ShipmentIntent
  -> Carrier allocation
  -> DHL/UPS server-side adapter
```

Carrier adapters may receive scoped handoff material only after wallet consent, address validation, and carrier allocation gates pass.

Client-side apps and merchant dashboards must not receive DHL/UPS production credentials, raw carrier payloads, proof witnesses, or unscoped address material.

## Lifecycle

- `requires_consent`: recipient ID exists, but recipient consent is still required.
- `active`: recipient consent policy exists and the ID can be used to create a ShipmentIntent.
- `revoked`: the ID must no longer be used for new shipments.

## Non-Claims

- Recipient ID is not a raw address.
- Recipient ID is not proof of residence.
- Recipient ID is not legal identity verification.
- Recipient ID is not a carrier delivery guarantee.
- AddressQL validation is not wallet consent.
- A recipient ID alone does not authorize marketing use, resale, or long-term address retention.

## Next Build Step

Create the first Hexaship sandbox method that accepts `recipientId`, `parcelProfileRef`, and `servicePreference`, then returns a local `ShipmentIntent` without contacting DHL, UPS, or any production carrier.
