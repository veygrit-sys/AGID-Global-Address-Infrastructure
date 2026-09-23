import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getPrivacyHumanRightsPositioning,
  validatePrivacyHumanRightsPositioning,
} from './privacyHumanRightsPrinciples';

test('front-loads Ethereum optional, local-first, and no-raw-address defaults', () => {
  const positioning = getPrivacyHumanRightsPositioning();

  assert.equal(positioning.ethereumRequirement, 'optional');
  assert.equal(positioning.defaultMode, 'local-first');
  assert.equal(positioning.rawAddressDefault, 'forbidden-outside-local-or-encrypted-private-storage');
  assert.match(positioning.oneSentence, /local-first/i);
  assert.match(positioning.oneSentence, /Ethereum-optional/i);
  assert.match(positioning.oneSentence, /no-raw-address-by-default/i);
});

test('keeps privacy and human-rights positioning valid and implementation-facing', () => {
  const positioning = getPrivacyHumanRightsPositioning();
  const validation = validatePrivacyHumanRightsPositioning(positioning);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  for (const principle of positioning.principles) {
    assert.ok(principle.mustNot.length > 0);
    assert.ok(principle.implementationSignals.length > 0);
  }
});

test('rejects positioning that makes Ethereum mandatory or weakens local-first defaults', () => {
  const positioning = getPrivacyHumanRightsPositioning();
  const validation = validatePrivacyHumanRightsPositioning({
    ...positioning,
    ethereumRequirement: 'required' as never,
    defaultMode: 'server-first' as never,
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('ethereum-must-remain-optional'));
  assert.ok(validation.errors.includes('default-mode-must-be-local-first'));
});
