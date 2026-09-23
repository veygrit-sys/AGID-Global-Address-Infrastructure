import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAddressStandardLibraryResolution } from './addressStandardLibraryResolver';

function ids(entries: Array<{ id: string }>) {
  return entries.map(entry => entry.id);
}

test('builds a free standard-library resolver plan for postal and multilingual addresses', () => {
  const plan = buildAddressStandardLibraryResolution({
    countryCode: 'jp',
    targetCountries: ['JP'],
    hasPostcode: true,
    hasCoordinates: true,
    sourceLanguage: 'ja',
    targetLanguage: 'en',
    libpostalEndpointConfigured: true,
  });

  assert.equal(plan.countryCode, 'JP');
  assert.equal(plan.freeOnly, true);
  assert.equal(plan.canParseLocally, true);
  assert.equal(plan.requiresNetworkForStrongVerification, true);
  assert.ok(ids(plan.primary).includes('local-address-parser'));
  assert.ok(ids(plan.primary).includes('local-address-format-rules'));
  assert.ok(ids(plan.fallback).includes('libpostal-compatible-parser'));
  assert.ok(plan.fallback.some(entry => entry.stage === 'postal'));
  assert.ok(ids(plan.fallback).includes('open-source-translation-api'));
  assert.ok(ids(plan.fallback).includes('open-geodata'));
});

test('keeps libpostal disabled when no endpoint is configured', () => {
  const plan = buildAddressStandardLibraryResolution({
    countryCode: 'US',
    hasPostcode: true,
    libpostalEndpointConfigured: false,
  });

  assert.ok(ids(plan.primary).includes('local-address-parser'));
  assert.ok(ids(plan.disabled).includes('libpostal-compatible-parser'));
  assert.ok(plan.warnings.some(warning => warning.includes('libpostal')));
});

test('adds Earth-observation geodata for sparse natural geography contexts', () => {
  const plan = buildAddressStandardLibraryResolution({
    countryCode: 'AQ',
    hasCoordinates: true,
    needsNaturalGeographyContext: true,
    sparseOrRemoteArea: true,
  });

  assert.ok(ids(plan.fallback).includes('open-geodata'));
  assert.ok(ids(plan.fallback).includes('space-agency-open-geodata'));
  assert.ok(plan.nextActions.some(action => action.includes('Earth-observation')));
});
