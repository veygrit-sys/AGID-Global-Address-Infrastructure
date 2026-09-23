import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CARRIER_CONNECTOR_LAYER_VERSION,
  buildCarrierConnectorLayerPlan,
  buildCarrierLiveOnboardingPlan,
  assessCarrierLiveEnvironment,
  isMvpHexashipCarrier,
  runCarrierCapabilityPreflight,
  runCarrierConnectorSandbox,
  selectCarrierConnector,
  validateCarrierConnectorLayerPlan,
  validateCarrierLiveOnboardingPlan,
} from './carrierConnectorLayer';
import { assertModulesDoNotImportScripts } from './veygritImportBoundary.testHelper';

test('carrier lib-side delivery contract modules do not import script fixtures', () => {
  assertModulesDoNotImportScripts([
    'src/lib/carrierConnectorLayer.ts',
    'src/lib/carrierWaybillAddress.ts',
    'src/lib/upsCarrierFeatures.ts',
    'src/lib/dhlCarrierFeatures.ts',
    'src/lib/deliveryGatewayCarrierApi.ts',
    'src/lib/carrierLabelIntent.ts',
    'src/lib/shippingLabelQr.ts',
    'src/lib/shippingAddressAccuracy.ts',
  ]);
});

test('Carrier Connector Layer validates as the carrier API difference absorber', () => {
  const plan = buildCarrierConnectorLayerPlan();

  assert.equal(plan.version, CARRIER_CONNECTOR_LAYER_VERSION);
  assert.equal(plan.productName, 'Carrier Connector Layer');
  assert.deepEqual(validateCarrierConnectorLayerPlan(plan), []);
  assert.deepEqual(plan.activeConnectors, ['dhl', 'ups']);
  assert.deepEqual(plan.plannedConnectors, ['fedex', 'yamato', 'japan-post', 'sf-express']);
});

test('DHL and UPS expose the same Hexaship methods through different API dialects', () => {
  const dhl = selectCarrierConnector('dhl');
  const ups = selectCarrierConnector('ups');

  assert.ok(dhl);
  assert.ok(ups);
  assert.equal(dhl.status, 'active-mvp');
  assert.equal(ups.status, 'active-mvp');
  assert.equal(dhl.authModel, 'basic-auth-account');
  assert.equal(ups.authModel, 'oauth-client-credentials');
  assert.equal(dhl.dialect.labelOperation, 'mydhl.shipments.create');
  assert.equal(ups.dialect.labelOperation, 'ups.shipping.shipment');
  assert.equal(dhl.dialect.labelArtifactName, 'documents');
  assert.equal(ups.dialect.labelArtifactName, 'labelImage');
  assert.deepEqual(dhl.supportedMethods, ups.supportedMethods);
  assert.equal(isMvpHexashipCarrier('dhl'), true);
  assert.equal(isMvpHexashipCarrier('ups'), true);
  assert.equal(isMvpHexashipCarrier('fedex'), false);
});

test('live DHL and UPS onboarding plan captures account, credential, sandbox, and production gates', () => {
  const plan = buildCarrierLiveOnboardingPlan();

  assert.equal(plan.version, CARRIER_CONNECTOR_LAYER_VERSION);
  assert.equal(plan.productName, 'Carrier Live Onboarding');
  assert.equal(plan.liveTrafficDefault, false);
  assert.deepEqual(validateCarrierLiveOnboardingPlan(plan), []);

  const dhl = plan.checklists.find(checklist => checklist.connectorId === 'dhl');
  const ups = plan.checklists.find(checklist => checklist.connectorId === 'ups');
  assert.ok(dhl);
  assert.ok(ups);
  assert.equal(dhl.authModel, 'basic-auth-account');
  assert.equal(ups.authModel, 'oauth-client-credentials');
  assert.equal(dhl.sandboxBaseUrl, 'https://express.api.dhl.com/mydhlapi/test');
  assert.equal(ups.productionBaseUrl, 'https://onlinetools.ups.com');
  assert.ok(dhl.requiredServerEnvKeys.includes('HEXASHIP_DHL_MYDHL_USERNAME'));
  assert.ok(dhl.requiredServerEnvKeys.includes('HEXASHIP_DHL_MYDHL_PASSWORD'));
  assert.ok(ups.requiredServerEnvKeys.includes('HEXASHIP_UPS_CLIENT_ID'));
  assert.ok(ups.requiredServerEnvKeys.includes('HEXASHIP_UPS_CLIENT_SECRET'));
  assert.ok(plan.sharedGates.includes('verify:carrier-connector-layer'));
  assert.ok(plan.sharedGates.includes('verify:hexaship-delivery-gateway'));
});

