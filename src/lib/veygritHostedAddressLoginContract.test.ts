import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS,
  buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract,
  buildHostedAddressLoginMerchantVisibleRedactionDisplayContractFromCore,
  buildHostedAddressLoginMerchantVisibleRedactionCopyPayload,
  buildHostedAddressLoginWebhookKeyRotationRunbook,
  checkHostedAddressLoginMerchantVisibleRedactionContractSync,
  copyHostedAddressLoginMerchantVisibleRedactionClipboardPayload,
  runHostedAddressLoginSyntheticSmoke,
  validateHostedAddressLoginCallbackContract,
  validateHostedAddressLoginCallbackValidationVectors,
  validateHostedAddressLoginFixtureRedaction,
  validateHostedAddressLoginFixtureAgainstSchema,
  validateHostedAddressLoginMerchantVisibleRedactionDisplayContract,
  validateHostedAddressLoginWebhookContract,
  type HostedAddressLoginFixtureSet,
  type HostedAddressLoginJsonSchemaSubset,
  type HostedAddressLoginMerchantVisibleRedactionSourceContract,
} from './veygritHostedAddressLoginContract';

function loadFixtures(): HostedAddressLoginFixtureSet {
  return JSON.parse(readFileSync('docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json', 'utf8')) as HostedAddressLoginFixtureSet;
}

function loadCoreRedactionContract(): HostedAddressLoginMerchantVisibleRedactionSourceContract {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/veygrit-id-core-v0.1.json', 'utf8')) as {
    merchantVisibleRedactionDisplayContract: HostedAddressLoginMerchantVisibleRedactionSourceContract;
  };
  return fixture.merchantVisibleRedactionDisplayContract;
}

function loadHostedFixtureSchema(): HostedAddressLoginJsonSchemaSubset {
  return JSON.parse(readFileSync('docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json', 'utf8')) as HostedAddressLoginJsonSchemaSubset;
}

test('Hosted Address Login synthetic smoke runs carrier and proof-only flows', () => {
  const report = runHostedAddressLoginSyntheticSmoke(loadFixtures());

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.errors, []);
  assert.ok(report.checkedFlows.includes('carrier-decryptable-shipping'));
  assert.ok(report.checkedFlows.includes('proof-only-identity'));
  assert.ok(report.checkedFlows.includes('friend-delivery-sso-approval'));
  assert.ok(report.checkedFlows.includes('friend-delivery-merchant-scenario'));
  assert.ok(report.checkedFlows.includes('merchant-visible-redaction-display-contract'));
  assert.ok(report.endpoints.includes('POST /carrier/decrypt-request'));
  assert.ok(report.endpoints.includes('POST /friend-delivery/requests'));
  assert.ok(report.endpoints.includes('POST /friend-delivery/approvals'));
  assert.ok(report.endpoints.includes('SCENARIO /friend-delivery/merchant'));
  assert.ok(report.proofBundleRefs.includes('proof_ref_synthetic_shipping_001'));
  assert.ok(report.proofBundleRefs.includes('proof_ref_synthetic_identity_001'));
  assert.ok(report.handoffReceiptRefs.includes('handoff_receipt_ref_synthetic_shipping_001'));
  assert.ok(report.warnings.some(warning => /Synthetic vectors/i.test(warning)));
});

