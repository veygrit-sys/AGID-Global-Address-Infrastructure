import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createInMemoryAgidRegistryApiStore } from './agidRegistryApi';
import {
  buildDbLedgerEventRow,
  buildDbRegistryMirrorRecords,
  buildDbSyncOutboxRecord,
  evaluateDbLedgerRegistryReadiness,
  listDbLedgerRegistryTablePlan,
} from './dbLedgerRegistryIntegration';
import { buildSyncQueueRecord } from './syncQueue';

const POSTGRES_SCHEMA_REFS = [
  'db/address-resolution-ledger.postgres.sql',
  'db/agid-registry.postgres.sql',
  'db/spatial-address-index.postgres.sql',
  'db/address-offline-sync-crdt.postgres.sql',
];

test('production DB readiness requires TLS, migrations, least-privilege roles, audit, ledger, and registry gates', () => {
  const readiness = evaluateDbLedgerRegistryReadiness({
    adapterId: 'postgres',
    environment: 'production',
    tls: { required: true, verified: true, caRef: 'secret:agid-db-ca' },
    roles: {
      appRole: 'agid_app',
      readRole: 'agid_readonly',
      migrationRole: 'agid_migration',
      adminRole: 'agid_admin',
      leastPrivilege: true,
    },
    migrations: {
      runner: 'agid-migrate',
      appliedMigrationIds: ['20260624_db_ledger_registry'],
      appliedSchemaRefs: POSTGRES_SCHEMA_REFS,
    },
    audit: {
      enabled: true,
      table: 'agid_registry_audit_event',
      retentionDays: 400,
      actorRequired: true,
    },
    ledger: {
      enabled: true,
      appendOnly: true,
      eventHashChain: true,
    },
    registry: {
      enabled: true,
      rawMaterialAccepted: false,
    },
  });

  assert.equal(readiness.accepted, true, readiness.errors.join(', '));
  assert.equal(readiness.mode, 'production-db-contract-ready');
  assert.deepEqual(readiness.missingSchemaRefs, []);
  assert.ok(readiness.schemaRefs.includes('db/agid-registry.postgres.sql'));
  assert.ok(readiness.requiredControls.includes('verified-tls-in-production'));
  assert.ok(readiness.tablePlan.some(table => table.table === 'agid_registry_nullifier'));
});

test('production DB readiness blocks unsafe registry, missing TLS, missing migrations, and weak audit', () => {
  const readiness = evaluateDbLedgerRegistryReadiness({
    adapterId: 'postgres',
    environment: 'production',
    roles: { appRole: 'agid_app' },
    audit: { enabled: true, table: 'agid_audit', retentionDays: 30 },
    ledger: { enabled: true, appendOnly: false, eventHashChain: false },
    registry: { enabled: true, rawMaterialAccepted: true },
  });

  assert.equal(readiness.accepted, false);
  assert.ok(readiness.errors.includes('verified-tls-required-for-production-db'));
  assert.ok(readiness.errors.includes('tls-verification-required-for-production-db'));
  assert.ok(readiness.errors.includes('least-privilege-db-roles-required'));
  assert.ok(readiness.errors.includes('db-read-role-required'));
  assert.ok(readiness.errors.includes('db-migration-role-required'));
  assert.ok(readiness.errors.includes('migration-runner-required'));
  assert.ok(readiness.errors.includes('missing-applied-schema-ref:db/agid-registry.postgres.sql'));
  assert.ok(readiness.errors.includes('db-audit-retention-too-short'));
  assert.ok(readiness.errors.includes('db-audit-actor-required'));
  assert.ok(readiness.errors.includes('append-only-ledger-required'));
  assert.ok(readiness.errors.includes('ledger-event-hash-chain-required'));
  assert.ok(readiness.errors.includes('registry-must-not-accept-raw-private-material'));
});

