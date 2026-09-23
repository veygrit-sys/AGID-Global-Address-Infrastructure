import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  createHexashipClient,
  createHexashipFetchTransport,
  createHexashipMerchantOnboardingFetchClient,
  createHexashipMvpV01FetchClient,
  createHexashipMvpV01SandboxClient,
  createSkipshipClient,
  HEXASHIP_JS_ALIAS,
  HexashipApiError,
  HexashipMvpV01HttpError,
  HexashipMvpV01SandboxError,
  preflightHexashipMvpV01Shipment,
} from '../src';
import { handleSkipshipMockRequest } from '../../../src/lib/deliveryGatewayCarrierApi';

const aliasMigrationFixture = JSON.parse(
  readFileSync(join('sdk/hexaship-js/fixtures', 'hexaship-alias-migration-v0.1.json'), 'utf8'),
) as {
  fixtureId: string;
  legacyImport: { packageName: string; clientFactory: string };
  hexashipImport: { packageName: string; clientFactory: string };
  unchangedContracts: string[];
  sampleShipmentRequest: Parameters<ReturnType<typeof createHexashipClient>['createShipment']>[0];
  privacy: {
    localOnly: boolean;
    productionTraffic: boolean;
    rawAddressFixtures: boolean;
    blockedMaterial: string[];
  };
  nonClaims: string[];
};

const merchantOnboardingFixture = JSON.parse(
  readFileSync(join('docs/specs/fixtures', 'merchant-console-onboarding-v0.1.json'), 'utf8'),
) as {
  request: Parameters<ReturnType<typeof createHexashipMerchantOnboardingFetchClient>['createOnboarding']>[0];
};

test('@hexaship/js exposes Hexaship names while retaining Skipship compatibility exports', () => {
  assert.equal(HEXASHIP_JS_ALIAS.packageName, '@hexaship/js');
  assert.equal(HEXASHIP_JS_ALIAS.reexportsPackage, '@skipship/js');
  assert.equal(HEXASHIP_JS_ALIAS.compatibility, 'non-breaking-alias');
  assert.equal(HEXASHIP_JS_ALIAS.legacyExportsRetained, true);
  assert.equal(HEXASHIP_JS_ALIAS.productionTraffic, false);
  assert.equal(HEXASHIP_JS_ALIAS.rawAddressFixtures, false);
  assert.equal(createHexashipClient, createSkipshipClient);
});

test('@hexaship/js createHexashipClient round-trips through the existing safe sandbox facade', async () => {
  const client = createHexashipClient({
    baseUrl: 'https://hexaship.local',
    publishableKey: 'pk_test_hexaship_alias',
    transport: async request => {
      const response = handleSkipshipMockRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        headers: request.headers,
        body: request.body as Record<string, unknown>,
      });
      return {
        status: response.status,
        body: response.body,
      };
    },
  });

  const shipment = await client.createShipment({
    recipientId: 'ship_recipient_synthetic_hexaship_001',
    addressFormVersion: 'wallet_country_form_ref_synthetic_hexaship_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'consent_synthetic_hexaship_001',
    servicePreference: 'cheapest',
  });

  assert.equal(shipment.status, 'sandbox_label_ready');
  assert.equal(shipment.productionTraffic, false);
  assert.equal(shipment.rawAddressFixtures, false);
  assert.match(shipment.safeRefs.labelRef, /^label_[0-9a-f]{24}$/);
});

test('@hexaship/js preserves Skipship safety rejection and structured errors', async () => {
  const client = createHexashipClient({
    baseUrl: 'https://hexaship.local',
    publishableKey: '',
    transport: createHexashipFetchTransport(async () => ({
      status: 401,
      async json() {
        return { ok: false, error: 'auth_required' };
      },
    })),
  });

  await assert.rejects(
    () => client.createShipment({
      recipientId: 'ship_recipient_synthetic_hexaship_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
      walletConsentRef: 'consent_synthetic_hexaship_001',
      rawAddress: 'blocked',
    } as Parameters<typeof client.createShipment>[0]),
    /Unsafe Skipship createShipment payload keys: rawAddress/,
  );

  await assert.rejects(
    () => client.createShipment({
      recipientId: 'ship_recipient_synthetic_hexaship_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
      walletConsentRef: 'consent_synthetic_hexaship_001',
    }),
    (error: unknown) => {
      assert.ok(error instanceof HexashipApiError);
      assert.equal(error.message, 'Skipship createShipment failed with status 401');
      return true;
    },
  );
});

