import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchHybridQualityDecision } from './HybridQualityService';

test('hybrid quality service calls central quality for online verification workflows', async () => {
  const calls: string[] = [];
  const result = await fetchHybridQualityDecision(
    {
      workflow: 'address-quality',
      centralConfidence: 0.86,
    },
    {
      fetcher: async (url) => {
        calls.push(String(url));
        return Response.json({
          ok: true,
          data: {
            decision: {
              workflow: 'address-quality',
              mode: 'central-verified',
              authorities: ['central', 'device', 'open-data-pack'],
              shouldCallCentral: true,
              canRunOffline: true,
              canUseSdkWithoutCentral: true,
              qualityTier: 'verified',
              privacyScope: 'derived-evidence',
              sendsPersonalDataToPublicLayer: false,
              label: 'Central postal, geo, and source confidence',
            },
            policy: {
              workflow: 'address-quality',
              label: 'Address quality and evidence scoring',
              primaryAuthority: 'central',
              fallbackAuthorities: ['device', 'open-data-pack'],
              onlineMode: 'central-verified',
              offlineMode: 'manual-required',
              centralRole: 'verification-source',
              sdkRole: 'consumer',
              privacyScope: 'derived-evidence',
              canRunOffline: true,
              canUseSdkWithoutCentral: true,
              sendsPersonalDataToPublicLayer: false,
              cacheStrategy: 'read-through-cache',
              evidenceLabel: 'Central postal, geo, and source confidence',
            },
          },
          confidence: 0.9,
          sources: ['agid-central-quality'],
          warnings: [],
          requestId: 'req-central',
        });
      },
    },
  );

  assert.deepEqual(calls, ['/api/v1/hybrid/quality']);
  assert.equal(result.ok, true);
  assert.equal(result.data?.decision.qualityTier, 'verified');
  assert.deepEqual(result.sources, ['agid-central-quality']);
});

test('hybrid quality service keeps SDK-only workflows local', async () => {
  let calls = 0;
  const result = await fetchHybridQualityDecision(
    { workflow: 'agid-core' },
    {
      fetcher: async () => {
        calls += 1;
        return Response.json({});
      },
    },
  );

  assert.equal(calls, 0);
  assert.equal(result.data?.decision.mode, 'sdk-portable');
  assert.deepEqual(result.sources, ['agid-local-hybrid-policy']);
});

test('hybrid quality service falls back to local policy when central fails', async () => {
  const result = await fetchHybridQualityDecision(
    { workflow: 'postal-lookup' },
    {
      fetcher: async () => {
        throw new Error('offline');
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.data?.decision.mode, 'read-through-cache');
  assert.match(result.warnings.join(' '), /Central quality service is unavailable/);
});