test('ledger rows are append-only hash-chain records and reject raw private material', () => {
  const first = buildDbLedgerEventRow({
    streamId: 'delivery:abc',
    aggregateKind: 'delivery',
    aggregateId: 'delivery:abc',
    eventType: 'delivery.address_reference_verified',
    sequence: 1,
    occurredAt: '2026-06-24T00:00:00.000Z',
    actorCommitment: 'actor:commitment:carrier',
    payload: {
      addressReferenceCommitment: 'addrref:001',
      qualityScore: 0.92,
      sourceIds: ['registry-fixture'],
    },
  });
  const second = buildDbLedgerEventRow({
    streamId: 'delivery:abc',
    aggregateKind: 'delivery',
    aggregateId: 'delivery:abc',
    eventType: 'delivery.nullifier_marked_used',
    sequence: 2,
    occurredAt: '2026-06-24T00:01:00.000Z',
    previousEventHash: first.eventHash,
    payload: {
      nullifierHash: 'nullifier:001',
      scope: 'delivery',
    },
  });

  assert.equal(first.rawPrivateMaterialStored, false);
  assert.equal(second.previousEventHash, first.eventHash);
  assert.notEqual(second.eventHash, first.eventHash);
  assert.match(first.payloadHash, /^[0-9a-f]{64}$/);

  assert.throws(
    () => buildDbLedgerEventRow({
      streamId: 'delivery:private',
      aggregateKind: 'delivery',
      aggregateId: 'delivery:private',
      eventType: 'delivery.raw_address_attempted',
      sequence: 1,
      payload: {
        address: '東京都千代田区丸の内1-1',
        recipient: 'Private Receiver',
      },
    }),
    /rejected private material/i,
  );
});

test('registry mirror records preserve public registry state without private address fields', () => {
  const store = createInMemoryAgidRegistryApiStore();
  store.registerIssuer({
    issuerId: 'issuer-db',
    trustScore: 0.9,
    publicKeyCommitment: '0xPUB',
    metadataHash: '0xMETA',
  });
  store.anchorFreshnessRoot({
    freshnessRoot: '0xFRESH',
    registryId: 'registry-db',
    issuerId: 'issuer-db',
    freshUntil: '2026-06-25T00:00:00.000Z',
  });
  store.markNullifierUsed({
    nullifierHash: '0xNULLIFIER',
    scope: 'delivery',
    issuerId: 'issuer-db',
  });

  const mirror = buildDbRegistryMirrorRecords(store.snapshot(), {
    generatedAt: '2026-06-24T00:00:00.000Z',
  });
  const serialized = JSON.stringify(mirror);

  assert.equal(mirror.rawPrivateMaterialStored, false);
  assert.equal(mirror.counts.issuers, 1);
  assert.equal(mirror.counts.freshnessRoots, 1);
  assert.equal(mirror.counts.usedNullifiers, 1);
  assert.match(mirror.registryRoot, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(serialized, /recipient|phone|東京都|丸の内/i);
});

test('sync outbox stores hashes by default and rejects private payloads before DB dispatch', () => {
  const queueRecord = buildSyncQueueRecord({
    entityType: 'savedAgid',
    entityId: 'JP05AV8TJGH8',
    action: 'update',
    payload: {
      publicHandle: 'JP05AV8TJGH8',
      addressReferenceCommitment: 'addrref:001',
      countryCode: 'JP',
    },
    targetSurface: 'public-api',
    now: 1000,
  });

  const outbox = buildDbSyncOutboxRecord(queueRecord);
  assert.match(outbox.outboxId, /^DBO-/);
  assert.match(outbox.payloadHash, /^[0-9a-f]{64}$/);
  assert.equal(outbox.rawPrivateMaterialStored, false);
  assert.equal('payloadJson' in outbox, false);

  assert.throws(
    () => buildDbSyncOutboxRecord({
      ...queueRecord,
      payload: {
        address: '東京都千代田区丸の内1-1',
        recipientName: 'Private Receiver',
      },
    }),
    /sync outbox rejected private material/i,
  );
});

test('DB ledger registry table plan is explicit about no raw private material', () => {
  const plan = listDbLedgerRegistryTablePlan();

  assert.ok(plan.some(table => table.table === 'address_resolution_event' && table.role === 'append-only'));
  assert.ok(plan.some(table => table.table === 'agid_sync_outbox' && table.role === 'outbox'));
  assert.equal(plan.every(table => table.rawPrivateMaterialStored === false), true);
});
