import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildVeygritEcosystemAddressBridge,
  createStorePublicationSelection,
  validateNavigationHandoff,
  validateVeygritEcosystemAddressBridge,
} from './veygritEcosystemAddressBridge';

test('ecosystem contract separates five deployables and assigns ID ownership', () => {
  const bridge = buildVeygritEcosystemAddressBridge();
  assert.equal(bridge.recommendedDeployables, 5);
  assert.deepEqual(validateVeygritEcosystemAddressBridge(bridge), []);
  assert.equal(bridge.identifiers.find(id => id.name === 'recipient_id')?.owner, 'address-wallet');
  assert.equal(bridge.identifiers.find(id => id.name === 'address_credential_ref')?.exposedTo.length, 0);
});

test('Ship can select a Store publication without carrying address data', () => {
  const selection = createStorePublicationSelection({
    merchantRef: 'merchant_ref_demo',
    storeRef: 'store_ref_shopify_demo',
    connectionRef: 'store_connection_ref_demo',
    publishToVeygritStore: true,
    catalogScope: 'selected_collections',
  });
  assert.equal(selection.status, 'enabled');
  assert.equal(selection.carriesRawAddress, false);
  assert.doesNotMatch(JSON.stringify(selection), /recipientPhone|addressLine1/);
});

test('navigation handoff is pairwise, short-lived, and return-path constrained', () => {
  const errors = validateNavigationHandoff({
    handoffRef: 'nav_handoff_demo_1234',
    from: 'address-wallet',
    to: 'veygrit-store',
    pairwiseSubjectAlias: 'pairwise_store_demo',
    returnPath: '/store/my-stores',
    expiresAt: '2026-07-18T01:10:00.000Z',
  }, new Date('2026-07-18T01:00:00.000Z'));
  assert.deepEqual(errors, []);
});

test('navigation handoff rejects open redirects and same-surface hops', () => {
  const errors = validateNavigationHandoff({
    handoffRef: 'nav_handoff_demo_1234',
    from: 'veygrit-store',
    to: 'veygrit-store',
    pairwiseSubjectAlias: 'global-user-id',
    returnPath: '//evil.example',
    expiresAt: '2026-07-18T00:59:00.000Z',
  }, new Date('2026-07-18T01:00:00.000Z'));
  assert.deepEqual(errors.sort(), ['handoff-expired', 'pairwise-subject-required', 'relative-return-path-required', 'source-and-target-must-differ'].sort());
});
