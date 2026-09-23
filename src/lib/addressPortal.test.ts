import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressPortalSafeExport,
  buildAddressPortalActionReceipt,
  buildAddressPortalPermissionTimeline,
  buildAddressPortalConnection,
  buildAddressPortalSnapshot,
  narrowAddressPortalConnectionScopes,
  revokeAddressPortalConnection,
  validateAddressPortalPayloadIsSafe,
} from './addressPortal';

test('Address Portal summarizes connections without exposing raw address material', () => {
  const snapshot = buildAddressPortalSnapshot([
    {
      participantName: 'North Star Market',
      participantType: 'merchant',
      purpose: 'delivery',
      issuerId: 'issuer-market',
      credentialRef: { ref: 'cred-cmt-market-001' },
      scopes: ['delivery:eligible', 'region:coarse'],
      revocationState: 'active',
      lastVerifiedAt: '2026-06-17T00:00:00.000Z',
      lastAccessedAt: '2026-06-17T00:05:00.000Z',
    },
    {
      participantName: 'Field Aid NGO',
      participantType: 'ngo',
      purpose: 'aid',
      issuerId: 'issuer-ngo',
      credentialRef: { ref: 'cred-cmt-ngo-001' },
      scopes: ['recipient:verify'],
      revocationState: 'stale',
    },
  ], '2026-06-17T01:00:00.000Z');

  assert.equal(snapshot.counts.total, 2);
  assert.equal(snapshot.counts.active, 1);
  assert.equal(snapshot.counts.needsReview, 1);
  assert.match(snapshot.portalRoot, /^[a-f0-9]{64}$/);
  assert.equal(snapshot.privacy.plaintextAddressDisplayed, false);
  assert.doesNotMatch(JSON.stringify(snapshot), /JP05AV8TJGH8|Marunouchi|\+81/i);
});

