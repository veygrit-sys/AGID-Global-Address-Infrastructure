import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildHybridEvidenceLabel,
getHybridPolicy,
getHybridSyncEntityPolicy,
getHybridWorkflowForSyncEntity,
listHybridPolicies,
resolveHybridRuntime,
} from './hybridArchitecture';

test('keeps AGID core and SDK packages portable without central dependency', () => {
  for (const workflow of ['agid-core', 'sdk-package'] as const) {
    const policy = getHybridPolicy(workflow);
    const online = resolveHybridRuntime({ workflow, online: true });
    const offline = resolveHybridRuntime({ workflow, online: false });

    assert.equal(policy.primaryAuthority, 'sdk');
    assert.equal(policy.centralRole, 'none');
    assert.equal(policy.identityLayer, 'AGID');
    assert.equal(policy.canUseSdkWithoutCentral, true);
    assert.equal(online.shouldCallCentral, false);
    assert.equal(offline.mode, 'sdk-portable');
  }
});

test('uses central quality online but keeps address work usable offline', () => {
  const online = resolveHybridRuntime({
    workflow: 'address-quality',
    online: true,
    centralConfidence: 0.92,
  });
  const offline = resolveHybridRuntime({
    workflow: 'address-quality',
    online: false,
    centralConfidence: 0.92,
  });

  assert.equal(online.shouldCallCentral, true);
  assert.equal(online.mode, 'central-verified');
  assert.equal(online.qualityTier, 'verified');
  assert.equal(offline.shouldCallCentral, false);
  assert.equal(offline.canRunOffline, true);
  assert.equal(offline.mode, 'manual-required');
});

test('postal lookup is central verified with read-through cache and local fallback', () => {
  const policy = getHybridPolicy('postal-lookup');
  const online = resolveHybridRuntime({ workflow: 'postal-lookup', online: true });
  const offline = resolveHybridRuntime({ workflow: 'postal-lookup', online: false });

  assert.equal(policy.cacheStrategy, 'read-through-cache');
  assert.equal(online.mode, 'read-through-cache');
  assert.equal(online.shouldCallCentral, true);
  assert.equal(offline.mode, 'local-first');
  assert.equal(offline.canUseSdkWithoutCentral, true);
});

test('private address sync requires opt-in and never publishes personal records', () => {
  const withoutOptIn = resolveHybridRuntime({
    workflow: 'registered-address-sync',
    online: true,
    userOptedInToSync: false,
  });
  const withOptIn = resolveHybridRuntime({
    workflow: 'registered-address-sync',
    online: true,
    userOptedInToSync: true,
  });

  assert.equal(withoutOptIn.shouldCallCentral, false);
  assert.equal(withOptIn.shouldCallCentral, true);
  assert.equal(withOptIn.privacyScope, 'private-record');
  assert.equal(withOptIn.identityLayer, 'AOID');
  assert.equal(withOptIn.sendsPersonalDataToPublicLayer, false);
});

test('sync queue entities map to hybrid policies explicitly', () => {
  assert.equal(getHybridWorkflowForSyncEntity('savedAgid'), 'agid-core');
  assert.equal(getHybridWorkflowForSyncEntity('registeredAddress'), 'registered-address-sync');
  assert.equal(getHybridWorkflowForSyncEntity('aoid'), 'registered-address-sync');
  assert.equal(getHybridSyncEntityPolicy('savedAgid').identityLayer, 'AGID');
  assert.equal(getHybridSyncEntityPolicy('aoid').identityLayer, 'AOID');
  assert.equal(getHybridSyncEntityPolicy('settings').privacyScope, 'settings');
});

test('all hybrid policies prevent public distribution of personal data', () => {
  const policies = listHybridPolicies();

  assert.ok(policies.length >= 8);
  assert.equal(policies.every(policy => policy.sendsPersonalDataToPublicLayer === false), true);
  assert.match(
    buildHybridEvidenceLabel({ workflow: 'geo-evidence', online: false, hasOpenDataPack: true }),
    /^LOCAL \/ local-first \/ Versioned open geography source pack$/,
  );
});
