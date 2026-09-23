import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCloudDbConnectorPlan,
  buildCloudDbSyncJob,
  getCloudDbConnectorProfile,
  listCloudDbConnectorProfiles,
} from './cloudDbIntegration';
import { buildAOIDEncryptedSyncEnvelope } from './aoid';
import { buildRegisteredAddressRecord } from './registeredAddressQr';

const publicAgid = {
  id: 'JP05AV8TJGH8',
  label: 'Tokyo public AGID reference',
  countryCode: 'JP',
};

function privateAoidRecord() {
  return buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      street: '2-2 Roppongi',
      city: 'Tokyo',
      phone: '+81 3 0000 0000',
      room: '2801',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.66, lon: 139.73 },
      now: '2026-06-03T00:00:00.000Z',
    },
  );
}

function encryptedAoidEnvelope() {
  return buildAOIDEncryptedSyncEnvelope(privateAoidRecord(), {
    encryptedPayload: 'base64url.ciphertext.tag',
    ownerKeyId: 'owner-key-001',
    deviceKeyId: 'device-key-001',
    now: 1000,
  });
}

test('lists common cloud and database connector profiles', () => {
  const ids = listCloudDbConnectorProfiles().map(profile => profile.id);

  assert.ok(ids.includes('aws-s3'));
  assert.ok(ids.includes('cloudflare-r2'));
  assert.ok(ids.includes('google-cloud-storage'));
  assert.ok(ids.includes('oci-object-storage'));
  assert.ok(ids.includes('alibaba-cloud-oss'));
  assert.ok(ids.includes('tencent-cloud-cos'));
  assert.ok(ids.includes('huawei-cloud-obs'));
  assert.ok(ids.includes('baidu-ai-cloud-bos'));
  assert.ok(ids.includes('vercel-blob'));
  assert.ok(ids.includes('postgres'));
  assert.ok(ids.includes('aws-rds-postgres'));
  assert.ok(ids.includes('azure-sql'));
  assert.ok(ids.includes('oracle-autonomous-database'));
  assert.ok(ids.includes('oracle-mysql-heatwave'));
  assert.ok(ids.includes('alibaba-cloud-rds'));
  assert.ok(ids.includes('alibaba-cloud-polardb'));
  assert.ok(ids.includes('tencent-cloud-tdsql'));
  assert.ok(ids.includes('huawei-cloud-gaussdb'));
  assert.ok(ids.includes('baidu-ai-cloud-rds'));
  assert.ok(ids.includes('supabase'));
  assert.ok(ids.includes('mongodb-atlas'));
  assert.ok(ids.includes('azure-cosmos-db'));
  assert.ok(ids.includes('oracle-nosql'));
  assert.ok(ids.includes('alibaba-cloud-tablestore'));
  assert.ok(ids.includes('tencentdb-mongodb'));
  assert.ok(ids.includes('firestore'));
  assert.ok(ids.includes('bigquery'));
  assert.ok(ids.includes('snowflake'));
  assert.ok(ids.includes('oracle-analytics-cloud'));
  assert.ok(ids.includes('alibaba-cloud-analyticdb'));
  assert.ok(ids.includes('opensearch'));
  assert.ok(ids.includes('qdrant'));
  assert.ok(ids.includes('oracle-netsuite'));
  assert.ok(ids.includes('oracle-blockchain-platform'));
  assert.ok(ids.includes('dingtalk-webhook'));
  assert.ok(ids.includes('feishu-open-platform'));
  assert.ok(ids.includes('wecom-webhook'));
  assert.ok(ids.includes('upstash-redis'));
  assert.ok(ids.includes('custom-http-webhook'));
  assert.equal(getCloudDbConnectorProfile(' POSTGRES ')?.family, 'relational-db');
  assert.equal(getCloudDbConnectorProfile(' BIGQUERY ')?.family, 'analytics-warehouse');
  assert.equal(getCloudDbConnectorProfile(' ORACLE-NETSUITE ')?.family, 'enterprise-app');
  assert.equal(getCloudDbConnectorProfile(' ORACLE-BLOCKCHAIN-PLATFORM ')?.family, 'blockchain-ledger');
  assert.equal(getCloudDbConnectorProfile(' ALIBABA-CLOUD-OSS ')?.family, 'object-storage');
  assert.equal(getCloudDbConnectorProfile(' DINGTALK-WEBHOOK ')?.family, 'enterprise-app');
});

