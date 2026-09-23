# Hexaship JS

Compatibility alias package for the Hexaship shipping infrastructure SDK.

Hexaship is the proposed product-facing brand. During the migration window,
this package re-exports the existing `@skipship/js` client instead of changing
routes, headers, fixtures, or safety behavior.

```ts verified:primary
import {
  createHexashipClient,
  type HexashipShipmentCreateResult,
  type HexashipTransport,
} from "@hexaship/js";

const syntheticShipment: HexashipShipmentCreateResult = {
  shipmentId: "shipment_synthetic_readme_001",
  apiVersion: "delivery-gateway-carrier-api-v0.1",
  developerCall: "shipping.createShipment",
  status: "sandbox_label_ready",
  servicePreference: "cheapest",
  carrierAlias: "sandbox-carrier",
  recipientId: "ship_recipient_synthetic_001",
  safeRefs: {
    rateRef: "rate_synthetic_readme_001",
    allocationRef: "allocation_synthetic_readme_001",
    labelRef: "label_synthetic_readme_001",
    trackingReceiptRef: "tracking_synthetic_readme_001",
    deliveryProofRef: "proof_synthetic_readme_001",
  },
  webhookEvents: ["shipment.created"],
  blockedMaterial: [],
  localOnly: true,
  productionTraffic: false,
  rawAddressFixtures: false,
  nonClaims: ["README sample only"],
  validationErrors: [],
};

const transport: HexashipTransport = async <T>() => ({
  status: 200,
  body: syntheticShipment as T,
});

const hexaship = createHexashipClient({
  baseUrl: "https://hexaship.local",
  publishableKey: "pk_test_synthetic",
  transport,
});

const shipment = await hexaship.createShipment({
  recipientId: "ship_recipient_synthetic_001",
  addressFormVersion: "wallet_country_form_ref_synthetic_001",
  parcelProfileRef: "parcel_profile_synthetic_small_box_001",
  walletConsentRef: "consent_synthetic_hexaship_001",
  servicePreference: "cheapest",
});
```

## Compatibility

- `createHexashipClient` aliases `createSkipshipClient`.
- `createHexashipFetchTransport` aliases `createSkipshipFetchTransport`.
- Existing `createSkipshipClient` exports remain available.
- Existing `skipship-*` HTTP headers and `/v1/...` routes are unchanged.

Migration example:

```ts verified:migration
import {
  createHexashipClient,
  createSkipshipClient,
  type HexashipShipmentCreateRequest,
  type HexashipTransport,
} from "@hexaship/js";

const transport: HexashipTransport = async <T>() => ({
  status: 200,
  body: {
    shipmentId: "shipment_synthetic_migration_001",
    apiVersion: "delivery-gateway-carrier-api-v0.1",
    developerCall: "shipping.createShipment",
    status: "sandbox_label_ready",
    servicePreference: "balanced",
    carrierAlias: "sandbox-carrier",
    recipientId: "ship_recipient_synthetic_migration_001",
    safeRefs: {
      rateRef: "rate_synthetic_migration_001",
      allocationRef: "allocation_synthetic_migration_001",
      labelRef: "label_synthetic_migration_001",
      trackingReceiptRef: "tracking_synthetic_migration_001",
      deliveryProofRef: "proof_synthetic_migration_001",
    },
    webhookEvents: ["shipment.created"],
    blockedMaterial: [],
    localOnly: true,
    productionTraffic: false,
    rawAddressFixtures: false,
    nonClaims: ["migration sample only"],
    validationErrors: [],
  } as T,
});

const options = {
  baseUrl: "https://hexaship.local",
  publishableKey: "pk_test_synthetic",
  transport,
};

const request: HexashipShipmentCreateRequest = {
  recipientId: "ship_recipient_synthetic_migration_001",
  addressFormVersion: "wallet_country_form_ref_synthetic_migration_001",
  parcelProfileRef: "parcel_profile_synthetic_migration_001",
  walletConsentRef: "consent_synthetic_migration_001",
};

const skipship = createSkipshipClient(options);
const hexaship = createHexashipClient(options);

await skipship.createShipment(request);
await hexaship.createShipment(request);
```

The SDK still only accepts references. Raw address text, recipient contact
material, carrier credentials, raw labels, private keys, and proof secrets are
rejected before transport.

## MVP v0.1 Preflight

`preflightHexashipMvpV01Shipment()` lets an EC plugin check the local create-shipment readiness before calling the sandbox orchestration.

