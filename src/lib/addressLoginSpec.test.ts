import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_LOGIN_ENDPOINTS,
  ADDRESS_LOGIN_MERCHANT_FEATURES,
  ADDRESS_LOGIN_REQUIREMENTS,
  ADDRESS_LOGIN_USER_EXPERIENCE_STEPS,
  buildAddressLoginFormCapability,
  buildAddressLoginMerchantIntegration,
  buildAddressLoginMerchantSetupPreflight,
  buildAddressLoginWebhookHmacValidator,
  requiredClaimsForAddressLogin,
  validateAddressLoginRequest,
  type AddressLoginRequest,
} from './addressLoginSpec';
import type { AddressFormat } from '../data/address_formats';

const japanFormat: AddressFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    name: 'Japanese',
    addressFormat: '〒{postalCode} {prefecture}{city}{street}',
    ordering: 'big-to-small',
    fields: [
      { key: 'postalCode', label: '郵便番号', required: true },
      { key: 'prefecture', label: '都道府県', required: true },
      { key: 'city', label: '市区町村', required: true },
      { key: 'street', label: '町名・番地', required: true },
      { key: 'building', label: '建物名' },
    ],
  },
  english: {
    name: 'English',
    addressFormat: '{street}, {city}, {prefecture} {postalCode}, Japan',
    ordering: 'small-to-big',
    fields: [
      { key: 'street', label: 'Street', required: true },
      { key: 'city', label: 'City', required: true },
      { key: 'prefecture', label: 'Prefecture', required: true },
      { key: 'postalCode', label: 'Postal code', required: true },
    ],
  },
  postalCode: {
    format: 'NNN-NNNN',
    regex: '^\\d{3}-\\d{4}$',
    api: 'japan-post',
    source: 'test-fixture',
  },
};

const hongKongNoPostcodeFormat: AddressFormat = {
  countryCode: 'HK',
  name: 'Hong Kong',
  native: {
    name: 'Chinese (Traditional)',
    addressFormat: '{district}{street}{building}',
    ordering: 'big-to-small',
    fields: [
      { key: 'district', label: '區', required: true },
      { key: 'street', label: '街道', required: true },
      { key: 'building', label: '大廈' },
    ],
  },
  english: {
    name: 'English',
    addressFormat: '{building}, {street}, {district}, Hong Kong',
    ordering: 'small-to-big',
    fields: [
      { key: 'building', label: 'Building' },
      { key: 'street', label: 'Street', required: true },
      { key: 'district', label: 'District', required: true },
    ],
  },
  postalCode: {
    format: null,
    regex: null,
    api: null,
    source: 'Hongkong Post / LandsD / CSDI (No postal codes used)',
  },
};

test('Address Login requirements include functional, privacy, security, and design-facing acceptance criteria', () => {
  const categories = new Set(ADDRESS_LOGIN_REQUIREMENTS.map(requirement => requirement.category));

  assert.ok(categories.has('functional'));
  assert.ok(categories.has('privacy'));
  assert.ok(categories.has('security'));
  assert.ok(categories.has('internationalization'));
  assert.ok(categories.has('developer-experience'));
  assert.ok(ADDRESS_LOGIN_REQUIREMENTS.every(requirement => requirement.acceptance.length > 0));
  assert.ok(ADDRESS_LOGIN_REQUIREMENTS.some(requirement => requirement.id === 'AL-I18N-002'));
});

test('Address Login public endpoint catalog forbids raw addresses', () => {
  assert.ok(ADDRESS_LOGIN_ENDPOINTS.length >= 6);
  assert.ok(ADDRESS_LOGIN_ENDPOINTS.every(endpoint => endpoint.rawAddressAllowed === false));
  assert.ok(ADDRESS_LOGIN_ENDPOINTS.some(endpoint => endpoint.path === '/address-login/authorize'));
  assert.ok(ADDRESS_LOGIN_ENDPOINTS.some(endpoint => endpoint.path === '/address-login/carrier/decrypt-request'));
});

test('carrier-decryptable shipping request requires carrier and delivery claims', () => {
  const claims = requiredClaimsForAddressLogin('shipping', 'standard', 'carrier_decryptable');
  const request: AddressLoginRequest = {
    clientId: 'merchant_test',
    redirectUri: 'https://merchant.example/callback',
    state: 'state_123',
    nonce: 'nonce_123',
    purpose: 'shipping',
    requestedClaims: claims,
    disclosureMode: 'carrier_decryptable',
    riskLevel: 'standard',
    carrierId: 'carrier_test',
    displayLanguageMode: 'native_and_english',
  };

  const validation = validateAddressLoginRequest(request);

  assert.equal(validation.valid, true);
  assert.ok(validation.requiredClaims.includes('deliverable'));
  assert.ok(validation.requiredClaims.includes('carrier_decryptable_address'));
});