test('Hosted Address Login fixtures mirror merchant-visible redaction display contract', () => {
  const fixtures = loadFixtures();
  const contract = fixtures.merchantVisibleRedactionDisplayContract;
  const shippingResult = fixtures.addressLoginResults.find(result => result.id === 'result_shipping_carrier_decryptable');
  const errors = validateHostedAddressLoginMerchantVisibleRedactionDisplayContract(fixtures);

  assert.deepEqual(errors, []);
  assert.ok(shippingResult);
  assert.equal(contract.sourceFixture, 'docs/specs/fixtures/veygrit-id-core-v0.1.json#merchantVisibleRedactionDisplayContract');
  assert.equal(contract.sdkPackage, '@veygrit/address-login-react');
  assert.equal(contract.sdkHelper, 'createMerchantVisibleRedactionDisplayModel');
  assert.deepEqual(contract.displayFields, [
    'pairwiseSubjectAlias',
    'guestCheckoutAlias',
    'walletConsentRef',
    'addressCredentialRef',
    'carrierHandoffRef',
  ]);
  assert.equal(contract.displayRefsByField.pairwiseSubjectAlias, shippingResult.subjectAlias);
  assert.equal(contract.displayRefsByField.walletConsentRef, shippingResult.consentEnvelopeRef);
  assert.equal(contract.displayRefsByField.addressCredentialRef, shippingResult.credentialRef);
  assert.equal(contract.displayRefsByField.carrierHandoffRef, shippingResult.encryptedForCarrierRef);
  assert.match(contract.displayRefsByField.guestCheckoutAlias, /^guest_checkout_alias_synthetic_/);
  assert.equal(fixtures.merchantVisibleRedactionHostedRefSource.source, 'hosted-address-login-synthetic-flow-refs-v0.1');
  assert.equal(contract.displayRefsByField.guestCheckoutAlias, fixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias);
  assert.ok(fixtures.merchantVisibleRedactionHostedRefSource.nonClaims.length >= 2);
  assert.equal(contract.blockedClassCount, 7);
  assert.equal(contract.nonClaimCount, 1);
  assert.deepEqual(fixtures.testVectorResult.merchantVisibleRedactionDisplayContract, contract);
  assert.doesNotMatch(
    JSON.stringify(Object.values(contract.displayRefsByField)),
    /rawAddress|addressLine|recipient|phone|email|witness|proofSecret|privateKey|providerAccessToken|carrierApiKey|productionCredential/i,
  );
});

test('Hosted Address Login redaction contract is generated from Vey ID Core shape and hosted refs', () => {
  const fixtures = loadFixtures();
  const sourceContract = loadCoreRedactionContract();
  const shippingResult = fixtures.addressLoginResults.find(result => result.id === 'result_shipping_carrier_decryptable');
  assert.ok(shippingResult);
  assert.ok(shippingResult.encryptedForCarrierRef);

  const generatedContract = buildHostedAddressLoginMerchantVisibleRedactionDisplayContractFromCore(sourceContract, {
    pairwiseSubjectAlias: shippingResult.subjectAlias,
    guestCheckoutAlias: fixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias,
    walletConsentRef: shippingResult.consentEnvelopeRef,
    addressCredentialRef: shippingResult.credentialRef,
    carrierHandoffRef: shippingResult.encryptedForCarrierRef,
  });

  assert.deepEqual(generatedContract, fixtures.merchantVisibleRedactionDisplayContract);
  assert.deepEqual(generatedContract, fixtures.testVectorResult.merchantVisibleRedactionDisplayContract);
  assert.notEqual(generatedContract.displayRefsByField.pairwiseSubjectAlias, sourceContract.displayRefsByField.pairwiseSubjectAlias);
  assert.notEqual(generatedContract.displayRefsByField.carrierHandoffRef, sourceContract.displayRefsByField.carrierHandoffRef);
  assert.doesNotMatch(
    JSON.stringify(generatedContract),
    /rawAddress|addressLine|recipient|phone|email|witness|proofSecret|privateKey|providerAccessToken|carrierApiKey|productionCredential/i,
  );
});

test('Hosted Address Login redaction sync helper checks root and test-vector mirrors', () => {
  const fixtures = loadFixtures();
  const sourceContract = loadCoreRedactionContract();
  const generatedContract = buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract(fixtures, sourceContract);
  const report = checkHostedAddressLoginMerchantVisibleRedactionContractSync(fixtures, sourceContract);

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.expectedContract, fixtures.merchantVisibleRedactionDisplayContract);
  assert.deepEqual(generatedContract, fixtures.testVectorResult.merchantVisibleRedactionDisplayContract);

  const staleFixtures = JSON.parse(JSON.stringify(fixtures)) as HostedAddressLoginFixtureSet;
  staleFixtures.testVectorResult.merchantVisibleRedactionDisplayContract = {
    ...staleFixtures.testVectorResult.merchantVisibleRedactionDisplayContract,
    nonClaimCount: staleFixtures.testVectorResult.merchantVisibleRedactionDisplayContract.nonClaimCount + 1,
  };

  const staleReport = checkHostedAddressLoginMerchantVisibleRedactionContractSync(staleFixtures, sourceContract);
  assert.equal(staleReport.status, 'fail');
  assert.deepEqual(staleReport.errors, ['test-vector-contract-drift']);

  const staleSourceFixtures = JSON.parse(JSON.stringify(fixtures)) as HostedAddressLoginFixtureSet;
  staleSourceFixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias = 'guest_checkout_alias_synthetic_rotated_001';
  const staleSourceReport = checkHostedAddressLoginMerchantVisibleRedactionContractSync(staleSourceFixtures, sourceContract);
  assert.equal(staleSourceReport.status, 'fail');
  assert.deepEqual(staleSourceReport.errors, ['root-contract-drift', 'test-vector-contract-drift']);
});

