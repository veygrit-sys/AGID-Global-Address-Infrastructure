import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';

import {
  MERCHANT_CONSOLE_CLIPBOARD_FORBIDDEN_VALUE_MARKERS,
  MERCHANT_CONSOLE_EC_PLUGIN_VERSION,
  auditMerchantConsoleClipboardRedaction,
  buildMerchantConsoleClipboardRedactionAudit,
  buildMerchantConsoleClipboardRedactionAuditCandidates,
  buildMerchantConsoleLocalHexashipIdempotencyLedgerRows,
  buildMerchantConsoleLocalHexashipLedgerLayoutAudit,
  buildMerchantConsoleLocalHexashipWebhookReplayFixture,
  buildMerchantConsoleLocalHexashipReplayPreview,
  buildMerchantConsoleLocalHexashipRequestFixtureCopyText,
  buildMerchantConsoleLocalHexashipRequestFixture,
  buildMerchantConsoleLocalHexashipIdempotencyKey,
  buildMerchantConsoleCarrierCapabilityPreflight,
  buildMerchantConsoleGuidedShipmentStep,
  buildMerchantConsoleMerchantOnboardingFixtureContract,
  buildMerchantConsoleOnboardingOpenApiContractCopyPayload,
  buildMerchantConsoleOnboardingOpenApiContractStatus,
  buildMerchantConsoleCallbackPreflightNegativeFixture,
  buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText,
  buildMerchantConsoleCallbackPreflightRepairActions,
  buildMerchantConsoleMerchantOnboardingSdkCopyPayload,
  buildMerchantConsoleMerchantOnboardingSdkSnippet,
  buildMerchantConsoleEcPluginPlan,
  buildMerchantConsoleRedactedShipmentRows,
  buildMerchantConsoleVeyIdAdoptionCheck,
  createMerchantConsoleOnboardingMock,
  evaluateMerchantShipmentCreationReadiness,
  upsertMerchantConsoleLocalHexashipShipmentRecord,
  validateMerchantConsoleClipboardRedactionAudit,
  validateMerchantConsoleEcPluginPlan,
} from './merchantConsoleEcPlugin';
import {
  buildDeliveryGatewayCarrierApiRegistry,
  DELIVERY_GATEWAY_CARRIER_API_VERSION,
} from './deliveryGatewayCarrierApi';
import { runHexashipMvpV01Sandbox } from './hexashipDeliveryGateway';

test('Merchant Console / EC Plugin plan validates as a Shopify-style shipping admin surface', () => {
  const plan = buildMerchantConsoleEcPluginPlan();

  assert.equal(plan.version, MERCHANT_CONSOLE_EC_PLUGIN_VERSION);
  assert.equal(plan.productName, 'Merchant Console / EC Plugin');
  assert.deepEqual(validateMerchantConsoleEcPluginPlan(plan), []);
  assert.match(plan.thesis, /Shopify-like operations/);
  assert.equal(plan.redactionPolicy.addressVisibleByDefault, false);
});

test('Stripe-like EC onboarding covers four integration modes and five setup steps', () => {
  const plan = buildMerchantConsoleEcPluginPlan();

  assert.deepEqual(plan.integrationModes.map(mode => mode.id), [
    'hosted-checkout-widget',
    'rest-api',
    'sdk',
    'plugin',
  ]);
  assert.deepEqual(plan.onboardingSteps.map(step => step.id), [
    'merchant-account',
    'store-ec-platform',
    'shipping-preferences',
    'address-wallet-settings',
    'api-keys-webhooks',
  ]);
  assert.ok(plan.integrationModes.every(mode => mode.requiredRefs.includes('merchantRef')));
  assert.ok(plan.integrationModes.every(mode => mode.blockedMaterial.includes('rawAddress')));
  assert.ok(plan.onboardingSteps.every(step => step.safeOutputRefs.every(ref => ref.endsWith('Ref') || ref.endsWith('Refs'))));
  assert.ok(plan.onboardingSteps.every(step => step.blockedMaterial.includes('carrierApiKey')));
  assert.match(plan.onboardingSteps.find(step => step.id === 'merchant-account')?.completionGate ?? '', /2fa/i);
  assert.match(plan.onboardingSteps.find(step => step.id === 'api-keys-webhooks')?.completionGate ?? '', /test_shipment/);
});

test('Merchant Console lets EC merchants choose Playlist Commerce, EC Social Login, or both without mixing roles', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const choices = new Map(plan.commerceIntegrationChoices.map(choice => [choice.id, choice]));
  const playlist = choices.get('playlist-commerce');
  const ecSocialLogin = choices.get('ec-social-login');
  const both = choices.get('both');

  assert.deepEqual(plan.commerceIntegrationChoices.map(choice => choice.id), [
    'playlist-commerce',
    'ec-social-login',
    'both',
  ]);
  assert.equal(playlist?.title, 'Playlist Commerce');
  assert.deepEqual(playlist?.installTargets, ['veygrit-app']);
  assert.deepEqual(playlist?.startPoints, ['veygrit']);
  assert.deepEqual(playlist?.productQuestions, ['which-ec-to-use']);
  assert.equal(playlist?.loginButtonRequiredToShop, false);
  assert.equal(playlist?.continueWithVeygritRequired, false);
  assert.ok(playlist?.requiredSetupRefs.includes('playlistParticipationRef'));
  assert.ok(playlist?.merchantVisibleRefs.includes('storePreferenceAlias'));

  assert.equal(ecSocialLogin?.title, 'EC Social Login');
  assert.deepEqual(ecSocialLogin?.installTargets, ['merchant-ec-plugin-or-sdk']);
  assert.deepEqual(ecSocialLogin?.startPoints, ['merchant-ec-site']);
  assert.deepEqual(ecSocialLogin?.productQuestions, ['how-to-buy-at-that-ec']);
  assert.equal(ecSocialLogin?.loginButtonRequiredToShop, true);
  assert.equal(ecSocialLogin?.continueWithVeygritRequired, true);
  assert.ok(ecSocialLogin?.requiredSetupRefs.includes('addressLoginClientRef'));
  assert.ok(ecSocialLogin?.merchantVisibleRefs.includes('recipientId'));

  assert.equal(both?.title, 'Playlist Commerce + EC Social Login');
  assert.equal(both?.loginButtonRequiredToShop, 'mixed');
  assert.equal(both?.continueWithVeygritRequired, 'mixed');
  assert.ok(both?.installTargets.includes('veygrit-app'));
  assert.ok(both?.installTargets.includes('merchant-ec-plugin-or-sdk'));
  assert.ok(both?.requiredSetupRefs.includes('playlistParticipationRef'));
  assert.ok(both?.requiredSetupRefs.includes('addressLoginClientRef'));
  assert.ok(plan.validationGates.includes('npm run verify:skipship-strategy'));
  assert.doesNotMatch(JSON.stringify(plan.commerceIntegrationChoices), /rawAddressValue|recipientPhoneValue|privateKeyValue|proofSecretValue/);
});

test('onboarding fields encode merchant, EC platform, carrier, wallet, key, and webhook requirements', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const allFields = plan.onboardingSteps.flatMap(step => step.fieldGroups.flatMap(group => group.fields));
  const fieldById = new Map(allFields.map(field => [field.id, field]));

  for (const fieldId of [
    'displayName',
    'legalName',
    'storeUrl',
    'platform',
    'addressLoginClientRef',
    'addressLoginCallbackUrl',
    'enabledCarriers',
    'selectionRule',
    'addressWalletLoginEnabled',
    'friendDeliveryEnabled',
    'recipientApprovalRequired',
    'addressFormVersionRef',
    'carrierSpecificAddressShapeBlocked',
    'testSecretKeyRef',
    'webhookUrl',
    'webhookSigningSecretRef',
    'productionReviewSubmitted',
  ]) {
    assert.equal(fieldById.get(fieldId)?.required, true, `${fieldId} should be required`);
  }

  assert.ok(fieldById.get('platform')?.options?.includes('shopify'));
  assert.ok(fieldById.get('platform')?.options?.includes('woocommerce'));
  assert.ok(fieldById.get('platform')?.options?.includes('ec-cube'));
  assert.ok(fieldById.get('platform')?.options?.includes('custom-ec'));
  assert.ok(fieldById.get('enabledCarriers')?.options?.includes('dhl'));
  assert.ok(fieldById.get('enabledCarriers')?.options?.includes('ups'));
  assert.ok(fieldById.get('selectionRule')?.options?.includes('cheapest'));
  assert.ok(fieldById.get('selectionRule')?.options?.includes('fastest'));
  assert.equal(fieldById.get('testSecretKeyRef')?.secretHandling, 'server_side_only');
  assert.equal(fieldById.get('webhookSigningSecretRef')?.secretHandling, 'server_side_only');
  assert.equal(fieldById.get('addressLoginClientRef')?.secretHandling, 'ref_only');
  assert.equal(fieldById.get('addressFormVersionRef')?.secretHandling, 'ref_only');
  assert.equal(fieldById.get('addressLoginCallbackUrl')?.dataKind, 'store_profile');
  assert.equal(fieldById.get('carrierSpecificAddressShapeBlocked')?.dataKind, 'wallet_policy');
  assert.ok(plan.onboardingSteps.find(step => step.id === 'store-ec-platform')?.safeOutputRefs.includes('addressLoginClientRef'));
  assert.ok(plan.onboardingSteps.find(step => step.id === 'store-ec-platform')?.safeOutputRefs.includes('addressLoginCallbackPreflightRef'));
  assert.ok(plan.onboardingSteps.find(step => step.id === 'address-wallet-settings')?.safeOutputRefs.includes('addressFormVersionRef'));
});

