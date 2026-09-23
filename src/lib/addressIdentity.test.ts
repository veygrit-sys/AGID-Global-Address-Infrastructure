import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
ADDRESS_IDENTITY_COMPARISON,
canOwnerUpdateIdentityLayer,
canPublishIdentityLayer,
getAddressIdentityCommunicationPolicy,
getAddressIdentityPolicy,
getAddressIdentitySummary,
listAddressIdentityCommunicationPolicies,
listAddressIdentityPolicies,
} from './addressIdentity';

test('keeps AGID as a public place, address, building, and map-feature layer without private fields', () => {
  const policy = getAddressIdentityPolicy('AGID');

  assert.equal(policy.visibility, 'public');
  assert.equal(policy.subject, 'public-geographic-entity');
  assert.equal(policy.represents, 'public geographic location and non-personal place reference');
  assert.equal(policy.includesPublicAddress, true);
  assert.equal(policy.includesBuildingName, true);
  assert.equal(policy.includesUnitOrRoom, false);
  assert.equal(policy.mayIncludePersonalData, false);
  assert.equal(policy.publicLayerSafe, true);
  assert.equal(policy.mutability, 'stable-public-reference');
  assert.equal(policy.holder, 'system-governed');
  assert.equal(canPublishIdentityLayer('AGID'), true);
  assert.equal(canOwnerUpdateIdentityLayer('AGID'), false);
});

test('keeps AOID as an owner-controlled private address layer', () => {
  const policy = getAddressIdentityPolicy('AOID');

  assert.equal(policy.visibility, 'private');
  assert.equal(policy.subject, 'private-delivery-destination');
  assert.equal(policy.represents, 'private delivery and residence destination that references an AGID');
  assert.equal(policy.includesPublicAddress, true);
  assert.equal(policy.includesBuildingName, true);
  assert.equal(policy.includesUnitOrRoom, true);
  assert.equal(policy.mayIncludePersonalData, true);
  assert.equal(policy.updateAuthority, 'owner-only');
  assert.equal(policy.qrUpdateAuthority, 'owner-only');
  assert.equal(policy.mutability, 'owner-editable');
  assert.equal(policy.holder, 'user-owned');
  assert.equal(policy.referencesLayer, 'AGID');
  assert.equal(policy.publicLayerSafe, false);
  assert.equal(canPublishIdentityLayer('AOID'), false);
  assert.equal(canOwnerUpdateIdentityLayer('AOID'), true);
});

test('documents the AGID/AOID difference as a stable comparison table', () => {
  const rows = ADDRESS_IDENTITY_COMPARISON;
  const text = rows.map(row => `${row.item}: ${row.agid} / ${row.aoid}`).join('\n');

  assert.ok(rows.length >= 8);
  assert.match(text, /目的/);
  assert.match(text, /編集/);
  assert.match(text, /プライバシー/);
  assert.match(text, /保持者/);
  assert.match(text, /参照関係/);
  assert.match(text, /必ずAGIDを参照/);
});

test('summaries expose central and distributed roles without mixing layers', () => {
  const policies = listAddressIdentityPolicies();

  assert.equal(policies.length, 2);
  assert.match(getAddressIdentitySummary('AGID'), /public geographic location and non-personal place reference/);
  assert.match(getAddressIdentityPolicy('AGID').distributedRole, /SDKs and devices/);
  assert.match(getAddressIdentityPolicy('AOID').centralRole, /explicit owner consent/);
});

test('communication policy separates public AGID transport from private AOID sync', () => {
  const agid = getAddressIdentityCommunicationPolicy('AGID');
  const aoid = getAddressIdentityCommunicationPolicy('AOID');

  assert.equal(agid.defaultMode, 'public-or-local');
  assert.match(agid.sdkSurface, /encode\/decode\/cellBounds/);
  assert.match(agid.publicApiSurface, /public REST\/OpenAPI/);
  assert.ok(agid.allowedNetworkPayloads.includes('public address label'));
  assert.ok(agid.allowedNetworkPayloads.includes('public map feature name'));
  assert.ok(agid.forbiddenNetworkPayloads.includes('recipient'));

  assert.equal(aoid.defaultMode, 'local-first-private');
  assert.match(aoid.publicApiSurface, /opaque commitment or scoped reference/);
  assert.match(aoid.syncSurface, /encrypted envelope only/);
  assert.ok(aoid.allowedNetworkPayloads.includes('opaque encrypted payload'));
  assert.ok(aoid.forbiddenNetworkPayloads.includes('raw AOID private body'));
  assert.ok(aoid.forbiddenNetworkPayloads.includes('plaintext phone'));
  assert.match(aoid.ownershipRule, /owner consent/);
});

test('communication policies cover both identity layers', () => {
  assert.deepEqual(
    listAddressIdentityCommunicationPolicies().map(policy => policy.layer).sort(),
    ['AGID', 'AOID'],
  );
});
