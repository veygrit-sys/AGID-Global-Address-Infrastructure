import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ADDRESS_WALLET_FRIEND_DELIVERY_VERSION } from './addressWalletFriendDelivery';
import { ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION } from './addressWalletCarrierCountryForms';
import { ADDRESS_WALLET_RECIPIENT_ID_VERSION } from './addressWalletRecipientId';
import {
  VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS,
  VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION,
  buildVeyIdAddressWalletPassExportAudit,
  buildVeyIdAddressWalletFoundation,
  validateVeyIdAddressWalletPassExportAudit,
  validateVeyIdAddressWalletFoundation,
} from './veyIdAddressWalletFoundation';

test('Vey ID / Address Wallet foundation validates as an integrated product surface', () => {
  const plan = buildVeyIdAddressWalletFoundation();

  assert.equal(plan.version, VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION);
  assert.equal(plan.productName, 'Vey ID / Address Wallet');
  assert.deepEqual(validateVeyIdAddressWalletFoundation(plan), []);
  assert.equal(plan.linkedPrimitives.recipientIdVersion, ADDRESS_WALLET_RECIPIENT_ID_VERSION);
  assert.equal(plan.linkedPrimitives.friendDeliveryVersion, ADDRESS_WALLET_FRIEND_DELIVERY_VERSION);
  assert.equal(plan.linkedPrimitives.carrierCountryFormsVersion, ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION);
});

test('foundation fixes Google/Apple account creation and address-wallet OS navigation', () => {
  const plan = buildVeyIdAddressWalletFoundation();

  assert.deepEqual(plan.accountCreationPolicy.allowedProviders, ['google', 'apple']);
  assert.equal(plan.accountCreationPolicy.passwordSignupEnabled, false);
  assert.equal(plan.accountCreationPolicy.emailPasswordSignupEnabled, false);
  assert.equal(plan.accountCreationPolicy.phoneSignupEnabled, false);
  assert.equal(plan.accountCreationPolicy.passkeyPurpose, 'step-up-only');
  assert.deepEqual(plan.walletOsNavigation.sideMenu, ['Home', 'Friends', 'Store', 'My Page']);
  assert.deepEqual(plan.walletOsNavigation.storeSections, ['Topics', 'Discover', 'My Stores']);
  for (const section of ['My Address', 'Spare Address', 'QR', 'Recent Deliveries', 'Recent Stores']) {
    assert.ok(plan.walletOsNavigation.homeSections.includes(section));
  }
  for (const section of ['Profile', 'Payment Methods', 'Notifications', 'Help', 'Settings']) {
    assert.ok(plan.walletOsNavigation.myPageSections.includes(section));
  }
});

test('foundation covers authentication, address IDs, friend delivery, approval, wallet passes, and QR', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const capabilityIds = new Set(plan.capabilities.map(capability => capability.id));

  for (const expected of [
    'user-authentication',
    'address-id-management',
    'friend-delivery',
    'address-disclosure-approval',
    'apple-wallet-pass-foundation',
    'google-wallet-pass-foundation',
    'qr-handoff-foundation',
  ]) {
    assert.ok(capabilityIds.has(expected as never), `${expected} should be present`);
  }

  const flow = plan.endToEndFlow.join('\n');
  const userAuth = plan.capabilities.find(capability => capability.id === 'user-authentication');

  assert.ok(userAuth?.safeOutputs.includes('authorizationCodeRef'));
  assert.ok(userAuth?.safeOutputs.includes('accessTokenRef'));
  assert.ok(userAuth?.safeOutputs.includes('idTokenRef'));
  assert.ok(userAuth?.safeOutputs.includes('addressCredentialRef'));
  assert.ok(userAuth?.releaseGates.includes('pairwise-subject-alias-required'));
  assert.match(flow, /creates or opens Vey ID/);
  assert.match(flow, /Google or Apple/);
  assert.match(flow, /authorizationCodeRef/);
  assert.match(flow, /PKCE/);
  assert.match(flow, /recipient_id/);
  assert.match(flow, /friend-delivery request/);
  assert.match(flow, /DHL\/UPS country form/);
  assert.match(flow, /carrier capability next action/);
  assert.match(flow, /walletConsentRef/);
  assert.match(flow, /Apple Wallet, Google Wallet, or QR token/);
  assert.match(flow, /Hexaship creates ShipmentIntent/);
});

