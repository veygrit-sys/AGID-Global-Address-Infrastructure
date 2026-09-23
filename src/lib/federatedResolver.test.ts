import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAddressDnsRecord } from './addressDnsRecord';
import {
  createStaticFederatedResolverSource,
  resolveFederatedAddress,
  type FederatedResolverRequest,
} from './federatedResolver';

test('federated resolver reaches consensus without sending raw address material', async () => {
  const observedRequests: FederatedResolverRequest[] = [];
  const sourceA = {
    sourceId: 'registry-a',
    sourceKind: 'registry-api' as const,
    trustScore: 0.9,
    resolve: async (request: FederatedResolverRequest) => {
      observedRequests.push(request);
      return {
        status: 'resolved' as const,
        confidence: 0.91,
        addressReferenceCommitment: '0xSAME',
        freshnessRoot: '0xFRESH',
      };
    },
  };
  const sourceB = {
    sourceId: 'dns-b',
    sourceKind: 'address-dns' as const,
    trustScore: 0.82,
    resolve: async (request: FederatedResolverRequest) => {
      observedRequests.push(request);
      return {
        status: 'resolved' as const,
        confidence: 0.86,
        addressReferenceCommitment: '0xsame',
      };
    },
  };

  const result = await resolveFederatedAddress({
    mode: 'hybrid',
    domain: 'federated:delivery',
    salt: 'federated-test-salt',
    now: '2026-06-17T00:00:00.000Z',
    payload: {
      ownerName: 'pickup.store.jp.agid',
      zone: 'jp.agid',
      agid: 'ML01R1A0ZTR4',
      aoid: 'ABCDEFGHJKLMNPQ',
      address: '東京都千代田区丸の内1-1',
      recipient: 'Example Recipient',
      issuerId: 'issuer-jp',
      freshnessRoot: '0xFRESH',
    },
    sources: [sourceA, sourceB],
    quorum: 2,
  });

  const publicText = JSON.stringify(result.publicRequestPayload);
  const sentText = JSON.stringify(observedRequests);

  assert.equal(result.status, 'resolved');
  assert.equal(result.decision, 'accept');
  assert.equal(result.consensus.quorumMet, true);
  assert.equal(result.consensus.winningTargetKey, '0xsame');
  assert.equal(result.privacy.rawAddressSentToFederation, false);
  assert.equal(result.privacy.rawAgidSentToFederation, false);
  assert.equal(observedRequests.length, 2);
  assert.doesNotMatch(publicText, /東京都|Example Recipient|ML01R1A0ZTR4|ABCDEFGHJKLMNPQ/);
  assert.doesNotMatch(sentText, /東京都|Example Recipient|ML01R1A0ZTR4|ABCDEFGHJKLMNPQ/);
  assert.equal(result.commitments.length, 4);
  assert.ok(result.actions.includes('use-federated-result'));
});