test('API keys, webhooks, and production review gates stay Stripe-like but shipping-safe', () => {
  const plan = buildMerchantConsoleEcPluginPlan();

  assert.equal(plan.apiKeyPolicy.defaultMode, 'test');
  assert.equal(plan.apiKeyPolicy.serverSidePrimary, true);
  assert.equal(plan.apiKeyPolicy.publishableKeyScope, 'hosted_widget_only');
  assert.ok(plan.apiKeyPolicy.keyRefs.includes('test_secret_key_ref'));
  assert.ok(plan.apiKeyPolicy.keyRefs.includes('live_secret_key_ref'));
  assert.ok(plan.apiKeyPolicy.liveKeysBlockedUntil.includes('limited_production_approved'));
  assert.equal(plan.webhookSetup.requiredUrlScheme, 'https');
  assert.deepEqual(plan.webhookSetup.events, [
    'shipment.created',
    'rates.created',
    'label.created',
    'shipment.in_transit',
    'shipment.delivered',
    'shipment.failed',
    'return.created',
  ]);
  assert.equal(plan.webhookSetup.testSendButton, true);
  assert.equal(plan.webhookSetup.signatureSecretHandling, 'stored_as_ref_only');
  assert.ok(plan.productionReviewGates.every(gate => gate.required));
  assert.ok(plan.productionReviewGates.some(gate => gate.id === 'dhl-ups-account-linkage'));
  assert.ok(plan.productionReviewGates.some(gate => gate.id === 'incident-liability-boundary'));
});

test('EC createShipment example exposes refs only while Vey handles carrier allocation behind the gateway', () => {
  const plan = buildMerchantConsoleEcPluginPlan();

  assert.match(plan.ecCreateShipmentExample.sdkCall, /hexaship\.createShipment/);
  assert.match(plan.ecCreateShipmentExample.sdkCall, /recipientId/);
  assert.match(plan.ecCreateShipmentExample.sdkCall, /addressFormVersion/);
  assert.match(plan.ecCreateShipmentExample.sdkCall, /wallet_country_form_ref_xxx/);
  assert.match(plan.ecCreateShipmentExample.sdkCall, /parcelProfileRef/);
  assert.match(plan.ecCreateShipmentExample.sdkCall, /preference/);
  assert.deepEqual(plan.ecCreateShipmentExample.merchantVisibleRefs, ['recipientId', 'shipmentRef', 'labelRef', 'trackingAlias']);
  assert.ok(plan.ecCreateShipmentExample.hiddenBackendPipeline.includes('resolve_address_wallet_recipient_id'));
  assert.ok(plan.ecCreateShipmentExample.hiddenBackendPipeline.includes('verify_recipient_consent'));
  assert.ok(plan.ecCreateShipmentExample.hiddenBackendPipeline.includes('check_dhl_ups_capability'));
  assert.ok(plan.ecCreateShipmentExample.hiddenBackendPipeline.includes('allocate_cheapest_fastest_or_balanced_carrier'));
  assert.ok(plan.ecCreateShipmentExample.hiddenBackendPipeline.includes('notify_merchant_webhook'));
  assert.ok(plan.ecCreateShipmentExample.merchantHiddenMaterial.includes('rawAddress'));
  assert.ok(plan.ecCreateShipmentExample.merchantHiddenMaterial.includes('carrierApiKey'));
  assert.ok(plan.ecCreateShipmentExample.merchantHiddenMaterial.includes('rawCarrierPayload'));
  assert.doesNotMatch(JSON.stringify(plan.ecCreateShipmentExample.merchantVisibleRefs), /rawAddress|recipientPhone|carrierApiKey|proofSecret/);
});

test('Merchant onboarding SDK snippet uses Hexaship helper with safe Wallet refs only', () => {
  const snippet = buildMerchantConsoleMerchantOnboardingSdkSnippet();

  assert.match(snippet, /createHexashipMerchantOnboardingFetchClient/);
  assert.match(snippet, /createOnboarding/);
  assert.match(snippet, /idempotencyKey: 'idem_merchant_onboarding_demo_001'/);
  assert.match(snippet, /addressLoginClientRef: 'address_login_client_ref_synthetic_001'/);
  assert.match(snippet, /addressLoginCallbackUrl: 'https:\/\/merchant\.example\/veygrit\/callback'/);
  assert.match(snippet, /addressFormVersionRef: 'wallet_country_form_ref_us_en_v1'/);
  assert.match(snippet, /carrierSpecificAddressShapeBlocked: true/);
  assert.match(snippet, /enabledCarriers: \['dhl', 'ups'\]/);
  assert.doesNotMatch(snippet, /rawAddress|recipientPhone|carrierApiKey|carrierCredential|rawCarrierPayload|proofSecret|privateKey|webhookSecret/);
});

test('Merchant onboarding SDK copy payload keeps UI labels and clipboard text on one safe source', () => {
  const payload = buildMerchantConsoleMerchantOnboardingSdkCopyPayload();

  assert.equal(payload.label, 'Merchant onboarding SDK');
  assert.equal(payload.buttonLabel, 'Copy SDK');
  assert.equal(payload.successLabel, 'Copied SDK');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.equal(payload.clipboardText, buildMerchantConsoleMerchantOnboardingSdkSnippet());
  assert.match(payload.clipboardText, /createHexashipMerchantOnboardingFetchClient/);
  assert.match(payload.clipboardText, /idempotencyKey: 'idem_merchant_onboarding_demo_001'/);
  assert.match(payload.clipboardText, /addressLoginClientRef: 'address_login_client_ref_synthetic_001'/);
  assert.match(payload.clipboardText, /addressLoginCallbackUrl: 'https:\/\/merchant\.example\/veygrit\/callback'/);
  assert.match(payload.clipboardText, /addressFormVersionRef: 'wallet_country_form_ref_us_en_v1'/);
  assert.match(payload.clipboardText, /carrierSpecificAddressShapeBlocked: true/);
  assert.ok(payload.forbiddenPublicMaterial.includes('rawAddress'));
  assert.ok(payload.forbiddenPublicMaterial.includes('carrierApiKey'));
  assert.doesNotMatch(payload.clipboardText, /rawAddress|recipientPhone|carrierApiKey|carrierCredential|rawCarrierPayload|proofSecret|privateKey|webhookSecret/);
});

test('plugin profiles cover WooCommerce, EC-CUBE, Shopify-like, and custom EC SDKs', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const profiles = new Map(plan.pluginProfiles.map(profile => [profile.id, profile]));

  assert.equal(profiles.get('shopify-like')?.integrationMode, 'app-embed');
  assert.equal(profiles.get('woocommerce')?.integrationMode, 'wordpress-plugin');
  assert.equal(profiles.get('ec-cube')?.integrationMode, 'php-plugin');
  assert.equal(profiles.get('custom-ec')?.integrationMode, 'typescript-sdk');

  for (const profile of plan.pluginProfiles) {
    assert.ok(profile.requiredRefs.includes('recipient_id'));
    assert.ok(profile.requiredRefs.includes('carrierCapabilityRef'));
    assert.ok(profile.blockedStorage.includes('rawAddress'));
    assert.ok(profile.blockedStorage.includes('carrierApiKey'));
    assert.ok(profile.releaseGate.length >= 3);
  }
});

test('console surfaces expose carrier selection, shipment history, webhook history, settings, redaction policy, and Vey ID adoption', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const surfaces = new Map(plan.surfaces.map(surface => [surface.id, surface]));

  assert.ok(surfaces.get('carrier-selection')?.actions.includes('select-dhl'));
  assert.ok(surfaces.get('carrier-selection')?.actions.includes('select-ups'));
  assert.ok(surfaces.get('shipment-history')?.visibleColumns.includes('trackingAlias'));
  assert.ok(surfaces.get('webhook-history')?.visibleColumns.includes('attemptCount'));
  assert.ok(surfaces.get('plugin-settings')?.actions.includes('run-preflight'));
  assert.ok(surfaces.get('redaction-policy')?.hiddenByDefault.includes('selectedAddressBody'));
  assert.ok(surfaces.get('vey-id-adoption')?.actions.includes('run-vey-id-openapi-check'));
  assert.ok(surfaces.get('vey-id-adoption')?.visibleColumns.includes('verifierCommand'));
  assert.ok(surfaces.get('vey-id-adoption')?.hiddenByDefault.includes('providerIdToken'));

  for (const surface of plan.surfaces) {
    assert.ok(surface.hiddenByDefault.some(field => /raw|recipient|secret|proof|carrier/i.test(field)));
  }
});

