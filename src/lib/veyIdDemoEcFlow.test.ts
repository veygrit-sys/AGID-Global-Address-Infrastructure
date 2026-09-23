import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEY_ID_DEMO_EC_FLOW_VERSION,
  buildVeyIdDemoEcFlow,
  validateVeyIdDemoEcFlow,
} from './veyIdDemoEcFlow';

test('Vey ID demo EC flow creates a ready guest checkout with merchant-visible refs only', () => {
  const flow = buildVeyIdDemoEcFlow();
  const validation = validateVeyIdDemoEcFlow(flow);

  assert.equal(flow.version, VEY_ID_DEMO_EC_FLOW_VERSION);
  assert.equal(flow.status, 'ready');
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(flow.accountPolicy.allowedCreationProviders, ['google', 'apple']);
  assert.equal(flow.accountPolicy.selectedProvider, 'google');
  assert.equal(flow.accountPolicy.emailPasswordSignupEnabled, false);
  assert.equal(flow.merchantPolicy.playlistCommerceStartWithoutLogin, true);
  assert.equal(flow.merchantPolicy.ecIntegrationRequiresVeyIdButtonForAddressReuse, true);
  assert.equal(flow.merchantPolicy.merchantAccountRequiredBeforeCheckout, false);
  assert.equal(flow.merchantPolicy.passwordRequiredBeforeCheckout, false);
  assert.equal(flow.merchantPolicy.canCreateAccountSilently, false);
  assert.match(flow.coreRefs.pairwiseSubjectAlias ?? '', /^pairwise_subject_/);
  assert.match(flow.coreRefs.accessTokenRef ?? '', /^vey_access_token_/);
  assert.match(flow.coreRefs.idTokenRef ?? '', /^vey_id_token_/);
  assert.match(flow.coreRefs.addressCredentialRef ?? '', /^address_credential_/);
  assert.match(flow.coreRefs.walletConsentRef ?? '', /^wallet_consent_/);
  assert.match(flow.coreRefs.guestCheckoutAlias ?? '', /^vey_guest_checkout_/);
  assert.match(flow.coreRefs.carrierHandoffRef ?? '', /^carrier_handoff_/);
  assert.equal(flow.privacy.rawAddressVisibleToMerchant, false);
  assert.equal(flow.privacy.providerTokenVisibleToMerchant, false);
  assert.equal(flow.privacy.carrierCredentialVisibleToMerchant, false);
  assert.equal(flow.privacy.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(flow.merchantVisibleRefs), /rawAddressValue|providerTokenValue|privateKeyValue|proofSecretValue|carrierApiKeyValue|sk_live_/);
});

test('Vey ID demo EC flow exposes a merchant-visible redaction affordance for UI and SDKs', () => {
  const flow = buildVeyIdDemoEcFlow();
  const affordance = flow.merchantVisibleRedactionAffordance;

  assert.equal(affordance.boundaryGateId, 'merchant-visible-redaction');
  assert.equal(affordance.boundarySource, 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates');
  assert.deepEqual(affordance.displayFields, [
    'pairwiseSubjectAlias',
    'guestCheckoutAlias',
    'walletConsentRef',
    'addressCredentialRef',
    'carrierHandoffRef',
  ]);
  assert.equal(affordance.requiredNextAction, 'create-guest-order-from-refs');
  assert.ok(affordance.displayRefs.every(ref => flow.merchantVisibleRefs.includes(ref)));
  for (const material of ['rawAddress', 'recipientName', 'recipientPhone', 'privateKey', 'proofSecret', 'carrierCredential', 'productionCredential']) {
    assert.ok(affordance.blockedMaterial.includes(material), `${material} stays blocked`);
  }
  assert.ok(affordance.nonClaims.some(nonClaim => /not raw address disclosure/i.test(nonClaim)));
  assert.doesNotMatch(JSON.stringify(affordance), /rawAddressValue|recipientPhoneValue|providerTokenValue|privateKeyValue|proofSecretValue|carrierApiKeyValue|sk_live_/);
});

test('Vey ID demo EC flow also supports Apple as an account creation provider', () => {
  const flow = buildVeyIdDemoEcFlow({ provider: 'apple' });

  assert.equal(flow.status, 'ready');
  assert.equal(flow.accountPolicy.selectedProvider, 'apple');
  assert.deepEqual(flow.accountPolicy.allowedCreationProviders, ['google', 'apple']);
  assert.equal(validateVeyIdDemoEcFlow(flow).ok, true);
});

test('Vey ID demo EC flow blocks carrier handoff when address consent is missing', () => {
  const flow = buildVeyIdDemoEcFlow({ includeAddressConsent: false });
  const validation = validateVeyIdDemoEcFlow(flow);

  assert.equal(flow.status, 'blocked');
  assert.equal(validation.ok, true);
  assert.ok(flow.errors.includes('address-credential-ref-required'));
  assert.ok(flow.errors.includes('address-scope-required-for-guest-checkout'));
  assert.equal(flow.coreRefs.addressCredentialRef, undefined);
  assert.equal(flow.coreRefs.carrierHandoffRef, undefined);
  assert.ok(flow.steps.some(step => step.nextAction === 'request-address-consent'));
  assert.equal(flow.merchantVisibleRedactionAffordance.requiredNextAction, 'request-address-wallet-consent');
  assert.doesNotMatch(flow.merchantVisibleRedactionAffordance.displayRefs.join('\n'), /address_credential_|carrier_handoff_/);
  assert.equal(flow.privacy.rawAddressVisibleToMerchant, false);
});

test('Vey ID demo EC flow documents its product boundary and verification gate', () => {
  const doc = readFileSync('docs/product/vey-id-demo-ec-flow.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.match(doc, /Vey ID Demo EC Flow/);
  assert.match(doc, /Google \/ Apple/);
  assert.match(doc, /guest checkout/i);
  assert.match(doc, /Address Wallet consent/);
  assert.match(doc, /merchant-visible-redaction/);
  assert.match(doc, /create-guest-order-from-refs/);
  assert.match(doc, /production traffic: false/);
  assert.match(doc, /npx tsx --test src\/lib\/veyIdDemoEcFlow\.test\.ts/);
  assert.equal(packageJson.scripts?.['verify:vey-id-demo-ec-flow'], 'tsx --test src/lib/veyIdDemoEcFlow.test.ts');
});