test('@hexaship/js exposes the Hexaship MVP v0.1 local orchestration client', async () => {
  const client = createHexashipMvpV01SandboxClient();

  const shipment = await client.createShipment({
    merchantRef: 'merchant_ref_sdk_mvp_001',
    ecOrderRef: 'ec_order_ref_sdk_mvp_001',
    recipientId: 'aw_rec_friend_sdk_mvp_001',
    addressFormVersion: 'wallet_country_form_ref_sdk_mvp_001',
    parcelProfileRef: 'parcel_profile_ref_sdk_box_001',
    walletConsentRef: 'wallet_consent_ref_sdk_mvp_001',
    carrierCapabilityRef: 'carrier_capability_sdk_mvp_001',
    selectionMode: 'fastest',
    selectedBy: 'user',
    requestedAt: '2026-07-04T17:35:12.868Z',
  });

  assert.equal(shipment.flow, 'hexaship-mvp-v0.1');
  assert.equal(shipment.selection.selectionMode, 'fastest');
  assert.equal(shipment.selection.selectedCarrier, 'dhl');
  assert.equal(shipment.capability.carrierCapabilityRef, 'carrier_capability_sdk_mvp_001');
  assert.equal(shipment.recipientResolution.containsRawAddress, false);
  assert.equal(shipment.label.status, 'label_created');
  assert.equal(shipment.tracking.status, 'in_transit');
  assert.equal(shipment.webhookLedger.some(entry => entry.eventType === 'shipment.in_transit'), true);
  assert.equal(shipment.privacy.rawAddressStored, false);
  assert.equal(shipment.productionTraffic, false);
});

test('@hexaship/js exposes local MVP preflight before createShipment', () => {
  const capabilityCheck = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_sdk_preflight_001',
    ecOrderRef: 'ec_order_ref_sdk_preflight_001',
    recipientId: 'aw_rec_friend_sdk_preflight_001',
    parcelProfileRef: 'parcel_profile_ref_sdk_preflight_001',
    walletConsentRef: 'wallet_consent_ref_sdk_preflight_001',
    selectionMode: 'fastest',
  });
  const ready = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_sdk_preflight_002',
    ecOrderRef: 'ec_order_ref_sdk_preflight_002',
    recipientId: 'aw_rec_friend_sdk_preflight_002',
    addressFormVersion: 'wallet_country_form_ref_sdk_preflight_002',
    parcelProfileRef: 'parcel_profile_ref_sdk_preflight_002',
    walletConsentRef: 'wallet_consent_ref_sdk_preflight_002',
    carrierCapabilityRef: 'carrier_capability_sdk_preflight_002',
    selectionMode: 'fastest',
  });

  assert.equal(capabilityCheck.ok, false);
  assert.equal(capabilityCheck.requiredNextAction, 'run_carrier_capability_preflight');
  assert.deepEqual(capabilityCheck.missingCarrierRefs, ['carrierCapabilityRef']);
  assert.equal(ready.ok, true);
  assert.equal(ready.requiredNextAction, 'call_hexaship_createShipment');
  assert.equal(ready.safeInputRefs.addressFormVersion, 'wallet_country_form_ref_sdk_preflight_002');
  assert.equal(ready.safety.productionTraffic, false);
  assert.equal(ready.safety.privateMaterialExposed, false);
});

