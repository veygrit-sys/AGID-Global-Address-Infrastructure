import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS,
  EXECUTABLE_EXPECTATION_REGISTRY_VERSION,
  findExecutableExpectation,
  recordExecutableExpectationObservation,
  summarizeExecutableExpectations,
  validateExecutableExpectationRegistry,
} from './executableExpectations';

test('validates the executable expectation registry', () => {
  const result = validateExecutableExpectationRegistry();

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ids.length, ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS.length);
});

test('summarizes open expectations and validation methods', () => {
  const summary = summarizeExecutableExpectations();

  assert.equal(summary.registryVersion, EXECUTABLE_EXPECTATION_REGISTRY_VERSION);
  assert.equal(summary.total, ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS.length);
  assert.ok(summary.byStatus.open > 0);
  assert.ok(summary.byStatus.proved > 0);
  assert.ok(summary.byStatus.tested > 0);
  assert.ok(summary.byValidationMethod.benchmark > 0);
  assert.equal(summary.failureRewriteIds.length, summary.total);
});

test('finds an expectation by id', () => {
  const expectation = findExecutableExpectation('commercial-validator-competition');

  assert.ok(expectation);
  assert.match(expectation.failureWording, /commercial validators/i);
});

test('records pass and fail observations with safe wording', () => {
  const pass = recordExecutableExpectationObservation('candidate-coverage', {
    passed: true,
    observedOutcome: 'recall@10 improved on the sampled benchmark',
  });
  const fail = recordExecutableExpectationObservation('candidate-coverage', {
    passed: false,
    observedOutcome: 'candidate miss rate remained high for sparse polar records',
  });

  assert.equal(pass.nextStatus, 'empirical-pass');
  assert.match(pass.recommendedWording, /improves measured coverage/i);
  assert.equal(fail.nextStatus, 'empirical-fail');
  assert.match(fail.recommendedWording, /unresolved/i);
});

test('rejects unknown expectations and empty observations', () => {
  assert.throws(
    () => recordExecutableExpectationObservation('missing', {
      passed: true,
      observedOutcome: 'ok',
    }),
    /Unknown executable expectation/,
  );

  assert.throws(
    () => recordExecutableExpectationObservation('candidate-coverage', {
      passed: true,
      observedOutcome: '',
    }),
    /observedOutcome/,
  );
});
