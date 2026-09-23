import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PLACE_SEARCH_LANGUAGE_POLICY,
  buildPlaceSearchLanguageProfile,
  buildPlaceSearchQueryVariants,
  detectPlaceSearchScripts,
} from './placeSearchLanguage';

test('place search language policy is independent from app and address languages', () => {
  assert.deepEqual(PLACE_SEARCH_LANGUAGE_POLICY.independentFrom, ['app-language', 'address-language']);

  const profile = buildPlaceSearchLanguageProfile('東京駅');
  assert.deepEqual(profile.independentFrom, ['app-language', 'address-language']);
  assert.ok(profile.languageHints.includes('ja'));
  assert.ok(profile.languageHints.includes('en'));
});

test('detects common global place-name scripts for provider language hints', () => {
  assert.deepEqual(detectPlaceSearchScripts('東京'), ['han']);
  assert.deepEqual(detectPlaceSearchScripts('とうきょう'), ['kana']);
  assert.deepEqual(detectPlaceSearchScripts('서울'), ['hangul']);
  assert.deepEqual(detectPlaceSearchScripts('Москва'), ['cyrillic']);
  assert.deepEqual(detectPlaceSearchScripts('القاهرة'), ['arabic']);
  assert.deepEqual(detectPlaceSearchScripts('वाराणसी'), ['devanagari']);
  assert.deepEqual(detectPlaceSearchScripts('กรุงเทพมหานคร'), ['thai']);
  assert.deepEqual(detectPlaceSearchScripts('Αθήνα'), ['greek']);
});

test('builds multilingual provider hints from input text, not settings', () => {
  const arabic = buildPlaceSearchLanguageProfile('القاهرة');
  assert.deepEqual(arabic.languageHints.slice(0, 3), ['ar', 'fa', 'ur']);
  assert.match(arabic.acceptLanguage, /^ar,fa,ur/);

  const latin = buildPlaceSearchLanguageProfile('Sao Paulo');
  assert.ok(latin.languageHints.includes('pt'));
  assert.ok(latin.languageHints.includes('en'));
});

test('keeps native, alias, and accent-folded variants for geocoder recall', () => {
  assert.deepEqual(buildPlaceSearchQueryVariants('東京都').slice(0, 2), ['東京都', 'Tokyo']);
  assert.ok(buildPlaceSearchQueryVariants('São Paulo').includes('Sao Paulo'));
  assert.ok(buildPlaceSearchQueryVariants('Bogotá').includes('Bogota'));
  assert.ok(buildPlaceSearchQueryVariants('কলকাতা').includes('Kolkata'));
});