test('Vey ID adoption check wires Google/Apple-only account creation to SDK and wallet revocation gates', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const check = buildMerchantConsoleVeyIdAdoptionCheck();

  assert.deepEqual(plan.veyIdAdoptionCheck, check);
  assert.equal(check.title, 'Vey ID Core adoption check');
  assert.equal(check.status, 'ready');
  assert.deepEqual(check.accountCreationProviders, ['google', 'apple']);
  assert.ok(check.requiredSdkPackages.includes('@veygrit/address-login-react'));
  assert.ok(check.requiredSdkPackages.includes('@veygrit/address-login-nextjs'));
  assert.ok(check.requiredSpecs.includes('docs/specs/veygrit-id-core.openapi.yaml'));
  assert.ok(check.requiredRoutes.includes('GET /veygrit/oauth/authorize'));
  assert.ok(check.requiredRoutes.includes('POST /veygrit/oauth/token'));
  assert.ok(check.requiredRoutes.includes('POST /veygrit/connections/revoke'));
  assert.ok(check.requiredControls.includes('google-apple-only-account-creation'));
  assert.ok(check.requiredControls.includes('pkce-s256-required'));
  assert.ok(check.requiredControls.includes('pairwise-subject-alias'));
  assert.ok(check.requiredControls.includes('address-wallet-credential-reuse'));
  assert.ok(check.requiredControls.includes('wallet-side-revocation'));
  assert.ok(check.merchantVisibleRefs.includes('authorizationCodeRef'));
  assert.ok(check.merchantVisibleRefs.includes('pairwiseSubjectAlias'));
  assert.ok(check.merchantVisibleRefs.includes('addressCredentialRef'));
  assert.ok(check.serverOnlyRefs.includes('pkceVerifierRef'));
  assert.ok(check.serverOnlyRefs.includes('accessTokenRef'));
  assert.ok(check.walletRevocationRefs.includes('revocationRef'));
  assert.ok(check.blockedMaterial.includes('providerIdToken'));
  assert.ok(check.blockedMaterial.includes('providerAccessToken'));
  assert.ok(check.blockedMaterial.includes('providerRefreshToken'));
  assert.ok(check.blockedMaterial.includes('rawProviderProfile'));
  assert.ok(check.blockedMaterial.includes('rawAddress'));
  assert.ok(check.verifierCommands.every(command => plan.validationGates.includes(command)));
  assert.equal(check.localOnly, true);
  assert.equal(check.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(check.merchantVisibleRefs), /rawAddress|providerIdToken|providerAccessToken|providerRefreshToken|rawProviderProfile|rawVeyIdToken|recipientPhone|privateKey|proofSecret/);
  assert.doesNotMatch(JSON.stringify(check), /sk_live|provider_id_token_value|provider_access_token_value|provider_refresh_token_value|rawAddressValue|privateKeyValue|proofSecretValue/);
});

test('carrier options include auto, DHL, UPS, and planned future carriers', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const carrierOptions = new Map(plan.carrierOptions.map(option => [option.carrier, option]));

  assert.equal(carrierOptions.get('auto')?.availableInMvp, true);
  assert.equal(carrierOptions.get('dhl')?.availableInMvp, true);
  assert.equal(carrierOptions.get('ups')?.availableInMvp, true);
  assert.equal(carrierOptions.get('fedex')?.availableInMvp, false);
  assert.equal(carrierOptions.get('yamato')?.availableInMvp, false);
  assert.equal(carrierOptions.get('japan-post')?.availableInMvp, false);
  assert.equal(carrierOptions.get('sf-express')?.availableInMvp, false);
  assert.ok(carrierOptions.get('auto')?.selectionModes.includes('fastest'));
  assert.ok(carrierOptions.get('auto')?.selectionModes.includes('cheapest'));
});

test('shipment and webhook history rows are redacted ref-only views', () => {
  const plan = buildMerchantConsoleEcPluginPlan();
  const shipmentRows = buildMerchantConsoleRedactedShipmentRows(plan.sampleShipmentHistory);

  assert.ok(shipmentRows.length >= 2);
  assert.ok(shipmentRows.every(row => row.recipientDisplayRef.startsWith('aw_rec_')));
  assert.ok(shipmentRows.every(row => row.carrierCapabilityRef.startsWith('carrier_capability_')));
  assert.ok(shipmentRows.every(row => row.blockedMaterial.includes('rawAddress')));
  assert.ok(plan.sampleWebhookHistory.every(row => row.eventRef.startsWith('webhook_event_ref_')));
  assert.ok(plan.sampleWebhookHistory.every(row => row.blockedMaterial.includes('rawWebhookPayload')));
  assert.doesNotMatch(JSON.stringify(shipmentRows.map(({ blockedMaterial: _blockedMaterial, ...row }) => row)), /rawAddress|recipientPhone|carrierApiKey|proofWitness/);
  assert.doesNotMatch(JSON.stringify(plan.sampleWebhookHistory.map(row => row.safeRefs)), /rawWebhookPayload|webhookSecret|rawAddress/);
});

test('shipment creation readiness blocks orders until Address Wallet and carrier preflights pass', () => {
  const ready = evaluateMerchantShipmentCreationReadiness({
    orderRef: 'order_ref_synthetic_ready_001',
    recipientDisplayRef: 'aw_rec_friend_synthetic_display_001',
    recipientId: 'ship_recipient_synthetic_001',
    addressFormVersion: 'wallet_country_form_ref_synthetic_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_001',
    carrierCapabilityRef: 'carrier_capability_synthetic_console_001',
    carrierAlias: 'dhl',
    servicePreference: 'fastest',
  });
  const missingCapability = evaluateMerchantShipmentCreationReadiness({
    orderRef: 'order_ref_synthetic_blocked_001',
    recipientDisplayRef: 'aw_rec_friend_synthetic_display_002',
    recipientId: 'ship_recipient_synthetic_002',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_002',
    walletConsentRef: 'wallet_consent_ref_synthetic_002',
    carrierAlias: 'ups',
    servicePreference: 'cheapest',
  });
  const missingWallet = evaluateMerchantShipmentCreationReadiness({
    orderRef: 'order_ref_synthetic_blocked_002',
    carrierAlias: 'auto',
    servicePreference: 'balanced',
  });

  assert.equal(ready.canCreateShipment, true);
  assert.equal(ready.status, 'ready_for_hexaship_createShipment');
  assert.equal(ready.nextStep, 'call_hexaship_createShipment');
  assert.equal(ready.gatewayPreflight.ok, true);
  assert.equal(ready.gatewayPreflight.requiredNextAction, 'call_hexaship_createShipment');
  assert.equal(ready.safeRefs.addressFormVersion, 'wallet_country_form_ref_synthetic_001');
  assert.equal(ready.servicePreference, 'fastest');
  assert.deepEqual(ready.disabledActions, []);
  assert.equal(missingCapability.canCreateShipment, false);
  assert.equal(missingCapability.status, 'blocked_missing_carrier_capability');
  assert.equal(missingCapability.nextStep, 'run_carrier_capability_preflight');
  assert.equal(missingCapability.gatewayPreflight.requiredNextAction, 'run_carrier_capability_preflight');
  assert.deepEqual(missingCapability.gatewayPreflight.missingCarrierRefs, ['carrierCapabilityRef']);
  assert.equal(missingCapability.servicePreference, 'cheapest');
  assert.ok(missingCapability.disabledActions.includes('create-shipment'));
  assert.deepEqual(missingCapability.missingRefs, ['carrierCapabilityRef']);
  assert.equal(missingWallet.status, 'blocked_missing_address_wallet_preflight');
  assert.equal(missingWallet.nextStep, 'run_address_wallet_preflight');
  assert.equal(missingWallet.gatewayPreflight.requiredNextAction, 'run_address_wallet_preflight');
  assert.ok(missingWallet.missingRefs.includes('recipientId'));
});

test('shipment creation readiness rejects private material before enabling shipment actions', () => {
  const unsafe = evaluateMerchantShipmentCreationReadiness({
    orderRef: 'order_ref_synthetic_unsafe_001',
    recipientId: 'ship_recipient_synthetic_003',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_003',
    walletConsentRef: 'wallet_consent_ref_synthetic_003',
    carrierCapabilityRef: 'carrier_capability_synthetic_console_003',
    rawAddress: 'blocked synthetic private material',
    nested: {
      carrierApiKey: 'blocked synthetic credential',
    },
  });

  assert.equal(unsafe.canCreateShipment, false);
  assert.equal(unsafe.status, 'blocked_private_material');
  assert.equal(unsafe.nextStep, 'remove_private_material');
  assert.equal(unsafe.gatewayPreflight.requiredNextAction, 'remove_private_material');
  assert.ok(unsafe.gatewayPreflight.rejectedKeys.includes('rawAddress'));
  assert.ok(unsafe.gatewayPreflight.rejectedKeys.includes('carrierApiKey'));
  assert.ok(unsafe.rejectedKeys.includes('rawAddress'));
  assert.ok(unsafe.rejectedKeys.includes('nested.carrierApiKey'));
  assert.doesNotMatch(JSON.stringify(unsafe.safeRefs), /rawAddress|carrierApiKey|recipientPhone|proofWitness|privateKey/);
  assert.equal(unsafe.gatewayPreflight.safety.productionTraffic, false);
  assert.equal(unsafe.gatewayPreflight.safety.privateMaterialExposed, false);
});

