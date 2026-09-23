import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_RESOLVER_CONFORMANCE_VERSION,
  buildAgidResolverConformanceSuite,
  filterAgidResolverConformanceSuite,
  runAgidResolverConformanceCase,
  runAgidResolverConformanceSuite,
  validateAgidResolverConformanceSuite,
} from './agidResolverConformance';

test('builds a valid AGID Resolver Conformance Tests suite', () => {
  const suite = buildAgidResolverConformanceSuite({
    generatedAt: '2026-06-20T00:00:00.000Z',
  });
  const validation = validateAgidResolverConformanceSuite(suite);

  assert.equal(suite.manifest.version, AGID_RESOLVER_CONFORMANCE_VERSION);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(suite.manifest.counts.cases, suite.cases.length);
  assert.ok(suite.manifest.counts.surfaces['agid-local-resolver'] >= 4);
  assert.ok(suite.manifest.counts.surfaces['federated-resolver'] >= 2);
  assert.ok(suite.manifest.counts.negativeCases >= 1);
});

test('all AGID Resolver Conformance cases pass against the reference implementation', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const run = await runAgidResolverConformanceSuite(suite);

  assert.equal(run.passed, true, JSON.stringify(run.results, null, 2));
  assert.equal(run.results.length, suite.cases.length);
});

test('filters resolver conformance cases while keeping manifest counts valid', () => {
  const suite = buildAgidResolverConformanceSuite();
  const filtered = filterAgidResolverConformanceSuite(
    suite,
    testCase => testCase.caseId === 'resolver-agid-s-needs-key-v1',
  );
  const validation = validateAgidResolverConformanceSuite(filtered);

  assert.equal(filtered.cases.length, 1);
  assert.equal(filtered.manifest.counts.cases, 1);
  assert.equal(filtered.manifest.counts.surfaces['agid-local-resolver'], 1);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
});

test('reference conformance runner does not emit dynamic address-format lookup warnings', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(' '));
  };

  try {
    const run = await runAgidResolverConformanceSuite(suite);
    assert.equal(run.passed, true);
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(warnings, []);
});

test('local coordinates case locks the deterministic AGID id', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const testCase = suite.cases.find(item => item.caseId === 'resolver-local-coordinates-to-agid-v1');
  assert.ok(testCase);

  const result = await runAgidResolverConformanceCase(testCase);

  assert.equal(result.passed, true, result.errors.join('\n'));
  assert.equal(result.observed.inputKind, 'coordinates');
  assert.equal(result.observed.agidId, testCase.expected.agidId);
  assert.ok(result.observed.actions?.includes('do-not-send-private-fields'));
});

test('AGID-S conformance case requires a local key', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const testCase = suite.cases.find(item => item.caseId === 'resolver-agid-s-needs-key-v1');
  assert.ok(testCase);

  const result = await runAgidResolverConformanceCase(testCase);

  assert.equal(result.passed, true, result.errors.join('\n'));
  assert.equal(result.observed.status, 'needs-key');
  assert.equal(result.observed.inputKind, 'agid-s');
  assert.equal(result.observed.agidId, undefined);
  assert.ok(result.observed.actions?.includes('request-agid-s-key'));
});

test('standard-library conformance case stays free and local-first', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const testCase = suite.cases.find(item => item.caseId === 'resolver-standard-library-free-local-first-v1');
  assert.ok(testCase);

  const result = await runAgidResolverConformanceCase(testCase);

  assert.equal(result.passed, true, result.errors.join('\n'));
  assert.equal(result.observed.standardLibrary?.freeOnly, true);
  assert.equal(result.observed.standardLibrary?.canParseLocally, true);
  assert.ok(result.observed.standardLibrary?.primaryIds.includes('local-address-parser'));
  assert.ok(result.observed.standardLibrary?.primaryIds.includes('local-unicode-address-normalizer'));
});

test('federated conformance accepts commitment consensus without raw egress', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const testCase = suite.cases.find(item => item.caseId === 'resolver-federated-consensus-v1');
  assert.ok(testCase);

  const result = await runAgidResolverConformanceCase(testCase);

  assert.equal(result.passed, true, result.errors.join('\n'));
  assert.equal(result.observed.status, 'resolved');
  assert.equal(result.observed.decision, 'accept');
  assert.equal(result.observed.federated?.quorumMet, true);
  assert.equal(result.observed.federated?.privacy.rawAddressSentToFederation, false);
  assert.equal(result.observed.federated?.privacy.rawAgidSentToFederation, false);
});

test('federated negative conformance case blocks private material before source calls', async () => {
  const suite = buildAgidResolverConformanceSuite();
  const testCase = suite.cases.find(item => item.caseId === 'resolver-federated-private-material-block-v1');
  assert.ok(testCase);

  const result = await runAgidResolverConformanceCase(testCase);

  assert.equal(result.passed, true, result.errors.join('\n'));
  assert.equal(result.observed.status, 'blocked');
  assert.equal(result.observed.decision, 'reject');
  assert.equal(result.observed.federated?.sourceCount, 0);
  assert.equal(result.observed.federated?.privacy.privatePayloadKeptLocal, true);
});
