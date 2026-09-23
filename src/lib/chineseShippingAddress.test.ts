import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AddressRenderer, type CanonicalAddress } from './addressRendering';
import {
  buildChineseShippingAddress,
  CHINESE_SHIPPING_COUNTRY_CODES,
  getChineseShippingComponentLabels,
  getChineseShippingProfile,
  normalizeChineseShippingField,
} from './chineseShippingAddress';

const synthetic = (countryCode: string, values: Partial<CanonicalAddress> = {}): CanonicalAddress => ({
  country_code: countryCode,
  country: '',
  state: '',
  city: '',
  district: '',
  subdistrict: '',
  suburb: '',
  road: '',
  house_number: '',
  building: '',
  postcode: '',
  poi: '',
  ...values,
});

test('publishes explicit Chinese shipping profiles and evidence for all four destinations', () => {
  assert.deepEqual(CHINESE_SHIPPING_COUNTRY_CODES, ['CN', 'TW', 'HK', 'MO']);
  for (const code of CHINESE_SHIPPING_COUNTRY_CODES) {
    const profile = getChineseShippingProfile(code);
    assert.ok(profile);
    assert.match(profile.evidence.url, /^https:\/\//);
    assert.equal(profile.evidence.checkedOn, '2026-07-25');
  }
});

test('uses complete OpenCC character conversion with Taiwan and Hong Kong variants', () => {
  assert.equal(
    normalizeChineseShippingField({
      countryCode: 'TW',
      text: '广东省龙华区后台发展里',
      mode: 'domestic-traditional',
    }),
    '廣東省龍華區後臺發展裡',
  );
  assert.equal(
    normalizeChineseShippingField({
      countryCode: 'HK',
      text: '广东省龙华区后台发展里',
      mode: 'domestic-traditional',
    }),
    '廣東省龍華區後台發展裏',
  );
  assert.equal(
    normalizeChineseShippingField({
      countryCode: 'CN',
      text: '廣東省龍華區',
      mode: 'domestic-simplified',
    }),
    '广东省龙华区',
  );
});

test('renders Mainland domestic addresses in requested script without duplicating number suffixes', () => {
  const input = synthetic('CN', {
    state: '广东省',
    city: '深圳市',
    district: '龙华区',
    road: '合成测试路',
    house_number: '88号',
    building: '虚构大厦A座',
    postcode: '518000',
  });

  const simplified = buildChineseShippingAddress(input, 'domestic-simplified');
  assert.equal(
    simplified.formatted,
    '518000广东省深圳市龙华区\n合成测试路88号\n虚构大厦A座',
  );
  assert.equal(simplified.status, 'format-ready');

  const traditional = buildChineseShippingAddress(input, 'domestic-traditional');
  assert.equal(
    traditional.formatted,
    '518000廣東省深圳市龍華區\n合成測試路88號\n虛構大廈A座',
  );
});

test('renders Mainland international labels in small-to-big Pinyin order', () => {
  const result = buildChineseShippingAddress(synthetic('CN', {
    state: '北京市',
    city: '北京市',
    district: '朝阳区',
    road: '世纪大道',
    house_number: '88',
    building: '合成测试大厦',
    postcode: '100000',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Hechengceshi Building',
    'No. 88, Century Avenue',
    'Chaoyang District',
    '100000 Beijing',
    'P.R. CHINA',
  ]);
  assert.equal(result.status, 'format-ready');
  assert.equal(result.deliveryPointValidated, false);
});

test('uses Taiwan postal aliases and current 3+3 postcode readiness', () => {
  const result = buildChineseShippingAddress(synthetic('TW', {
    state: '臺北市',
    city: '信義區',
    road: '市府路',
    house_number: '45',
    building: '合成測試大樓',
    postcode: '110204',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Hechengceshi Building',
    'No. 45, Shifu Rd.',
    'Xinyi District, Taipei City, 110204',
    'TAIWAN',
  ]);
  assert.equal(result.status, 'format-ready');

  const legacy = buildChineseShippingAddress(synthetic('TW', {
    state: '臺北市',
    city: '信義區',
    road: '市府路',
    house_number: '45',
    postcode: '110',
  }), 'domestic-traditional');
  assert.ok(legacy.warnings.includes('legacy_postcode_format'));
});

test('uses Hong Kong gazetted English aliases and no postcode', () => {
  const result = buildChineseShippingAddress(synthetic('HK', {
    state: '九龍',
    district: '油尖旺區',
    subdistrict: '尖沙咀',
    road: '彌敦道',
    house_number: '100',
    building: 'Synthetic Tower',
  }), 'international-shipping');

  assert.deepEqual(result.lines, [
    'Synthetic Tower',
    '100 Nathan Road',
    'Tsim Sha Tsui',
    'Yau Tsim Mong District',
    'Kowloon',
    'HONG KONG',
  ]);
  assert.equal(result.status, 'format-ready');
  assert.ok(!result.formatted.match(/\d{5,6}/));
});

test('flags unknown Hong Kong romanization rather than claiming an official English name', () => {
  const result = buildChineseShippingAddress(synthetic('HK', {
    state: '新界',
    district: '測試區',
    road: '虛構道',
    house_number: '8',
  }), 'international-shipping');

  assert.ok(result.warnings.includes('official_romanization_unverified'));
  assert.equal(result.status, 'needs-review');
});

test('renders Macao Chinese and international lines using official area aliases', () => {
  const input = synthetic('MO', {
    city: '氹仔',
    road: '新馬路',
    house_number: '130',
    building: 'Synthetic Building',
  });
  assert.equal(
    buildChineseShippingAddress(input, 'domestic-traditional').formatted,
    '澳門 氹仔\n新馬路130號\nSynthetic Building',
  );
  assert.deepEqual(
    buildChineseShippingAddress(input, 'international-shipping').lines,
    ['Synthetic Building', 'No. 130, Avenida de Almeida Ribeiro', 'Taipa', 'MACAO'],
  );
});

test('returns localized field labels for both Chinese scripts and English', () => {
  assert.equal(getChineseShippingComponentLabels('domestic-simplified').postcode, '邮政编码');
  assert.equal(getChineseShippingComponentLabels('domestic-traditional').postcode, '郵遞區號');
  assert.equal(getChineseShippingComponentLabels('international-shipping').postcode, 'Postal code');
});

test('connects domestic script and international English modes to the shared renderer', () => {
  const input = synthetic('CN', {
    state: '广东省',
    city: '深圳市',
    district: '龙华区',
    road: '世纪大道',
    house_number: '88',
    postcode: '518000',
  });
  assert.match(AddressRenderer.render('zh-Hant', input), /廣東省深圳市龍華區/);
  assert.match(AddressRenderer.render('intl_en', input), /Century Avenue/);
  assert.match(AddressRenderer.render('intl_en', input), /P\.R\. CHINA$/);
});

test('keeps incomplete and no-postcode policy failures explicit', () => {
  const incomplete = buildChineseShippingAddress(synthetic('CN'), 'domestic-simplified');
  assert.equal(incomplete.status, 'insufficient');
  assert.ok(incomplete.warnings.includes('missing_delivery_line'));
  assert.ok(incomplete.warnings.includes('missing_postcode'));

  const hongKong = buildChineseShippingAddress(synthetic('HK', {
    state: '九龍',
    road: '彌敦道',
    house_number: '1',
    postcode: '999999',
  }), 'domestic-traditional');
  assert.ok(hongKong.warnings.includes('unexpected_postcode'));
  assert.ok(!hongKong.formatted.includes('999999'));
});