test('carrier capability preflight can repair a blocked Merchant Console order with safe refs', () => {
  const blocked = evaluateMerchantShipmentCreationReadiness({
    orderRef: 'order_ref_synthetic_capability_repair_001',
    recipientDisplayRef: 'aw_rec_friend_synthetic_display_repair_001',
    recipientId: 'ship_recipient_synthetic_repair_001',
    parcelProfileRef: 'parcel_profile_synthetic_repair_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_repair_001',
    servicePreference: 'cheapest',
  });
  const capability = buildMerchantConsoleCarrierCapabilityPreflight(blocked, 'us', 'ups');
  const dhlCapability = buildMerchantConsoleCarrierCapabilityPreflight(blocked, 'jp', 'dhl');
  const beforeStep = buildMerchantConsoleGuidedShipmentStep(blocked);
  const deliveryGatewayRegistry = buildDeliveryGatewayCarrierApiRegistry();
  const deliveryGatewayCapabilitySurface = deliveryGatewayRegistry.apiSurfaces.find(surface => surface.id === 'carrier-capability');

  assert.equal(blocked.nextStep, 'run_carrier_capability_preflight');
  assert.equal(beforeStep.currentStep, 'run_capability_preflight');
  assert.equal(beforeStep.primaryAction, 'Capability preflight');
  assert.equal(beforeStep.canRunCapabilityPreflight, true);
  assert.equal(beforeStep.canCreateShipment, false);
  assert.equal(capability.connectorId, 'ups');
  assert.equal(capability.countryCode, 'US');
  assert.equal(capability.response.ok, true);
  assert.equal(capability.requiredNextAction, 'apply_carrierCapabilityRef');
  assert.match(capability.carrierCapabilityRef ?? '', /^carrier_capability_/);
  assert.equal(capability.localOnly, true);
  assert.equal(capability.productionTraffic, false);
  assert.ok(deliveryGatewayCapabilitySurface, 'expected Delivery Gateway carrier-capability surface');
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.apiVersion, DELIVERY_GATEWAY_CARRIER_API_VERSION);
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.apiVersion, deliveryGatewayRegistry.version);
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.id, deliveryGatewayCapabilitySurface.id);
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.path, deliveryGatewayCapabilitySurface.path);
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.boundary, 'oss-contract');
  assert.deepEqual(capability.deliveryGatewayCarrierCapabilitySurface.safeOutputs, deliveryGatewayCapabilitySurface.safeOutputs);
  assert.deepEqual(capability.deliveryGatewayCarrierCapabilitySurface.blockedFields, deliveryGatewayCapabilitySurface.blockedFields);
  assert.ok(capability.deliveryGatewayCarrierCapabilitySurface.nonClaims.some(nonClaim => /not a live carrier contract/i.test(nonClaim)));
  assert.ok(capability.deliveryGatewayCarrierCapabilitySurface.nonClaims.some(nonClaim => /not production carrier credentials/i.test(nonClaim)));
  assert.equal(capability.deliveryGatewayCarrierCapabilitySurface.productionCarrierAvailabilityClaim, false);
  assert.equal(dhlCapability.connectorId, 'dhl');
  assert.equal(dhlCapability.countryCode, 'JP');
  assert.deepEqual(dhlCapability.deliveryGatewayCarrierCapabilitySurface, capability.deliveryGatewayCarrierCapabilitySurface);
  assert.match(dhlCapability.carrierCapabilityRef ?? '', /^carrier_capability_/);
  assert.notEqual(dhlCapability.carrierCapabilityRef, capability.carrierCapabilityRef);
  assert.doesNotMatch(JSON.stringify({
    carrierCapabilityRef: capability.carrierCapabilityRef,
    safeRefs: capability.response.ok ? capability.response.body.safeRefs : {},
  }), /rawAddress|recipientPhone|carrierApiKey|proofSecret|privateKey/);
  assert.doesNotMatch(JSON.stringify(capability.deliveryGatewayCarrierCapabilitySurface), /liveCarrierAvailable|productionCarrierAvailability: true|carrierApiKeyValue|commercialRateSecretValue|privateContractTermsValue/);

  const repaired = evaluateMerchantShipmentCreationReadiness({
    orderRef: blocked.orderRef,
    recipientDisplayRef: blocked.safeRefs.recipientDisplayRef,
    recipientId: blocked.safeRefs.recipientId,
    parcelProfileRef: blocked.safeRefs.parcelProfileRef,
    walletConsentRef: blocked.safeRefs.walletConsentRef,
    carrierCapabilityRef: capability.carrierCapabilityRef,
    servicePreference: blocked.servicePreference,
  });
  const afterStep = buildMerchantConsoleGuidedShipmentStep(repaired, capability);

  assert.equal(repaired.canCreateShipment, true);
  assert.equal(repaired.gatewayPreflight.requiredNextAction, 'call_hexaship_createShipment');
  assert.equal(afterStep.currentStep, 'create_shipment');
  assert.equal(afterStep.primaryAction, 'Create shipment');
  assert.equal(afterStep.canRunCapabilityPreflight, false);
  assert.equal(afterStep.canCreateShipment, true);
  assert.equal(afterStep.productionTraffic, false);
});

test('local Hexaship shipment records keep deterministic idempotency and duplicate click counts', () => {
  const result = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_demo',
    ecOrderRef: 'order_ref_synthetic_shop_001',
    recipientId: 'ship_recipient_synthetic_001',
    parcelProfileRef: 'parcel_profile_ref_order_ref_synthetic_shop_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_001',
    carrierCapabilityRef: 'carrier_capability_synthetic_console_001',
    selectionMode: 'fastest',
    selectedBy: 'ec',
    requestedAt: '2026-07-04T22:15:09.189Z',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  const firstRecord = upsertMerchantConsoleLocalHexashipShipmentRecord(undefined, result.ecOrderRef, result);
  const secondRecord = upsertMerchantConsoleLocalHexashipShipmentRecord(firstRecord, result.ecOrderRef, result);

  assert.equal(firstRecord.idempotencyKey, buildMerchantConsoleLocalHexashipIdempotencyKey(result.ecOrderRef));
  assert.equal(secondRecord.idempotencyKey, firstRecord.idempotencyKey);
  assert.equal(firstRecord.duplicateClickCount, 1);
  assert.equal(secondRecord.duplicateClickCount, 2);
  assert.equal(secondRecord.result.selection.decisionRef, result.selection.decisionRef);
  assert.equal(secondRecord.result.privacy.rawAddressStored, false);
  assert.equal(secondRecord.result.privacy.carrierCredentialsAcceptedFromClient, false);
  assert.doesNotMatch(JSON.stringify(secondRecord), /carrierApiKey|proofWitness|privateKey/);

  const firstReplayPreview = buildMerchantConsoleLocalHexashipReplayPreview(firstRecord);
  const secondReplayPreview = buildMerchantConsoleLocalHexashipReplayPreview(secondRecord);

  assert.equal(firstReplayPreview.idempotencyKey, firstRecord.idempotencyKey);
  assert.equal(firstReplayPreview.replayed, false);
  assert.equal(firstReplayPreview.replayStatus, 'not_replayed_yet');
  assert.equal(secondReplayPreview.idempotencyKey, firstReplayPreview.idempotencyKey);
  assert.equal(secondReplayPreview.replayed, true);
  assert.equal(secondReplayPreview.replayStatus, 'would_replay_same_request');
  assert.equal(secondReplayPreview.duplicateClickCount, 2);
  assert.equal(secondReplayPreview.routePath, '/v1/hexaship/mvp-v0.1/shipments');
  assert.equal(secondReplayPreview.productionTraffic, false);
  assert.match(secondReplayPreview.safeReplayRef, /^replay_ref_idem_hexaship_console_/);
  assert.doesNotMatch(JSON.stringify(secondReplayPreview), /rawAddress|carrierApiKey|proofWitness|privateKey/);

  const ledgerRows = buildMerchantConsoleLocalHexashipIdempotencyLedgerRows([secondRecord]);

  assert.equal(ledgerRows.length, 1);
  assert.equal(ledgerRows[0].shipmentRef, result.shipment.shipmentRef);
  assert.equal(ledgerRows[0].ecOrderRef, result.ecOrderRef);
  assert.equal(ledgerRows[0].idempotencyKey, secondRecord.idempotencyKey);
  assert.equal(ledgerRows[0].createReplayStatus, 'would_replay_same_request');
  assert.equal(ledgerRows[0].webhookReplayStatus, 'accepted_exact_replay');
  assert.equal(ledgerRows[0].duplicateClickCount, 2);
  assert.equal(ledgerRows[0].webhookEventCount, result.webhookLedger.length);
  assert.equal(ledgerRows[0].latestWebhookEventRef, result.webhookLedger[result.webhookLedger.length - 1]?.eventRef);
  assert.equal(ledgerRows[0].latestWebhookStatus, result.webhookLedger[result.webhookLedger.length - 1]?.status);
  assert.match(ledgerRows[0].safeWebhookReplayRef, /^webhook_replay_ref_hx_webhook_event_/);
  assert.equal(ledgerRows[0].selectedCarrier, result.selection.selectedCarrier);
  assert.equal(ledgerRows[0].addressExposure, 'ref_only');
  assert.equal(ledgerRows[0].productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(ledgerRows), /rawAddress|recipientPhone|carrierApiKey|proofWitness|privateKey/);

  const webhookReplayFixture = buildMerchantConsoleLocalHexashipWebhookReplayFixture(ledgerRows[0]);

  assert.equal(webhookReplayFixture.latestWebhookEventRef, ledgerRows[0].latestWebhookEventRef);
  assert.equal(webhookReplayFixture.acceptedReplayKind, 'replayed');
  assert.equal(webhookReplayFixture.conflictReplayKind, 'conflict');
  assert.equal(webhookReplayFixture.acceptedResponseStatus, 202);
  assert.equal(webhookReplayFixture.conflictResponseStatus, 409);
  assert.match(webhookReplayFixture.safeBodyFingerprintRef, /^bodyfp_ref_hx_webhook_event_/);
  assert.match(webhookReplayFixture.safeConflictFingerprintRef, /^bodyfp_conflict_ref_hx_webhook_event_/);
  assert.equal(webhookReplayFixture.privateMaterialExposed, false);
  assert.equal(webhookReplayFixture.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(webhookReplayFixture), /rawAddress|recipientPhone|carrierApiKey|proofWitness|privateKey|rawWebhookPayload/);

  const layoutAudit = buildMerchantConsoleLocalHexashipLedgerLayoutAudit(ledgerRows);

  assert.equal(layoutAudit.rowCount, 1);
  assert.equal(layoutAudit.usesCompactSummaryGrid, true);
  assert.equal(layoutAudit.maxSummaryColumns, 4);
  assert.equal(layoutAudit.requiresWrappedRefs, true);
  assert.deepEqual(layoutAudit.requiredVisibleFields, [
    'shipmentRef',
    'ecOrderRef',
    'idempotencyKey',
    'createReplayStatus',
    'webhookReplayStatus',
    'webhookEventCount',
    'addressExposure',
  ]);
  assert.deepEqual(layoutAudit.requiredWrappedRefFields, [
    'safeBodyFingerprintRef',
    'safeWebhookReplayRef',
    'latestWebhookEventRef',
  ]);
  assert.equal(layoutAudit.privateMaterialExposed, false);
  assert.equal(layoutAudit.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(layoutAudit), /rawAddress|recipientPhone|carrierApiKey|proofWitness|privateKey|rawWebhookPayload/);
});

