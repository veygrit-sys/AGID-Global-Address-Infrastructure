import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
chooseOceaniaAddressTranslationRoute,
getOceaniaAddressTranslationProfile,
translateOceaniaAddressField,
} from './oceaniaAddressTranslation';

test('classifies Oceania address markets by domestic language algorithm and topology', () => {
  assert.deepEqual(getOceaniaAddressTranslationProfile('NZ'), {
    countryCode: 'NZ',
    nativeLanguages: ['en', 'mi'],
    defaultLanguage: 'en',
    defaultTopology: 'english-address',
    englishAlgorithm: 'new-zealand-maori-english-address',
  });
  assert.equal(getOceaniaAddressTranslationProfile('FJ')?.nativeLanguages.join(','), 'en,fj,hi');
  assert.equal(getOceaniaAddressTranslationProfile('PG')?.nativeLanguages.join(','), 'en,tpi,ho');
  assert.equal(getOceaniaAddressTranslationProfile('VU')?.nativeLanguages.join(','), 'bi,en,fr');
  assert.equal(getOceaniaAddressTranslationProfile('FM')?.nativeLanguages.join(','), 'en,chk,pon,kos,yap');
  assert.equal(getOceaniaAddressTranslationProfile('CK')?.nativeLanguages.join(','), 'en,rar');
  assert.equal(getOceaniaAddressTranslationProfile('PF')?.nativeLanguages.join(','), 'fr,ty');
  assert.equal(getOceaniaAddressTranslationProfile('WF')?.nativeLanguages.join(','), 'fr,wls,fud');
  assert.equal(getOceaniaAddressTranslationProfile('GU')?.nativeLanguages.join(','), 'en,ch');
});

test('allows Oceania native-to-English and domestic multilingual routes only', () => {
  assert.equal(
    chooseOceaniaAddressTranslationRoute({
      countryCode: 'WS',
      sourceLanguage: 'sm',
      targetLanguage: 'en',
    })?.algorithm,
    'samoa-samoan-english-address'
  );
  assert.equal(
    chooseOceaniaAddressTranslationRoute({
      countryCode: 'FJ',
      sourceLanguage: 'fj',
      targetLanguage: 'hi',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseOceaniaAddressTranslationRoute({
      countryCode: 'VU',
      sourceLanguage: 'bi',
      targetLanguage: 'fr',
    })?.mode,
    'english-pivot'
  );
  assert.equal(
    chooseOceaniaAddressTranslationRoute({
      countryCode: 'AU',
      sourceLanguage: 'en',
      targetLanguage: 'de',
    }),
    null
  );
});

test('translates representative Oceania native address fields to English', async () => {
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'NZ',
    fieldKey: 'country',
    text: 'Aotearoa',
    sourceLanguage: 'mi',
    targetLanguage: 'en',
  }))?.text, 'New Zealand');
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'FJ',
    fieldKey: 'country',
    text: 'Viti',
    sourceLanguage: 'fj',
    targetLanguage: 'en',
  }))?.text, 'Fiji');
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'PG',
    fieldKey: 'country',
    text: 'Papua Niugini',
    sourceLanguage: 'tpi',
    targetLanguage: 'en',
  }))?.text, 'Papua New Guinea');
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'VU',
    fieldKey: 'street',
    text: 'Namba blong House',
    sourceLanguage: 'bi',
    targetLanguage: 'en',
  }))?.text, 'House Number');
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'VU',
    fieldKey: 'street',
    text: 'Rue du Marché',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
  }))?.text, 'Rue du Marché');
  assert.equal((await translateOceaniaAddressField({
    countryCode: 'WS',
    fieldKey: 'street',
    text: 'Auala',
    sourceLanguage: 'sm',
    targetLanguage: 'en',
  }))?.text, 'Street');
});

test('uses English pivot for Oceania native address tabs with different topology', async () => {
  const calls: string[] = [];
  const translated = await translateOceaniaAddressField({
    countryCode: 'FJ',
    fieldKey: 'country',
    text: 'Viti',
    sourceLanguage: 'fj',
    targetLanguage: 'hi',
    translator: async ({ text, source, target }) => {
      calls.push(`${source}->${target}:${text}`);
      return `${target}:${text}`;
    },
  });

  assert.equal(translated?.text, 'hi:Fiji');
  assert.deepEqual(calls, ['en->hi:Fiji']);
});