test('capabilities keep raw address, proof, private key, and carrier credentials out of public surfaces', () => {
  const plan = buildVeyIdAddressWalletFoundation();

  for (const capability of plan.capabilities) {
    assert.ok(capability.blockedMaterial.includes('rawAddress'), `${capability.id} blocks rawAddress`);
    assert.ok(capability.blockedMaterial.includes('recipientPhone'), `${capability.id} blocks recipientPhone`);
    assert.ok(capability.blockedMaterial.includes('proofWitness'), `${capability.id} blocks proofWitness`);
    assert.ok(capability.blockedMaterial.includes('privateKey'), `${capability.id} blocks privateKey`);
    assert.ok(capability.blockedMaterial.includes('carrierApiKey'), `${capability.id} blocks carrierApiKey`);
    assert.doesNotMatch(JSON.stringify(capability.safeOutputs), /rawAddress|recipientPhone|proofWitness|privateKey|carrierApiKey/);
  }
});

test('privacy threat boundary gates bind capabilities to safe evidence refs', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const capabilityIds = new Set(plan.capabilities.map(capability => capability.id));
  const boundaries = new Map(plan.privacyThreatBoundaryGates.map(boundary => [boundary.id, boundary]));

  assert.deepEqual([...boundaries.keys()], [
    'merchant-visible-redaction',
    'consent-bound-carrier-handoff',
    'wallet-pass-short-lived-ref',
    'carrier-preflight-sandbox-only',
  ]);

  for (const boundary of plan.privacyThreatBoundaryGates) {
    assert.ok(boundary.appliesTo.length, `${boundary.id} applies to at least one capability`);
    assert.ok(boundary.requiredBlockedMaterial.includes('rawAddress'), `${boundary.id} blocks rawAddress`);
    assert.ok(boundary.requiredBlockedMaterial.includes('proofWitness'), `${boundary.id} blocks proofWitness`);
    assert.ok(boundary.releaseGates.length, `${boundary.id} has release gates`);
    assert.ok(boundary.nonClaims.length, `${boundary.id} has non-claims`);
    assert.doesNotMatch(JSON.stringify(boundary.safeEvidenceRefs), /rawAddress|recipientPhone|proofWitness|proofSecret|privateKey|carrierApiKey/);

    for (const capabilityId of boundary.appliesTo) {
      assert.ok(capabilityIds.has(capabilityId), `${boundary.id} references known capability ${capabilityId}`);
      const capability = plan.capabilities.find(item => item.id === capabilityId);
      for (const material of boundary.requiredBlockedMaterial) {
        assert.ok(capability?.blockedMaterial.includes(material), `${capabilityId} blocks ${material} for ${boundary.id}`);
      }
    }
  }

  assert.ok(boundaries.get('merchant-visible-redaction')?.safeEvidenceRefs.includes('pairwiseSubjectAlias'));
  assert.ok(boundaries.get('consent-bound-carrier-handoff')?.safeEvidenceRefs.includes('carrierHandoffRef'));
  assert.ok(boundaries.get('wallet-pass-short-lived-ref')?.safeEvidenceRefs.includes('qrTokenRef'));
  assert.ok(boundaries.get('carrier-preflight-sandbox-only')?.safeEvidenceRefs.includes('productionTraffic:false'));
});

test('foundation links Address Wallet carrier-form preflight readiness previews', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const readyPreview = plan.carrierPreflightReadinessPreview.find(preview => preview.activeNextAction === 'ready_for_hexaship_createShipment');
  const capabilityPreview = plan.carrierPreflightReadinessPreview.find(preview => preview.activeNextAction === 'run_carrier_capability_check');

  assert.ok(readyPreview, 'ready preview should be present');
  assert.ok(capabilityPreview, 'capability-check preview should be present');
  assert.equal(readyPreview?.carrier, 'dhl');
  assert.equal(readyPreview?.countryCode, 'JP');
  assert.equal(capabilityPreview?.carrier, 'ups');
  assert.equal(capabilityPreview?.countryCode, 'US');
  assert.deepEqual(capabilityPreview?.activeMissingRefs, ['carrierCapabilityRef']);
  for (const preview of plan.carrierPreflightReadinessPreview) {
    assert.equal(preview.productionTraffic, false);
    assert.equal(preview.privateMaterialExposed, false);
    assert.doesNotMatch(JSON.stringify(preview), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofWitnessValue|privateKeyValue/);
  }
});

