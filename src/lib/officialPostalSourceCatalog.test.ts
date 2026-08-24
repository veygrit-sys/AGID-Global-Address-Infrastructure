import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyPostalSourceTrust,
  getOfficialPostalSourcesForCountry,
  getPreferredPostalSourceIdsForCountry,
  OFFICIAL_POSTAL_SOURCE_CATALOG,
} from './officialPostalSourceCatalog';

test('registers official and open postal sources for the priority rollout countries', () => {
  for (const countryCode of ['JP', 'US', 'GB', 'BR', 'SG', 'FR', 'NL', 'AU', 'HK', 'AQ', 'DE', 'CZ', 'DK', 'MT', 'MC', 'FI', 'LV', 'LT', 'PT', 'JE', 'IM', 'GI']) {
    const sources = getOfficialPostalSourcesForCountry(countryCode);
    assert.ok(sources.length > 0, `${countryCode} should have at least one registered source`);
    assert.ok(getPreferredPostalSourceIdsForCountry(countryCode).length > 0, `${countryCode} should expose preferred source ids`);
  }
});

test('prefers country-specific official sources before the UPU global fallback', () => {
  const countrySpecificCountries = ['AO', 'DJ', 'DZ', 'EG', 'ET', 'GH', 'KE', 'LR', 'MA', 'MW', 'MZ', 'NA', 'NG', 'SC', 'SO', 'SS', 'TN', 'TZ', 'UG', 'RW', 'ZM', 'ZW', 'MG', 'MU', 'BW', 'AT', 'CH', 'DE', 'CZ', 'DK', 'MT', 'MC', 'FI', 'LV', 'LT', 'LI', 'NL', 'PT', 'JE', 'IM', 'GI'];

  for (const countryCode of countrySpecificCountries) {
    const sources = getOfficialPostalSourcesForCountry(countryCode);
    assert.notEqual(sources[0]?.id, 'upu-universal-postcode-database', `${countryCode} should not prefer the global fallback first`);
    assert.ok(
      sources.some(source => (
        !source.countryCodes.includes('*') &&
        ['authoritative', 'official', 'official-derived'].includes(source.trustTier)
      )),
      `${countryCode} should have a country-specific official source`,
    );
  }

  assert.equal(getOfficialPostalSourcesForCountry('DE')[0]?.id, 'bkg-postleitzahlgebiete');
  assert.equal(getOfficialPostalSourcesForCountry('CZ')[0]?.id, 'ceska-posta-customer-outputs');
  assert.equal(getOfficialPostalSourcesForCountry('FI')[0]?.id, 'posti-finland-postal-code-services');
  assert.equal(getOfficialPostalSourcesForCountry('LV')[0]?.id, 'latvijas-pasts-check-address');
  assert.equal(getOfficialPostalSourcesForCountry('LT')[0]?.id, 'lietuvos-pastas-postcode-search');
  assert.equal(getOfficialPostalSourcesForCountry('JE')[0]?.id, 'jersey-post-address-finder');
  assert.equal(getOfficialPostalSourcesForCountry('IM')[0]?.id, 'isle-of-man-post-office-postcode-finder');
});

test('keeps Guatemala legal framework evidence separate from postal-reference data', () => {
  const source = getOfficialPostalSourcesForCountry('GT')
    .find(candidate => candidate.id === 'correos-guatemala-postal-legal-framework');

  assert.equal(source?.authority, 'postal-operator');
  assert.equal(source?.trustTier, 'official');
  assert.equal(source?.availability, 'web-search');
  assert.equal(source?.depth, 'legal-framework');
  assert.equal(source?.sourceRole, 'legal-framework-only');
  assert.equal(source?.validationReadiness, 'metadata-only');
  assert.equal(source?.requiresCredential, false);
  assert.ok(source?.notes.some(note => /not a current postcode-to-locality dataset/i.test(note)));
  assert.ok(source?.notes.some(note => /delivery-point validity/i.test(note)));
});

