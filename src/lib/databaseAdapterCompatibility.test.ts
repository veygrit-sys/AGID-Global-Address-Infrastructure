import assert from 'node:assert/strict';
import { test } from 'node:test';

import { listCloudDbConnectorProfiles } from './cloudDbIntegration';
import {
  getDatabaseAdapterCompatibility,
  listDatabaseAdapterCompatibility,
  summarizeDatabaseAdapterCompatibility,
  validateDatabaseAdapterCompatibility,
} from './databaseAdapterCompatibility';

test('database adapter compatibility covers every cloud DB connector plus local stores', () => {
  const compatibilityIds = new Set(listDatabaseAdapterCompatibility().map(record => record.id));
  const connectorIds = listCloudDbConnectorProfiles().map(profile => profile.id);

  assert.ok(compatibilityIds.has('memory'));
  assert.ok(compatibilityIds.has('sqlite'));

  for (const connectorId of connectorIds) {
    assert.ok(compatibilityIds.has(connectorId), `${connectorId} has a compatibility record`);
  }
});

test('runtime ledger adapters are explicit and do not imply every provider has a live store', () => {
  const summary = summarizeDatabaseAdapterCompatibility();

  assert.deepEqual(
    summary.runtimeLedgerAdapters,
    ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'],
  );
  assert.ok(summary.postgresCompatibleRuntimeAdapters.includes('neon-postgres'));
  assert.ok(summary.postgresCompatibleRuntimeAdapters.includes('supabase'));
  assert.ok(summary.postgresCompatibleRuntimeAdapters.includes('aws-rds-postgres'));
  assert.ok(summary.postgresCompatibleRuntimeAdapters.includes('google-cloud-sql-postgres'));
  assert.ok(summary.plannedRuntimeAdapters.includes('mysql'));
  assert.ok(summary.plannedRuntimeAdapters.includes('azure-sql'));
  assert.ok(summary.plannedRuntimeAdapters.includes('oracle-autonomous-database'));
  assert.ok(summary.plannedRuntimeAdapters.includes('oracle-nosql'));
  assert.ok(summary.plannedRuntimeAdapters.includes('alibaba-cloud-rds'));
  assert.ok(summary.plannedRuntimeAdapters.includes('alibaba-cloud-tablestore'));
  assert.ok(summary.plannedRuntimeAdapters.includes('tencent-cloud-tdsql'));
  assert.ok(summary.plannedRuntimeAdapters.includes('huawei-cloud-gaussdb'));
  assert.ok(summary.plannedRuntimeAdapters.includes('mongodb-atlas'));
  assert.ok(summary.plannedRuntimeAdapters.includes('azure-cosmos-db'));
  assert.ok(summary.plannedRuntimeAdapters.includes('firestore'));
  assert.ok(summary.plannedRuntimeAdapters.includes('dynamodb'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('bigquery'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('oracle-analytics-cloud'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('alibaba-cloud-analyticdb'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('opensearch'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('qdrant'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('oracle-netsuite'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('oracle-blockchain-platform'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('dingtalk-webhook'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('feishu-open-platform'));
  assert.ok(summary.connectorPlanOnlyAdapters.includes('wecom-webhook'));
  assert.ok(summary.cacheOnlyAdapters.includes('upstash-redis'));
  assert.ok(summary.cacheOnlyAdapters.includes('cloudflare-kv'));
  assert.ok(summary.objectStorageExportAdapters.includes('cloudflare-r2'));
  assert.ok(summary.objectStorageExportAdapters.includes('oci-object-storage'));
  assert.ok(summary.objectStorageExportAdapters.includes('alibaba-cloud-oss'));
  assert.ok(summary.objectStorageExportAdapters.includes('tencent-cloud-cos'));
  assert.ok(summary.objectStorageExportAdapters.includes('huawei-cloud-obs'));
  assert.ok(summary.objectStorageExportAdapters.includes('baidu-ai-cloud-bos'));
  assert.ok(summary.objectStorageExportAdapters.includes('vercel-blob'));
  assert.equal(summary.plaintextAoidAllowed, false);
});

test('privacy boundary is uniform across database and cloud adapters', () => {
  for (const record of listDatabaseAdapterCompatibility()) {
    assert.equal(record.plaintextAoidAllowed, false, `${record.id} must not allow plaintext AOID`);
    assert.ok(record.privacyControls.includes('no-plaintext-aoid-storage'), `${record.id} has AOID privacy control`);
    assert.doesNotMatch(record.recommendedFor.join(' '), /plaintext AOID/i, `${record.id} recommendations stay privacy safe`);
  }
});

test('durable runtime adapters point to concrete schema contracts', () => {
  assert.ok(getDatabaseAdapterCompatibility('sqlite')?.schemaRefs.includes('db/address-resolution-ledger.sqlite.sql'));
  assert.ok(getDatabaseAdapterCompatibility('sqlite')?.schemaRefs.includes('db/agid-registry.sqlite.sql'));
  assert.ok(getDatabaseAdapterCompatibility('postgres')?.schemaRefs.includes('db/address-resolution-ledger.postgres.sql'));
  assert.ok(getDatabaseAdapterCompatibility('postgres')?.schemaRefs.includes('db/agid-registry.postgres.sql'));
  assert.ok(getDatabaseAdapterCompatibility('neon-postgres')?.schemaRefs.includes('db/agid-registry.postgres.sql'));
  assert.ok(getDatabaseAdapterCompatibility('mongodb')?.schemaRefs.includes('db/address-resolution-ledger.mongodb.md'));

  const redis = getDatabaseAdapterCompatibility('redis');
  assert.equal(redis?.runtimeLedgerStoreMode, 'redis');
  assert.ok(redis?.notRecommendedFor.some(item => /only copy of revocation state/i.test(item)));
});

test('compatibility catalog validates against cloud profiles and runtime modes', () => {
  const validation = validateDatabaseAdapterCompatibility();

  assert.equal(validation.valid, true, validation.errors.join(', '));
  assert.deepEqual(validation.runtimeLedgerStoreModes, ['memory', 'mongodb', 'postgres', 'redis', 'sqlite']);
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('postgres'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('mongodb'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('bigquery'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('aws-rds-postgres'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('oracle-netsuite'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('alibaba-cloud-oss'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('dingtalk-webhook'));
  assert.ok(validation.cloudDbConnectorProfileCoverage.includes('custom-http-webhook'));
});
