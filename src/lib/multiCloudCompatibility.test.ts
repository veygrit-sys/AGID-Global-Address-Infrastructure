import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildMultiCloudCompatibilityPlan,
  getMultiCloudWorkloadMatrix,
  listCloudProviders,
  listMultiCloudServiceMappings,
  listMultiCloudWorkloads,
  renderMultiCloudCompatibilityMermaid,
  validateMultiCloudCompatibility,
} from './multiCloudCompatibility';

test('covers every workload across local, Azure, GCP, and AWS', () => {
  const providers = listCloudProviders();

  assert.deepEqual(providers, ['local', 'azure', 'gcp', 'aws']);

  for (const workload of listMultiCloudWorkloads()) {
    const matrixProviders = getMultiCloudWorkloadMatrix(workload).map(mapping => mapping.provider).sort();

    assert.deepEqual(matrixProviders, [...providers].sort(), workload);
  }

  assert.equal(listMultiCloudServiceMappings().length, listMultiCloudWorkloads().length * providers.length);
});

test('blocks provider plaintext geocoding and OCR unless explicitly allowed', () => {
  const plan = buildMultiCloudCompatibilityPlan({
    providers: ['azure', 'gcp', 'aws'],
    workloads: ['address-geocoding', 'document-ocr'],
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('provider-plaintext-disabled:azure:address-geocoding'));
  assert.ok(plan.errors.includes('provider-plaintext-disabled:gcp:address-geocoding'));
  assert.ok(plan.errors.includes('provider-plaintext-disabled:aws:address-geocoding'));
  assert.ok(plan.errors.includes('provider-plaintext-disabled:azure:document-ocr'));
  assert.ok(plan.requiredControls.includes('no-raw-address-provider-persistence'));
  assert.ok(plan.requiredControls.includes('store-commitment-or-encrypted-envelope'));
});

test('allows encrypted object storage and relational ledgers across all clouds', () => {
  const plan = buildMultiCloudCompatibilityPlan({
    providers: ['local', 'azure', 'gcp', 'aws'],
    workloads: ['object-evidence-storage', 'relational-ledger'],
    requireAwsParity: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.errors.length, 0);
  assert.ok(plan.mappings.some(mapping => mapping.adapterRef === 'aws-s3'));
  assert.ok(plan.mappings.some(mapping => mapping.adapterRef === 'aws-rds-postgres'));
  assert.ok(plan.mappings.some(mapping => mapping.adapterRef === 'azure-blob'));
  assert.ok(plan.mappings.some(mapping => mapping.adapterRef === 'google-cloud-storage'));
  assert.ok(plan.requiredControls.includes('owner-device-or-server-side-envelope-encryption-before-upload'));
  assert.ok(plan.requiredControls.includes('no-plaintext-address-log-table'));
});

test('warns when high-risk mode uses external plaintext providers', () => {
  const plan = buildMultiCloudCompatibilityPlan({
    providers: ['azure', 'gcp', 'aws'],
    workloads: ['address-geocoding'],
    allowProviderPlaintext: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-or-encrypted-adapter:azure:address-geocoding'));
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-or-encrypted-adapter:gcp:address-geocoding'));
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-or-encrypted-adapter:aws:address-geocoding'));
});

test('records AWS parity through the dedicated AWS integration module', () => {
  const plan = buildMultiCloudCompatibilityPlan({
    providers: ['aws'],
    workloads: ['identity-access', 'key-secret-management', 'event-bus', 'api-gateway'],
    requireAwsParity: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.warnings.length, 0);
  assert.ok(plan.mappings.every(mapping => mapping.existingModule === 'src/lib/awsServiceIntegration.ts'));
  assert.ok(plan.mappings.every(mapping => mapping.status === 'adapter-ready'));
});

test('validates the compatibility matrix and Mermaid ecosystem diagram', () => {
  const report = validateMultiCloudCompatibility();
  const diagram = renderMultiCloudCompatibilityMermaid();

  assert.equal(report.errors.length, 0);
  assert.equal(report.workloadCount, listMultiCloudWorkloads().length);
  assert.ok(report.mappingCount >= 64);
  assert.match(diagram, /Azure/);
  assert.match(diagram, /GCP/);
  assert.match(diagram, /AWS/);
  assert.match(diagram, /AGID Core Contracts/);
});