test('Apple Wallet, Google Wallet, and QR artifacts are short-lived refs, not raw address containers', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const artifacts = new Map(plan.walletPassArtifacts.map(artifact => [artifact.id, artifact]));

  for (const id of ['apple-wallet-pass', 'google-wallet-pass', 'qr-token']) {
    const artifact = artifacts.get(id as never);
    assert.ok(artifact, `${id} should be present`);
    assert.ok(artifact.safePayloadRefs.some(ref => ref.endsWith('Ref') || ref === 'recipient_id' || ref === 'expiry'));
    assert.ok(artifact.blockedPayload.includes('rawQrPayload'));
    assert.match(artifact.expiryPolicy, /Short-lived|Minutes/i);
    assert.match(artifact.rotationPolicy, /Rotate|rotat|invalidates/i);
    assert.doesNotMatch(JSON.stringify(artifact.safePayloadRefs), /rawAddress|selectedAddressBody|proofWitness|privateKey/);
  }
});

test('wallet pass export audit keeps Apple Wallet, Google Wallet, and QR payloads ref-only', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const audit = buildVeyIdAddressWalletPassExportAudit(plan);
  const artifacts = new Map(audit.artifacts.map(artifact => [artifact.artifactId, artifact]));

  assert.equal(audit.version, VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION);
  assert.equal(audit.artifactCount, 3);
  assert.equal(audit.localOnly, true);
  assert.equal(audit.productionTraffic, false);
  assert.equal(audit.privateMaterialExposed, false);
  assert.deepEqual(audit.forbiddenValueMarkers, [...VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS]);
  assert.deepEqual(audit.validationErrors, []);
  assert.deepEqual(validateVeyIdAddressWalletPassExportAudit(audit), []);
  assert.deepEqual([...artifacts.keys()], ['apple-wallet-pass', 'google-wallet-pass', 'qr-token']);

  for (const artifact of audit.artifacts) {
    assert.equal(artifact.localOnly, true);
    assert.equal(artifact.productionTraffic, false);
    assert.equal(artifact.privateMaterialExposed, false);
    assert.ok(artifact.safePayloadRefs.includes('expiry'));
    assert.ok(artifact.blockedPayload.includes('rawQrPayload'));
    assert.ok(artifact.nonClaims.some(nonClaim => /not raw address disclosure/i.test(nonClaim)));
    assert.deepEqual(artifact.forbiddenValueMarkersFound, []);
    assert.doesNotMatch(JSON.stringify(artifact.safePayloadRefs), /rawAddress|recipientPhone|proofWitness|proofSecret|privateKey|devicePrivateKey|carrierApiKey|carrierCredential|rawQrPayload|unscopedPassPayload/);
  }

  const unsafePlan: typeof plan = {
    ...plan,
    walletPassArtifacts: plan.walletPassArtifacts.map((artifact, index) => (
      index === 0
        ? { ...artifact, safePayloadRefs: [...artifact.safePayloadRefs, 'rawAddressValue'] }
        : artifact
    )),
  };
  const unsafeAudit = buildVeyIdAddressWalletPassExportAudit(unsafePlan);

  assert.equal(unsafeAudit.privateMaterialExposed, true);
  assert.ok(unsafeAudit.validationErrors.includes('pass-export-unsafe-safe-payload-ref:apple-wallet-pass:rawAddressValue'));
  assert.ok(unsafeAudit.validationErrors.includes('pass-export-private-value-marker:apple-wallet-pass:rawAddressValue'));
});