test('proof-only regulated flow requires device and region proof claims', () => {
  const claims = requiredClaimsForAddressLogin('identity_verification', 'regulated', 'proof_only');
  assert.ok(claims.includes('device_bound'));
  assert.ok(claims.includes('region_membership'));
  assert.ok(claims.includes('postal_equivalent'));

  const validation = validateAddressLoginRequest({
    clientId: 'regulated_test',
    redirectUri: 'https://regulated.example/callback',
    state: 'state_456',
    nonce: 'nonce_456',
    purpose: 'identity_verification',
    requestedClaims: claims.filter(claim => claim !== 'device_bound'),
    disclosureMode: 'proof_only',
    riskLevel: 'regulated',
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.includes('device_bound')));
});

test('Address Login inherits native and English country forms from Address Element', () => {
  const capability = buildAddressLoginFormCapability({
    countryCode: 'JP',
    format: japanFormat,
    displayLanguageMode: 'native_and_english',
    includeP0GazetteerPack: true,
    includePoiGraph: true,
    includeSpatialIntelligence: true,
  });

  assert.equal(capability.countryCode, 'JP');
  assert.equal(capability.nativeInputSupported, true);
  assert.equal(capability.englishInputSupported, true);
  assert.equal(capability.bilingualInputSupported, true);
  assert.equal(capability.fallbackFormUsed, false);
  assert.ok(capability.publicFieldKeys.includes('postcode'));
  assert.ok(capability.privateFieldKeys.includes('recipient'));
  assert.ok(capability.privateFieldKeys.includes('phone'));
  assert.equal(capability.postalCode.available, true);
  assert.ok(capability.sourceRefs.includes('p0-gazetteer-pack'));
  assert.ok(capability.sourceRefs.includes('agid-poi-graph'));
  assert.ok(capability.sourceRefs.includes('address-spatial-intelligence'));
});

test('Address Login supports no-postcode countries without forcing a postal field', () => {
  const capability = buildAddressLoginFormCapability({
    countryCode: 'HK',
    format: hongKongNoPostcodeFormat,
    displayLanguageMode: 'native_and_english',
  });

  assert.equal(capability.countryCode, 'HK');
  assert.equal(capability.postalCode.available, false);
  assert.equal(capability.postalCode.format, 'not used');
  assert.ok(!capability.publicFieldKeys.includes('postcode'));
  assert.equal(capability.nativeInputSupported, true);
  assert.equal(capability.englishInputSupported, true);
});

test('Address Login has a fallback form for every unsupported country or special region', () => {
  const capability = buildAddressLoginFormCapability({
    countryCode: 'XU',
    format: null,
    displayLanguageMode: 'native_and_english',
    includeP0GazetteerPack: true,
  });

  assert.equal(capability.countryCode, 'XU');
  assert.equal(capability.fallbackFormUsed, true);
  assert.ok(capability.fieldCount >= 8);
  assert.ok(capability.nativeInputSupported);
  assert.ok(capability.englishInputSupported);
  assert.ok(capability.warnings.includes('country-specific-format-missing-fallback-form-used'));
  assert.ok(capability.sourceRefs.includes('p0-gazetteer-pack'));
});

test('Address Login user experience separates merchant, wallet, and carrier stages', () => {
  assert.equal(ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.length, 5);
  assert.deepEqual(
    ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.map(step => step.actor),
    ['merchant', 'wallet', 'wallet', 'merchant', 'carrier'],
  );
  assert.ok(ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.every(step => step.safeVisibleData.length > 0));
  assert.ok(ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.every(step => step.blockedData.length > 0));
  assert.ok(ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.some(step => step.id === 'carrier-handoff-if-needed'));
});

test('Address Login merchant control plane covers setup, policy, testing, operations, and support', () => {
  const areas = new Set(ADDRESS_LOGIN_MERCHANT_FEATURES.map(feature => feature.area));

  assert.deepEqual([...areas], ['setup', 'policy', 'testing', 'operations', 'support']);
  assert.ok(ADDRESS_LOGIN_MERCHANT_FEATURES.some(feature => feature.id === 'country-form-coverage'));
  assert.ok(ADDRESS_LOGIN_MERCHANT_FEATURES.some(feature => feature.id === 'callback-contract-gate'));
  assert.ok(ADDRESS_LOGIN_MERCHANT_FEATURES.some(feature => feature.id === 'webhook-and-audit'));
  assert.ok(ADDRESS_LOGIN_MERCHANT_FEATURES.every(feature => feature.safeOutputs.length > 0));
  assert.ok(ADDRESS_LOGIN_MERCHANT_FEATURES.every(feature => feature.blockedOutputs.length > 0));
});

