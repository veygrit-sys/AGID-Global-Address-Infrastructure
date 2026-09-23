import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProductionLoadTestPlan,
  PRODUCTION_LOAD_TEST_ACK,
  runProductionLoadTest,
} from './productionLoadTest';

test('production load test plan fails closed without explicit production guardrails', () => {
  assert.throws(
    () => createProductionLoadTestPlan({ baseUrl: 'http://agid.example.com', allowedHosts: ['agid.example.com'] }),
    /https/,
  );
  assert.throws(
    () => createProductionLoadTestPlan({ baseUrl: 'https://agid.example.com', allowedHosts: ['other.example.com'] }),
    /not in AGID_LOAD_TEST_ALLOWED_HOSTS/,
  );
  assert.throws(
    () => createProductionLoadTestPlan({
      baseUrl: 'https://agid.example.com',
      allowedHosts: ['agid.example.com'],
      dryRun: false,
    }),
    /AGID_LOAD_TEST_ACK/,
  );
});

test('production load test plan rejects private or unsafe request shapes', () => {
  assert.throws(
    () => createProductionLoadTestPlan({
      baseUrl: 'https://agid.example.com',
      allowedHosts: ['agid.example.com'],
      endpoints: [{ name: 'leaky', path: '/api/search?address=Tokyo' }],
    }),
    /private address material/,
  );
  assert.throws(
    () => createProductionLoadTestPlan({
      baseUrl: 'https://agid.example.com',
      allowedHosts: ['agid.example.com'],
      endpoints: [{ name: 'post', method: 'POST' as any, path: '/api/address-resolution/resolve' }],
    }),
    /unsafe method/,
  );
});

test('dry run validates the plan without sending production traffic', async () => {
  let calls = 0;
  const plan = createProductionLoadTestPlan({
    baseUrl: 'https://agid.example.com',
    allowedHosts: ['agid.example.com'],
    dryRun: true,
    rps: 20,
    durationSeconds: 10,
  });
  const result = await runProductionLoadTest(plan, {
    fetchImpl: async () => {
      calls += 1;
      return { status: 200 };
    },
  });

  assert.equal(calls, 0);
  assert.equal(result.dryRun, true);
  assert.equal(result.completedRequests, 0);
  assert.equal(result.stopReason, 'dry-run-no-traffic-sent');
});

test('read-only execution records status and latency metrics without response bodies', async () => {
  const seenUrls: string[] = [];
  const plan = createProductionLoadTestPlan({
    baseUrl: 'https://agid.example.com',
    allowedHosts: ['agid.example.com'],
    ack: PRODUCTION_LOAD_TEST_ACK,
    dryRun: false,
    rps: 2,
    durationSeconds: 1,
    concurrency: 2,
    endpoints: [{ name: 'health', path: '/api/health', expectedStatus: 200 }],
  });
  const result = await runProductionLoadTest(plan, {
    fetchImpl: async (url) => {
      seenUrls.push(url);
      return { status: 200 };
    },
  });

  assert.equal(result.totalRequests, 2);
  assert.equal(result.completedRequests, 2);
  assert.equal(result.okRequests, 2);
  assert.deepEqual(result.statusCounts, { '200': 2 });
  assert.deepEqual(seenUrls, ['https://agid.example.com/api/health', 'https://agid.example.com/api/health']);
});

test('execution stops early when production error budget burns too fast', async () => {
  const plan = createProductionLoadTestPlan({
    baseUrl: 'https://agid.example.com',
    allowedHosts: ['agid.example.com'],
    ack: PRODUCTION_LOAD_TEST_ACK,
    dryRun: false,
    rps: 20,
    durationSeconds: 1,
    concurrency: 5,
    endpoints: [{ name: 'health', path: '/api/health', expectedStatus: 200 }],
    stopConditions: { maxConsecutiveFailures: 2 },
  });
  const result = await runProductionLoadTest(plan, {
    fetchImpl: async () => ({ status: 503 }),
  });

  assert.equal(result.stopReason, 'max-consecutive-failures');
  assert.ok(result.completedRequests < result.totalRequests);
  assert.ok(result.errorRate > 0);
});
