import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
  buildAddressScaleTopologyPlan,
  listAddressScaleArchitectureCapabilities,
} from './addressScaleArchitecture';

test('plans Redis/Postgres/Mongo topology for high-throughput multi-server address operations', () => {
  const plan = buildAddressScaleTopologyPlan({
    generatedAt: '2026-06-17T00:00:00.000Z',
    workload: 'audit-report',
    expectedDailyEvents: 2_500_000,
    peakEventsPerSecond: 700,
    multiServer: true,
    requireFlexibleEvidence: true,
    requireSpatialQuery: true,
    requireLowLatency: true,
    preferredStores: ['postgres', 'redis', 'mongodb'],
  });

  assert.equal(plan.modelVersion, ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION);
  assert.equal(plan.accepted, true);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.topology.primaryLedger, 'postgres');
  assert.equal(plan.topology.hotCache, 'redis');
  assert.equal(plan.topology.documentEvidence, 'mongodb');
  assert.ok(plan.stores.some(store => store.role === 'primary-ledger' && store.adapter === 'postgres'));
  assert.ok(plan.stores.some(store => store.role === 'read-through-cache' && store.adapter === 'redis'));
  assert.ok(plan.stores.some(store => store.role === 'document-evidence' && store.adapter === 'mongodb'));
  assert.equal(plan.bulk.workerCount, 16);
  assert.equal(plan.bulk.defaultBatchSize, 1000);
  assert.equal(plan.bulk.idempotencyKeysRequired, true);
  assert.ok(plan.bulk.jobs.some(job => job.kind === 'replay-event-log' && job.enabled));
  assert.ok(plan.indexes.postgres.some(index => /gist/i.test(index)));
  assert.equal(plan.privacy.rawAddressStorage, false);
  assert.equal(plan.privacy.plaintextAoidAllowed, false);
});

test('shortens caches and keeps local sync explicit for high-risk offline POS', () => {
  const plan = buildAddressScaleTopologyPlan({
    generatedAt: '2026-06-17T00:00:00.000Z',
    workload: 'pos-handoff',
    peakEventsPerSecond: 60,
    offlinePos: true,
    highRiskMode: true,
    cacheClasses: ['terminal-session', 'revocation-freshness', 'nullifier-used'],
  });

  assert.equal(plan.accepted, true);
  assert.equal(plan.status, 'attention');
  assert.equal(plan.topology.mode, 'high-risk');
  assert.equal(plan.topology.offlineStore, 'sqlite');
  assert.ok(plan.stores.some(store => store.role === 'offline-cache' && store.adapter === 'sqlite'));
  assert.equal(plan.bulk.defaultBatchSize, 50);
  assert.ok(plan.bulk.jobs.some(job => job.kind === 'sync-offline-pos' && job.enabled));
  for (const policy of plan.cache.policies) {
    assert.ok(policy.ttlSeconds <= 60);
    assert.equal(policy.highRiskOverride?.rawPayloadCache, false);
  }
});

test('rejects private address, AGID, AOID, and proof material in scale planning input', () => {
  const plan = buildAddressScaleTopologyPlan({
    workload: 'address-resolution',
    peakEventsPerSecond: 30,
    rawAddress: '1 private street',
    agid: 'AGID-SECRET',
    proofCode: '123456',
  } as any);

  assert.equal(plan.accepted, false);
  assert.equal(plan.status, 'blocked');
  assert.ok(plan.errors.some(error => error.includes('private-material-rejected')));
  assert.equal(plan.privacy.rawPayloadStorage, false);
});

test('capabilities describe Redis, Postgres, MongoDB, bulk jobs, cache classes, and privacy', () => {
  const capabilities = listAddressScaleArchitectureCapabilities();

  assert.equal(capabilities.modelVersion, ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION);
  assert.ok(capabilities.workloads.includes('address-resolution'));
  assert.equal(capabilities.stores.postgres.role, 'primary-ledger');
  assert.equal(capabilities.stores.redis.role, 'read-through-cache');
  assert.equal(capabilities.stores.mongodb.role, 'document-evidence');
  assert.ok(capabilities.bulkJobs.includes('rebuild-materialized-view'));
  assert.ok(capabilities.cacheClasses.includes('revocation-freshness'));
  assert.equal(capabilities.privacy.cacheStoresRawPayload, false);
  assert.equal(capabilities.adapterCompatibility.plaintextAoidAllowed, false);
});
