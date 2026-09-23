import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { test } from 'node:test';

import { assessAddressDisplayQuality,formatAddressDisplayText } from './addressDisplay';
import { AddressRenderer,createCanonicalAddress,type CanonicalAddress } from './addressRendering';

function renderedQuality(address: string, tab: string, countryCode: string) {
  const display = formatAddressDisplayText(address, { tab, countryCode });
  return {
    display,
    quality: assessAddressDisplayQuality(display, { countryCode }),
  };
}

function hasAdjacentRepeatedLineOrToken(display: string) {
  const parts = display
    .split(/\r?\n|,\s*/)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);

  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

const maliRegions = [
  'Kidal',
  'Tombouctou',
  'Gao',
  'Mopti',
  'Segou',
  'Kayes',
  'Koulikoro',
  'Sikasso',
  'Menaka',
  'Taoudenit',
];

const maliDistricts = [
  'Cercle de Tessalit',
  'Cercle de Abeibara',
  'Cercle de Bourem',
  'Cercle de Niafunke',
  'Cercle de Youwarou',
  'Cercle de Bandiagara',
  'Cercle de Niono',
  'Cercle de Kita',
  'Cercle de Koutiala',
  'Cercle de Ansongo',
];

const japanesePrefectures = [
  '東京都',
  '北海道',
  '大阪府',
  '京都府',
  '福岡県',
  '沖縄県',
  '長野県',
  '宮城県',
  '広島県',
  '鹿児島県',
];

const japaneseCities = [
  '千代田区',
  '札幌市',
  '大阪市',
  '京都市',
  '福岡市',
  '那覇市',
  '松本市',
  '仙台市',
  '広島市',
  '鹿児島市',
];

const japaneseTowns = [
  '永田町',
  '北一条西',
  '梅田',
  '祇園町南側',
  '天神',
  '久茂地',
  '深志',
  '一番町',
  '紙屋町',
  '山下町',
];

test('Mali sparse-region address display keeps 100 cases useful without repeated administrative labels', () => {
  const start = performance.now();

  for (let index = 0; index < 100; index += 1) {
    const canonical = createCanonicalAddress({
      country_code: 'ml',
      country: 'Mali',
      state: maliRegions[index % maliRegions.length],
      city: maliRegions[(index * 3) % maliRegions.length],
      district: maliDistricts[index % maliDistricts.length],
      postcode: index % 4 === 0 ? '' : String(7000 + index),
    });

    for (const tab of ['fr', 'en', 'intl_en']) {
      const { display, quality } = renderedQuality(AddressRenderer.render(tab, canonical), tab, 'ML');

      assert.equal(quality.isWeak, false, `Mali case ${index}/${tab} should not be weak: ${display}`);
      assert.ok(quality.score >= 0.55, `Mali case ${index}/${tab} should score >= 0.55: ${display}`);
      assert.equal(hasAdjacentRepeatedLineOrToken(display), false, `Mali case ${index}/${tab} should not repeat adjacent region labels: ${display}`);
    }
  }

  assert.ok(performance.now() - start < 1000, 'Mali 100-case address rendering should stay below 1s');
});

test('Japan address display keeps 100 native and English cases distinct, readable, and fast', () => {
  const start = performance.now();

  for (let index = 0; index < 100; index += 1) {
    const canonical: CanonicalAddress = {
      country_code: 'JP',
      country: '日本',
      state: japanesePrefectures[index % japanesePrefectures.length],
      city: japaneseCities[index % japaneseCities.length],
      district: '',
      subdistrict: japaneseTowns[index % japaneseTowns.length],
      suburb: '',
      road: `${(index % 5) + 1}-${(index % 9) + 1}`,
      house_number: String((index % 30) + 1),
      building: index % 3 === 0 ? '市民センター' : '',
      postcode: `${100 + index}-${String(1000 + index).slice(0, 4)}`,
      poi: '',
    };

    const native = renderedQuality(AddressRenderer.render('ja', canonical), 'ja', 'JP');
    const english = renderedQuality(AddressRenderer.render('en', canonical), 'en', 'JP');

    assert.equal(native.quality.isWeak, false, `Japan native case ${index} should not be weak: ${native.display}`);
    assert.ok(native.quality.score >= 0.55, `Japan native case ${index} should score >= 0.55: ${native.display}`);
    assert.match(native.display, /[\u3040-\u30ff\u3400-\u9fff]/, `Japan native case ${index} should keep native script`);

    assert.equal(english.quality.isWeak, false, `Japan English case ${index} should not be weak: ${english.display}`);
    assert.ok(english.quality.score >= 0.55, `Japan English case ${index} should score >= 0.55: ${english.display}`);
    assert.doesNotMatch(english.display, /[\u3040-\u30ff\u3400-\u9fff]/, `Japan English case ${index} should romanize display`);
    assert.notEqual(native.display, english.display, `Japan language tab case ${index} should visibly change`);
  }

  assert.ok(performance.now() - start < 1000, 'Japan 100-case address rendering should stay below 1s');
});
