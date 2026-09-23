import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assessAddressDisplayQuality,formatAddressDisplayText,shouldPreserveAddressDisplayLines } from './addressDisplay';

test('regular English address display is compact and removes needless line breaks', () => {
  assert.equal(
    formatAddressDisplayText('Chiyoda-ku\nTokyo 1006727\nJAPAN', { tab: 'en' }),
    'Chiyoda-ku, Tokyo 1006727, JAPAN'
  );
});

test('international shipping labels keep deliberate line breaks', () => {
  assert.equal(
    formatAddressDisplayText('1 1-1\nNAGATACHO, CHIYODA-KU\nTOKYO 100-0014\nJAPAN', { tab: 'intl_en' }),
    '1 1-1\nNAGATACHO, CHIYODA-KU\nTOKYO 100-0014\nJAPAN'
  );
  assert.equal(shouldPreserveAddressDisplayLines('shipping_label'), true);
});

test('English display tab preserves shipping lines for non-English address countries', () => {
  assert.equal(
    formatAddressDisplayText('TESSALIT CERCLE\nKIDAL\nMALI', { tab: 'en', countryCode: 'ML' }),
    'TESSALIT CERCLE\nKIDAL\nMALI'
  );
  assert.equal(shouldPreserveAddressDisplayLines('en', 'ML'), true);
  assert.equal(shouldPreserveAddressDisplayLines('en', 'US'), false);
});

test('detects weak partial address displays before they reach the AGID panel', () => {
  const weak = assessAddressDisplayQuality('20.\nMali', {
    country: 'Mali',
    countryCode: 'ML',
    missingRequiredFields: ['recipient', 'street'],
  });

  assert.equal(weak.isWeak, true);
  assert.equal(weak.meaningfulParts.length, 0);

  const usable = assessAddressDisplayQuality('1 Infinite Loop, Cupertino, CA 95014', {
    country: 'United States',
    countryCode: 'US',
  });

  assert.equal(usable.isWeak, false);
});