test('Address Login merchant integration returns SDK, gates, webhooks, and a redacted callback preview', () => {
  const integration = buildAddressLoginMerchantIntegration({
    purpose: 'shipping',
    disclosureMode: 'carrier_decryptable',
    riskLevel: 'standard',
    countryHints: ['JP'],
    displayLanguageMode: 'native_and_english',
  });

  assert.equal(integration.validation.valid, true);
  assert.match(integration.sdkSnippet, /createAddressLogin/);
  assert.match(integration.sdkSnippet, /carrier_decryptable/);
  assert.ok(integration.requiredDashboardGates.includes('no-raw-address-callback-validator'));
  assert.ok(integration.requiredDashboardGates.includes('callback-contract-v0.1-pinned'));
  assert.ok(integration.requiredDashboardGates.includes('webhook-hmac-negative-fixture'));
  assert.equal(integration.setupPreflight.callbackUrl, 'https://merchant.example/callback');
  assert.equal(integration.setupPreflight.callbackContractVersion, integration.callbackContract.version);
  assert.ok(integration.setupPreflight.checks.every(check => check.status === 'pass'));
  assert.equal(integration.setupPreflight.testVectorCommand, 'npm run verify:address-login-spec');
  assert.ok(integration.setupPreflight.testVectorIds.includes('forbidden-callback-param-negative'));
  assert.ok(integration.setupPreflight.testVectorIds.includes('callback_forbidden_value_negative'));
  assert.ok(integration.webhookEvents.includes('address_login.result_issued'));
  assert.equal(integration.callbackContract.version, 'veygrit-address-login-callback-v0.1');
  assert.ok(integration.callbackContract.canonicalParams.includes('proof_bundle_ref'));
  assert.ok(integration.callbackContract.canonicalParams.includes('carrier_handoff_ref'));
  assert.deepEqual(integration.callbackContract.acceptedAliases.proofBundleRef, ['proof_ref']);
  assert.deepEqual(integration.callbackContract.acceptedAliases.carrierHandoffRef, ['handoff_ref']);
  assert.ok(integration.callbackContract.nonClaims.some(nonClaim => /not address resolution evidence/i.test(nonClaim)));
  assert.equal(integration.webhookHmacValidator.algorithm, 'hmac-sha256');
  assert.equal(integration.webhookHmacValidator.headerName, 'x-veygrit-signature');
  assert.equal(integration.webhookHmacValidator.negativeCaseId, 'hmac-signature-mismatch-negative');
  assert.ok(integration.webhookHmacValidator.cases.some(testCase => testCase.expected === 'pass'));
  assert.ok(integration.webhookHmacValidator.cases.some(testCase => testCase.expected === 'fail'));
  assert.equal(integration.safeCallbackPreview.status, 'approved');
  assert.equal(integration.safeCallbackPreview.publicClaims.deliverable, true);
  assert.equal(integration.safeCallbackPreview.encryptedAddressForCarrierRef, 'carrier_blob_ref_demo');
  assert.doesNotMatch(JSON.stringify(integration.safeCallbackPreview), /東京都|1-1-1|phone|recipient/i);
});

test('Address Login webhook HMAC validator includes a negative fixture without secret or address material', () => {
  const validator = buildAddressLoginWebhookHmacValidator(['address_login.result_issued']);
  const negativeCase = validator.cases.find(testCase => testCase.id === validator.negativeCaseId);

  assert.ok(negativeCase);
  assert.equal(negativeCase.expected, 'fail');
  assert.equal(validator.signingKeyRef, 'whkey_ref_demo');
  assert.ok(validator.nonClaims.some(nonClaim => /not address truth/i.test(nonClaim)));
  assert.ok(validator.nonClaims.some(nonClaim => /stop processing/i.test(nonClaim)));
  assert.ok(validator.cases.every(testCase => testCase.safeInputs.includes('payloadFingerprint')));
  assert.ok(validator.cases.every(testCase => testCase.signingKeyRef === validator.signingKeyRef));
  assert.doesNotMatch(JSON.stringify(validator.cases), /raw_address|recipient|phone|private_key|proof_secret|東京都|1-1-1/i);
});

test('Address Login merchant setup preflight fails unsafe callback URLs before live enablement', () => {
  const request = {
    clientId: 'merchant_demo',
    redirectUri: 'http://merchant.example/callback?proof_secret=leak',
    state: 'state_demo',
    nonce: 'nonce_demo',
    purpose: 'shipping',
    requestedClaims: ['address_credential_valid', 'user_approved', 'not_revoked', 'freshness', 'deliverable', 'quality_threshold'],
    disclosureMode: 'proof_only',
    riskLevel: 'standard',
  } satisfies AddressLoginRequest;
  const preflight = buildAddressLoginMerchantSetupPreflight(request);

  assert.equal(preflight.callbackContractVersion, 'veygrit-address-login-callback-v0.1');
  assert.equal(preflight.checks.find(check => check.id === 'callback-url-https')?.status, 'fail');
  assert.equal(preflight.checks.find(check => check.id === 'callback-url-forbidden-param-scan')?.status, 'fail');
  assert.match(preflight.checks.find(check => check.id === 'callback-url-forbidden-param-scan')?.detail ?? '', /proof_secret/);
});
