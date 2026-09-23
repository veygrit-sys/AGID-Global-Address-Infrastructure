import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { SqlitePosAgidSecureRegistryStore } from './posAgidSecureRegistryAdapters';

test('SQLite POS AGID-S registry adapter persists status and rejects duplicate used tokens', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agid-pos-sqlite-registry-'));
  const store = new SqlitePosAgidSecureRegistryStore(join(dir, 'registry.sqlite'));
  try {
    const first = await store.markUsed({
      keyId: 'sqlite-pos-key-1',
      jti: 'ABCDEFGHJKMNPQRST012345678',
      terminalId: 'sqlite-terminal-a',
      requestId: 'sqlite-req-1',
      now: Date.parse('2026-06-07T00:00:00.000Z'),
    });
    const duplicate = await store.markUsed({
      keyId: 'sqlite-pos-key-1',
      jti: 'ABCDEFGHJKMNPQRST012345678',
      terminalId: 'sqlite-terminal-b',
      requestId: 'sqlite-req-2',
      now: Date.parse('2026-06-07T00:00:01.000Z'),
    });
    const status = await store.publicStatus(Date.parse('2026-06-07T00:00:02.000Z'));
    const audit = await store.recentAudit(5);

    assert.equal(first.ok, true);
    assert.equal(duplicate.ok, false);
    assert.equal(duplicate.event.outcome, 'conflict');
    assert.equal(duplicate.event.errors.includes('token-already-used'), true);
    assert.equal(status.storageMode, 'sqlite');
    assert.equal(status.usedCount, 1);
    assert.equal(status.auditCount, 2);
    assert.equal(status.rawAddressStorage, false);
    assert.equal(status.rawAgidSecureStorage, false);
    assert.equal(audit.length, 2);
  } finally {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  }
});
