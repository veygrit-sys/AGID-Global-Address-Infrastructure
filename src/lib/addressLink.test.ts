import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession } from './addressElement';
import {
  buildAddressLinkSession,
  listAddressLinkCapabilities,
} from './addressLink';

test('Address Link grants delivery eligibility without exposing raw address material', () => {
  const elementSession = buildAddressElementSession({
    purpose: 'delivery',
    mode: 'local',
    countryCode: 'JP',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      state: true,
      city: true,
      street: true,
    },
  });

  const link = buildAddressLinkSession({
    surface: 'ec',
    purpose: 'delivery',
    mode: 'local',
    requestedCapabilities: ['delivery-eligibility'],
    evidence: {
      addressElementSession: elementSession,
      deliveryEligible: true,
      commitments: {
        address: 'addr-cmt-001',
        agid: 'agid-cmt-001',
      },
    },
  });

  assert.equal(link.status, 'ready');
  assert.deepEqual(link.grantedScopes, ['delivery:eligible']);
  assert.equal(link.publicClaims.delivery?.eligible, true);
  assert.equal(link.privacy.plaintextAddressShared, false);
  assert.equal(link.privacy.rawAgidShared, false);
  assert.doesNotMatch(JSON.stringify(link.publicClaims), /Private Receiver|\+81|Marunouchi|1-9-1|JP05AV8TJGH8/i);
});

test('Address Link requires live recipient proof before granting recipient confirmation', () => {
  const pending = buildAddressLinkSession({
    surface: 'pos',
    purpose: 'delivery',
    requestedCapabilities: ['recipient-confirmation'],
    evidence: {
      recipientProof: {
        passed: false,
        method: 'passkey',
      },
    },
  });

  assert.equal(pending.status, 'requires-proof');
  assert.equal(pending.nextAction, 'request_recipient_proof');
  assert.equal(pending.grantedScopes.length, 0);

  const granted = buildAddressLinkSession({
    surface: 'pos',
    purpose: 'delivery',
    requestedCapabilities: ['recipient-confirmation'],
    evidence: {
      recipientProof: {
        passed: true,
        method: 'passkey',
        safeFingerprint: 'proof-fp-pos-001',
      },
    },
  });

  assert.equal(granted.status, 'ready');
  assert.equal(granted.publicClaims.recipient?.controlled, true);
  assert.equal(granted.publicClaims.recipient?.method, 'passkey');
  assert.equal(granted.publicClaims.recipient?.proofFingerprint, 'proof-fp-pos-001');
});

test('Address Link grants only coarse region and rejects precise address leakage', () => {
  const link = buildAddressLinkSession({
    surface: 'shopping-agent',
    purpose: 'aid',
    requestedCapabilities: ['coarse-region'],
    evidence: {
      coarseRegion: {
        countryCode: 'JP',
        regionCode: 'JP-01',
        label: 'Hokkaido',
        precision: 'region',
      },
    },
  });

  assert.equal(link.status, 'ready');
  assert.equal(link.publicClaims.region?.countryCode, 'JP');
  assert.equal(link.publicClaims.region?.regionCode, 'JP-01');
  assert.equal(link.publicClaims.region?.precision, 'region');
  assert.doesNotMatch(JSON.stringify(link.publicClaims), /latitude|longitude|house|room|JP05AV8TJGH8/i);

  const rejected = buildAddressLinkSession({
    surface: 'shopping-agent',
    purpose: 'aid',
    requestedCapabilities: ['coarse-region'],
    evidence: {
      coarseRegion: { countryCode: 'JP' },
      rawAgid: 'JP05AV8TJGH8',
    } as any,
  });

  assert.equal(rejected.status, 'rejected');
  assert.ok(rejected.errors.includes('address-link-evidence-contains-private-material'));
});

test('Address Link high-risk mode shortens expiry and keeps warnings visible', () => {
  const link = buildAddressLinkSession({
    surface: 'cms',
    purpose: 'aid',
    mode: 'zk',
    highRiskMode: true,
    createdAt: '2026-06-17T00:00:00.000Z',
    expiresAt: '2026-06-17T02:00:00.000Z',
    requestedCapabilities: ['coarse-region', 'address-quality'],
    evidence: {
      coarseRegion: {
        countryCode: 'UA',
        precision: 'country',
      },
      qualityDecision: 'partial',
    },
  });

  assert.equal(link.expiresAt, '2026-06-17T00:05:00.000Z');
  assert.ok(link.warnings.includes('address-link-high-risk-mode-uses-short-expiry-and-minimum-disclosure'));
  assert.ok(link.warnings.includes('address-link-high-risk-region-should-remain-coarse'));
  assert.equal(link.publicClaims.quality?.decision, 'partial');
});

test('Address Link exposes capabilities and privacy boundary for embeds', () => {
  const capabilities = listAddressLinkCapabilities();

  assert.ok(capabilities.surfaces.includes('ec'));
  assert.ok(capabilities.surfaces.includes('shopping-agent'));
  assert.ok(capabilities.capabilities.includes('delivery-eligibility'));
  assert.ok(capabilities.scopes.includes('recipient:verify'));
  assert.equal(capabilities.privacy.rawAoidShared, false);
  assert.ok(capabilities.forbiddenPublicMaterial.includes('exact-coordinates'));
});