```ts example:mvp-preflight
import { preflightHexashipMvpV01Shipment } from "@hexaship/js";

const preflight = preflightHexashipMvpV01Shipment({
  merchantRef: "merchant_ref_demo",
  ecOrderRef: "ec_order_ref_demo",
  recipientId: "aw_rec_friend_demo",
  addressFormVersion: "wallet_country_form_ref_demo",
  parcelProfileRef: "parcel_profile_ref_demo",
  walletConsentRef: "wallet_consent_ref_demo",
});

if (preflight.requiredNextAction === "run_carrier_capability_preflight") {
  // Ask the server-side connector layer for a carrierCapabilityRef.
}
```

The preflight result contains only refs, missing key names, and next actions.
`addressFormVersion` is an Address Wallet form-version ref that lets EC plugins
confirm which familiar country form was used before carrier label mapping. It
does not expose a recipient address or call DHL/UPS production APIs.

## Merchant Onboarding

`createHexashipMerchantOnboardingFetchClient()` calls the sandbox
`POST /v1/merchant-console/onboarding` route with the same test key and
idempotency style as shipment creation.

```ts example:merchant-onboarding
import { createHexashipMerchantOnboardingFetchClient } from "@hexaship/js";

const onboarding = createHexashipMerchantOnboardingFetchClient({
  baseUrl: "https://hexaship.local",
  publishableKey: "pk_test_synthetic",
});

await onboarding.createOnboarding({
  merchantAccount: {
    displayName: "Synthetic Demo Store",
    adminUserRef: "admin_user_ref_synthetic_001",
    businessProfileRef: "business_profile_ref_synthetic_001",
    billingProfileRef: "billing_profile_ref_synthetic_001",
    twoFactorEnabled: true,
  },
  storeEcPlatform: {
    storeRef: "store_ref_synthetic_001",
    platformStoreRef: "platform_store_ref_synthetic_shopify_like_001",
    platform: "shopify-like",
    orderSchemaRef: "order_schema_ref_synthetic_001",
  },
  shippingPreferences: {
    carrierPolicyRef: "carrier_policy_ref_synthetic_dhl_ups_001",
    enabledCarriers: ["dhl", "ups"],
    selectionRule: "cheapest",
    parcelProfileRefs: ["parcel_profile_ref_small_box"],
  },
  addressWalletSettings: {
    walletPolicyRef: "wallet_policy_ref_synthetic_001",
    recipientApprovalPolicyRef: "recipient_approval_policy_ref_required_001",
    addressFormVersionRef: "wallet_country_form_ref_us_en_v1",
    carrierSpecificAddressShapeBlocked: true,
    hideAddressFromBuyer: true,
    friendDeliveryEnabled: true,
    addressWalletLoginEnabled: true,
    qrRailPolicyRef: "qr_rail_policy_ref_synthetic_001",
  },
  apiKeysAndWebhooks: {
    apiKeySetRef: "api_key_set_ref_test_only_001",
    testPublishableKeyRef: "pk_test_ref_synthetic_001",
    testSecretKeyRef: "sk_test_ref_synthetic_001",
    webhookEndpointRef: "webhook_endpoint_ref_synthetic_001",
    webhookEventRefs: ["webhook_event_ref_shipment_created"],
    productionReviewRef: "production_review_ref_pending_001",
  },
}, { idempotencyKey: "idem_merchant_onboarding_demo_001" });
```

This helper still only sends refs. It does not send raw recipient address text,
recipient phone numbers, DHL/UPS credentials, raw carrier payloads, or webhook
secrets.

## Fixtures

The alias migration fixture is redacted and local-only:

```text
fixtures/hexaship-alias-migration-v0.1.json
```

It is also available through the package export map:

```ts example:fixture-export
import aliasMigrationFixture from "@hexaship/js/fixtures/hexaship-alias-migration-v0.1.json" with { type: "json" };
```

Run:

```bash
npm run verify:hexaship-js
npm run verify:hexaship-package
```

`verify:hexaship-package` builds the package, runs `npm pack --dry-run`,
installs the generated tarball into a temporary local consumer project, and
checks that `import { createHexashipClient } from "@hexaship/js"` works without
production traffic. It also runs a TypeScript consumer smoke test for
`HexashipClient`, `HexashipShipmentCreateRequest`, `HexashipTransport`, and the
redacted fixture JSON export. The primary README TypeScript sample is extracted
and typechecked as part of the same gate. The migration example is also
typechecked to keep the legacy `createSkipshipClient` alias working. README
code fences must be tagged as `verified:primary`, `verified:migration`, or an
explicit `example:*` block so verification coverage stays intentional.
