import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AddressFormat } from '../data/address_formats';
import {
  classifyAddressTabEnvironment,
  scoreAddressTabQuality,
  scoreAddressTabs,
  selectVisibleAddressTabs,
} from './addressTabQuality';
import type { AddressValidationResult } from './addressValidation';

const jpFormat: AddressFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    name: 'Japanese',
    addressFormat: '{{postcode}}\n{{state}}{{city}}{{street}}\n{{organization}}',
    ordering: 'big-to-small',
    fields: [],
  },
  english: {
    name: 'International English',
    addressFormat: '{{organization}}\n{{street}}, {{city}}, {{state}} {{postcode}}\n{{country}}',
    ordering: 'small-to-big',
    fields: [],
  },
  openSourceIds: ['osm-nominatim', 'geonames-postal'],
  addressRules: {
    languages: [{ code: 'ja', name: 'Japanese' }],
    nativeOrder: [],
    englishOrder: [],
    regionalHierarchy: [],
    openSourceIds: ['openaddresses'],
    postalCode: { label: 'Postal code', required: true, usage: 'required' },
  },
};

function validation(overrides: Partial<AddressValidationResult> = {}): AddressValidationResult {
  return {
    status: 'verified',
    score: 0.95,
    postalCodeValid: true,
    missingRequiredFields: [],
    warnings: [],
    checkedWith: ['osm-nominatim', 'geonames-postal'],
    quality: {
      mode: 'postal-verified',
      label: 'Verified',
      reason: 'Postal and open-source address evidence matched.',
      canAutofill: true,
      shouldOverwriteUserInput: false,
    },
    displays: {},
    ...overrides,
  };
}

test('scores stable urban native address tabs high enough to skip duplicate verification', () => {
  const quality = scoreAddressTabQuality('ja', {
    countryCode: 'JP',
    format: jpFormat,
    validation: validation(),
    details: {
      country: 'Japan',
      country_code: 'JP',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: '丸の内1丁目',
      house_number: '9-1',
      lat: 35.6812,
      lon: 139.7671,
    },
    displayTextByTab: {
      ja: '〒100-6728\n東京都千代田区丸の内1丁目9-1\nグラントウキョウサウスタワー',
    },
  });

  assert.equal(quality.environment, 'urban');
  assert.equal(quality.decision, 'show');
  assert.ok(quality.score >= 85);
  assert.equal(quality.canSkipSecondVerification, true);
});

