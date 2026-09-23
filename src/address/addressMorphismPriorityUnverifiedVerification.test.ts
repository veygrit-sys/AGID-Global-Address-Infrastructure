import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  type PriorityUnverifiedVerificationItem,
  priorityUnverifiedVerificationMatrix,
  verifyPriorityUnverifiedVerificationMatrix,
} from './addressMorphismPriorityUnverifiedVerification';

const byId = new Map(priorityUnverifiedVerificationMatrix.map(item => [item.id, item]));

const cloneItem = (
  id: PriorityUnverifiedVerificationItem['id'],
  patch: Partial<PriorityUnverifiedVerificationItem>,
): PriorityUnverifiedVerificationItem => ({
  ...byId.get(id)!,
  ...patch,
});

test('priority S unverified matrix decomposes every item by region, use case, source, and failure behavior', () => {
  const result = verifyPriorityUnverifiedVerificationMatrix();

  assert.equal(result.passed, true, result.findings.map(finding => finding.message).join('\n'));
  assert.equal(result.summary.itemCount, 7);
  assert.ok(result.summary.regionSliceCount >= 21);
  assert.ok(result.summary.useCaseSliceCount >= 21);
  assert.ok(result.summary.dataSourceSliceCount >= 21);
  assert.ok(result.summary.failureBehaviorCount >= 14);

  for (const item of priorityUnverifiedVerificationMatrix) {
    assert.equal(item.priority, 'S');
    assert.ok(item.regionSlices.length >= 3, item.id);
    assert.ok(item.useCaseSlices.length >= 3, item.id);
    assert.ok(item.dataSourceSlices.length >= 3, item.id);
    assert.ok(item.failureBehaviors.length >= 2, item.id);
    assert.ok(item.failureBehaviors.every(behavior => behavior.blocksVerifiedIssuance), item.id);
  }
});

test('candidate generation remains a recall benchmark, not a world-completeness claim', () => {
  const item = byId.get('candidate-generation-global-completeness')!;

  assert.deepEqual(
    ['recall@k', 'candidate-miss-rate', 'unresolved-rate'].every(metric => item.metrics.includes(metric)),
    true,
  );
  assert.ok(item.failureBehaviors.some(behavior => behavior.action === 'unresolved'));
  assert.match(item.safePaperWording, /source-bound/i);
  assert.ok(item.forbiddenClaims.some(claim => /complete worldwide recall/i.test(claim)));
});

test('multilingual recall is separated from identity preservation', () => {
  const item = byId.get('multilingual-search-recall')!;

  assert.ok(item.metrics.includes('recall@k'));
  assert.ok(item.metrics.includes('false-merge-rate'));
  assert.match(item.claimBoundary, /not identity preservation/i);
  assert.ok(item.failureBehaviors.some(behavior => behavior.id === 'language-false-merge'));
});

test('natural and cultural features stay source-bound with unresolved fallback', () => {
  const item = byId.get('natural-cultural-feature-coverage')!;

  assert.ok(item.metrics.includes('feature-type-coverage-rate'));
  assert.ok(item.metrics.includes('unresolved-rate'));
  assert.ok(item.dataSourceSlices.some(source => source.id === 'gazetteer-heritage-science'));
  assert.ok(item.failureBehaviors.some(behavior => behavior.action === 'unresolved'));
});

test('commercial validators cannot be marked locally proven or called without approval', () => {
  const item = byId.get('commercial-validator-comparison')!;

  assert.equal(item.currentPosture, 'external-benchmark-required');
  assert.ok(item.dataSourceSlices.some(source => source.id === 'commercial-validators' && source.externalApprovalRequired));
  assert.ok(item.failureBehaviors.some(behavior => behavior.action === 'external-approval-required'));

  const invalid = cloneItem('commercial-validator-comparison', {
    dataSourceSlices: item.dataSourceSlices.map(source =>
      source.id === 'commercial-validators' ? { ...source, externalApprovalRequired: false } : source,
    ),
  });
  const result = verifyPriorityUnverifiedVerificationMatrix([invalid]);

  assert.equal(result.passed, false);
  assert.ok(result.findings.some(finding => /External data sources require explicit approval/.test(finding.message)));
});

test('ZK item remains ZK-ready only until circuit implementation and audit exist', () => {
  const item = byId.get('zk-circuit-safety')!;

  assert.equal(item.currentPosture, 'cryptographic-audit-required');
  assert.ok(item.failureBehaviors.some(behavior => behavior.action === 'zk-ready-only'));
  assert.ok(item.dataSourceSlices.some(source => source.id === 'zk-circuit-audit' && source.externalApprovalRequired));
  assert.ok(item.forbiddenClaims.some(claim => /complete ZK system/i.test(claim)));
});

test('production security cites local gates while preserving external audit boundary', () => {
  const item = byId.get('agid-aoid-production-security')!;

  assert.equal(item.currentPosture, 'production-audit-required');
  assert.ok(item.localEvidence.includes('verify:mandatory-security'));
  assert.ok(item.localEvidence.includes('verify:no-raw-address'));
  assert.ok(item.localEvidence.includes('verify:preaudit-secrets'));
  assert.ok(item.failureBehaviors.every(behavior => behavior.blocksVerifiedIssuance));
});

test('unsafe paper wording and under-specified decompositions are rejected', () => {
  const unsafe = cloneItem('candidate-generation-global-completeness', {
    safePaperWording: 'complete worldwide recall is proven',
    regionSlices: [byId.get('candidate-generation-global-completeness')!.regionSlices[0]],
  });
  const result = verifyPriorityUnverifiedVerificationMatrix([unsafe]);

  assert.equal(result.passed, false);
  assert.ok(result.findings.some(finding => /At least three region slices/.test(finding.message)));
  assert.ok(result.findings.some(finding => /overclaim marker/.test(finding.message)));
});

test('research documentation links the decomposition ledger and does not claim empirical completion', () => {
  const doc = readFileSync('docs/research/address-morphism-priority-unverified-verification.md', 'utf8');

  assert.match(doc, /npm run verify:address-morphism-unverified/);
  assert.match(doc, /world completeness has not been empirically proven/i);
  assert.match(doc, /Commercial API live benchmark/);
  assert.doesNotMatch(doc, /all global addresses are verified/i);
});
