import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  executeVerifiedAddressTranslation,
  type VerifiedAddressTranslationFormat,
} from './verifiedAddressTranslation';

const japanFormat: VerifiedAddressTranslationFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '〒{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}\n{{organization}}',
    ordering: 'big-to-small',
    fields: [
      { key: 'postcode', label: '郵便番号', required: true },
      { key: 'city', label: '市区町村', required: true },
      { key: 'street', label: '町名', required: true },
      { key: 'houseNumber', label: '番地', required: true },
    ],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}\n{{country}}',
    ordering: 'small-to-big',
    fields: [],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'japan-postcode-api',
    format: '123-4567',
    api: null,
  },
  openSourceIds: ['japan-postcode-api', 'jageocoder', 'geolonia-address'],
  addressRules: {
    languages: [{ code: 'ja', name: '日本語' }],
    nativeOrder: ['postcode', 'state', 'city', 'street', 'houseNumber', 'organization'],
    englishOrder: ['organization', 'houseNumber', 'street', 'city', 'state', 'postcode', 'country'],
    regionalHierarchy: ['prefecture', 'city', 'district'],
    openSourceIds: ['japan-postcode-api', 'jageocoder', 'geolonia-address'],
    postalCode: { label: 'Postal code', required: true, usage: 'required' },
  },
};

test('VATT structures, verifies, reorders, and regenerates Japanese native and international English address', async () => {
  const result = await executeVerifiedAddressTranslation({
    countryCode: 'JP',
    language: 'ja',
    details: {
      country_code: 'jp',
      country: 'Japan',
      postcode: '100-6728',
      state: '東京都',
      city: '千代田区',
      road: '丸の内',
      house_number: '1-9-1',
      building: 'グラントウキョウサウスタワー',
      lat: 35.681236,
      lon: 139.767125,
    },
    format: japanFormat,
    sources: ['japan-postcode-api', 'jageocoder', 'geolonia-address'],
  });

  assert.equal(result.canonical.country_code, 'JP');
  assert.equal(result.graph.postal.code, '100-6728');
  assert.equal(result.graph.geo.lat, 35.681236);
  assert.equal(result.graph.geo.lon, 139.767125);
  assert.equal(result.validation.quality.label, 'Verified');
  assert.equal(result.renderings.native, '〒100-6728\n東京都千代田区丸の内1-9-1\nグラントウキョウサウスタワー');
  assert.match(result.renderings.internationalEnglish, /GranTokyo South Tower/);
  assert.match(result.renderings.internationalEnglish, /1-9-1 Marunouchi/);
  assert.match(result.renderings.internationalEnglish, /Chiyoda-ku/);
  assert.match(result.renderings.internationalEnglish, /JAPAN|Japan/);
  assert.deepEqual(result.orders.native, japanFormat.addressRules?.nativeOrder);
  assert.deepEqual(result.orders.internationalEnglish, japanFormat.addressRules?.englishOrder);
  assert.equal(result.pipeline.map(stage => stage.id).join('>'), 'parse>normalize>verify>transform>render');
  assert.equal(result.purpose, 'international_shipping');
  assert.equal(result.outputFormat, 'shipping_label');
  assert.equal(result.postalCodeMatch, 'valid');
  assert.equal(result.deliveryRisk, 'low');
  assert.deepEqual(result.unverifiedFields, []);
  assert.equal(result.structured, result.normalized);
  assert.equal(result.normalized.countryCode, 'JP');
  assert.equal(result.normalized.postalCode, '100-6728');
  assert.equal(result.interlingua.country, 'JP');
  assert.equal(result.interlingua.privacyLevel, 'building_required');
  assert.match(result.interlingua.agid, /^AGID-JP-/);
  assert.equal(result.evaluation.postalMatchRate, 1);
  assert.equal(result.evaluation.privacyPreservation, 1);
  assert.ok(result.formatted.some(line => /Japan|JAPAN/.test(line)));
});

test('VATT accepts public API-style request fields and returns normalized, formatted, and risk metadata', async () => {
  const result = await executeVerifiedAddressTranslation({
    input_address: '東京都渋谷区神南1-19-11',
    input_language: 'ja',
    target_language: 'en',
    purpose: 'international_shipping',
    country_model: 'JP',
    output_format: 'shipping_label',
    details: {
      country_code: 'jp',
      country: 'Japan',
      postcode: '150-0041',
      state: '東京都',
      city: '渋谷区',
      road: '神南',
      house_number: '1-19-11',
    },
    format: japanFormat,
    sources: ['japan-postcode-api', 'jageocoder', 'geolonia-address'],
  });

  assert.equal(result.targetLanguage, 'en');
  assert.equal(result.normalized.country, 'Japan');
  assert.equal(result.normalized.adminLevel1, '東京都');
  assert.equal(result.normalized.adminLevel2, '渋谷区');
  assert.equal(result.normalized.street, '神南');
  assert.equal(result.normalized.houseNumber, '1-19-11');
  assert.equal(result.postalCodeMatch, 'valid');
  assert.equal(result.deliveryRisk, 'low');
  assert.equal(result.validation.quality.label, 'Verified');
  assert.ok(result.confidence >= 0.9);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.interlingua.adminPath[0], '東京都');
  assert.equal(result.evaluation.carrierAcceptance, 0.95);
  assert.ok(result.formatted.length >= 2);
});

test('VATT keeps no-postal strong geography as geo verified instead of inventing a postal address', async () => {
  const result = await executeVerifiedAddressTranslation({
    countryCode: 'HK',
    language: 'zh-Hant',
    details: {
      country_code: 'hk',
      country: 'Hong Kong',
      district: 'Central and Western',
      road: 'Queen’s Road Central',
      plus_code: '7PJP+Q5',
    },
    format: {
      countryCode: 'HK',
      name: 'Hong Kong',
      native: {
        addressFormat: '{{district}}\n{{street}}',
        ordering: 'big-to-small',
        fields: [
          { key: 'district', label: '區', required: true },
          { key: 'street', label: '街道', required: true },
        ],
      },
      english: {
        addressFormat: '{{street}}\n{{district}}\n{{country}}',
        ordering: 'small-to-big',
        fields: [],
      },
      addressRules: {
        languages: [{ code: 'zh-Hant', name: '繁體中文' }],
        nativeOrder: ['district', 'street'],
        englishOrder: ['street', 'district', 'country'],
        regionalHierarchy: ['district'],
        openSourceIds: ['osm-nominatim', 'hk-csdi', 'overture-maps'],
        postalCode: null,
      },
      openSourceIds: ['osm-nominatim', 'hk-csdi', 'overture-maps'],
    },
    sources: ['osm-nominatim', 'hk-csdi', 'overture-maps'],
  });

  assert.equal(result.validation.quality.label, 'Geo Verified');
  assert.equal(result.graph.postal.code, '');
  assert.equal(result.postalCodeMatch, 'not_applicable');
  assert.notEqual(result.deliveryRisk, 'high');
  assert.equal(result.evaluation.geocodeMatchRate, 1);
  assert.equal(result.graph.geo.hasCoordinateOrCode, true);
  assert.doesNotMatch(result.renderings.internationalEnglish, /Postal Code/i);
});
