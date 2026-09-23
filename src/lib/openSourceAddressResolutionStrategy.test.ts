import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildOpenSourceAddressResolutionPipeline,
shouldUseOpenSourceTranslationBeforeLocalFallback,
} from './openSourceAddressResolutionStrategy';

test('address resolution pipeline puts open APIs and OSS evidence before dictionary fallback', () => {
  const pipeline = buildOpenSourceAddressResolutionPipeline({
    countryCode: 'JP',
    hasPostcode: true,
    hasCoordinates: true,
    sourceLanguage: 'ja',
    targetLanguage: 'en',
  });
  const stepIds = pipeline.map(step => step.id);

  assert.deepEqual(stepIds.slice(0, 4), [
    'official-postal-api',
    'open-postal-dataset',
    'open-geodata',
    'open-source-translation-api',
  ]);
  assert.equal(stepIds.at(-1), 'local-dictionary-fallback');
  assert.equal(pipeline.at(-1)?.dictionaryDependent, true);
  assert.equal(pipeline.slice(0, -1).some(step => step.dictionaryDependent), false);
});

test('natural and remote places add space-agency geodata after normal open geodata', () => {
  const pipeline = buildOpenSourceAddressResolutionPipeline({
    countryCode: 'AQ',
    hasCoordinates: true,
    needsNaturalGeographyContext: true,
    sparseOrRemoteArea: true,
  });
  const stepIds = pipeline.map(step => step.id);

  assert.deepEqual(stepIds.slice(0, 2), [
    'open-geodata',
    'space-agency-open-geodata',
  ]);
  assert.equal(pipeline[1].kind, 'space-agency-geodata');
  assert.equal(pipeline[1].dictionaryDependent, false);
});

test('default app translation tries open-source/free APIs before local dictionaries', () => {
  assert.equal(shouldUseOpenSourceTranslationBeforeLocalFallback({
    hasCustomTranslator: false,
    fieldKey: 'city',
    text: '東京都千代田区',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
  }), true);

  assert.equal(shouldUseOpenSourceTranslationBeforeLocalFallback({
    hasCustomTranslator: true,
    fieldKey: 'city',
    text: '東京都千代田区',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
  }), false);

  assert.equal(shouldUseOpenSourceTranslationBeforeLocalFallback({
    hasCustomTranslator: false,
    fieldKey: 'postcode',
    text: '1000001',
    sourceLanguage: 'ja',
    targetLanguage: 'en',
  }), false);
});
