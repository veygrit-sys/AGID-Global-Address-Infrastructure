import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  addressLoginCoverageMap,
  findMissingAddressLoginCoverage,
} from './addressLoginCoverageMap';

const screenSource = readFileSync(join(process.cwd(), 'src/components/AddressLoginExperienceScreen.tsx'), 'utf8');

test('Address Login coverage map connects spec areas to screen evidence', () => {
  assert.equal(addressLoginCoverageMap.length, 9);
  assert.deepEqual(findMissingAddressLoginCoverage(screenSource), []);
});

test('Address Login coverage map spans requirements, UX, merchant controls, and gates', () => {
  const areas = new Set(addressLoginCoverageMap.map(item => item.area));
  assert.deepEqual([...areas].sort(), [
    'country-form-capability',
    'developer-adoption',
    'endpoint-catalog',
    'merchant-control-plane',
    'release-gates',
    'requirements',
    'safe-callback',
    'user-experience',
    'webhook-events',
  ]);

  for (const item of addressLoginCoverageMap) {
    assert.ok(item.executableEvidence.length > 0, `${item.area} lacks executable evidence`);
    assert.match(item.privacyBoundary, /^Do not /);
  }
});

test('Address Login coverage map catches missing screen anchors and blocks unsafe boundary wording', () => {
  const missing = findMissingAddressLoginCoverage(screenSource.replace('Safe callback preview', 'Callback preview'));
  assert.ok(missing.some(item => item.reason === 'screen:Safe callback preview'));

  for (const item of addressLoginCoverageMap) {
    assert.doesNotMatch(item.privacyBoundary, /store raw address|expose proof witness|private key value/i);
  }
});