test('keeps island and no-postal-code addresses visible when geodata is strong', () => {
  const quality = scoreAddressTabQuality('dv', {
    countryCode: 'MV',
    validation: validation({
      score: 0.82,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim'],
      quality: {
        mode: 'geo-verified',
        label: 'Geo Verified',
        reason: 'Coordinates and mapped locality evidence matched.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Maldives',
      country_code: 'MV',
      city: 'Male',
      island: 'Male',
      lat: 4.1755,
      lon: 73.5093,
    },
    displayTextByTab: {
      dv: 'Male, Maldives',
    },
  });

  assert.equal(quality.environment, 'island');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
});

test('keeps mapped island subtype addresses visible when geodata is strong', () => {
  const quality = scoreAddressTabQuality('en', {
    countryCode: 'MH',
    validation: validation({
      status: 'partial',
      score: 0.68,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim', 'open-location-code'],
      warnings: ['Island address evidence'],
      quality: {
        mode: 'geo-verified',
        label: 'Geo Verified',
        reason: 'Island feature and coordinate evidence matched.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Marshall Islands',
      country_code: 'MH',
      atoll: 'Bikini Atoll',
      map_feature_kind: 'island',
      map_feature_name: 'Bikini Atoll',
      lat: 11.6065,
      lon: 165.3768,
      plus_code: '72Q7J9XG+JQ',
    },
    sources: ['osm-nominatim', 'open-location-code'],
    displayTextByTab: {
      en: 'Bikini Atoll\nCoordinates: 11.60650, 165.37680\nPlus Code: 72Q7J9XG+JQ',
    },
  });

  assert.equal(quality.environment, 'island');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
});

test('marks sparse rural address tabs for re-verification instead of hiding them', () => {
  const quality = scoreAddressTabQuality('ne', {
    countryCode: 'NP',
    validation: validation({
      status: 'partial',
      score: 0.52,
      postalCodeValid: null,
      missingRequiredFields: ['street'],
      warnings: ['Sparse rural address evidence'],
      checkedWith: ['osm-nominatim'],
      quality: {
        mode: 'partial-postal',
        label: 'Partial',
        reason: 'Postal source is limited for this area.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Nepal',
      country_code: 'NP',
      village: 'Khumjung',
      locality: 'Solukhumbu',
      lat: 27.8167,
      lon: 86.7167,
    },
    displayTextByTab: {
      ne: 'Khumjung, Solukhumbu, Nepal',
    },
  });

  assert.equal(quality.environment, 'rural');
  assert.equal(quality.shouldDisplay, true);
  assert.equal(quality.decision, 'reverify');
  assert.equal(quality.needsReverification, true);
});

test('keeps mountain addresses visible when natural feature and coordinate evidence are present', () => {
  const quality = scoreAddressTabQuality('ja', {
    countryCode: 'JP',
    format: jpFormat,
    validation: validation({
      score: 0.84,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim', 'open-elevation'],
      quality: {
        mode: 'geo-verified',
        label: 'Geo Verified',
        reason: 'Mountain name, elevation, and coordinates matched.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Japan',
      country_code: 'JP',
      mountain_name: '富士山',
      elevation: 3776,
      lat: 35.3606,
      lon: 138.7274,
      plus_code: '8Q7X+XX',
      map_feature_kind: 'mountain',
    },
    sources: ['osm-nominatim', 'open-elevation'],
    displayTextByTab: {
      ja: '富士山\n標高 3776 m\n35.36060, 138.72740',
    },
  });

  assert.equal(quality.environment, 'mountain');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
});

test('keeps desert addresses as re-verification candidates instead of unresolved tabs', () => {
  const quality = scoreAddressTabQuality('en', {
    countryCode: 'MA',
    validation: validation({
      status: 'partial',
      score: 0.6,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim'],
      warnings: ['Sparse desert address evidence'],
      quality: {
        mode: 'manual-required',
        label: 'Manual Required',
        reason: 'Desert address depends on natural feature and coordinate evidence.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Morocco',
      country_code: 'MA',
      desert: 'Sahara Desert',
      natural: 'desert',
      lat: 23.4162,
      lon: 25.6628,
      plus_code: '7GR7+2X',
      map_feature_kind: 'desert',
    },
    sources: ['osm-nominatim'],
    displayTextByTab: {
      en: 'Sahara Desert\nCoordinates: 23.41620, 25.66280\nPlus Code: 7GR7+2X',
    },
  });

  assert.equal(quality.environment, 'desert');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
  assert.equal(quality.needsReverification, true);
});

test('keeps desert-like sparse natural geography visible with coordinate evidence', () => {
  const quality = scoreAddressTabQuality('es', {
    countryCode: 'BO',
    validation: validation({
      status: 'partial',
      score: 0.58,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim', 'open-location-code'],
      warnings: ['Sparse natural geography address evidence'],
      quality: {
        mode: 'manual-required',
        label: 'Manual Required',
        reason: 'Sparse natural area depends on named feature and coordinate evidence.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Bolivia',
      country_code: 'BO',
      dryland: 'Salar de Uyuni',
      natural: 'salt_flat',
      lat: -20.1338,
      lon: -67.4891,
      plus_code: '58GP+F9',
      map_feature_kind: 'dryland',
    },
    sources: ['osm-nominatim', 'open-location-code'],
    displayTextByTab: {
      es: 'Salar de Uyuni\nCoordenadas: -20.13380, -67.48910\nPlus Code: 58GP+F9',
    },
  });

  assert.equal(quality.environment, 'sparse_natural');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
  assert.equal(quality.needsReverification, true);
});

test('keeps named lake addresses visible with coordinate evidence', () => {
  const quality = scoreAddressTabQuality('en', {
    countryCode: 'CH',
    validation: validation({
      status: 'partial',
      score: 0.68,
      postalCodeValid: null,
      checkedWith: ['osm-nominatim', 'open-location-code'],
      warnings: ['Inland water address evidence'],
      quality: {
        mode: 'geo-verified',
        label: 'Geo Verified',
        reason: 'Lake name and coordinate evidence matched.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      },
    }),
    details: {
      country: 'Switzerland',
      country_code: 'CH',
      city: 'Montreux',
      lake: 'Lake Geneva',
      water: 'lake',
      lat: 46.4312,
      lon: 6.9106,
      plus_code: '8FVF9X2C+M5',
      map_feature_kind: 'lake',
    },
    sources: ['osm-nominatim', 'open-location-code'],
    displayTextByTab: {
      en: 'Lake Geneva\nCoordinates: 46.43120, 6.91060\nPlus Code: 8FVF9X2C+M5',
    },
  });

  assert.equal(quality.environment, 'water');
  assert.equal(quality.shouldDisplay, true);
  assert.notEqual(quality.decision, 'hide');
});

test('hides only clearly unresolved address tab displays', () => {
  const quality = scoreAddressTabQuality('en', {
    countryCode: 'ZZ',
    displayTextByTab: {
      en: 'Resolving...',
    },
  });

  assert.equal(quality.tier, 'hidden');
  assert.equal(quality.decision, 'hide');
  assert.equal(quality.shouldDisplay, false);
});

test('visible tab selection keeps the best candidate when every tab is hidden', () => {
  const tabs = ['local', 'en'];
  const qualityByTab = scoreAddressTabs(tabs, {
    countryCode: 'ZZ',
    displayTextByTab: {
      local: 'Resolving...',
      en: 'Address unavailable',
    },
  });

  assert.equal(selectVisibleAddressTabs(tabs, qualityByTab).length, 1);
});

test('environment classifier separates water, polar, island, urban, and rural contexts', () => {
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'AQ', details: { lat: -77.85 } }), 'polar');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'JP', displayText: 'Shinano River' }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'JP', displayText: '華厳の滝' }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'ZW', details: { waterfall: 'Victoria Falls', natural: 'waterfall' } }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'CH', details: { lake: 'Lake Geneva' } }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'US', details: { map_feature_kind: 'lake', reservoir: 'Hoover Reservoir' } }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'JP', details: { natural: 'peak', mountain_name: 'Mount Fuji' } }), 'mountain');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'MA', details: { natural: 'desert', desert: 'Sahara Desert' } }), 'desert');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'BO', details: { natural: 'salt_flat', dryland: 'Salar de Uyuni' } }), 'sparse_natural');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'US', details: { water: 'salt_lake', salt_lake: 'Great Salt Lake' } }), 'water');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'GB', details: { natural: 'moor', wilderness: 'Rannoch Moor' } }), 'sparse_natural');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'CA', details: { natural: 'glacier', ice_field: 'Columbia Icefield' } }), 'sparse_natural');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'MV', details: { city: 'Male' } }), 'island');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'US', details: { map_feature_kind: 'island', key: 'Key West' } }), 'island');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'JP', details: { city: 'Tokyo', building: 'Tower' } }), 'urban');
  assert.equal(classifyAddressTabEnvironment({ countryCode: 'NP', details: { village: 'Khumjung' } }), 'rural');
});