test('allows public AGID cache plans without private sync controls', () => {
  const plan = buildCloudDbConnectorPlan({
    providerId: 'cloudflare-r2',
    purpose: 'public-agid-cache',
    layer: 'AGID',
    payload: publicAgid,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.storageMode, 'public-cache');
  assert.equal(plan.targetSurface, 'public-api');
  assert.equal(plan.governance?.payloadClass, 'public-agid-reference');
  assert.ok(plan.requiredEnvVars.includes('AGID_R2_BUCKET'));
  assert.doesNotMatch(plan.requiredControls.join(' '), /owner-device-encrypted-envelope/);
});

test('blocks plaintext AOID records from cloud private sync', () => {
  const plan = buildCloudDbConnectorPlan({
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: privateAoidRecord(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('agid-aoid-governance-blocked-payload'));
  assert.ok(plan.errors.includes('aoid-sync-requires-owner-device-encrypted-envelope'));
  assert.notEqual(plan.governance?.payloadClass, 'aoid-encrypted-envelope');
  assert.ok(plan.governance?.forbiddenFields.some(field => field.endsWith('.recipient')));
});

test('requires owner consent and storage/transport encryption for AOID cloud sync', () => {
  const plan = buildCloudDbConnectorPlan({
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: encryptedAoidEnvelope(),
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('owner-consent-required'));
  assert.ok(plan.errors.includes('encrypted-at-rest-required'));
  assert.ok(plan.errors.includes('encrypted-in-transit-required'));
});

test('allows encrypted AOID envelopes after the consent and encryption gate passes', () => {
  const plan = buildCloudDbConnectorPlan({
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: encryptedAoidEnvelope(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.storageMode, 'encrypted-envelope');
  assert.equal(plan.targetSurface, 'encrypted-sync');
  assert.equal(plan.governance?.payloadClass, 'aoid-encrypted-envelope');
  assert.ok(plan.requiredControls.includes('no-server-plaintext-aoid-decryption'));
});

test('keeps analytics, search, and vector providers out of private AOID sync', () => {
  for (const providerId of ['bigquery', 'opensearch', 'qdrant']) {
    const plan = buildCloudDbConnectorPlan({
      providerId,
      purpose: 'encrypted-aoid-sync',
      entityType: 'aoid',
      payload: encryptedAoidEnvelope(),
      ownerConsent: true,
      encryptedAtRest: true,
      encryptedInTransit: true,
    });

    assert.equal(plan.allowed, false, `${providerId} must not allow encrypted AOID sync`);
    assert.ok(plan.errors.includes('provider-does-not-support-purpose'));
  }
});

test('plans Oracle service connectors without treating them as plaintext address stores', () => {
  const ociObjectPlan = buildCloudDbConnectorPlan({
    providerId: 'oci-object-storage',
    purpose: 'public-agid-cache',
    layer: 'AGID',
    payload: publicAgid,
  });
  assert.equal(ociObjectPlan.allowed, true);
  assert.ok(ociObjectPlan.requiredEnvVars.includes('AGID_OCI_BUCKET'));

  const netsuiteAuditPlan = buildCloudDbConnectorPlan({
    providerId: 'oracle-netsuite',
    purpose: 'audit-log',
    payload: {
      event: 'address_intent.verified',
      addressIntentAlias: 'aint_live_alias_001',
      commitment: 'cm_001',
    },
    encryptedInTransit: true,
  });
  assert.equal(netsuiteAuditPlan.allowed, true);
  assert.equal(netsuiteAuditPlan.provider?.family, 'enterprise-app');

  const netsuiteAoidPlan = buildCloudDbConnectorPlan({
    providerId: 'oracle-netsuite',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: encryptedAoidEnvelope(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
  });
  assert.equal(netsuiteAoidPlan.allowed, false);
  assert.ok(netsuiteAoidPlan.errors.includes('provider-does-not-support-purpose'));

  const blockchainAnchorPlan = buildCloudDbConnectorPlan({
    providerId: 'oracle-blockchain-platform',
    purpose: 'proof-bundle-registry',
    encryptedInTransit: true,
  });
  assert.equal(blockchainAnchorPlan.allowed, true);
  assert.equal(blockchainAnchorPlan.provider?.family, 'blockchain-ledger');
  assert.ok(blockchainAnchorPlan.requiredControls.includes('public-commitments-only'));
});

test('plans China-region service connectors with redacted enterprise-app boundaries', () => {
  const ossPlan = buildCloudDbConnectorPlan({
    providerId: 'alibaba-cloud-oss',
    purpose: 'public-agid-cache',
    layer: 'AGID',
    payload: publicAgid,
  });
  assert.equal(ossPlan.allowed, true);
  assert.ok(ossPlan.requiredEnvVars.includes('AGID_OSS_BUCKET'));

  const tdsqlPlan = buildCloudDbConnectorPlan({
    providerId: 'tencent-cloud-tdsql',
    purpose: 'address-verification-cache',
    payload: { countryCode: 'CN', postalCodeHash: 'pc_hash_001', source: 'carrier-cache' },
  });
  assert.equal(tdsqlPlan.allowed, true);
  assert.equal(tdsqlPlan.provider?.family, 'relational-db');

  const dingTalkAuditPlan = buildCloudDbConnectorPlan({
    providerId: 'dingtalk-webhook',
    purpose: 'audit-log',
    payload: {
      event: 'handoff.requires_review',
      addressIntentAlias: 'aint_cn_alias_001',
      commitment: 'cm_cn_001',
    },
    encryptedInTransit: true,
  });
  assert.equal(dingTalkAuditPlan.allowed, true);
  assert.equal(dingTalkAuditPlan.provider?.family, 'enterprise-app');

  const feishuAoidPlan = buildCloudDbConnectorPlan({
    providerId: 'feishu-open-platform',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    payload: encryptedAoidEnvelope(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
  });
  assert.equal(feishuAoidPlan.allowed, false);
  assert.ok(feishuAoidPlan.errors.includes('provider-does-not-support-purpose'));
});

test('builds a sync job contract without constructing provider network requests', () => {
  const job = buildCloudDbSyncJob({
    providerId: 'postgres',
    purpose: 'encrypted-aoid-sync',
    entityType: 'aoid',
    entityId: '05AV8TJGH8QZ6M2R',
    action: 'update',
    payload: encryptedAoidEnvelope(),
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    now: 1000,
  });

  assert.match(job.id, /^CLOUDDB-/);
  assert.equal(job.dispatch.networkRequestBuilt, false);
  assert.equal(job.queueRecord.audit?.surface, 'encrypted-sync');
  assert.equal(job.queueRecord.audit?.payloadClass, 'aoid-encrypted-envelope');
  assert.equal((job.queueRecord.payload as { type?: string }).type, 'AOID_SYNC_ENVELOPE');

  const serialized = JSON.stringify(job);
  assert.doesNotMatch(serialized, /Private Receiver|2801|\+81 3|35\.66|139\.73/);
});

test('rejects unsupported provider or sync action before adapter dispatch', () => {
  assert.throws(
    () => buildCloudDbSyncJob({
      providerId: 'unknown-db',
      purpose: 'public-agid-cache',
      entityType: 'savedAgid',
      entityId: 'JP05AV8TJGH8',
      action: 'update',
      payload: publicAgid,
    }),
    /not supported/i,
  );

  assert.throws(
    () => buildCloudDbSyncJob({
      providerId: 'postgres',
      purpose: 'public-agid-cache',
      entityType: 'savedAgid',
      entityId: 'JP05AV8TJGH8',
      action: 'upsert',
      payload: publicAgid,
    }),
    /create, update, or delete/i,
  );
});