test('does not promote legal framework metadata into postal validation evidence', () => {
  const classification = classifyPostalSourceTrust({
    countryCode: 'GT',
    source: 'Correos de Guatemala postal legal framework',
  });
  const preferredSourceIds = getPreferredPostalSourceIdsForCountry('GT');

  assert.equal(classification.tier, 'weak');
  assert.equal(classification.strength, 'weak');
  assert.match(classification.reason, /legal framework/i);
  assert.ok(classification.matches.some(source => source.id === 'correos-guatemala-postal-legal-framework'));
  assert.ok(!preferredSourceIds.includes('correos-guatemala-postal-legal-framework'));
});

test('keeps the UPU source as an explicit official global fallback', () => {
  const sources = getOfficialPostalSourcesForCountry('ZZ');
  const upu = sources.find(source => source.id === 'upu-universal-postcode-database');

  assert.equal(upu?.authority, 'intergovernmental-postal-standard');
  assert.equal(upu?.trustTier, 'official');
  assert.equal(upu?.requiresCredential, true);
});

test('classifies official postal APIs and government address APIs as strong evidence', () => {
  const japanPost = classifyPostalSourceTrust({
    countryCode: 'JP',
    source: 'Japan Post Postal Code and Digital Address API',
  });
  const uspsAddresses = classifyPostalSourceTrust({
    countryCode: 'US',
    source: 'USPS Addresses 3.0 API ZIP Code lookup',
  });
  const franceBan = classifyPostalSourceTrust({
    countryCode: 'FR',
    source: 'API Adresse Base Adresse Nationale data.gouv.fr',
  });
  const singaporeOneMap = classifyPostalSourceTrust({
    countryCode: 'SG',
    source: 'OneMap SLA address search',
  });

  assert.equal(japanPost.strength, 'strong');
  assert.equal(japanPost.tier, 'authoritative');
  assert.equal(uspsAddresses.strength, 'strong');
  assert.equal(uspsAddresses.tier, 'authoritative');
  assert.equal(franceBan.strength, 'strong');
  assert.equal(singaporeOneMap.strength, 'strong');
});

test('separates United States postal authority, geography, and crosswalk sources', () => {
  const usSources = getOfficialPostalSourcesForCountry('US');
  const usSourceIds = usSources.map(source => source.id);

  assert.equal(usSources[0]?.id, 'usps-web-tools');
  assert.ok(usSourceIds.includes('us-census-tiger-line'));
  assert.ok(usSourceIds.includes('us-census-geocoder'));
  assert.ok(usSourceIds.includes('hud-usps-zip-crosswalk'));
  assert.equal(usSources.find(source => source.id === 'usps-web-tools')?.depth, 'delivery-point');
  assert.equal(usSources.find(source => source.id === 'us-census-tiger-line')?.depth, 'geo-only');
  assert.equal(usSources.find(source => source.id === 'hud-usps-zip-crosswalk')?.depth, 'postcode');
});

test('keeps weak third-party postal lists below official and official-derived sources', () => {
  const datahub = classifyPostalSourceTrust({
    countryCode: 'IT',
    source: 'datahub postal-codes-it',
  });
  const geonames = classifyPostalSourceTrust({
    countryCode: 'ZA',
    source: 'geonames-postal',
  });

  assert.equal(datahub.strength, 'weak');
  assert.equal(datahub.tier, 'weak');
  assert.equal(geonames.strength, 'weak');
  assert.equal(geonames.tier, 'community');
});

test('catalog source ids are unique and sorted by trust for a country lookup', () => {
  const ids = OFFICIAL_POSTAL_SOURCE_CATALOG.map(source => source.id);
  assert.equal(new Set(ids).size, ids.length);

  const jpSources = getOfficialPostalSourcesForCountry('JP');
  assert.equal(jpSources[0].id, 'japan-post-digital-address-api');
  assert.ok(jpSources.find(source => source.id === 'zipcloud-jp'));
});