test('@hexaship/js MVP v0.1 local client supports EC-selected cheapest carrier allocation', async () => {
  const client = createHexashipMvpV01SandboxClient();

  const shipment = await client.createShipment({
    merchantRef: 'merchant_ref_sdk_mvp_002',
    ecOrderRef: 'ec_order_ref_sdk_mvp_002',
    recipientId: 'aw_rec_self_sdk_mvp_002',
    parcelProfileRef: 'parcel_profile_ref_sdk_box_002',
    walletConsentRef: 'wallet_consent_ref_sdk_mvp_002',
    carrierCapabilityRef: 'carrier_capability_sdk_mvp_002',
    selectionMode: 'cheapest',
    selectedBy: 'ec',
  });
  const selectedRate = shipment.candidates.find(candidate => candidate.rateRef === shipment.selection.selectedRateRef);

  assert.equal(shipment.selection.selectedBy, 'ec');
  assert.equal(shipment.selection.selectedCarrier, 'ups');
  assert.equal(selectedRate?.priceMinor, Math.min(...shipment.candidates.map(candidate => candidate.priceMinor)));
});

test('@hexaship/js MVP v0.1 local client rejects raw address and carrier private material', async () => {
  const client = createHexashipMvpV01SandboxClient();

  await assert.rejects(
    () => client.createShipment({
      merchantRef: 'merchant_ref_sdk_mvp_003',
      ecOrderRef: 'ec_order_ref_sdk_mvp_003',
      recipientId: 'aw_rec_friend_sdk_mvp_003',
      parcelProfileRef: 'parcel_profile_ref_sdk_box_003',
      walletConsentRef: 'wallet_consent_ref_sdk_mvp_003',
      carrierCapabilityRef: 'carrier_capability_sdk_mvp_003',
      selectionMode: 'fastest',
      rawAddress: 'blocked',
      carrierApiKey: 'blocked',
    } as Parameters<typeof client.createShipment>[0]),
    (error: unknown) => {
      assert.ok(error instanceof HexashipMvpV01SandboxError);
      assert.equal(error.response.error, 'private_material_rejected');
      assert.deepEqual(error.response.rejectedKeys?.sort(), ['carrierApiKey', 'rawAddress']);
      return true;
    },
  );
});

test('@hexaship/js MVP v0.1 fetch client posts to the HTTP sandbox route with idempotency', async () => {
  const captured: Array<{ url: string; headers: Record<string, string>; body: unknown }> = [];
  const client = createHexashipMvpV01FetchClient({
    baseUrl: 'https://hexaship.local/',
    publishableKey: 'pk_test_hexaship_mvp',
    fetchImpl: async (url, init) => {
      captured.push({
        url,
        headers: init.headers,
        body: JSON.parse(init.body) as unknown,
      });
      return {
        status: 201,
        async json() {
          return {
            ok: true,
            version: 'hexaship-delivery-gateway-v0.1',
            flow: 'hexaship-mvp-v0.1',
            ecOrderRef: 'ec_order_ref_sdk_http_001',
            recipientResolution: {
              recipientId: 'aw_rec_friend_sdk_http_001',
              addressResolutionRef: 'hx_address_resolution_demo',
              walletConsentRef: 'wallet_consent_ref_sdk_http_001',
              containsRawAddress: false,
            },
            capability: {
              carrierCapabilityRef: 'carrier_capability_sdk_http_001',
              requiredNextAction: 'getRates',
              localOnly: true,
            },
            shipment: { shipmentRef: 'hx_ship_demo', status: 'created' },
            candidates: [],
            selection: {
              selectionMode: 'fastest',
              selectedBy: 'user',
              selectedCarrier: 'dhl',
              selectedRateRef: 'hx_rate_demo',
              decisionRef: 'hx_carrier_decision_demo',
            },
            label: {
              labelRef: 'hx_label_demo',
              waybillAlias: 'hx_waybill_demo',
              trackingAlias: 'hx_track_demo',
              labelQrCommitment: 'hx_labelqr_cmt_demo',
              status: 'label_created',
            },
            tracking: {
              trackingAlias: 'hx_track_demo',
              trackingReceiptRef: 'hx_tracking_receipt_demo',
              status: 'in_transit',
            },
            webhookLedger: [],
            privacy: {
              rawAddressStored: false,
              recipientContactStored: false,
              carrierCredentialsAcceptedFromClient: false,
              rawCarrierPayloadStored: false,
            },
            localOnly: true,
            productionTraffic: false,
            nonClaims: [],
          };
        },
      };
    },
  });

  const shipment = await client.createShipment({
    merchantRef: 'merchant_ref_sdk_http_001',
    ecOrderRef: 'ec_order_ref_sdk_http_001',
    recipientId: 'aw_rec_friend_sdk_http_001',
    addressFormVersion: 'wallet_country_form_ref_sdk_http_001',
    parcelProfileRef: 'parcel_profile_ref_sdk_http_001',
    walletConsentRef: 'wallet_consent_ref_sdk_http_001',
    carrierCapabilityRef: 'carrier_capability_sdk_http_001',
    selectionMode: 'fastest',
    selectedBy: 'user',
  }, { idempotencyKey: 'idem_hexaship_sdk_http_001' });

  assert.equal(captured[0].url, 'https://hexaship.local/v1/hexaship/mvp-v0.1/shipments');
  assert.equal(captured[0].headers.authorization, 'Bearer pk_test_hexaship_mvp');
  assert.equal(captured[0].headers['idempotency-key'], 'idem_hexaship_sdk_http_001');
  assert.equal((captured[0].body as { recipientId: string }).recipientId, 'aw_rec_friend_sdk_http_001');
  assert.equal((captured[0].body as { addressFormVersion: string }).addressFormVersion, 'wallet_country_form_ref_sdk_http_001');
  assert.equal((captured[0].body as { carrierCapabilityRef: string }).carrierCapabilityRef, 'carrier_capability_sdk_http_001');
  assert.equal(shipment.flow, 'hexaship-mvp-v0.1');
  assert.equal(shipment.selection.selectedCarrier, 'dhl');
  assert.equal(shipment.privacy.rawAddressStored, false);
});

