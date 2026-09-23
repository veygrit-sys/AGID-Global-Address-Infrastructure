import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getPosRuntimePolicy,
  getPosRuntimeRecommendation,
} from './posRuntimePolicy';

test('POS runtime policy keeps browser QR/NFC UI in TypeScript', () => {
  const recommendation = getPosRuntimeRecommendation('browser-qr-nfc-ui');

  assert.equal(recommendation.rewriteFromTypeScript, false);
  assert.deepEqual(recommendation.preferredBackends, ['typescript-react']);
});

test('POS runtime policy moves deterministic predicates and formal ZK out of TypeScript', () => {
  const predicateRecommendation = getPosRuntimeRecommendation('deterministic-predicate-evaluation');
  const zkRecommendation = getPosRuntimeRecommendation('formal-zk-proof-generation');

  assert.equal(predicateRecommendation.rewriteFromTypeScript, true);
  assert.ok(predicateRecommendation.preferredBackends.includes('rust-wasm'));
  assert.equal(zkRecommendation.rewriteFromTypeScript, true);
  assert.ok(zkRecommendation.preferredBackends.includes('zk-circuit'));
});

test('POS runtime policy exposes a complete reviewable recommendation set', () => {
  const profile = getPosRuntimePolicy();

  assert.equal(profile.recommendations.length, 5);
  assert.match(profile.rule, /TypeScript/u);
  assert.match(profile.rule, /Rust\/WASM/u);
});
