import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import { createPosAgidSecureRegistryStore } from './posAgidSecureRegistryStore';

test('POS AGID-S registry persists used and revoked handles without raw address storage', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agid-pos-registry-'));
  const filePath = join(dir, 'registry.json');
  try {
    const first = createPosAgidSecureRegistryStore({ filePath });
    const used = await first.markUsed({
      keyId: 'pos-key-1',
      jti: '0123456789ABCDEFGHJKMNPQRST',
      terminalId: 'terminal-a',
      requestId: 'req-1',
      now: Date.parse('2026-06-07T00:00:00.000Z'),
    });
    assert.equal(used.ok, true);

    const revoked = await first.revokeKey({
      keyId: 'pos-key-1',
      reason: 'device lost',
      requestId: 'req-2',
      now: Date.parse('2026-06-07T00:01:00.000Z'),
    });
    assert.equal(revoked.ok, true);

    const second = createPosAgidSecureRegistryStore({ filePath });
    const decision = await second.verify({
      keyId: 'pos-key-1',
      jti: '0123456789ABCDEFGHJKMNPQRST',
      now: Date.parse('2026-06-07T00:02:00.000Z'),
    });
    assert.equal(decision.valid, false);
    assert.deepEqual(decision.errors.sort(), ['key-revoked-by-registry', 'token-already-used'].sort());

    const status = await second.publicStatus(Date.parse('2026-06-07T00:02:00.000Z'));
    assert.equal(status.usedCount, 1);
    assert.equal(status.revokedKeyCount, 1);
    assert.equal(status.rawAddressStorage, false);
    assert.equal(status.decryptedAgidStorage, false);
    assert.equal(status.rawAgidSecureStorage, false);

    const serialized = await readFile(filePath, 'utf8');
    assert.doesNotMatch(serialized, /AGIDS1-|JP05AV8TJGH8|Tokyo|address|phone/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('POS AGID-S deferred sync reports conflicts for already used jtis', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agid-pos-registry-'));
  try {
    const store = createPosAgidSecureRegistryStore({ filePath: join(dir, 'registry.json') });
    const first = await store.applyDeferredSync({
      terminalId: 'offline-terminal',
      requestId: 'sync-1',
      now: Date.parse('2026-06-07T00:00:00.000Z'),
      items: [
        {
          action: 'mark-used',
          keyId: 'pos-key-2',
          jti: 'ABCDEFGHJKMNPQRST012345678',
        },
      ],
    });
    assert.equal(first.accepted, 1);
    assert.equal(first.conflicts, 0);

    const second = await store.applyDeferredSync({
      terminalId: 'offline-terminal',
      requestId: 'sync-2',
      now: Date.parse('2026-06-07T00:01:00.000Z'),
      items: [
        {
          action: 'mark-used',
          keyId: 'pos-key-2',
          jti: 'ABCDEFGHJKMNPQRST012345678',
        },
      ],
    });
    assert.equal(second.accepted, 0);
    assert.equal(second.conflicts, 1);
    assert.equal(second.events[0]?.errors.includes('token-already-used'), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