test('Hosted Address Login fixture schema validator catches hosted redaction source drift', () => {
  const fixtures = loadFixtures();
  const schema = loadHostedFixtureSchema();

  assert.deepEqual(validateHostedAddressLoginFixtureAgainstSchema(fixtures, schema), []);

  const missingSourceFixtures = JSON.parse(JSON.stringify(fixtures)) as Record<string, unknown>;
  delete missingSourceFixtures.merchantVisibleRedactionHostedRefSource;
  assert.ok(
    validateHostedAddressLoginFixtureAgainstSchema(missingSourceFixtures, schema)
      .includes('$.merchantVisibleRedactionHostedRefSource:required-missing'),
  );

  const staleSourceFixtures = JSON.parse(JSON.stringify(fixtures)) as HostedAddressLoginFixtureSet;
  staleSourceFixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias = 'guest_checkout_alias_synthetic_rotated_001';
  assert.ok(
    validateHostedAddressLoginFixtureAgainstSchema(staleSourceFixtures, schema)
      .includes('$.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias:const-mismatch'),
  );
});

test('Hosted Address Login merchant-visible redaction copy payload stays ref-count only', () => {
  const fixtures = loadFixtures();
  const payload = buildHostedAddressLoginMerchantVisibleRedactionCopyPayload(fixtures.merchantVisibleRedactionDisplayContract);

  assert.equal(payload.label, 'Hosted redaction safe refs');
  assert.equal(payload.buttonLabel, 'Copy safe refs');
  assert.equal(payload.successLabel, 'Copied safe refs');
  assert.equal(payload.localOnly, true);
  assert.equal(payload.productionTraffic, false);
  assert.equal(payload.countsOnly, true);
  assert.deepEqual(payload.counts, {
    visibleRefs: 5,
    blockedClasses: 7,
    nonClaims: 1,
  });
  assert.equal(payload.displayRefs.carrierHandoffRef, fixtures.addressLoginResults[0].encryptedForCarrierRef);
  assert.match(payload.clipboardText, /visibleRefs: 5/);
  assert.match(payload.clipboardText, /blockedClasses: 7/);
  assert.match(payload.clipboardText, /nonClaims: 1/);
  assert.match(payload.clipboardText, /guestCheckoutAlias: guest_checkout_alias_synthetic_hosted_001/);
  assert.match(payload.clipboardText, /carrierHandoffRef: carrier_blob_ref_synthetic_shipping_001/);
  assert.doesNotMatch(
    payload.clipboardText,
    /copyBlockedMaterialNames|copyNonClaimText|sourceFixture|sdkHelper|rawAddress|addressLine|recipient|phone|email|witness|proofSecret|privateKey|providerAccessToken|carrierApiKey|productionCredential/i,
  );
});

test('Hosted Address Login redaction clipboard helper writes only the safe payload', async () => {
  const fixtures = loadFixtures();
  const payload = buildHostedAddressLoginMerchantVisibleRedactionCopyPayload(fixtures.merchantVisibleRedactionDisplayContract);
  const writes: string[] = [];

  const result = await copyHostedAddressLoginMerchantVisibleRedactionClipboardPayload(payload, text => {
    writes.push(text);
  });

  assert.deepEqual(writes, [payload.clipboardText]);
  assert.equal(result.status, 'copied');
  assert.equal(result.successLabel, 'Copied safe refs');
  assert.equal(result.localOnly, true);
  assert.equal(result.productionTraffic, false);
  assert.equal(result.countsOnly, true);
  assert.deepEqual(result.counts, payload.counts);
  assert.equal(result.clipboardTextLength, payload.clipboardText.length);
  assert.doesNotMatch(JSON.stringify(result), /pairwise_sub_synthetic_shipping_001|carrier_blob_ref_synthetic_shipping_001/);
  assert.doesNotMatch(
    writes[0],
    /copyBlockedMaterialNames|copyNonClaimText|sourceFixture|sdkHelper|rawAddress|addressLine|recipient|phone|email|witness|proofSecret|privateKey|providerAccessToken|carrierApiKey|productionCredential/i,
  );
});