test('@hexaship/js MVP v0.1 fetch client exposes structured HTTP errors', async () => {
  const client = createHexashipMvpV01FetchClient({
    baseUrl: 'https://hexaship.local',
    publishableKey: '',
    fetchImpl: async () => ({
      status: 401,
      async json() {
        return { ok: false, error: 'auth_required' };
      },
    }),
  });

  await assert.rejects(
    () => client.createShipment({
      merchantRef: 'merchant_ref_sdk_http_002',
      ecOrderRef: 'ec_order_ref_sdk_http_002',
      recipientId: 'aw_rec_friend_sdk_http_002',
      parcelProfileRef: 'parcel_profile_ref_sdk_http_002',
      walletConsentRef: 'wallet_consent_ref_sdk_http_002',
      carrierCapabilityRef: 'carrier_capability_sdk_http_002',
      selectionMode: 'cheapest',
      selectedBy: 'ec',
    }),
    (error: unknown) => {
      assert.ok(error instanceof HexashipMvpV01HttpError);
      assert.equal(error.status, 401);
      assert.deepEqual(error.body, { ok: false, error: 'auth_required' });
      return true;
    },
  );
});

test('@hexaship/js merchant onboarding fetch client posts safe Wallet boundary refs with idempotency', async () => {
  const captured: Array<{ url: string; headers: Record<string, string>; body: unknown }> = [];
  const client = createHexashipMerchantOnboardingFetchClient({
    baseUrl: 'https://hexaship.local/',
    publishableKey: 'pk_test_hexaship_onboarding',
    fetchImpl: async (url, init) => {
      captured.push({
        url,
        headers: init.headers,
        body: JSON.parse(init.body) as unknown,
      });
      return {
        status: 201,
        async json() {
          return {
            ok: true,
            status: 201,
            onboardingRef: 'merchant_onboarding_ref_1234567890abcdef12345678',
            merchantRef: 'merchant_1234567890abcdef12345678',
            safeOutputRefs: ['merchantRef', 'addressFormVersionRef'],
            requiredNextAction: 'run_sandbox_shipment',
            walletBoundary: {
              addressFormVersionRef: 'wallet_country_form_ref_us_en_v1',
              carrierSpecificAddressShapeBlocked: true,
              rawAddressVisibleToEc: false,
              carrierSpecificAddressShapeCollectedByEc: false,
            },
            blockedMaterial: ['rawAddress', 'carrierApiKey', 'rawCarrierPayload'],
            localOnly: true,
            productionTraffic: false,
          };
        },
      };
    },
  });

  const result = await client.createOnboarding(merchantOnboardingFixture.request, {
    idempotencyKey: 'idem_hexaship_merchant_onboarding_001',
  });
  const body = captured[0].body as {
    addressWalletSettings: {
      addressFormVersionRef: string;
      carrierSpecificAddressShapeBlocked: boolean;
    };
  };

  assert.equal(captured[0].url, 'https://hexaship.local/v1/merchant-console/onboarding');
  assert.equal(captured[0].headers.authorization, 'Bearer pk_test_hexaship_onboarding');
  assert.equal(captured[0].headers['idempotency-key'], 'idem_hexaship_merchant_onboarding_001');
  assert.equal(body.addressWalletSettings.addressFormVersionRef, 'wallet_country_form_ref_us_en_v1');
  assert.equal(body.addressWalletSettings.carrierSpecificAddressShapeBlocked, true);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('onboarding fixture should be accepted');
  assert.equal(result.walletBoundary.rawAddressVisibleToEc, false);
  assert.equal(result.walletBoundary.carrierSpecificAddressShapeCollectedByEc, false);
  assert.equal(result.productionTraffic, false);
});