test('local Hexaship shipment records build SDK and route idempotency request fixtures', () => {
  const result = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_demo',
    ecOrderRef: 'order_ref_synthetic_shop_003',
    recipientId: 'ship_recipient_synthetic_003',
    parcelProfileRef: 'parcel_profile_ref_order_ref_synthetic_shop_003',
    walletConsentRef: 'wallet_consent_ref_synthetic_003',
    carrierCapabilityRef: 'carrier_capability_synthetic_console_003',
    selectionMode: 'cheapest',
    selectedBy: 'ec',
    requestedAt: '2026-07-04T22:35:11.367Z',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  const record = upsertMerchantConsoleLocalHexashipShipmentRecord(undefined, result.ecOrderRef, result);
  const fixture = buildMerchantConsoleLocalHexashipRequestFixture(record);

  assert.equal(fixture.method, 'POST');
  assert.equal(fixture.path, '/v1/hexaship/mvp-v0.1/shipments');
  assert.equal(fixture.sdkRequestOptions.idempotencyKey, record.idempotencyKey);
  assert.equal(fixture.headers['idempotency-key'], record.idempotencyKey);
  assert.equal(fixture.headers['x-hexaship-local-only'], 'true');
  assert.equal(fixture.bodyRefs.ecOrderRef, result.ecOrderRef);
  assert.equal(fixture.bodyRefs.recipientId, result.recipientResolution.recipientId);
  assert.match(fixture.bodyRefs.addressFormVersion, /^wallet_country_form_ref_/);
  assert.equal(fixture.bodyRefs.carrierCapabilityRef, result.capability.carrierCapabilityRef);
  assert.equal(fixture.bodyRefs.selectionMode, 'cheapest');
  assert.equal(fixture.productionTraffic, false);
  assert.ok(fixture.forbiddenPublicMaterial.includes('rawAddress'));
  assert.doesNotMatch(JSON.stringify(fixture), /carrierApiKeyValue|proofWitnessValue|privateKeyValue|addressLine1Value/);

  const copyText = buildMerchantConsoleLocalHexashipRequestFixtureCopyText(fixture);
  assert.match(copyText, /"path": "\/v1\/hexaship\/mvp-v0\.1\/shipments"/);
  assert.match(copyText, /"idempotency-key": "idem_hexaship_console_order_ref_synthetic_shop_003"/);
  assert.match(copyText, /"addressFormVersion": "wallet_country_form_ref_/);
  assert.match(copyText, /"productionTraffic": false/);
  assert.doesNotMatch(copyText, /forbiddenPublicMaterial|rawAddress|carrierApiKey|proofWitness|privateKey/);
});

test('Merchant Console clipboard redaction audit covers copyable payloads without retaining private material', () => {
  const onboardingFixture = JSON.parse(readFileSync('docs/specs/fixtures/merchant-console-onboarding-v0.1.json', 'utf8')) as Parameters<
    typeof buildMerchantConsoleOnboardingOpenApiContractStatus
  >[0];
  const sdkCopy = buildMerchantConsoleMerchantOnboardingSdkCopyPayload();
  const openApiCopy = buildMerchantConsoleOnboardingOpenApiContractCopyPayload(
    buildMerchantConsoleOnboardingOpenApiContractStatus(onboardingFixture),
  );
  const callbackNegativeFixture = buildMerchantConsoleCallbackPreflightNegativeFixture();
  const callbackNegativeCopyText = buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText(callbackNegativeFixture);
  const shipmentResult = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_demo',
    ecOrderRef: 'order_ref_synthetic_shop_clipboard_001',
    recipientId: 'ship_recipient_synthetic_clipboard_001',
    parcelProfileRef: 'parcel_profile_ref_order_ref_synthetic_shop_clipboard_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_clipboard_001',
    carrierCapabilityRef: 'carrier_capability_synthetic_console_clipboard_001',
    selectionMode: 'cheapest',
    selectedBy: 'ec',
    requestedAt: '2026-07-21T21:41:37.433Z',
  });

  assert.equal(shipmentResult.ok, true);
  if (!shipmentResult.ok) return;

  const shipmentRecord = upsertMerchantConsoleLocalHexashipShipmentRecord(
    undefined,
    shipmentResult.ecOrderRef,
    shipmentResult,
  );
  const localHexashipFixture = buildMerchantConsoleLocalHexashipRequestFixture(shipmentRecord);
  const localHexashipCopyText = buildMerchantConsoleLocalHexashipRequestFixtureCopyText(localHexashipFixture);
  const candidates = buildMerchantConsoleClipboardRedactionAuditCandidates({
    onboardingFixture,
    callbackNegativeFixture,
    localHexashipShipmentRecords: [shipmentRecord],
  });
  const audit = buildMerchantConsoleClipboardRedactionAudit({
    onboardingFixture,
    callbackNegativeFixture,
    localHexashipShipmentRecords: [shipmentRecord],
  });

  assert.deepEqual(candidates.map(candidate => candidate.id), [
    'merchant-onboarding-sdk',
    'merchant-onboarding-openapi-contract',
    'callback-preflight-negative-fixture',
    `local-hexaship-request-fixture:${shipmentRecord.result.shipment.shipmentRef}`,
  ]);
  assert.equal(candidates.find(candidate => candidate.id === 'merchant-onboarding-sdk')?.clipboardText, sdkCopy.clipboardText);
  assert.equal(candidates.find(candidate => candidate.id === 'merchant-onboarding-openapi-contract')?.clipboardText, openApiCopy.clipboardText);
  assert.equal(candidates.find(candidate => candidate.id === 'callback-preflight-negative-fixture')?.clipboardText, callbackNegativeCopyText);
  assert.equal(
    candidates.find(candidate => candidate.id.startsWith('local-hexaship-request-fixture:'))?.clipboardText,
    localHexashipCopyText,
  );

  assert.equal(audit.version, MERCHANT_CONSOLE_EC_PLUGIN_VERSION);
  assert.equal(audit.candidateCount, 4);
  assert.equal(audit.localOnly, true);
  assert.equal(audit.productionTraffic, false);
  assert.equal(audit.privateMaterialExposed, false);
  assert.deepEqual(audit.forbiddenValueMarkers, [...MERCHANT_CONSOLE_CLIPBOARD_FORBIDDEN_VALUE_MARKERS]);
  assert.deepEqual(audit.validationErrors, []);
  assert.deepEqual(validateMerchantConsoleClipboardRedactionAudit(audit), []);
  assert.ok(audit.candidates.every(candidate => candidate.byteLength > 0));
  assert.ok(audit.candidates.every(candidate => candidate.forbiddenValueMarkersFound.length === 0));
  assert.doesNotMatch(JSON.stringify(audit.candidates), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofSecretValue|proof_secret_fixture_value|privateKeyValue/);

  const unsafeAudit = auditMerchantConsoleClipboardRedaction([
    {
      id: 'unsafe-synthetic-marker',
      label: 'Unsafe synthetic marker',
      clipboardText: 'carrierApiKeyValue',
      localOnly: true,
      productionTraffic: false,
    },
  ]);

  assert.equal(unsafeAudit.privateMaterialExposed, true);
  assert.ok(unsafeAudit.validationErrors.includes('clipboard-private-value-marker:unsafe-synthetic-marker:carrierApiKeyValue'));

  const unsafeCallbackFixtureAudit = auditMerchantConsoleClipboardRedaction([
    {
      id: 'callback-preflight-negative-fixture-leak',
      label: 'Callback preflight negative fixture',
      clipboardText: `${callbackNegativeCopyText}\n"credential_ref": "proof_secret_fixture_value"`,
      localOnly: true,
      productionTraffic: false,
    },
  ]);

  assert.equal(unsafeCallbackFixtureAudit.privateMaterialExposed, true);
  assert.ok(unsafeCallbackFixtureAudit.validationErrors.includes(
    'clipboard-private-value-marker:callback-preflight-negative-fixture-leak:proof_secret_fixture_value',
  ));
});