test('Hosted Address Login fixtures expose Address Wallet friend delivery request and approval vectors', () => {
  const fixtures = loadFixtures();
  const request = fixtures.friendDeliveryRequests[0];
  const requestResult = fixtures.friendDeliveryRequestResults[0];
  const approval = fixtures.friendDeliveryApprovals[0];
  const approvalResult = fixtures.friendDeliveryApprovalResults[0];

  assert.equal(request.endpoint, 'POST /friend-delivery/requests');
  assert.equal(request.purpose, 'anonymous_shipping');
  assert.equal(request.disclosureMode, 'carrier_decryptable');
  assert.ok(request.requestedClaims.includes('carrier_decryptable_address'));
  assert.equal(requestResult.status, 'notified');
  assert.equal(approval.endpoint, 'POST /friend-delivery/approvals');
  assert.equal(approval.friendDeliveryRequestRef, requestResult.friendDeliveryRequestRef);
  assert.equal(approvalResult.status, 'approved');
  assert.equal(approvalResult.friendDeliveryRequestRef, approval.friendDeliveryRequestRef);
  assert.ok(approvalResult.carrierHandoffRef);
  assert.ok(approvalResult.deliveryReceiptRef);
  assert.equal(approvalResult.privacy.rawAddressAccepted, false);
  assert.equal(approvalResult.privacy.merchantCanDecrypt, false);
});

test('Hosted Address Login fixtures expose merchant-side Friend Delivery scenario', () => {
  const fixtures = loadFixtures();
  const scenario = fixtures.friendDeliveryMerchantScenarios[0];

  assert.equal(scenario.endpoint, 'SCENARIO /friend-delivery/merchant');
  assert.equal(scenario.purpose, 'anonymous_shipping');
  assert.equal(scenario.disclosureMode, 'carrier_decryptable_preferred');
  assert.equal(scenario.friendAlias, fixtures.friendDeliveryRequests[0].friendAlias);
  assert.equal(scenario.friendDeliveryRequestRef, fixtures.friendDeliveryRequestResults[0].friendDeliveryRequestRef);
  assert.equal(scenario.approvalRef, fixtures.friendDeliveryApprovals[0].approvalRef);
  assert.equal(scenario.carrierHandoffRef, fixtures.friendDeliveryApprovalResults[0].carrierHandoffRef);
  assert.ok(scenario.merchantVisibleRefs.includes(scenario.deliveryReceiptRef));
  assert.ok(scenario.purchaserNeverSees.includes('selectedAddressRef'));
  assert.ok(scenario.steps.findIndex(step => step.id === 'wallet-approve') < scenario.steps.findIndex(step => step.id === 'server-receive-handoff'));
  assert.doesNotMatch(JSON.stringify(scenario), /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i);
});

test('Hosted Address Login synthetic contract rejects forbidden public keys', () => {
  const fixtures = loadFixtures();
  const leaked = {
    ...fixtures,
    addressLoginResults: [
      ...fixtures.addressLoginResults,
      {
        ...fixtures.addressLoginResults[0],
        id: 'leaked_result',
        rawAddress: 'forbidden synthetic leak',
      },
    ],
  } as HostedAddressLoginFixtureSet;

  const errors = validateHostedAddressLoginFixtureRedaction(leaked);

  assert.ok(errors.includes('forbidden-public-key:rawAddress'));
  for (const key of HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS.filter(key => key !== 'rawAddress')) {
    assert.ok(!errors.includes(`forbidden-public-key:${key}`));
  }
});

test('Hosted Address Login fixtures expose the shared callback contract', () => {
  const fixtures = loadFixtures();
  const errors = validateHostedAddressLoginCallbackContract(fixtures);

  assert.deepEqual(errors, []);
  assert.equal(fixtures.callbackContract.version, 'veygrit-address-login-callback-v0.1');
  assert.ok(fixtures.callbackContract.canonicalParams.includes('proof_bundle_ref'));
  assert.ok(fixtures.callbackContract.canonicalParams.includes('carrier_handoff_ref'));
  assert.deepEqual(fixtures.callbackContract.aliases.proofBundleRef, ['proof_ref']);
  assert.deepEqual(fixtures.callbackContract.aliases.carrierHandoffRef, ['handoff_ref']);
  assert.deepEqual(fixtures.testVectorResult.callbackContract, fixtures.callbackContract);
});

