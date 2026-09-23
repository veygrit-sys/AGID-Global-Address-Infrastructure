import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION,
  buildAddressQlGlobalCountryPreloadProfiles,
  getAddressQlGlobalCountryPreloadProfile,
  summarizeAddressQlGlobalCountryPreload,
  validateAddressQlGlobalCountryPreload,
} from './addressQlGlobalCountryPreload';

function addressQlDocPath(fileName: string) {
  const workspacePath = `docs/addressql/${fileName}`;
  return existsSync(workspacePath) ? workspacePath : `docs/${fileName}`;
}

test('AddressQL global preload covers all core countries and existing local address formats', () => {
  const profiles = buildAddressQlGlobalCountryPreloadProfiles();
  const summary = summarizeAddressQlGlobalCountryPreload();
  const codes = new Set(profiles.map(profile => profile.countryCode));

  assert.equal(summary.version, ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION);
  assert.ok(summary.totalProfiles >= 249);
  assert.ok(summary.localAddressFormatProfiles >= 249);
  assert.ok(summary.nativeAndEnglishProfiles > 150);
  assert.ok(codes.has('JP'));
  assert.ok(codes.has('US'));
  assert.ok(codes.has('HK'));
  assert.ok(codes.has('AE'));
  assert.ok(codes.has('KE'));
  assert.deepEqual(validateAddressQlGlobalCountryPreload(), []);
});

test('AddressQL preload distinguishes official, no-postal, and weak-postal countries', () => {
  const jp = getAddressQlGlobalCountryPreloadProfile('JP');
  const hk = getAddressQlGlobalCountryPreloadProfile('HK');
  const ae = getAddressQlGlobalCountryPreloadProfile('AE');
  const ke = getAddressQlGlobalCountryPreloadProfile('KE');
  const gh = getAddressQlGlobalCountryPreloadProfile('GH');

  assert.equal(jp?.postalStatus, 'official_postal_code');
  assert.equal(jp?.validationReadiness, 'format_only');
  assert.equal(hk?.postalStatus, 'no_postal_code');
  assert.equal(ae?.postalStatus, 'no_postal_code');
  assert.equal(hk?.validationReadiness, 'postal_equivalent_required');
  assert.match(hk?.sourcePolicy.postalEquivalentStrategy ?? '', /do not invent official postal codes/i);
  assert.equal(ke?.postalStatus, 'weak_or_partial_postal_code');
  assert.equal(gh?.postalStatus, 'weak_or_partial_postal_code');
  assert.equal(ke?.validationReadiness, 'metadata_gated');
});

test('AddressQL preload exposes native and English input readiness without raw address claims', () => {
  const hk = getAddressQlGlobalCountryPreloadProfile('hk');
  const jp = getAddressQlGlobalCountryPreloadProfile('jp');
  const profiles = buildAddressQlGlobalCountryPreloadProfiles();

  assert.equal(hk?.nativeInputAvailable, true);
  assert.equal(hk?.englishInputAvailable, true);
  assert.ok(hk?.languageCodes.includes('zh-Hant'));
  assert.equal(jp?.addressFormatCoverage, 'native_and_english_preloaded');
  assert.ok(jp?.requiredComponents.includes('postcode'));

  for (const profile of profiles.slice(0, 25)) {
    assert.match(profile.sourcePolicy.nonClaims.join(' '), /not proof of global address completeness/i);
    assert.match(profile.sourcePolicy.nonClaims.join(' '), /not proof of residence/i);
  }
});

test('AddressQL global preload docs and manifest are wired for OSS release', () => {
  const readme = readFileSync(addressQlDocPath('README.md'), 'utf8');
  const globalPreload = readFileSync(addressQlDocPath('global-country-preload-v0.7.md'), 'utf8');
  const manifest = readFileSync(addressQlDocPath('repository-manifest.json'), 'utf8');
  const packageJson = readFileSync('package.json', 'utf8');

  assert.match(readme, /global-country-preload-v0\.7\.md/);
  assert.match(globalPreload, /COUNTRY_ADDRESS_PROFILE/);
  assert.match(globalPreload, /POSTAL_EQUIVALENT/);
  assert.match(globalPreload, /not proof of global address completeness/i);
  assert.match(manifest, /addressql-global-country-preload/);
  assert.match(packageJson, /verify:addressql-global-preload/);
});