test('live onboarding plan fails closed on unofficial docs, live defaults, or secret-looking values', () => {
  const plan = buildCarrierLiveOnboardingPlan();

  const unsafe = {
    ...plan,
    liveTrafficDefault: true,
    checklists: plan.checklists.map(checklist =>
      checklist.connectorId === 'ups'
        ? {
            ...checklist,
            officialDocsUrl: 'https://example.com/ups',
            defaultLiveTrafficEnabled: true,
            accountPrerequisites: [...checklist.accountPrerequisites, 'client_secret=synthetic-secret-value'],
          }
        : checklist,
    ),
  } as unknown as typeof plan;
  const errors = validateCarrierLiveOnboardingPlan(unsafe);

  assert.ok(errors.includes('live-traffic-default-not-false'));
  assert.ok(errors.includes('checklist-live-default-not-false:ups'));
  assert.ok(errors.includes('unofficial-docs-url:ups'));
  assert.ok(errors.includes('secret-looking-value:ups'));
});

test('live environment readiness reports DHL/UPS missing keys without exposing secret values', () => {
  const dhl = assessCarrierLiveEnvironment('dhl', {
    HEXASHIP_DHL_MYDHL_BASE_URL: 'https://express.api.dhl.com/mydhlapi/test',
    HEXASHIP_DHL_MYDHL_USERNAME: 'synthetic-user',
    HEXASHIP_DHL_MYDHL_PASSWORD: 'synthetic-password',
  });
  const ups = assessCarrierLiveEnvironment('ups', {
    HEXASHIP_UPS_BASE_URL: 'https://wwwcie.ups.com',
    HEXASHIP_UPS_CLIENT_ID: 'synthetic-client-id',
    HEXASHIP_UPS_CLIENT_SECRET: 'synthetic-client-secret',
    HEXASHIP_UPS_ACCOUNT_NUMBER: 'synthetic-account',
    HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED: 'false',
  });

  assert.equal(dhl.readyForSandbox, false);
  assert.equal(dhl.readyForProduction, false);
  assert.equal(dhl.redactionPolicy, 'key_names_only');
  assert.ok(dhl.presentEnvKeys.includes('HEXASHIP_DHL_MYDHL_USERNAME'));
  assert.ok(dhl.missingEnvKeys.includes('HEXASHIP_DHL_ACCOUNT_NUMBER'));
  assert.doesNotMatch(JSON.stringify(dhl), /synthetic-password/);

  assert.equal(ups.readyForSandbox, true);
  assert.equal(ups.readyForProduction, false);
  assert.ok(ups.blockedReasons.includes('live-traffic-disabled'));
  assert.doesNotMatch(JSON.stringify(ups), /synthetic-client-secret/);
});

test('carrier capability preflight issues safe refs before getRates for DHL and UPS', () => {
  const dhl = runCarrierCapabilityPreflight({
    connectorId: 'dhl',
    countryCode: 'jp',
    recipientId: 'ship_recipient_synthetic_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'consent_synthetic_hexaship_001',
    servicePreference: 'fastest',
  });
  const ups = runCarrierCapabilityPreflight({
    connectorId: 'ups',
    countryCode: 'US',
    recipientId: 'ship_recipient_synthetic_002',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_002',
    walletConsentRef: 'consent_synthetic_hexaship_002',
    servicePreference: 'cheapest',
  });

  assert.equal(dhl.ok, true);
  assert.equal(ups.ok, true);
  if (!dhl.ok || !ups.ok) throw new Error('DHL/UPS capability preflight should succeed');
  assert.equal(dhl.body.countryCode, 'JP');
  assert.equal(ups.body.countryCode, 'US');
  assert.match(dhl.body.carrierCapabilityRef, /^carrier_capability_/);
  assert.deepEqual(dhl.body.requiredBeforeGetRates, [
    'countryCode',
    'recipientId',
    'parcelProfileRef',
    'walletConsentRef',
    'carrierCapabilityRef',
  ]);
  assert.equal(dhl.body.requiredNextAction, 'ready_for_getRates');
  assert.equal(dhl.body.productionTraffic, false);
});