test('federated resolver blocks private fields when salt is missing', async () => {
  const result = await resolveFederatedAddress({
    mode: 'server-registry',
    domain: 'federated:missing-salt',
    payload: {
      address: '1600 Pennsylvania Avenue NW',
      issuerId: 'issuer-us',
    },
    sources: [
      createStaticFederatedResolverSource({
        sourceId: 'registry-unused',
        response: {
          status: 'resolved',
          confidence: 0.8,
          addressReferenceCommitment: '0xunused',
        },
      }),
    ],
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.decision, 'reject');
  assert.match(result.errors.join('\n'), /salt is required/);
  assert.equal(result.sourceResults.length, 0);
});

test('federated resolver detects tied conflicts between trusted sources', async () => {
  const result = await resolveFederatedAddress({
    mode: 'server-registry',
    domain: 'federated:conflict',
    salt: 'conflict-salt',
    payload: {
      ownerName: 'candidate.jp.agid',
      issuerId: 'issuer-jp',
    },
    sources: [
      createStaticFederatedResolverSource({
        sourceId: 'registry-a',
        trustScore: 0.8,
        response: {
          status: 'resolved',
          confidence: 0.8,
          addressReferenceCommitment: '0xA',
        },
      }),
      createStaticFederatedResolverSource({
        sourceId: 'registry-b',
        trustScore: 0.8,
        response: {
          status: 'resolved',
          confidence: 0.8,
          addressReferenceCommitment: '0xB',
        },
      }),
    ],
    quorum: 1,
  });

  assert.equal(result.status, 'conflict');
  assert.equal(result.decision, 'review');
  assert.deepEqual(result.consensus.conflictKeys, ['0xb']);
  assert.ok(result.actions.includes('check-conflicting-resolvers'));
});

test('federated resolver records source timeouts and asks for retry', async () => {
  const result = await resolveFederatedAddress({
    mode: 'server-registry',
    domain: 'federated:timeout',
    salt: 'timeout-salt',
    timeoutMs: 20,
    payload: {
      ownerName: 'timeout.jp.agid',
      issuerId: 'issuer-jp',
    },
    sources: [
      createStaticFederatedResolverSource({
        sourceId: 'fast',
        response: {
          status: 'resolved',
          confidence: 0.9,
          addressReferenceCommitment: '0xFAST',
        },
      }),
      createStaticFederatedResolverSource({
        sourceId: 'slow',
        delayMs: 60,
        response: {
          status: 'resolved',
          confidence: 0.9,
          addressReferenceCommitment: '0xFAST',
        },
      }),
    ],
    quorum: 2,
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.sourceResults.find(source => source.sourceId === 'slow')?.status, 'timeout');
  assert.ok(result.actions.includes('retry-timeout-sources'));
  assert.ok(result.actions.includes('request-more-evidence'));
});

test('federated resolver rejects invalid Address DNS source records', async () => {
  const record = createAddressDnsRecord({
    ownerName: 'resolver.example.agid',
    zone: 'example.agid',
    target: {
      addressReferenceCommitment: '0xVALID',
    },
    issuedAt: '2026-06-17T00:00:00.000Z',
  });
  const invalidRecord = {
    ...record,
    target: {
      ...record.target,
      addressReferenceCommitment: '0xTAMPERED',
    },
  };

  const result = await resolveFederatedAddress({
    mode: 'address-dns',
    domain: 'federated:dns',
    salt: 'dns-salt',
    now: '2026-06-17T00:00:00.000Z',
    payload: {
      ownerName: 'resolver.example.agid',
      zone: 'example.agid',
    },
    sources: [
      createStaticFederatedResolverSource({
        sourceId: 'dns-invalid',
        sourceKind: 'address-dns',
        response: {
          status: 'resolved',
          confidence: 0.9,
          addressDnsRecords: [invalidRecord],
        },
      }),
    ],
    quorum: 1,
  });

  assert.equal(result.status, 'unresolved');
  assert.equal(result.decision, 'reject');
  assert.match(result.errors.join('\n'), /recordHash does not match canonical record payload/);
});

test('federated resolver rejects source responses that leak private material', async () => {
  const result = await resolveFederatedAddress({
    mode: 'server-registry',
    domain: 'federated:leak',
    salt: 'leak-salt',
    payload: {
      ownerName: 'leak.jp.agid',
      issuerId: 'issuer-jp',
    },
    sources: [
      createStaticFederatedResolverSource({
        sourceId: 'leaky',
        response: {
          status: 'resolved',
          confidence: 0.9,
          addressReferenceCommitment: '0xLEAK',
          publicPayload: {
            address: '東京都千代田区丸の内1-1',
          },
        },
      }),
    ],
    quorum: 1,
  });

  assert.equal(result.status, 'unresolved');
  assert.match(result.errors.join('\n'), /private material/i);
  assert.equal(result.sourceResults[0].status, 'error');
});