test('Address Portal connection exposes revoke and deletion actions by status', () => {
  const connection = buildAddressPortalConnection({
    participantName: 'Carrier Alpha',
    participantType: 'carrier',
    issuerId: 'issuer-carrier',
    credentialRef: { type: 'server-ref', ref: 'carrier-ref-001' },
    scopes: ['delivery:eligible', 'recipient:verify'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(connection.item.status, 'active');
  assert.ok(connection.allowedActions.includes('revoke'));
  assert.ok(connection.allowedActions.includes('delete_data'));
  assert.equal(connection.scopeEvaluation.accepted, true);

  const revoked = revokeAddressPortalConnection(connection);
  assert.equal(revoked.item.status, 'revoked');
  assert.ok(!revoked.allowedActions.includes('revoke'));
  assert.ok(revoked.allowedActions.includes('delete_data'));
  assert.equal(revoked.scopeEvaluation.accepted, false);
});

test('Address Portal safe export includes only refs, roots, scopes, and fingerprints', () => {
  const snapshot = buildAddressPortalSnapshot([
    {
      participantName: 'Shopping Agent',
      participantType: 'shopping-agent',
      purpose: 'delivery',
      issuerId: 'issuer-agent',
      credentialRef: { type: 'zk-ref', ref: 'zk-credential-ref-agent-001' },
      scopes: ['delivery:eligible', 'recipient:verify', 'region:coarse'],
      revocationState: 'active',
      lastVerifiedAt: '2026-06-17T00:00:00.000Z',
      lastAccessedAt: '2026-06-17T00:05:00.000Z',
      dataCategories: ['delivery eligibility', 'recipient proof', 'coarse region'],
    },
  ], '2026-06-17T01:00:00.000Z');

  const safeExport = buildAddressPortalSafeExport(snapshot, 'APE-TEST');
  const serialized = JSON.stringify(safeExport);

  assert.equal(safeExport.exportVersion, 'agid-address-portal-safe-export-v1');
  assert.equal(safeExport.privacy.rawPrivateFieldsExported, false);
  assert.equal(safeExport.connections[0]?.credentialFingerprint?.length, 32);
  assert.doesNotMatch(serialized, /"(rawAgid|rawAoid|plaintextAddress|phoneNumber|recipientSecret)"\s*:/i);
  assert.equal(validateAddressPortalPayloadIsSafe(safeExport).safe, true);
});

test('Address Portal action receipts are domain separated and do not leak raw address material', () => {
  const connection = buildAddressPortalConnection({
    participantName: 'Carrier Alpha',
    participantType: 'carrier',
    purpose: 'handoff',
    issuerId: 'issuer-carrier',
    credentialRef: { type: 'server-ref', ref: 'carrier-ref-001' },
    scopes: ['delivery:eligible', 'recipient:verify'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:00:00.000Z',
  });

  const receipt = buildAddressPortalActionReceipt(connection, 'revoke', '2026-06-17T01:00:00.000Z');
  const serialized = JSON.stringify(receipt);

  assert.match(receipt.receiptId, /^APR-[A-F0-9]{24}$/);
  assert.equal(receipt.domain, 'address-portal');
  assert.equal(receipt.action, 'revoke');
  assert.equal(receipt.privacy.rawPrivateFieldsIncluded, false);
  assert.equal(validateAddressPortalPayloadIsSafe(receipt).safe, true);
  assert.doesNotMatch(serialized, /"(rawAgid|rawAoid|plaintextAddress|phoneNumber|recipientSecret)"\s*:/i);
});

test('Address Portal permission timeline shows participant scopes and usage without private address material', () => {
  const snapshot = buildAddressPortalSnapshot([
    {
      connectionId: 'apc-carrier-alpha',
      participantName: 'Carrier Alpha',
      participantType: 'carrier',
      purpose: 'handoff',
      issuerId: 'issuer-carrier',
      credentialRef: { type: 'server-ref', ref: 'carrier-ref-001' },
      scopes: ['delivery:eligible', 'recipient:verify'],
      revocationState: 'active',
      createdAt: '2026-06-17T00:00:00.000Z',
      lastVerifiedAt: '2026-06-17T00:03:00.000Z',
      lastAccessedAt: '2026-06-17T00:05:00.000Z',
    },
    {
      connectionId: 'apc-revoked-shop',
      participantName: 'Revoked Shop',
      participantType: 'merchant',
      purpose: 'delivery',
      issuerId: 'issuer-revoked',
      credentialRef: { type: 'commitment', ref: 'revoked-ref-001' },
      scopes: ['delivery:eligible'],
      revocationState: 'revoked',
      createdAt: '2026-06-16T00:00:00.000Z',
      lastVerifiedAt: '2026-06-16T00:10:00.000Z',
    },
  ], '2026-06-17T01:00:00.000Z');

  const timeline = buildAddressPortalPermissionTimeline(snapshot);
  const serialized = JSON.stringify(timeline);

  assert.ok(timeline.some(entry => entry.event === 'permission_used' && entry.participantName === 'Carrier Alpha'));
  assert.ok(timeline.some(entry => entry.event === 'permission_revoked' && entry.participantName === 'Revoked Shop'));
  assert.equal(timeline.find(entry => entry.event === 'permission_used')?.canRevoke, true);
  assert.equal(timeline.find(entry => entry.event === 'permission_revoked')?.canRevoke, false);
  assert.equal(validateAddressPortalPayloadIsSafe(timeline).safe, true);
  assert.doesNotMatch(serialized, /"(rawAgid|rawAoid|plaintextAddress|phoneNumber|recipientSecret)"\s*:/i);
});

test('Address Portal safety validator rejects raw private payload keys', () => {
  const safety = validateAddressPortalPayloadIsSafe({
    connectionId: 'apc-unsafe',
    participantName: 'Unsafe Merchant',
    rawAddress: '1-1 Marunouchi, Tokyo',
    proofCode: '123456',
  });

  assert.equal(safety.safe, false);
  assert.deepEqual(safety.findings.sort(), ['proofCode', 'rawAddress']);
});

test('Address Portal can reduce scopes without granting new permissions', () => {
  const connection = buildAddressPortalConnection({
    participantName: 'Carrier Alpha',
    participantType: 'carrier',
    issuerId: 'issuer-carrier',
    credentialRef: { type: 'server-ref', ref: 'carrier-ref-001' },
    scopes: ['delivery:eligible', 'recipient:verify', 'return:label'],
    revocationState: 'active',
    lastVerifiedAt: '2026-06-17T00:00:00.000Z',
    dataCategories: ['delivery eligibility', 'recipient proof', 'return label'],
  });

  const narrowed = narrowAddressPortalConnectionScopes(connection, [
    'delivery:eligible',
    'region:coarse',
  ]);

  assert.deepEqual(narrowed.item.scopes, ['delivery:eligible']);
  assert.ok(!narrowed.item.scopes.includes('region:coarse'));
  assert.ok(narrowed.allowedActions.includes('reduce_scope'));
});
