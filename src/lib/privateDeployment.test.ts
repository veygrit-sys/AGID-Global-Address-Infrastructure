import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PRIVATE_DEPLOYMENT_MODEL_VERSION,
  buildPrivateDeploymentPlan,
  listPrivateDeploymentCapabilities,
} from './privateDeployment';

test('private deployment capabilities describe municipality, NGO, and carrier profiles', () => {
  const capabilities = listPrivateDeploymentCapabilities();

  assert.equal(capabilities.modelVersion, PRIVATE_DEPLOYMENT_MODEL_VERSION);
  assert.deepEqual(capabilities.sectors, ['municipality', 'ngo', 'carrier']);
  assert.ok(capabilities.networkModes.includes('offline-first'));
  assert.ok(capabilities.componentIds.includes('managed-zk-proof-worker'));
  assert.ok(capabilities.componentIds.includes('address-terminal-fleet'));
  assert.equal(capabilities.privacy.privateMaterialAccepted, false);
  assert.equal(capabilities.privacy.rawAddressStorage, false);
  assert.equal(capabilities.supports.ngoHumanitarianFieldOps, true);
});

test('NGO plans default to offline-first high-risk deployment without raw address storage', () => {
  const plan = buildPrivateDeploymentPlan({
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'relief-field-org',
    sector: 'ngo',
    countryCodes: ['jp', 'ph'],
    offlineSites: 8,
    expectedDailyEvents: 5000,
  });

  assert.equal(plan.accepted, true);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.sector, 'ngo');
  assert.equal(plan.deploymentProfile, 'private-ngo');
  assert.equal(plan.networkMode, 'offline-first');
  assert.equal(plan.runtimeMode, 'mode-2-zk-only');
  assert.equal(plan.storage.offlineStore, 'sqlite');
  assert.equal(plan.security.rawAddressStorage, false);
  assert.equal(plan.security.rawAgidStorage, false);
  assert.equal(plan.security.publicDashboardAllowed, false);
  assert.ok(plan.zk.proofFamilies.includes('anonymous-rate-limit'));
  assert.ok(plan.operations.launchGates.includes('high-risk-mode-enabled'));
  assert.ok(plan.components.some(component => component.id === 'offline-sync-ledger'));
  assert.ok(plan.components.every(component => component.storesRawAddress === false));
  assert.ok(plan.planRoot.length >= 32);
});

test('carrier plans add terminal, Redis, Postgres, and signed handoff controls', () => {
  const plan = buildPrivateDeploymentPlan({
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'carrier-edge-network',
    sector: 'carrier',
    countryCodes: ['US', 'CA'],
    expectedDailyEvents: 250_000,
    peakEventsPerSecond: 300,
    posTerminals: 250,
    requiresPublicDashboard: true,
  });

  assert.equal(plan.accepted, true);
  assert.equal(plan.sector, 'carrier');
  assert.equal(plan.runtimeMode, 'mode-1-server-registry');
  assert.equal(plan.scope.posTerminals, 250);
  assert.equal(plan.storage.primaryLedger, 'postgres');
  assert.equal(plan.storage.hotCache, 'redis');
  assert.equal(plan.storage.documentEvidence, 'mongodb');
  assert.equal(plan.operations.terminalFleetRequired, true);
  assert.equal(plan.security.publicDashboardAllowed, true);
  assert.ok(plan.components.some(component => component.id === 'address-terminal-fleet'));
  assert.ok(plan.components.some(component => component.id === 'signed-webhook-dispatcher'));
  assert.ok(plan.security.controls.includes('carrier-device-signature-required'));
});

test('municipality plans recommend residency controls and data residency review', () => {
  const plan = buildPrivateDeploymentPlan({
    tenantId: 'city-residence-registry',
    sector: 'municipality',
    countryCodes: ['JP'],
    networkMode: 'private-vpc',
    requiresZk: true,
    dataResidencyCountryCode: 'JP',
  });

  assert.equal(plan.accepted, true);
  assert.equal(plan.sector, 'municipality');
  assert.equal(plan.deploymentProfile, 'private-municipality');
  assert.equal(plan.networkMode, 'private-vpc');
  assert.equal(plan.operations.mTLSRecommended, true);
  assert.equal(plan.scope.dataResidencyCountryCode, 'JP');
  assert.ok(plan.zk.proofFamilies.includes('zk-residence'));
  assert.ok(plan.operations.launchGates.includes('issuer-trust-governance-approved'));
  assert.ok(plan.security.controls.includes('official-issuer-key-governance'));
});

test('private deployment plans reject private material and server-held witnesses', () => {
  const plan = buildPrivateDeploymentPlan({
    sector: 'carrier',
    rawAgid: 'JP05AV8TJGH8',
    witnessMode: 'server-held-witness',
    witness: {
      address: 'hidden private address',
    },
  });

  assert.equal(plan.accepted, false);
  assert.equal(plan.status, 'blocked');
  assert.match(plan.errors.join('\n'), /private-material-rejected/i);
  assert.match(plan.errors.join('\n'), /server-held-witness-forbidden/i);
  assert.equal(plan.security.privateMaterialAccepted, false);
  assert.equal(plan.zk.serverHeldWitnessAllowed, false);
});
