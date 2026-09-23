import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getLanguageDecision,
  getProgrammingLanguagePolicy,
  recommendLanguage,
  shouldRefactorFromTypeScript,
} from './programmingLanguagePolicy';

describe('programming language policy', () => {
  it('keeps TypeScript as the default orchestration language', () => {
    const policy = getProgrammingLanguagePolicy();

    assert.equal(policy.defaultLanguage, 'TypeScript');
    assert.match(policy.rule, /Default to TypeScript/u);
    assert.ok(policy.decisions.length >= 10);

    const ui = getLanguageDecision('frontend-ui');
    assert.equal(ui.primaryLanguage, 'TypeScript');
    assert.deepEqual(ui.allowedLanguages, ['TypeScript']);
  });

  it('recommends native or specialist languages for domains TypeScript should not own', () => {
    assert.equal(
      recommendLanguage({
        domain: 'deterministic-geo-core',
        deterministicNumeric: true,
        performanceCritical: true,
        browserRequired: true,
      }).primaryLanguage,
      'Rust'
    );
    assert.equal(
      recommendLanguage({
        domain: 'zk-circuit',
        cryptographicPrimitive: true,
      }).primaryLanguage,
      'Circom'
    );
    assert.equal(
      recommendLanguage({
        domain: 'formal-proof',
        formalVerificationRequired: true,
      }).primaryLanguage,
      'Lean'
    );
    assert.equal(
      recommendLanguage({
        domain: 'blockchain-contract',
        cryptographicPrimitive: true,
      }).primaryLanguage,
      'Solidity'
    );
  });

  it('turns language policy into refactor decisions', () => {
    assert.equal(shouldRefactorFromTypeScript({ domain: 'frontend-ui' }), false);
    assert.equal(shouldRefactorFromTypeScript({ domain: 'api-orchestration' }), false);
    assert.equal(
      shouldRefactorFromTypeScript({
        domain: 'deterministic-geo-core',
        deterministicNumeric: true,
        performanceCritical: true,
        browserRequired: true,
      }),
      true
    );
    assert.equal(
      shouldRefactorFromTypeScript({
        domain: 'zk-circuit',
        cryptographicPrimitive: true,
      }),
      true
    );
  });
});