test('merchant console docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/merchant-console-ec-plugin.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Merchant Console \/ EC Plugin/);
  assert.match(doc, /Shopify風/);
  assert.match(doc, /WooCommerce/);
  assert.match(doc, /EC-CUBE/);
  assert.match(doc, /自社EC/);
  assert.match(doc, /配送会社選択/);
  assert.match(doc, /発送履歴/);
  assert.match(doc, /Webhook履歴/);
  assert.match(doc, /住所を直接見せない/);
  assert.match(doc, /blocked_missing_carrier_capability/);
  assert.match(doc, /ready_for_hexaship_createShipment/);
  assert.match(doc, /addressFormVersionRef/);
  assert.match(doc, /carrierSpecificAddressShapeBlocked/);
  assert.match(doc, /carrier-specific address forms/);
  assert.match(doc, /merchant-console-onboarding-v0\.1\.json/);
  assert.match(doc, /Playlist Commerce/);
  assert.match(doc, /EC Social Login/);
  assert.match(doc, /Continue with Veygrit/);
  assert.match(doc, /playlistParticipationRef/);
  assert.match(doc, /addressLoginClientRef/);
  assert.match(doc, /rawAddress/);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:merchant-console-ec-plugin'], 'tsx --test src/lib/merchantConsoleEcPlugin.test.ts');
});

test('merchant onboarding fixture carries safe Wallet form refs without carrier-specific address material', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/merchant-console-onboarding-v0.1.json', 'utf8')) as {
    localOnly: boolean;
    request: {
      storeEcPlatform: {
        addressLoginClientRef: string;
        addressLoginCallbackUrl: string;
      };
      addressWalletSettings: {
        addressFormVersionRef: string;
        carrierSpecificAddressShapeBlocked: boolean;
      };
      shippingPreferences: {
        enabledCarriers: string[];
      };
    };
    expected: {
      requiredWalletBoundaryFields: string[];
      forbiddenPublicMaterial: string[];
      nonClaims: string[];
      safeOutputRefs: string[];
    };
  };
  const fixtureText = JSON.stringify(fixture);
  const contract = buildMerchantConsoleMerchantOnboardingFixtureContract(fixture);

  assert.equal(fixture.localOnly, true);
  assert.match(fixture.request.storeEcPlatform.addressLoginClientRef, /^address_login_client_ref_/);
  assert.match(fixture.request.storeEcPlatform.addressLoginCallbackUrl, /^https:\/\//);
  assert.equal(contract.addressLoginClientRef, fixture.request.storeEcPlatform.addressLoginClientRef);
  assert.equal(contract.addressLoginCallbackUrl, fixture.request.storeEcPlatform.addressLoginCallbackUrl);
  assert.match(contract.addressLoginCallbackPreflightRef ?? '', /^address_login_callback_preflight_ref_[0-9a-f]{24}$/);
  assert.equal(contract.callbackContractVersion, 'veygrit-address-login-callback-v0.1');
  assert.ok(contract.callbackPreflightChecks.every(check => check.status === 'pass'));
  assert.match(fixture.request.addressWalletSettings.addressFormVersionRef, /^wallet_country_form_ref_/);
  assert.equal(fixture.request.addressWalletSettings.carrierSpecificAddressShapeBlocked, true);
  assert.deepEqual(fixture.request.shippingPreferences.enabledCarriers, ['dhl', 'ups']);
  assert.deepEqual(contract.enabledCarriers, ['dhl', 'ups']);
  assert.equal(contract.addressFormVersionRef, fixture.request.addressWalletSettings.addressFormVersionRef);
  assert.equal(contract.carrierSpecificAddressShapeBlocked, true);
  assert.equal(contract.sdkCopyLabel, 'Merchant onboarding SDK');
  assert.equal(contract.sdkCopyLocalOnly, true);
  assert.equal(contract.sdkCopyProductionTraffic, false);
  assert.equal(contract.rawAddressVisibleToEc, false);
  assert.equal(contract.carrierSpecificAddressShapeCollectedByEc, false);
  assert.deepEqual(fixture.expected.requiredWalletBoundaryFields, [
    'addressFormVersionRef',
    'carrierSpecificAddressShapeBlocked',
  ]);
  assert.deepEqual(contract.requiredWalletBoundaryFields, fixture.expected.requiredWalletBoundaryFields);
  assert.ok(contract.safeOutputRefs.includes('merchantRef'));
  assert.ok(contract.safeOutputRefs.includes('addressLoginClientRef'));
  assert.ok(contract.safeOutputRefs.includes('addressLoginCallbackPreflightRef'));
  assert.ok(contract.safeOutputRefs.includes('addressFormVersionRef'));
  assert.ok(contract.forbiddenPublicMaterial.includes('rawAddress'));
  assert.ok(contract.forbiddenPublicMaterial.includes('carrierCredential'));
  assert.ok(contract.forbiddenPublicMaterial.includes('providerIdToken'));
  assert.ok(contract.forbiddenPublicMaterial.includes('rawProviderProfile'));
  assert.ok(contract.forbiddenPublicMaterial.includes('productionWebhookSecret'));
  assert.ok(contract.nonClaims.includes('not-raw-address-intake'));
  assert.ok(contract.nonClaims.includes('not-proof-witness-intake'));
  assert.ok(contract.nonClaims.includes('not-production-dhl-ups-traffic'));
  assert.ok(fixture.expected.nonClaims.includes('not-carrier-specific-address-form'));
  const status = buildMerchantConsoleOnboardingOpenApiContractStatus(fixture);
  assert.equal(status.path, '/v1/merchant-console/onboarding');
  assert.equal(status.fixture, 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json');
  assert.equal(status.verifier, 'npm run verify:merchant-console-ec-plugin');
  assert.deepEqual(status.enabledCarriers, ['dhl', 'ups']);
  assert.equal(status.addressLoginClientRef, fixture.request.storeEcPlatform.addressLoginClientRef);
  assert.match(status.addressLoginCallbackPreflightRef ?? '', /^address_login_callback_preflight_ref_[0-9a-f]{24}$/);
  assert.equal(status.callbackContractVersion, 'veygrit-address-login-callback-v0.1');
  assert.equal(status.callbackPreflightPassed, true);
  assert.equal(status.addressFormVersionRef, fixture.request.addressWalletSettings.addressFormVersionRef);
  assert.ok(status.safetyFlags.includes('enabledCarriers: dhl+ups'));
  assert.ok(status.safetyFlags.includes('addressLoginClientRef: address_login_client_ref_synthetic_001'));
  assert.ok(status.safetyFlags.includes('callbackContractVersion: veygrit-address-login-callback-v0.1'));
  assert.ok(status.safetyFlags.includes('callbackPreflightPassed: true'));
  assert.ok(status.safetyFlags.includes('localOnly: true'));
  assert.ok(status.safetyFlags.includes('productionTraffic: false'));
  assert.ok(status.safetyFlags.includes('rawAddressVisibleToEc: false'));
  assert.ok(status.safetyFlags.includes('carrierSpecificAddressShapeCollectedByEc: false'));
  const copyPayload = buildMerchantConsoleOnboardingOpenApiContractCopyPayload(status);
  assert.equal(copyPayload.label, 'Merchant onboarding OpenAPI contract');
  assert.equal(copyPayload.buttonLabel, 'Copy contract');
  assert.equal(copyPayload.successLabel, 'Copied contract');
  assert.equal(copyPayload.localOnly, true);
  assert.equal(copyPayload.productionTraffic, false);
  assert.match(copyPayload.clipboardText, /path: \/v1\/merchant-console\/onboarding/);
  assert.match(copyPayload.clipboardText, /enabledCarriers: dhl\+ups/);
  assert.match(copyPayload.clipboardText, /addressLoginClientRef: address_login_client_ref_synthetic_001/);
  assert.match(copyPayload.clipboardText, /callbackPreflightRef: address_login_callback_preflight_ref_[0-9a-f]{24}/);
  assert.match(copyPayload.clipboardText, /callbackContractVersion: veygrit-address-login-callback-v0\.1/);
  assert.match(copyPayload.clipboardText, /callbackPreflightPassed: true/);
  assert.match(copyPayload.clipboardText, /addressFormVersionRef: wallet_country_form_ref_us_en_v1/);
  assert.match(copyPayload.clipboardText, /walletBoundaryFields: addressFormVersionRef\+carrierSpecificAddressShapeBlocked/);
  assert.doesNotMatch(copyPayload.clipboardText, /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofSecretValue|privateKeyValue|webhookSecretValue/);
  for (const forbidden of fixture.expected.forbiddenPublicMaterial) {
    assert.doesNotMatch(fixtureText, new RegExp(`${forbidden}Value`, 'i'));
  }
  assert.doesNotMatch(fixtureText, /rawAddressValue|addressLine1Value|recipientPhoneValue|carrierApiKeyValue|carrierCredentialValue|rawCarrierPayloadValue|proofSecretValue|privateKeyValue|webhookSecretValue/);
});

