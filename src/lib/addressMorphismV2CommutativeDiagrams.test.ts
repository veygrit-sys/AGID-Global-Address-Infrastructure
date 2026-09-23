import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_COMMUTATIVE_DIAGRAMS_VERSION,
  getAddressMorphismV2CommutativeDiagrams,
  groupCommutativeDiagramsByKind,
  validateAddressMorphismV2CommutativeDiagrams,
} from './addressMorphismV2CommutativeDiagrams';

const docPath = 'docs/address-morphism-theory-v2/commutative-diagrams.md';

test('AMT v2 commutative diagram catalog validates', () => {
  const diagrams = getAddressMorphismV2CommutativeDiagrams();

  assert.equal(ADDRESS_MORPHISM_V2_COMMUTATIVE_DIAGRAMS_VERSION, 'address-morphism-v2-commutative-diagrams-v0.1');
  assert.equal(diagrams.length, 22);
  assert.deepEqual(validateAddressMorphismV2CommutativeDiagrams(diagrams), []);
});

test('AMT v2 commutative diagrams cover all chapters and all commutativity kinds', () => {
  const diagrams = getAddressMorphismV2CommutativeDiagrams();
  const chapters = new Set(diagrams.flatMap(item => item.chapters));
  const groups = groupCommutativeDiagramsByKind();

  assert.deepEqual(
    Array.from(chapters).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.ok(groups.strict.length >= 2);
  assert.ok(groups.weak.length >= 3);
  assert.ok(groups.conditional.length >= 10);
  assert.ok(groups['intentionally-non-commutative'].length >= 4);
});

test('AMT v2 commutative diagrams include the core safety boundaries', () => {
  const diagrams = getAddressMorphismV2CommutativeDiagrams();
  const byId = new Map(diagrams.map(item => [item.id, item]));

  assert.equal(byId.get('multilingual-referent-square')?.kind, 'weak');
  assert.equal(byId.get('postal-agid-region-square')?.equalizer, 'same-safety-decision');
  assert.equal(byId.get('vertical-privacy-noncommutative')?.equalizer, 'must-not-invert');
  assert.equal(byId.get('zk-boundary-noncommutative')?.kind, 'intentionally-non-commutative');
  assert.equal(byId.get('benchmark-oracle-square')?.kind, 'strict');
});

test('AMT v2 commutative diagram document references every catalog entry', () => {
  const doc = readFileSync(docPath, 'utf8');
  const diagrams = getAddressMorphismV2CommutativeDiagrams();

  assert.match(doc, /# AMT v2 Commutative Diagrams/);
  assert.match(doc, /strict/);
  assert.match(doc, /weak/);
  assert.match(doc, /conditional/);
  assert.match(doc, /intentionally-non-commutative/);
  assert.match(doc, /must not invert/);

  for (const item of diagrams) {
    assert.ok(doc.includes(item.id), `document missing diagram id: ${item.id}`);
    assert.ok(doc.includes(item.title), `document missing diagram title: ${item.title}`);
  }
});