test('@hexaship/js merchant onboarding fetch client exposes structured HTTP errors', async () => {
  const client = createHexashipMerchantOnboardingFetchClient({
    baseUrl: 'https://hexaship.local',
    publishableKey: 'pk_test_hexaship_onboarding',
    fetchImpl: async () => ({
      status: 400,
      async json() {
        return {
          ok: false,
          error: 'missing_wallet_form_boundary',
          missingRefs: ['addressWalletSettings.addressFormVersionRef'],
        };
      },
    }),
  });

  await assert.rejects(
    () => client.createOnboarding({
      addressWalletSettings: {
        addressFormVersionRef: 'form_ref_missing_prefix_001',
        carrierSpecificAddressShapeBlocked: false,
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof HexashipMvpV01HttpError);
      assert.equal(error.status, 400);
      assert.deepEqual(error.body, {
        ok: false,
        error: 'missing_wallet_form_boundary',
        missingRefs: ['addressWalletSettings.addressFormVersionRef'],
      });
      return true;
    },
  );
});

test('@hexaship/js migration fixture documents a redacted non-breaking alias path', async () => {
  assert.equal(aliasMigrationFixture.fixtureId, 'hexaship-alias-migration-v0.1');
  assert.equal(aliasMigrationFixture.legacyImport.packageName, '@skipship/js');
  assert.equal(aliasMigrationFixture.legacyImport.clientFactory, 'createSkipshipClient');
  assert.equal(aliasMigrationFixture.hexashipImport.packageName, '@hexaship/js');
  assert.equal(aliasMigrationFixture.hexashipImport.clientFactory, 'createHexashipClient');
  assert.ok(aliasMigrationFixture.unchangedContracts.includes('skipship-idempotency-key'));
  assert.equal(aliasMigrationFixture.privacy.localOnly, true);
  assert.equal(aliasMigrationFixture.privacy.productionTraffic, false);
  assert.equal(aliasMigrationFixture.privacy.rawAddressFixtures, false);
  assert.ok(aliasMigrationFixture.privacy.blockedMaterial.includes('productionCredential'));
  assert.ok(aliasMigrationFixture.nonClaims.some(nonClaim => /not a trademark clearance result/i.test(nonClaim)));

  const client = createHexashipClient({
    baseUrl: 'https://hexaship.local',
    publishableKey: 'pk_test_hexaship_alias',
    transport: async request => {
      const response = handleSkipshipMockRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        headers: request.headers,
        body: request.body as Record<string, unknown>,
      });
      return {
        status: response.status,
        body: response.body,
      };
    },
  });
  const shipment = await client.createShipment(aliasMigrationFixture.sampleShipmentRequest);
  const fixtureText = JSON.stringify(aliasMigrationFixture);

  assert.equal(shipment.productionTraffic, false);
  assert.equal(shipment.rawAddressFixtures, false);
  assert.equal(aliasMigrationFixture.sampleShipmentRequest.addressFormVersion, 'wallet_country_form_ref_synthetic_hexaship_001');
  assert.doesNotMatch(fixtureText, /rawAddressValue|recipient_phone_value|carrier_secret_value|proof_witness_value|private_key_value|productionCredentialValue/);
});
