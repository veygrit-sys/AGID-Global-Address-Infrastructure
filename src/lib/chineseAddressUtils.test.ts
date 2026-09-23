import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
buildChineseAddressProfile,
normalizeChineseRegionalAddressPart,
renderChineseLocaleAddress,
renderInternationalCN,
} from './chineseAddressUtils';

test('renders Mainland China international addresses with readable Pinyin and translated administrative suffixes', () => {
  const rendered = renderInternationalCN({
    country_code: 'CN',
    state: '新疆维吾尔自治区',
    city: '乌鲁木齐市',
    district: '天山区',
    road: '解放南路',
    house_number: '88',
    postcode: '830000',
  });

  assert.equal(rendered, 'Jiefang South Road, No. 88, Tianshan District, Urumqi, Xinjiang Uyghur Autonomous Region, 830000, CHINA');
});

test('builds separate alias and script layers for CN, TW, HK, and MO', () => {
  const cn = buildChineseAddressProfile('CN', { state: '北京市', city: '广州市' });
  assert.equal(cn.zone, 'mainland');
  assert.equal(cn.scripts.simplified.state, '北京市');
  assert.ok(cn.aliases.some(alias => alias.native === '北京市' && alias.values.includes('Beijing') && alias.values.includes('Peking')));
  assert.ok(cn.aliases.some(alias => alias.native === '广州市' && alias.values.includes('Guangzhou') && alias.values.includes('Canton')));

  const tw = buildChineseAddressProfile('TW', { state: '台北市', city: '信義區' });
  assert.equal(tw.zone, 'taiwan');
  assert.equal(tw.scripts.traditional.state, '臺北市');
  assert.ok(tw.aliases.some(alias => alias.native === '台北市' && alias.values.includes('Taipei') && alias.values.includes('Taibei')));

  const hk = buildChineseAddressProfile('HK', { city: '九龍', subdistrict: '尖沙咀', road: '彌敦道' });
  assert.equal(hk.zone, 'hong-kong');
  assert.ok(hk.aliases.some(alias => alias.native === '尖沙咀' && alias.values.includes('Tsim Sha Tsui')));
  assert.ok(hk.aliases.some(alias => alias.native === '彌敦道' && alias.values.includes('Nathan Road')));

  const mo = buildChineseAddressProfile('MO', { city: '澳門', subdistrict: '氹仔', road: '新馬路' });
  assert.equal(mo.zone, 'macao');
  assert.ok(mo.aliases.some(alias => alias.native === '氹仔' && alias.values.includes('Taipa')));
  assert.ok(mo.aliases.some(alias => alias.native === '新馬路' && alias.values.includes('Avenida de Almeida Ribeiro')));
});

test('renders Chinese-region addresses by locale instead of one generic Chinese English path', () => {
  assert.equal(
    renderChineseLocaleAddress('zh-CN', {
      country_code: 'CN',
      state: '北京市',
      city: '北京市',
      district: '朝阳区',
      road: '解放南路',
      house_number: '88',
      postcode: '100000',
    }),
    '100000北京市北京市朝阳区解放南路88号'
  );

  assert.equal(
    renderChineseLocaleAddress('en-TW', {
      country_code: 'TW',
      state: '台北市',
      city: '信義區',
      road: '市府路',
      house_number: '45',
      postcode: '110',
    }),
    'No. 45, Shifu Road, Xinyi District, Taipei City, 110, TAIWAN'
  );

  assert.equal(
    renderChineseLocaleAddress('en-HK', {
      country_code: 'HK',
      city: '九龍',
      subdistrict: '尖沙咀',
      road: '彌敦道',
      house_number: '100',
    }),
    '100 Nathan Road, Tsim Sha Tsui, Kowloon, HONG KONG'
  );

  assert.equal(
    renderChineseLocaleAddress('pt-MO', {
      country_code: 'MO',
      city: '澳門',
      road: '新馬路',
      house_number: '100',
    }),
    'No. 100, Avenida de Almeida Ribeiro, MACAU'
  );
});

test('uses country context for Han readings and fails closed where Mandarin fallback is unsafe', () => {
  assert.equal(normalizeChineseRegionalAddressPart('沙田', 'HK'), 'Sha Tin');
  assert.equal(normalizeChineseRegionalAddressPart('沙田', 'CN'), 'Shatian');
  assert.equal(normalizeChineseRegionalAddressPart('長洲', 'HK'), 'Cheung Chau');
  assert.equal(normalizeChineseRegionalAddressPart('長洲', 'CN'), 'Changzhou');
  assert.equal(normalizeChineseRegionalAddressPart('高雄市', 'TW'), 'Kaohsiung City');
  assert.equal(normalizeChineseRegionalAddressPart('氹仔', 'MO'), 'Taipa');
  assert.equal(normalizeChineseRegionalAddressPart('牛車水', 'SG'), 'Chinatown');
  assert.equal(normalizeChineseRegionalAddressPart('合成區', 'HK'), '');
});

test('resolves adjacent known regional names without applying one generic reading system', () => {
  assert.equal(
    normalizeChineseRegionalAddressPart('九龍尖沙咀彌敦道', 'HK'),
    'Kowloon Tsim Sha Tsui Nathan Road',
  );
  assert.equal(
    normalizeChineseRegionalAddressPart('台北市信義區市府路', 'TW'),
    'Taipei City Xinyi District Shifu Road',
  );
});
