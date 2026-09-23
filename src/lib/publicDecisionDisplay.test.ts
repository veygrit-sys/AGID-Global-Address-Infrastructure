import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatPublicConfidenceBand, formatPublicDecision, publicConfidenceBand } from './publicDecisionDisplay';

test('public decision display hides fine-grained numeric confidence', () => {
  assert.equal(publicConfidenceBand(0.98), 'high');
  assert.equal(publicConfidenceBand(0.62), 'medium');
  assert.equal(publicConfidenceBand(0.2), 'low');
  assert.equal(formatPublicConfidenceBand(0.98, 'ja-JP'), '高');
  assert.equal(formatPublicConfidenceBand(0.62, 'en-US'), 'Medium');
  assert.doesNotMatch(formatPublicConfidenceBand(0.9876), /\d/);
});

test('public decision display converts internal states to four user decisions', () => {
  assert.equal(formatPublicDecision('verified', 'ja-JP'), 'OK');
  assert.equal(formatPublicDecision('partial', 'ja-JP'), '要確認');
  assert.equal(formatPublicDecision('rejected', 'ja-JP'), '拒否');
  assert.equal(formatPublicDecision('blocked', 'ja-JP'), '制限');
});
