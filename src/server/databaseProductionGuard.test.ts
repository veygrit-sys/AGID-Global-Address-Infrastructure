import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateDatabaseProductionGuard } from './databaseProductionGuard';

test('database production guard blocks unsafe Postgres production configuration', () => {
  const result = evaluateDatabaseProductionGuard({
    adapter: 'postgres',
    serviceName: 'address ledger',
    url: 'postgres://postgres:secret@db.example/agid',
    envPrefix: 'AGID_ADDRESS_LEDGER',
    env: {
      NODE_ENV: 'production',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => /sslmode/.test(error)));
  assert.ok(result.errors.some(error => /privileged user/.test(error)));
  assert.ok(result.errors.some(error => /MIGRATIONS_APPLIED/.test(error)));
  assert.ok(result.errors.some(error => /AUDIT_LOG_ENABLED/.test(error)));
});

test('database production guard accepts TLS, least privilege, migrations, and audit log', () => {
  const result = evaluateDatabaseProductionGuard({
    adapter: 'postgres',
    serviceName: 'address ledger',
    url: 'postgres://agid_app:secret@db.example/agid?sslmode=verify-full',
    envPrefix: 'AGID_ADDRESS_LEDGER',
    env: {
      NODE_ENV: 'production',
      AGID_ADDRESS_LEDGER_MIGRATIONS_APPLIED: 'true',
      AGID_ADDRESS_LEDGER_AUDIT_LOG_ENABLED: 'true',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('database production guard validates Redis TLS in strict mode', () => {
  const blocked = evaluateDatabaseProductionGuard({
    adapter: 'redis',
    serviceName: 'POS registry',
    url: 'redis://pos_user:secret@redis.example/0',
    envPrefix: 'AGID_POS_REGISTRY',
    env: {
      AGID_DB_PRODUCTION_GUARD: 'strict',
      AGID_POS_REGISTRY_MIGRATIONS_APPLIED: 'true',
      AGID_POS_REGISTRY_AUDIT_LOG_ENABLED: 'true',
    } as NodeJS.ProcessEnv,
  });
  const accepted = evaluateDatabaseProductionGuard({
    adapter: 'redis',
    serviceName: 'POS registry',
    url: 'rediss://pos_user:secret@redis.example/0',
    envPrefix: 'AGID_POS_REGISTRY',
    env: {
      AGID_DB_PRODUCTION_GUARD: 'strict',
      AGID_POS_REGISTRY_MIGRATIONS_APPLIED: 'true',
      AGID_POS_REGISTRY_AUDIT_LOG_ENABLED: 'true',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(blocked.ok, false);
  assert.ok(blocked.errors.some(error => /rediss/.test(error)));
  assert.equal(accepted.ok, true);
});
