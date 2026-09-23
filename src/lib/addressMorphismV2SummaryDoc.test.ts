import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildAddressMorphismV2FormalRegistry } from './addressMorphismV2FormalRegistry';

const summaryPath = 'docs/address-morphism-theory-v2/SUMMARY.md';

test('AMT v2 summary states that every main chapter has an executable model', () => {
  const summary = readFileSync(summaryPath, 'utf8');
  const registry = buildAddressMorphismV2FormalRegistry();

  assert.match(summary, /12-chapter verified-model draft/);
  assert.equal(registry.pendingMainChapters.length, 0);
  assert.equal(registry.executableChapterCount, 12);
});

test('AMT v2 summary links every registry document, model, and test', () => {
  const summary = readFileSync(summaryPath, 'utf8');
  const registry = buildAddressMorphismV2FormalRegistry();

  for (const entry of registry.entries) {
    const documentName = entry.documentPath.split('/').at(-1);
    assert.ok(documentName);
    assert.ok(summary.includes(documentName), `missing document link for chapter ${entry.chapter}`);
    assert.ok(summary.includes(entry.modelModule), `missing model link for chapter ${entry.chapter}`);
    assert.ok(summary.includes(entry.testModule), `missing test link for chapter ${entry.chapter}`);
  }
});

test('AMT v2 summary exposes verification command and public-safety non-claims', () => {
  const summary = readFileSync(summaryPath, 'utf8');

  assert.match(summary, /npm run verify:address-morphism-v2-compatibility/);
  assert.match(summary, /global completeness/);
  assert.match(summary, /ZK proofs repair bad address resolution/);
  assert.match(summary, /raw address, recipient, witness, private-key, or proof-secret material/);
});