test('merchant onboarding mock accepts fixture refs and rejects private material or missing Wallet boundary', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/merchant-console-onboarding-v0.1.json', 'utf8')) as {
    request: Record<string, unknown>;
  };

  const accepted = createMerchantConsoleOnboardingMock(fixture.request);
  assert.equal(accepted.ok, true);
  assert.equal(accepted.status, 201);
  if (!accepted.ok) throw new Error('fixture should be accepted');
  assert.match(accepted.onboardingRef, /^merchant_onboarding_ref_[0-9a-f]{24}$/);
  assert.match(accepted.merchantRef, /^merchant_[0-9a-f]{24}$/);
  assert.equal(accepted.addressLoginBoundary.addressLoginClientRef, 'address_login_client_ref_synthetic_001');
  assert.equal(accepted.addressLoginBoundary.addressLoginCallbackUrl, 'https://merchant.example/veygrit/callback');
  assert.match(accepted.addressLoginBoundary.addressLoginCallbackPreflightRef, /^address_login_callback_preflight_ref_[0-9a-f]{24}$/);
  assert.equal(accepted.addressLoginBoundary.callbackContractVersion, 'veygrit-address-login-callback-v0.1');
  assert.equal(accepted.addressLoginBoundary.callbackUrlHttps, true);
  assert.equal(accepted.addressLoginBoundary.forbiddenCallbackParamsAbsent, true);
  assert.equal(accepted.addressLoginBoundary.rawAddressCallbackBlocked, true);
  assert.equal(accepted.addressLoginBoundary.testVectorCommand, 'npm run verify:address-login-spec');
  assert.ok(accepted.addressLoginBoundary.preflightChecks.every(check => check.status === 'pass'));
  assert.ok(accepted.safeOutputRefs.includes('addressLoginClientRef'));
  assert.ok(accepted.safeOutputRefs.includes('addressLoginCallbackPreflightRef'));
  assert.equal(accepted.walletBoundary.addressFormVersionRef, 'wallet_country_form_ref_us_en_v1');
  assert.equal(accepted.walletBoundary.carrierSpecificAddressShapeBlocked, true);
  assert.equal(accepted.walletBoundary.rawAddressVisibleToEc, false);
  assert.equal(accepted.walletBoundary.carrierSpecificAddressShapeCollectedByEc, false);
  assert.equal(accepted.localOnly, true);
  assert.equal(accepted.productionTraffic, false);
  assert.ok(accepted.blockedMaterial.includes('rawAddress'));
  assert.ok(accepted.blockedMaterial.includes('rawCarrierPayload'));
  assert.doesNotMatch(JSON.stringify(accepted), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|carrierCredentialValue|rawCarrierPayloadValue|proofSecretValue|privateKeyValue|webhookSecretValue/);

  const privateMaterial = createMerchantConsoleOnboardingMock({
    ...fixture.request,
    addressWalletSettings: {
      addressFormVersionRef: 'wallet_country_form_ref_us_en_v1',
      carrierSpecificAddressShapeBlocked: true,
      rawAddress: 'blocked synthetic private material',
    },
    apiKeysAndWebhooks: {
      carrierApiKey: 'blocked synthetic carrier key',
      providerIdToken: 'blocked synthetic provider token',
    },
  } as unknown as Parameters<typeof createMerchantConsoleOnboardingMock>[0]);
  assert.equal(privateMaterial.ok, false);
  assert.equal(privateMaterial.status, 400);
  if (privateMaterial.ok) throw new Error('private material should be rejected');
  assert.equal(privateMaterial.error, 'private_material_rejected');
  assert.deepEqual(privateMaterial.rejectedKeys.sort(), ['addressWalletSettings.rawAddress', 'apiKeysAndWebhooks.carrierApiKey', 'apiKeysAndWebhooks.providerIdToken']);

  const unsafeCallback = createMerchantConsoleOnboardingMock({
    ...fixture.request,
    storeEcPlatform: {
      storeRef: 'store_ref_synthetic_001',
      platformStoreRef: 'platform_store_ref_synthetic_shopify_like_001',
      platform: 'shopify-like',
      orderSchemaRef: 'order_schema_ref_synthetic_001',
      addressLoginClientRef: 'address_login_client_ref_synthetic_001',
      addressLoginCallbackUrl: 'http://merchant.example/veygrit/callback?raw_address=blocked',
    },
  });
  assert.equal(unsafeCallback.ok, false);
  if (unsafeCallback.ok) throw new Error('unsafe callback should be rejected');
  assert.equal(unsafeCallback.error, 'missing_address_login_boundary');
  assert.ok(unsafeCallback.missingRefs.includes('storeEcPlatform.addressLoginCallbackPreflight'));

  const missingBoundary = createMerchantConsoleOnboardingMock({
    ...fixture.request,
    addressWalletSettings: {
      addressFormVersionRef: 'form_ref_missing_prefix_001',
      carrierSpecificAddressShapeBlocked: false,
    },
  });
  assert.equal(missingBoundary.ok, false);
  if (missingBoundary.ok) throw new Error('missing Wallet boundary should be rejected');
  assert.equal(missingBoundary.error, 'missing_wallet_form_boundary');
  assert.deepEqual(missingBoundary.missingRefs.sort(), [
    'addressWalletSettings.addressFormVersionRef',
    'addressWalletSettings.carrierSpecificAddressShapeBlocked',
  ]);
});

test('callback preflight repair actions export a safe negative fixture for Merchant Console onboarding', () => {
  const negativeFixture = buildMerchantConsoleCallbackPreflightNegativeFixture();
  const repairActions = buildMerchantConsoleCallbackPreflightRepairActions({
    callbackUrl: negativeFixture.callbackUrl,
    callbackContractVersion: 'veygrit-address-login-callback-v0.1',
    checks: [
      {
        id: 'callback-url-https',
        label: 'Callback URL uses HTTPS',
        status: 'fail',
        detail: 'Redirect URI must use HTTPS before live traffic.',
        safeInputRef: 'redirectUri',
      },
      {
        id: 'callback-url-forbidden-param-scan',
        label: 'Forbidden callback params absent',
        status: 'fail',
        detail: 'Remove forbidden query params: raw_address, private_key, proof_secret',
        safeInputRef: 'redirectUri.query',
      },
    ],
    testVectorCommand: 'npm run verify:address-login-spec',
    testVectorIds: ['forbidden-callback-param-negative', 'callback_forbidden_value_negative'],
    runButtonLabel: 'Run synthetic test vectors',
  });
  const copyText = buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText(negativeFixture);
  const hostedFixture = JSON.parse(readFileSync('docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json', 'utf8')) as {
    callbackValidationVectors?: Array<{ id?: string }>;
  };
  const hostedCallbackValidationVectorIds = new Set(
    (hostedFixture.callbackValidationVectors ?? []).map(vector => vector.id).filter((id): id is string => typeof id === 'string'),
  );

  assert.equal(negativeFixture.fixtureId, 'merchant-console-callback-preflight-negative-v0.1');
  assert.equal(negativeFixture.expectedError, 'missing_address_login_boundary');
  assert.deepEqual(negativeFixture.expectedMissingRefs, ['storeEcPlatform.addressLoginCallbackPreflight']);
  assert.ok(negativeFixture.expectedFailingCheckIds.includes('callback-url-https'));
  assert.ok(negativeFixture.expectedFailingCheckIds.includes('callback-url-forbidden-param-scan'));
  assert.ok(negativeFixture.forbiddenParams.includes('raw_address'));
  assert.ok(negativeFixture.forbiddenParams.includes('private_key'));
  assert.ok(negativeFixture.forbiddenParams.includes('proof_secret'));
  assert.ok(negativeFixture.forbiddenValueParamRefs.includes('credential_ref'));
  assert.ok(negativeFixture.callbackValidationVectorIds.includes('callback_forbidden_param_negative'));
  assert.ok(negativeFixture.callbackValidationVectorIds.includes('callback_forbidden_value_negative'));
  assert.ok(negativeFixture.callbackValidationVectorIds.every(id => hostedCallbackValidationVectorIds.has(id)));
  assert.ok(!negativeFixture.callbackValidationVectorIds.includes('forbidden-callback-param-negative'));
  assert.match(negativeFixture.callbackUrl, /raw_address/);
  assert.match(negativeFixture.callbackUrl, /private_key/);
  assert.match(negativeFixture.callbackUrl, /proof_secret/);
  assert.ok(negativeFixture.repairActionIds.includes('replace_with_https_callback_url'));
  assert.ok(negativeFixture.repairActionIds.includes('remove_forbidden_callback_params'));
  assert.equal(negativeFixture.exportCommand, 'npm run verify:merchant-console-ec-plugin');
  assert.equal(negativeFixture.localOnly, true);
  assert.equal(negativeFixture.productionTraffic, false);
  assert.ok(negativeFixture.blockedMaterial.includes('providerIdToken'));
  assert.ok(negativeFixture.nonClaims.includes('not-raw-address-callback'));
  assert.ok(negativeFixture.nonClaims.includes('not-private-key-callback'));
  assert.ok(negativeFixture.nonClaims.includes('not-proof-secret-callback'));
  assert.ok(repairActions.some(action => action.primaryAction === 'replace_with_https_callback_url' && action.blocksLiveMode));
  assert.ok(repairActions.some(action => (
    action.primaryAction === 'remove_forbidden_callback_params'
    && action.blocksLiveMode
    && action.testVectorIds.includes('callback_forbidden_value_negative')
  )));
  assert.match(copyText, /merchant-console-callback-preflight-negative-v0\.1/);
  assert.match(copyText, /missing_address_login_boundary/);
  assert.match(copyText, /storeEcPlatform\.addressLoginCallbackPreflight/);
  assert.match(copyText, /raw_address/);
  assert.match(copyText, /private_key/);
  assert.match(copyText, /proof_secret/);
  assert.match(copyText, /credential_ref/);
  assert.match(copyText, /callback_forbidden_param_negative/);
  assert.match(copyText, /callback_forbidden_value_negative/);
  assert.match(copyText, /replace_with_https_callback_url/);
  assert.match(copyText, /remove_forbidden_callback_params/);
  assert.doesNotMatch(copyText, /forbidden-callback-param-negative/);
  assert.doesNotMatch(copyText, /providerIdTokenValue|providerAccessTokenValue|rawProviderProfileValue|rawAddressValue|recipientPhoneValue|privateKeyValue|proofSecretValue/);
});