test('Hosted Address Login fixtures expose offline callback validation vectors', () => {
  const fixtures = loadFixtures();
  const errors = validateHostedAddressLoginCallbackValidationVectors(fixtures);

  assert.deepEqual(errors, []);
  assert.deepEqual(fixtures.testVectorResult.callbackValidationVectors, fixtures.callbackValidationVectors);
  assert.ok(fixtures.callbackValidationVectors.some(vector => vector.expectedResult === 'accepted'));
  assert.ok(fixtures.callbackValidationVectors.some(vector => vector.expectedError === 'state_mismatch'));
  assert.ok(fixtures.callbackValidationVectors.some(vector => vector.expectedError === 'forbidden_callback_param'));
  assert.ok(fixtures.callbackValidationVectors.some(vector =>
    vector.id === 'callback_private_material_param_negative'
    && vector.expectedError === 'forbidden_callback_param'
    && Object.prototype.hasOwnProperty.call(vector.input, 'private_key')
    && Object.prototype.hasOwnProperty.call(vector.input, 'proof_secret')
  ));
  assert.ok(fixtures.callbackValidationVectors.some(vector =>
    vector.id === 'callback_forbidden_value_negative'
    && vector.expectedError === 'forbidden_callback_param'
    && vector.input.credential_ref === 'proof_secret_fixture_value'
  ));
  assert.ok(fixtures.callbackValidationVectors.some(vector => vector.expectedError === 'missing_code'));
  assert.ok(fixtures.callbackValidationVectors.some(vector =>
    vector.expectedNormalizedParams?.proof_bundle_ref === 'proof_ref_synthetic_shipping_001'
    && vector.expectedNormalizedParams?.carrier_handoff_ref === 'handoff_ref_synthetic_shipping_001'
  ));
});

test('Hosted Address Login fixtures expose webhook HMAC and idempotency contract', () => {
  const fixtures = loadFixtures();
  const errors = validateHostedAddressLoginWebhookContract(fixtures);

  assert.deepEqual(errors, []);
  assert.equal(fixtures.webhookContract.algorithm, 'hmac-sha256');
  assert.equal(fixtures.webhookContract.signatureHeader, 'x-veygrit-signature');
  assert.equal(fixtures.webhookContract.timestampHeader, 'x-veygrit-timestamp');
  assert.equal(fixtures.webhookContract.eventIdIdempotencyRequired, true);
  assert.ok(fixtures.webhookContract.keyIds.includes('whkey_fixture_2026_07'));
  assert.ok(fixtures.webhookContract.keyIds.includes('whkey_fixture_2026_08'));
  assert.ok(fixtures.webhookContract.keyIds.includes('whkey_fixture_2026_06'));
  assert.ok(fixtures.webhookContract.keyLifecycle.some(key => key.keyId === 'whkey_fixture_2026_06' && key.status === 'retired'));
  assert.deepEqual(fixtures.testVectorResult.webhookContract, fixtures.webhookContract);
  assert.deepEqual(fixtures.testVectorResult.webhookVectors, fixtures.webhookTestVectors);
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.expectedResult === 'accepted'));
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.id === 'webhook_rotated_key_valid' && vector.keyId === 'whkey_fixture_2026_08'));
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.expectedError === 'retired_key'));
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.expectedError === 'signature_mismatch'));
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.expectedError === 'duplicate_event_id'));
  assert.ok(fixtures.webhookTestVectors.some(vector => vector.expectedError === 'timestamp_replay'));
});

test('Hosted Address Login webhook key rotation runbook is backed by executable vectors', () => {
  const runbook = buildHostedAddressLoginWebhookKeyRotationRunbook(loadFixtures());

  assert.equal(runbook.version, 'veygrit-webhook-key-rotation-runbook-v0.1');
  assert.deepEqual(runbook.errors, []);
  assert.ok(runbook.activeKeyIds.includes('whkey_fixture_2026_07'));
  assert.ok(runbook.activeKeyIds.includes('whkey_fixture_2026_08'));
  assert.ok(runbook.retiredKeyIds.includes('whkey_fixture_2026_06'));
  assert.ok(runbook.overlapSeconds >= 300);
  assert.ok(runbook.phases.includes('notify-merchants-before-overlap'));
  assert.ok(runbook.phases.includes('reject-retired-key-even-when-hmac-matches'));
  assert.ok(runbook.evidenceVectorIds.includes('webhook_rotated_key_valid'));
  assert.ok(runbook.evidenceVectorIds.includes('webhook_retired_key_negative'));
});

test('Hosted Address Login synthetic smoke fails if carrier handoff is incomplete', () => {
  const fixtures = loadFixtures();
  const broken: HostedAddressLoginFixtureSet = {
    ...fixtures,
    carrierDecryptResults: [],
  };

  const report = runHostedAddressLoginSyntheticSmoke(broken);

  assert.equal(report.status, 'fail');
  assert.ok(report.errors.includes('missing-carrier-decrypt-result'));
});
