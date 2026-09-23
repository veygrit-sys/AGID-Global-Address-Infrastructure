import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadExternalAddressValidatorRuntimeConfig,
  normalizeExternalAddressValidationResponse,
  normalizeExternalAddressValidatorManifest,
  publicExternalAddressValidatorProfile,
  runExternalAddressValidators,
} from './externalAddressValidationApps';

test('external validator manifest import accepts metadata-only validators', () => {
  const result = normalizeExternalAddressValidatorManifest({
    id: 'official-postal-jp',
    name: 'Official Postal JP',
    version: '2026.06',
    adapter: 'agid-json-v1',
    capabilities: ['postal-lookup', 'address-verify'],
    supportedCountries: ['jp'],
    privacyMode: 'redacted-only',
    endpointId: 'jp-postal',
    dataRetention: 'none',
  });

  assert.equal(result.accepted, true);
  assert.equal(result.manifest?.id, 'official-postal-jp');
  assert.deepEqual(result.manifest?.supportedCountries, ['JP']);
});

test('external validator manifest import rejects runtime URLs, secrets, and address payloads', () => {
  const result = normalizeExternalAddressValidatorManifest({
    id: 'unsafe-validator',
    name: 'Unsafe Validator',
    adapter: 'generic-json',
    capabilities: ['address-verify'],
    privacyMode: 'redacted-only',
    endpoint: 'https://validator.example/verify',
    apiKey: 'secret',
    addressText: 'Private Receiver, 10F, phone +81-3-secret',
  });

  assert.equal(result.accepted, false);
  assert.match(result.errors.join('\n'), /endpoint/);
  assert.match(result.errors.join('\n'), /apiKey/);
  assert.match(result.errors.join('\n'), /addressText/);
});

test('runtime config keeps endpoint server-side and exposes only public profile', () => {
  const loaded = loadExternalAddressValidatorRuntimeConfig(JSON.stringify([
    {
      id: 'official-postal-jp',
      name: 'Official Postal JP',
      adapter: 'agid-json-v1',
      capabilities: ['postal-lookup'],
      supportedCountries: ['JP'],
      privacyMode: 'redacted-only',
      endpointId: 'jp-postal',
      endpoint: 'https://validator.example/verify',
      apiKeyEnv: 'AGID_TEST_VALIDATOR_KEY',
    },
  ]));

  assert.equal(loaded.errors.length, 0);
  assert.equal(loaded.validators.length, 1);
  const profile = publicExternalAddressValidatorProfile(loaded.validators[0]);
  assert.equal('endpoint' in profile, false);
  assert.equal('apiKeyEnv' in profile, false);
  assert.equal(profile.serverConfigured, true);
});

test('external validator response normalizes postal evidence and address references', () => {
  const result = normalizeExternalAddressValidationResponse({ id: 'official-postal-jp' }, {
    ok: true,
    status: 'verified',
    score: 0.94,
    canonicalAddress: {
      country_code: 'jp',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '1000005',
    },
    postalEvidence: [
      {
        source: 'japan-post',
        countryCode: 'JP',
        postalCode: '1000005',
        state: 'Tokyo',
        city: 'Chiyoda',
        confidence: 0.98,
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 'verified');
  assert.equal(result.postalEvidence.length, 2);
  assert.equal(result.postalEvidence[0].postalCode, '1000005');
  assert.equal(result.referenceRecords.length, 1);
  assert.equal(result.referenceRecords[0].street, 'Marunouchi');
});

test('external validator runner sends redacted payloads by default', async () => {
  const loaded = loadExternalAddressValidatorRuntimeConfig(JSON.stringify([
    {
      id: 'redacted-validator',
      name: 'Redacted Validator',
      adapter: 'agid-json-v1',
      capabilities: ['address-verify'],
      supportedCountries: ['JP'],
      privacyMode: 'redacted-only',
      endpoint: 'https://validator.example/verify',
    },
  ]));
  const calls: any[] = [];

  const result = await runExternalAddressValidators({
    validators: loaded.validators,
    input: {
      countryCode: 'JP',
      addressText: 'Private Receiver, 10F, phone +81-3-secret',
      address: {
        country_code: 'jp',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Marunouchi',
        house_number: '1-9-1',
        building: 'Private Building',
        postcode: '1000005',
      },
    },
    fetcher: async (_url, options) => {
      calls.push(JSON.parse(String(options?.body ?? '{}')));
      return new Response(JSON.stringify({
        ok: true,
        postalEvidence: [{ countryCode: 'JP', postalCode: '1000005', city: 'Chiyoda' }],
      }), { status: 200 });
    },
  });

  assert.equal(result.results.length, 1);
  assert.equal(result.postalEvidence.length, 1);
  assert.equal(calls[0].addressText, undefined);
  assert.equal(calls[0].address.road, undefined);
  assert.equal(calls[0].address.house_number, undefined);
  assert.equal(calls[0].address.building, undefined);
  assert.equal(calls[0].address.city, 'Chiyoda');
});

test('plaintext external validators are skipped unless explicitly allowed', async () => {
  const loaded = loadExternalAddressValidatorRuntimeConfig(JSON.stringify([
    {
      id: 'plaintext-validator',
      name: 'Plaintext Validator',
      adapter: 'generic-json',
      capabilities: ['address-verify'],
      supportedCountries: ['JP'],
      privacyMode: 'plaintext-address-required',
      endpoint: 'https://validator.example/verify',
    },
  ]));
  let called = false;
  const result = await runExternalAddressValidators({
    validators: loaded.validators,
    input: { countryCode: 'JP', addressText: 'Private Receiver, phone +81-3-secret' },
    fetcher: async () => {
      called = true;
      return new Response('{}');
    },
  });

  assert.equal(called, false);
  assert.equal(result.results[0].ok, false);
  assert.match(result.warnings.join('\n'), /plaintext external validation was not explicitly allowed/);
});