test('merchant onboarding OpenAPI path exposes Wallet form boundary without raw material', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/merchant-console-onboarding-v0.1.json', 'utf8')) as {
    request: {
      storeEcPlatform: {
        addressLoginClientRef: string;
        addressLoginCallbackUrl: string;
      };
      shippingPreferences: {
        enabledCarriers: string[];
      };
      addressWalletSettings: {
        addressFormVersionRef: string;
        carrierSpecificAddressShapeBlocked: boolean;
      };
    };
    expected: {
      requiredWalletBoundaryFields: string[];
      safeOutputRefs: string[];
      forbiddenPublicMaterial: string[];
      nonClaims: string[];
    };
  };
  const fixtureContract = buildMerchantConsoleMerchantOnboardingFixtureContract(fixture);
  const openapi = parseYaml(readFileSync('docs/specs/delivery-gateway-carrier-api.openapi.yaml', 'utf8')) as {
    paths?: Record<string, {
      post?: {
        requestBody?: {
          content?: {
            'application/json'?: {
              schema?: { $ref?: string };
              examples?: Record<string, { value?: {
                storeEcPlatform?: {
                  addressLoginClientRef?: string;
                  addressLoginCallbackUrl?: string;
                };
                shippingPreferences?: { enabledCarriers?: string[] };
                addressWalletSettings?: {
                  addressFormVersionRef?: string;
                  carrierSpecificAddressShapeBlocked?: boolean;
                };
              } }>;
            };
          };
        };
        responses?: Record<string, unknown>;
        ['x-agid-evidence-fixtures']?: Record<string, unknown>;
        ['x-agid-redacted-fields']?: string[];
        ['x-agid-non-claims']?: string[];
      };
    }>;
    components?: {
      schemas?: Record<string, {
        properties?: Record<string, unknown>;
      }>;
    };
  };
  const post = openapi.paths?.['/v1/merchant-console/onboarding']?.post;
  const requestJson = post?.requestBody?.content?.['application/json'];
  const schemaRef = requestJson?.schema?.$ref;
  const schemaName = schemaRef?.replace('#/components/schemas/', '') ?? '';
  const requestSchema = openapi.components?.schemas?.[schemaName] as {
    properties?: {
      addressWalletSettings?: {
        properties?: {
          addressFormVersionRef?: { pattern?: string };
          carrierSpecificAddressShapeBlocked?: { const?: boolean };
        };
      };
      storeEcPlatform?: {
        properties?: {
          addressLoginClientRef?: { pattern?: string };
          addressLoginCallbackUrl?: { pattern?: string };
        };
      };
    };
  } | undefined;
  const addressWalletSettings = requestSchema?.properties?.addressWalletSettings?.properties;
  const storeEcPlatform = requestSchema?.properties?.storeEcPlatform?.properties;
  const exampleValue = requestJson?.examples?.dhlUpsWalletFormBoundary?.value ?? {};
  const exampleContract = buildMerchantConsoleMerchantOnboardingFixtureContract({
    request: exampleValue,
    expected: {
      requiredWalletBoundaryFields: fixtureContract.requiredWalletBoundaryFields,
      safeOutputRefs: fixtureContract.safeOutputRefs,
      forbiddenPublicMaterial: fixtureContract.forbiddenPublicMaterial,
      nonClaims: fixtureContract.nonClaims,
    },
  });
  const exampleSettings = exampleValue.addressWalletSettings ?? {};
  const exampleStore = exampleValue.storeEcPlatform ?? {};

  assert.equal(schemaRef, '#/components/schemas/MerchantConsoleOnboardingRequest');
  assert.equal(storeEcPlatform?.addressLoginClientRef?.pattern, '^address_login_client_ref_[a-z0-9_:-]+$');
  assert.equal(storeEcPlatform?.addressLoginCallbackUrl?.pattern, '^https://');
  assert.equal(addressWalletSettings?.addressFormVersionRef?.pattern, '^wallet_country_form_ref_[a-z0-9_:-]+$');
  assert.equal(addressWalletSettings?.carrierSpecificAddressShapeBlocked?.const, true);
  assert.equal(exampleContract.addressLoginClientRef, fixture.request.storeEcPlatform.addressLoginClientRef);
  assert.match(exampleContract.addressLoginCallbackPreflightRef ?? '', /^address_login_callback_preflight_ref_[0-9a-f]{24}$/);
  assert.equal(exampleContract.callbackContractVersion, 'veygrit-address-login-callback-v0.1');
  assert.ok(exampleContract.callbackPreflightChecks.every(check => check.status === 'pass'));
  assert.equal(exampleContract.addressFormVersionRef, fixtureContract.addressFormVersionRef);
  assert.equal(exampleContract.carrierSpecificAddressShapeBlocked, fixtureContract.carrierSpecificAddressShapeBlocked);
  assert.deepEqual(exampleContract.enabledCarriers, fixtureContract.enabledCarriers);
  assert.deepEqual(exampleContract.requiredWalletBoundaryFields, fixtureContract.requiredWalletBoundaryFields);
  assert.deepEqual(exampleContract.safeOutputRefs, fixtureContract.safeOutputRefs);
  assert.equal(exampleContract.rawAddressVisibleToEc, false);
  assert.equal(exampleContract.carrierSpecificAddressShapeCollectedByEc, false);
  assert.match(String(exampleSettings.addressFormVersionRef), /^wallet_country_form_ref_/);
  assert.equal(exampleSettings.carrierSpecificAddressShapeBlocked, true);
  assert.match(String(exampleStore.addressLoginClientRef), /^address_login_client_ref_/);
  assert.match(String(exampleStore.addressLoginCallbackUrl), /^https:\/\//);
  assert.equal(post?.['x-agid-evidence-fixtures']?.preflightFixture, 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json');
  assert.equal(post?.['x-agid-evidence-fixtures']?.historyFixture, 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json');
  assert.equal(post?.['x-agid-evidence-fixtures']?.evidenceFixture, 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json');
  assert.equal(post?.['x-agid-evidence-fixtures']?.evidenceSchema, 'docs/specs/schemas/merchant-console-onboarding-v0.1.schema.json');
  assert.equal(post?.['x-agid-evidence-fixtures']?.verifierCommand, 'npm run verify:merchant-console-ec-plugin');
  assert.equal(post?.['x-agid-evidence-fixtures']?.aggregateVerifierCommand, 'npm run verify:address-login-spec');
  assert.equal(post?.['x-agid-evidence-fixtures']?.managedServiceBoundary, 'delivery-gateway-carrier-api');
  assert.equal(post?.['x-agid-evidence-fixtures']?.localOnly, true);
  assert.equal(post?.['x-agid-evidence-fixtures']?.nonClaimsProfile, 'merchant-console-onboarding-v0.1');
  assert.ok((post?.['x-agid-evidence-fixtures']?.forbiddenMaterial as string[] | undefined)?.includes('production_webhook_secret'));
  assert.ok((post?.['x-agid-evidence-fixtures']?.forbiddenMaterial as string[] | undefined)?.includes('proof_witness'));
  assert.ok((post?.['x-agid-evidence-fixtures']?.nonClaims as string[] | undefined)?.includes('not-raw-address-intake'));
  assert.ok((post?.['x-agid-evidence-fixtures']?.nonClaims as string[] | undefined)?.includes('not-proof-witness-intake'));
  assert.ok((post?.['x-agid-evidence-fixtures']?.nonClaims as string[] | undefined)?.includes('not-provider-token-intake'));
  assert.ok((post?.['x-agid-evidence-fixtures']?.nonClaims as string[] | undefined)?.includes('not-raw-carrier-payload-intake'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('raw_address'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('carrier_api_key'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('raw_carrier_payload'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('production_webhook_secret'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('proof_witness'));
  assert.ok(post?.['x-agid-redacted-fields']?.includes('provider_id_token'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-carrier-specific-address-form'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-raw-address-intake'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-proof-witness-intake'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-provider-token-intake'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-raw-carrier-payload-intake'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-raw-address-callback'));
  assert.ok(post?.['x-agid-non-claims']?.includes('not-production-dhl-ups-traffic'));
  for (const forbidden of fixtureContract.forbiddenPublicMaterial) {
    assert.doesNotMatch(JSON.stringify(exampleValue), new RegExp(`${forbidden}Value`, 'i'));
  }
  assert.ok(post?.responses?.['201']);
  assert.ok(post?.responses?.['409']);
});