test('carrier capability preflight rejects unsafe input and planned connectors', () => {
  const unsafe = runCarrierCapabilityPreflight({
    connectorId: 'dhl',
    countryCode: 'JP',
    recipientId: 'ship_recipient_synthetic_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'consent_synthetic_hexaship_001',
    nested: {
      rawAddress: 'blocked synthetic private material',
      carrierCredential: 'blocked synthetic credential',
    },
  });
  const planned = runCarrierCapabilityPreflight({
    connectorId: 'fedex',
    countryCode: 'US',
    recipientId: 'ship_recipient_synthetic_003',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_003',
    walletConsentRef: 'consent_synthetic_hexaship_003',
  });

  assert.equal(unsafe.ok, false);
  if (unsafe.ok) throw new Error('unsafe capability input should fail');
  assert.equal(unsafe.error, 'private_material_rejected');
  assert.deepEqual(unsafe.rejectedKeys?.sort(), ['carrierCredential', 'rawAddress']);
  assert.equal(planned.ok, false);
  if (planned.ok) throw new Error('planned connector should not be ready');
  assert.equal(planned.error, 'connector_not_active');
  assert.equal(planned.requiredNextAction, 'connector_not_active');
});

test('future connectors are planned behind the same connector interface', () => {
  const plan = buildCarrierConnectorLayerPlan();

  for (const connectorId of ['fedex', 'yamato', 'japan-post', 'sf-express']) {
    const connector = selectCarrierConnector(connectorId as never);
    assert.ok(connector, `${connectorId} should exist`);
    assert.equal(connector.status, 'planned');
    assert.equal(connector.serverSideOnly, true);
    assert.equal(connector.publicClientAllowed, false);
    assert.deepEqual(connector.supportedMethods, plan.normalizedMethods);
    assert.ok(connector.mappings.every(mapping => mapping.blockedInputs.includes('carrierApiKey')));
  }
});

test('connector sandbox normalizes DHL labels into Hexaship refs', () => {
  const result = runCarrierConnectorSandbox({
    connectorId: 'dhl',
    method: 'createLabel',
    shipmentRef: 'hx_ship_synthetic_001',
    rateRef: 'hx_rate_synthetic_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_001',
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('DHL connector sandbox should succeed');

  assert.equal(result.body.connectorId, 'dhl');
  assert.equal(result.body.connectorOperation, 'mydhl.shipments.create');
  assert.ok(result.body.carrierRefs.documents);
  assert.equal(result.body.serverSideOnly, true);
  assert.equal(result.body.productionTraffic, false);
  assert.ok(result.body.blockedMaterial.includes('rawAddress'));
  assert.ok(result.body.blockedMaterial.includes('carrierApiKey'));
});

test('connector sandbox normalizes UPS tracking into Hexaship refs', () => {
  const result = runCarrierConnectorSandbox({
    connectorId: 'ups',
    method: 'trackShipment',
    shipmentRef: 'hx_ship_synthetic_002',
    trackingAlias: 'hx_track_synthetic_002',
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('UPS connector sandbox should succeed');

  assert.equal(result.body.connectorId, 'ups');
  assert.equal(result.body.connectorOperation, 'ups.tracking.track');
  assert.ok(result.body.carrierRefs.trackingNumber);
  assert.match(result.body.normalizedRef, /^carrier_normalized_/);
});

test('connector sandbox rejects private carrier and address material recursively', () => {
  const result = runCarrierConnectorSandbox({
    connectorId: 'dhl',
    method: 'getRates',
    recipientId: 'aw_rec_friend_synthetic_003',
    parcelProfileRef: 'parcel_profile_ref_synthetic_003',
    nested: {
      rawAddress: 'blocked synthetic address',
      carrierApiKey: 'blocked synthetic carrier key',
      rawLabelPayload: 'blocked synthetic label',
    },
  });

  assert.equal(result.ok, false);
  if (result.ok) throw new Error('private material should be rejected');

  assert.equal(result.error, 'private_material_rejected');
  assert.deepEqual(result.rejectedKeys?.sort(), ['carrierApiKey', 'rawAddress', 'rawLabelPayload']);
});

test('connector layer docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/carrier-connector-layer.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Carrier Connector Layer/);
  assert.match(doc, /DHL Connector/);
  assert.match(doc, /UPS Connector/);
  assert.match(doc, /FedEx/);
  assert.match(doc, /ヤマト/);
  assert.match(doc, /日本郵便/);
  assert.match(doc, /SF Express/);
  assert.match(doc, /各社API差分/);
  assert.match(doc, /carrierCapabilityRef/);
  assert.match(doc, /ready_for_getRates/);
  assert.match(doc, /Real DHL\/UPS Onboarding/);
  assert.match(doc, /HEXASHIP_DHL_MYDHL_USERNAME/);
  assert.match(doc, /HEXASHIP_UPS_CLIENT_ID/);
  assert.match(doc, /carrierApiKey/);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:carrier-connector-layer'], 'tsx --test src/lib/carrierConnectorLayer.test.ts');
});
