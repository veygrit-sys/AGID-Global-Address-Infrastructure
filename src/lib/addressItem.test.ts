import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressItem,
  createInMemoryAddressItemStore,
  evaluateAddressItemScope,
  listAddressItemCapabilities,
} from './addressItem';
import { buildAddressLinkSession } from './addressLink';

test('Address Item persists one Address Link connection without raw address material', () => {
  const link = buildAddressLinkSession({
    surface: 'pos',
    purpose: 'delivery',
    mode: 'server',
    requestedCapabilities: ['delivery-eligibility', 'coarse-region'],
    createdAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2099-06-17T00:00:00.000Z',
    evidence: {
      deliveryEligible: true,
      coarseRegion: {
        countryCode: 'JP',
        regionCode: 'JP-13',
        label: 'Tokyo',
        precision: 'region',
      },
      commitments: {
        credential: 'cred-cmt-pos-001',
        address: 'addr-cmt-pos-001',
      },
    },
  });

  const item = buildAddressItem({
    issuerId: 'issuer-city-jp',
    linkSession: link,
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
    expiresAt: '2099-06-17T00:00:00.000Z',
  });

  assert.match(item.addressItemId, /^ADI-[A-F0-9]{20}$/);
  assert.equal(item.issuerId, 'issuer-city-jp');
  assert.equal(item.status, 'active');
  assert.deepEqual(item.scopes, ['delivery:eligible', 'region:coarse']);
  assert.equal(item.credentialRef?.type, 'commitment');
  assert.equal(item.credentialRef?.ref, 'cred-cmt-pos-001');
  assert.match(item.itemRoot, /^[a-f0-9]{64}$/);
  assert.equal(item.privacy.plaintextAddressStored, false);
  assert.equal(item.privacy.rawAgidStored, false);
  assert.doesNotMatch(JSON.stringify(item), /Marunouchi|1-9-1|JP05AV8TJGH8|\+81/i);
});

test('Address Item requires a credential reference before activation', () => {
  const item = buildAddressItem({
    addressItemId: 'address-item-without-credential',
    issuerId: 'issuer-ngo',
    scopes: ['delivery:eligible'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
  });

  assert.equal(item.status, 'requires_credential');
  assert.equal(item.nextAction, 'attach_credential');
  assert.equal(item.credentialRef, null);
});

test('Address Item revocation and expiry prevent scope grants', () => {
  const revoked = buildAddressItem({
    credentialRef: { type: 'vc-ref', ref: 'vc-ref-001' },
    scopes: ['recipient:verify'],
    revocationState: 'revoked',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
  });

  assert.equal(revoked.status, 'revoked');
  const revokedEvaluation = evaluateAddressItemScope(revoked, ['recipient:verify']);
  assert.equal(revokedEvaluation.accepted, false);
  assert.equal(revokedEvaluation.deniedScopes[0]?.reason, 'address-item-status-revoked');

  const expired = buildAddressItem({
    credentialRef: { type: 'server-ref', ref: 'server-ref-001' },
    scopes: ['delivery:eligible'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
    expiresAt: '2020-01-01T00:00:00.000Z',
  });

  assert.equal(expired.status, 'expired');
  assert.equal(evaluateAddressItemScope(expired, ['delivery:eligible']).accepted, false);
});

test('Address Item refuses private material in refs or metadata', () => {
  const item = buildAddressItem({
    credentialRef: {
      ref: 'cred-cmt-001',
      credentialSecret: 'do-not-store',
    } as any,
    metadata: {
      rawAgid: 'JP05AV8TJGH8',
      phone: '+81-3-0000-0000',
    },
    scopes: ['delivery:eligible'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
  });

  assert.equal(item.status, 'error');
  assert.ok(item.errors.includes('address-item-input-contains-private-material'));
  assert.ok(item.warnings.some(warning => warning.includes('metadata.rawAgid')));
  assert.equal(evaluateAddressItemScope(item, ['delivery:eligible']).accepted, false);
});

test('Address Item grants only active and explicitly authorized scopes', () => {
  const item = buildAddressItem({
    addressItemId: 'address-item-active-001',
    issuerId: 'issuer-carrier',
    credentialRef: { type: 'zk-ref', ref: 'zk-proof-credential-ref-001' },
    scopes: ['delivery:eligible', 'recipient:verify'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:02:00.000Z',
  });

  const accepted = evaluateAddressItemScope(item, ['delivery:eligible']);
  assert.equal(accepted.accepted, true);
  assert.deepEqual(accepted.grantedScopes, ['delivery:eligible']);

  const denied = evaluateAddressItemScope(item, ['return:label']);
  assert.equal(denied.accepted, false);
  assert.equal(denied.deniedScopes[0]?.reason, 'address-item-scope-not-granted');
});

test('Address Item exposes capabilities for registry adapters and SDKs', () => {
  const capabilities = listAddressItemCapabilities();

  assert.ok(capabilities.statuses.includes('active'));
  assert.ok(capabilities.revocationStates.includes('stale'));
  assert.ok(capabilities.credentialRefTypes.includes('commitment'));
  assert.ok(capabilities.linkScopes.includes('delivery:eligible'));
  assert.equal(capabilities.privacy.rawAoidStored, false);
  assert.equal(capabilities.privacy.storesRefsAndCommitmentsOnly, true);
});

test('Address Item store can be swapped later for durable adapters', () => {
  const store = createInMemoryAddressItemStore();
  const created = store.create({
    addressItemId: 'address-item-store-001',
    issuerId: 'issuer-store',
    credentialRef: { ref: 'cred-cmt-store-001' },
    scopes: ['delivery:eligible'],
    revocationState: 'not_checked',
  });

  assert.equal(created.status, 'requires_reverification');
  assert.equal(store.get('address-item-store-001')?.issuerId, 'issuer-store');

  const updated = store.update('address-item-store-001', {
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:03:00.000Z',
  });

  assert.equal(updated?.status, 'active');
  assert.equal(store.evaluate('address-item-store-001', ['delivery:eligible'])?.accepted, true);
  assert.equal(store.listRecent(1)[0]?.addressItemId, 'address-item-store-001');
});
