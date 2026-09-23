import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_FORMAL_REGISTRY_VERSION,
  buildAddressMorphismV2FormalRegistry,
  validateAddressMorphismV2FormalRegistry,
} from './addressMorphismV2FormalRegistry';

test('AMT v2 formal registry tracks executable chapter models', () => {
  const registry = buildAddressMorphismV2FormalRegistry();

  assert.equal(registry.version, ADDRESS_MORPHISM_V2_FORMAL_REGISTRY_VERSION);
  assert.equal(registry.executableChapterCount, 12);
  assert.deepEqual(
    registry.entries.map(entry => entry.chapter),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
});

test('AMT v2 formal registry entries link documents, models, and tests', () => {
  const registry = buildAddressMorphismV2FormalRegistry();

  for (const entry of registry.entries) {
    assert.match(entry.documentPath, /^docs\/address-morphism-theory-v2\//);
    assert.match(entry.modelModule, /^src\/lib\/addressMorphismV2/);
    assert.match(entry.testModule, /\.test\.ts$/);
    assert.equal(entry.executableStatus, 'verified');
    assert.ok(entry.preservedModelKinds.length >= 4);
  }
});

test('AMT v2 formal registry keeps pending chapters explicit', () => {
  const registry = buildAddressMorphismV2FormalRegistry();

  assert.deepEqual(registry.pendingMainChapters, []);
});

test('AMT v2 formal registry validates cleanly', () => {
  assert.deepEqual(validateAddressMorphismV2FormalRegistry(), []);
});
