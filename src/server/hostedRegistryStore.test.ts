import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { FileHostedAgidRegistryApiStore } from './hostedRegistryStore';

test('file hosted registry persists issuer, freshness, revocation, nullifier, and audit state', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agid-hosted-registry-'));
  const filePath = join(dir, 'registry.json');
  try {
    const first = new FileHostedAgidRegistryApiStore(filePath);
    const issuer = await first.registerIssuer({
      issuerId: 'hosted-issuer',
      trustScore: 0.91,
      publicKeyCommitment: '0xHOSTEDKEY',
    });
    const freshness = await first.anchorFreshnessRoot({
      freshnessRoot: '0xHOSTEDFRESH',
      registryId: 'hosted-registry',
      issuerId: 'hosted-issuer',
      freshUntil: '2026-06-18T00:00:00.000Z',
    });
    const revocation = await first.revokeCommitment({
      commitment: '0xHOSTEDREVOKED',
      commitmentType: 'credential',
      issuerId: 'hosted-issuer',
    });
    const nullifier = await first.markNullifierUsed({
      nullifierHash: '0xHOSTEDNULLIFIER',
      scope: 'delivery',
    });

    assert.equal(issuer.status, 'recorded');
    assert.equal(freshness.status, 'recorded');
    assert.equal(revocation.status, 'recorded');
    assert.equal(nullifier.status, 'recorded');

    const second = new FileHostedAgidRegistryApiStore(filePath);
    const status = await second.snapshot();
    const verification = await second.verify({
      issuerId: 'hosted-issuer',
      credentialCommitment: '0xHOSTEDCREDENTIAL',
      freshnessRoot: '0xHOSTEDFRESH',
      nullifierHash: '0xHOSTEDNULLIFIER',
      scope: 'delivery',
      now: '2026-06-17T00:00:00.000Z',
    });

    assert.equal(status.issuers.length, 1);
    assert.equal(status.freshnessRoots.length, 1);
    assert.equal(status.revokedCommitments.length, 1);
    assert.equal(status.usedNullifiers.length, 1);
    assert.equal(verification.valid, false);
    assert.ok(verification.errors.includes('nullifier-already-used'));
    assert.ok((await second.auditEvents(10)).length >= 5);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('file hosted registry rejects private raw address or AGID material before persistence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agid-hosted-registry-private-'));
  const filePath = join(dir, 'registry.json');
  try {
    const store = new FileHostedAgidRegistryApiStore(filePath);
    const result = await store.verify({
      issuerId: 'hosted-issuer',
      agid: 'AGID-SECRET-123456',
      address: '東京都千代田区丸の内1-1',
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.join('\n'), /private material/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
