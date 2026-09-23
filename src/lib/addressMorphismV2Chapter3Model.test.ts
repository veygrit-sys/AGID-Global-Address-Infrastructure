import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER3_MODEL_VERSION,
  CHAPTER3_FORMAL_COUNTEREXAMPLES,
  CHAPTER3_FORMAL_DEFINITIONS,
  CHAPTER3_FORMAL_NON_CLAIMS,
  CHAPTER3_FORMAL_PROPOSITIONS,
  buildChapter3FormalModelReport,
  validateFormalCounterexample,
} from './addressMorphismV2Chapter3Model';

test('chapter 3 formal model has definitions for referents, expressions, candidates, projection, and reachability', () => {
  const symbols = new Set(CHAPTER3_FORMAL_DEFINITIONS.map(definition => definition.symbol));

  assert.ok(symbols.has('R_t'));
  assert.ok(symbols.has('E_t(p)'));
  assert.ok(symbols.has('S_t'));
  assert.ok(symbols.has('O_t'));
  assert.ok(symbols.has('Gamma_t'));
  assert.ok(symbols.has('G_t'));
  assert.ok(symbols.has('pi_pub'));
  assert.ok(symbols.has('Reach_t'));
});

test('chapter 3 counterexamples are mathematically valid witnesses', () => {
  assert.equal(CHAPTER3_FORMAL_COUNTEREXAMPLES.length, 6);

  for (const counterexample of CHAPTER3_FORMAL_COUNTEREXAMPLES) {
    assert.deepEqual(validateFormalCounterexample(counterexample), []);
    assert.equal(counterexample.antecedent.value, true);
    assert.equal(counterexample.consequent.value, false);
    assert.match(counterexample.refutedUniversalClaim, /=>/);
  }
});

test('chapter 3 propositions are backed by counterexamples or definitions', () => {
  const report = buildChapter3FormalModelReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER3_MODEL_VERSION);
  assert.equal(report.invalidCounterexamples.length, 0);
  assert.equal(report.unsupportedPropositions.length, 0);
  assert.equal(report.unsupportedNonClaims.length, 0);
});

test('chapter 3 non-claims block unsafe universal statements', () => {
  const nonClaims = new Map(CHAPTER3_FORMAL_NON_CLAIMS.map(nonClaim => [nonClaim.id, nonClaim]));

  assert.match(
    nonClaims.get('nonclaim-perfect-candidate-generation')?.forbiddenUniversalClaim ?? '',
    /true_referent_t\(s\) in Gamma_t/,
  );
  assert.match(
    nonClaims.get('nonclaim-public-vertical-attributes')?.forbiddenUniversalClaim ?? '',
    /private_vertical_attributes/,
  );
});

test('chapter 3 keeps registrability separate from publicability and reachability', () => {
  const registrableNotPublic = CHAPTER3_FORMAL_COUNTEREXAMPLES.find(
    counterexample => counterexample.id === 'registrable-not-public',
  );
  const officialNotReachable = CHAPTER3_FORMAL_COUNTEREXAMPLES.find(
    counterexample => counterexample.id === 'official-address-not-reachable',
  );

  assert.ok(registrableNotPublic);
  assert.equal(registrableNotPublic.antecedent.formula, 'Reg_t(r, delivery) = 1');
  assert.equal(registrableNotPublic.consequent.formula, 'Pub_t(r, private_attribute, delivery) = 1');
  assert.equal(registrableNotPublic.consequent.value, false);

  assert.ok(officialNotReachable);
  assert.match(officialNotReachable.refutedUniversalClaim, /OfficialAddress_t\(r\) = 1/);
  assert.match(officialNotReachable.refutedUniversalClaim, /Reach_t\(r, carrier, delivery\) = 1/);
});

test('chapter 3 source chapter links preserve old chapters 3, 4, and 16', () => {
  const linked = new Set(CHAPTER3_FORMAL_COUNTEREXAMPLES.flatMap(counterexample => counterexample.preservedSourceChapters));

  assert.ok(linked.has(3));
  assert.ok(linked.has(4));
  assert.ok(linked.has(16));
});
