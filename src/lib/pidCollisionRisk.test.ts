import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AMT_PID_HASH_BITS,
  birthdayCollisionUpperBound,
  requiredBitsForCollisionRisk,
  verifyPidCollisionBudget,
} from './pidCollisionRisk';

test('bounds AMT PID collision risk for a trillion issued PIDs', () => {
  const report = verifyPidCollisionBudget({
    maxIssued: 1_000_000_000_000,
    maxCollisionRisk: 1e-12,
  });

  assert.equal(report.hashBits, AMT_PID_HASH_BITS);
  assert.equal(report.pass, true);
  assert.ok(report.birthdayUpperBound < 1e-12);
  assert.ok(report.requiredBits <= AMT_PID_HASH_BITS);
  assert.ok(report.safetyMarginBits > 0);
});

test('fails the budget when the issue volume is too large for the risk target', () => {
  const report = verifyPidCollisionBudget({
    maxIssued: 1_000_000_000_000_000,
    maxCollisionRisk: 1e-12,
  });

  assert.equal(report.pass, false);
  assert.ok(report.birthdayUpperBound > 1e-12);
  assert.ok(report.requiredBits > AMT_PID_HASH_BITS);
  assert.ok(report.safetyMarginBits < 0);
});

test('computes the required hash bits for a configured collision-risk budget', () => {
  assert.equal(requiredBitsForCollisionRisk(1_000_000_000_000, 1e-12), 119);
  assert.ok(birthdayCollisionUpperBound(1_000_000_000_000, 128) < 1e-12);
  assert.ok(birthdayCollisionUpperBound(1_000_000_000_000, 96) > 1e-12);
});

test('rejects invalid collision-risk budgets', () => {
  assert.throws(() => verifyPidCollisionBudget({ maxIssued: 0 }), /maxIssued/);
  assert.throws(() => verifyPidCollisionBudget({ hashBits: 0 }), /hashBits/);
  assert.throws(() => verifyPidCollisionBudget({ maxCollisionRisk: 1 }), /maxCollisionRisk/);
});
