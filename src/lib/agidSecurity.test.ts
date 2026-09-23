import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeAGID } from './agid';
import {
  AGID_SECURITY_POLICY,
  findForbiddenPublicAgidFields,
  isAgidPackedValueInRange,
  isValidAGIDFormat,
  normalizeAGIDInput,
  validatePublicAgidPayload,
} from './agidSecurity';

test('AGID security policy describes public integrity controls for open-source release', () => {
  assert.equal(AGID_SECURITY_POLICY.layer, 'public-location-address-building-map-feature');
  assert.equal(AGID_SECURITY_POLICY.confidentiality, 'public-by-design-no-personal-data');
  assert.ok(AGID_SECURITY_POLICY.integrityControls.includes('strict-agid-format'));
  assert.ok(AGID_SECURITY_POLICY.openSourceReleaseControls.includes('no-secret-material-in-repository'));
});

test('AGID canonical input validation accepts only the public 12-character format', () => {
  assert.equal(normalizeAGIDInput(' jp05av8tjghd '), 'JP05AV8TJGHD');
  assert.equal(isValidAGIDFormat('JP05AV8TJGHD'), true);
  assert.equal(isValidAGIDFormat('jp05av8tjghd'), true);
  assert.equal(isValidAGIDFormat('JP05AV8TJGH'), false);
  assert.equal(isValidAGIDFormat('JPOOOOOOOOOO'), false);
  assert.equal(isValidAGIDFormat('JP05AV8TJGH!'), false);
});

test('AGID decode rejects over-range packed values and invalid faces', () => {
  assert.ok(decodeAGID('jp05av8tjghd'));
  assert.equal(decodeAGID('ZZZZZZZZZZZZ'), null);
  assert.equal(isAgidPackedValueInRange((5n << 42n) | ((1n << 42n) - 1n)), true);
  assert.equal(isAgidPackedValueInRange(1n << 45n), false);
  assert.equal(isAgidPackedValueInRange(6n << 42n), false);
});

test('public AGID payload validation finds private delivery fields recursively', () => {
  const forbidden = findForbiddenPublicAgidFields({
    agid: 'JP05AV8TJGHD',
    address: 'Public address label',
    nested: {
      deliveryInstruction: 'leave with recipient',
      phone: '+81 90 0000 0000',
    },
  });

  assert.deepEqual(forbidden.sort(), [
    'record.nested.deliveryInstruction',
    'record.nested.phone',
  ]);
  assert.equal(validatePublicAgidPayload({ agid: 'JP05AV8TJGHD', address: 'Public label' }).ok, true);
});