test('wallet pass export fixture and schema pin the executable audit contract', () => {
  const plan = buildVeyIdAddressWalletFoundation();
  const audit = buildVeyIdAddressWalletPassExportAudit(plan);
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/vey-id-address-wallet-pass-export-v0.1.json', 'utf8')) as {
    $schema: string;
    fixtureId: string;
    status: string;
    source: {
      builder: string;
      verifier: string;
    };
    boundaryGateId: string;
    privacy: {
      localOnly: boolean;
      productionTraffic: boolean;
      containsRawAddress: boolean;
      privateMaterialExposed: boolean;
    };
    audit: typeof audit;
  };
  const schema = JSON.parse(readFileSync('docs/specs/schemas/vey-id-address-wallet-pass-export-v0.1.schema.json', 'utf8')) as {
    properties: Record<string, {
      const?: unknown;
      properties?: Record<string, {
        const?: unknown;
        properties?: Record<string, { const?: unknown }>;
      }>;
    }>;
  };

  assert.equal(fixture.$schema, '../schemas/vey-id-address-wallet-pass-export-v0.1.schema.json');
  assert.equal(fixture.fixtureId, 'vey-id-address-wallet-pass-export-v0.1');
  assert.equal(fixture.status, 'synthetic-local-fixture');
  assert.equal(fixture.source.builder, 'buildVeyIdAddressWalletPassExportAudit');
  assert.equal(fixture.source.verifier, 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema');
  assert.equal(fixture.boundaryGateId, 'wallet-pass-short-lived-ref');
  assert.deepEqual(fixture.privacy, {
    localOnly: true,
    productionTraffic: false,
    containsRawAddress: false,
    privateMaterialExposed: false,
  });
  assert.deepEqual(fixture.audit, audit);
  assert.equal(schema.properties.fixtureId.const, 'vey-id-address-wallet-pass-export-v0.1');
  assert.equal(schema.properties.status.const, 'synthetic-local-fixture');
  assert.equal(schema.properties.boundaryGateId.const, 'wallet-pass-short-lived-ref');
  assert.equal(schema.properties.source?.properties?.builder.const, 'buildVeyIdAddressWalletPassExportAudit');
  assert.equal(schema.properties.source?.properties?.verifier.const, 'npm run verify:vey-id-address-wallet-pass-export-fixture-schema');
  assert.equal(schema.properties.privacy?.properties?.localOnly.const, true);
  assert.equal(schema.properties.privacy?.properties?.productionTraffic.const, false);
  assert.equal(schema.properties.audit?.properties?.artifactCount.const, 3);
  assert.equal(schema.properties.audit?.properties?.localOnly.const, true);
  assert.equal(schema.properties.audit?.properties?.productionTraffic.const, false);
  assert.equal(schema.properties.audit?.properties?.privateMaterialExposed.const, false);
  assert.ok(fixture.audit.artifacts.every((artifact) => artifact.forbiddenValueMarkersFound.length === 0));
  assert.doesNotMatch(JSON.stringify(fixture.audit.artifacts.map((artifact) => artifact.safePayloadRefs)), /rawAddress|recipientPhone|proofWitness|proofSecret|privateKey|devicePrivateKey|carrierApiKey|carrierCredential|rawQrPayload|unscopedPassPayload/);
});

test('foundation docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/vey-id-address-wallet-foundation.md', 'utf8');
  const specsReadme = readFileSync('docs/specs/README.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Vey ID \/ Address Wallet/);
  assert.match(doc, /Google \/ Apple/);
  assert.match(doc, /Home \/ Friends \/ Store \/ My Page/);
  assert.match(doc, /Topics \/ Discover \/ My Stores/);
  assert.match(doc, /ユーザー認証/);
  assert.match(doc, /住所ID管理/);
  assert.match(doc, /友達配送/);
  assert.match(doc, /住所提供承認/);
  assert.match(doc, /Apple Wallet/);
  assert.match(doc, /Google Wallet/);
  assert.match(doc, /QR/);
  assert.match(doc, /carrier-form preflight/);
  assert.match(doc, /ready_for_hexaship_createShipment/);
  assert.match(doc, /run_carrier_capability_check/);
  assert.match(doc, /Privacy \/ Threat Boundary Gates/);
  assert.match(doc, /merchant-visible-redaction/);
  assert.match(doc, /consent-bound-carrier-handoff/);
  assert.match(doc, /wallet-pass-short-lived-ref/);
  assert.match(doc, /carrier-preflight-sandbox-only/);
  assert.match(doc, /pass export audit/);
  assert.match(doc, /buildVeyIdAddressWalletPassExportAudit/);
  assert.match(doc, /rawAddress/);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.match(specsReadme, /Vey ID Address Wallet pass export fixture/);
  assert.match(specsReadme, /vey-id-address-wallet-pass-export-v0\.1\.json/);
  assert.match(specsReadme, /vey-id-address-wallet-pass-export-v0\.1\.schema\.json/);
  assert.equal(packageJson.scripts?.['verify:vey-id-address-wallet-foundation'], 'tsx --test src/lib/veyIdAddressWalletFoundation.test.ts');
  assert.equal(packageJson.scripts?.['verify:vey-id-address-wallet-pass-export-fixture-schema'], 'tsx scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts');
});
