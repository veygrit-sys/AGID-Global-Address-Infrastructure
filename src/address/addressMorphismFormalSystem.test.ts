import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AMT_COMPLEXITY_BOUNDS,
  AMT_FORMAL_AXIOMS,
  AMT_FORMAL_THEOREMS,
  getAddressMorphismFormalSystem,
  validateAddressMorphismFormalSystem,
} from './addressMorphismFormalSystem';

test('address morphism formal system has strict axioms and theorem families', () => {
  const system = getAddressMorphismFormalSystem();

  assert.equal(system.axioms.length, 8);
  assert.equal(system.theorems.length, 10);
  assert.ok(AMT_FORMAL_AXIOMS.every(claim => claim.kind === 'axiom'));
  assert.ok(AMT_FORMAL_THEOREMS.some(claim => claim.kind === 'existence-theorem'));
  assert.ok(AMT_FORMAL_THEOREMS.some(claim => claim.kind === 'uniqueness-theorem'));
  assert.ok(AMT_FORMAL_THEOREMS.some(claim => claim.kind === 'impossibility-theorem'));
});

test('formal system avoids unconditional world-completeness claims', () => {
  const text = JSON.stringify(getAddressMorphismFormalSystem());

  assert.doesNotMatch(text, /all real-world addresses are covered/i);
  assert.doesNotMatch(text, /complete global candidate generation/i);
  assert.match(text, /candidate completeness remains empirical/i);
  assert.match(text, /does not prove real-world truth/i);
});

test('formal system validates dependencies, proof sketches, limitations, and Big-O bounds', () => {
  const validation = validateAddressMorphismFormalSystem();

  assert.deepEqual(validation, {
    valid: true,
    errors: [],
    claimCount: 18,
    complexityBoundCount: 5,
  });
});

test('complexity bounds cover the AMT resolution pipeline', () => {
  const operations = AMT_COMPLEXITY_BOUNDS.map(bound => bound.operation);

  assert.ok(operations.includes('Candidate generation with indexed lookup'));
  assert.ok(operations.includes('Pairwise structural clustering'));
  assert.ok(operations.includes('Context scoring'));
  assert.ok(operations.includes('Lineage update'));
  assert.ok(operations.includes('PID issuance gate'));
});
