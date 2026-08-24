import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyPostalSourceTrust,
  getOfficialPostalSourcesForCountry,
  getPreferredPostalSourceIdsForCountry,
  OFFICIAL_POSTAL_SOURCE_CATALOG,
} from './officialPostalSourceCatalog';

test('registers official and open postal sources for the priority rollout countries', () => {
  for (const countryCode of ['JP', 'US', 'GB', 'BR', 'SG', 'FR', 'NL', 'AU', 'HK', 'AQ', 'DE', 'CZ', 'DK', 'MT', 'MC', 'FI', 'LV', 'LT', 'LI', 'PT', 'JE', 'IM', 'GI']) {
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

test('separates Australian postal, address, statistical-area, building, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AU');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('australia-post-postcode-data')?.authority, 'postal-operator');
  assert.equal(byId.get('australia-post-postcode-data')?.trustTier, 'authoritative');
  assert.equal(byId.get('australia-post-paf')?.depth, 'delivery-point');
  assert.equal(byId.get('australia-post-paf')?.requiresCredential, true);
  assert.equal(byId.get('gnaf-au')?.depth, 'address');
  assert.match(byId.get('gnaf-au')?.notes.join(' ') ?? '', /secondary evidence/i);
  assert.equal(byId.get('abs-asgs-postal-areas')?.trustTier, 'official-derived');
  assert.match(byId.get('abs-asgs-postal-areas')?.notes.join(' ') ?? '', /not an Australia Post boundary/i);
  assert.equal(byId.get('geoscape-au-buildings')?.depth, 'building');
  assert.equal(byId.get('geoscape-au-buildings')?.availability, 'commercial-or-restricted');
  assert.equal(byId.get('abs-asgs-boundaries')?.depth, 'geo-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'AU',
    source: 'Australia Post Postcode Data',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Latvian postal, civic-address, building, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('LV');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('latvijas-pasts-check-address')?.authority, 'postal-operator');
  assert.equal(byId.get('latvijas-pasts-check-address')?.trustTier, 'authoritative');
  assert.match(byId.get('latvijas-pasts-check-address')?.notes.join(' ') ?? '', /not a canonical polygon/i);
  assert.equal(byId.get('vzd-latvia-address-register')?.authority, 'government');
  assert.equal(byId.get('vzd-latvia-address-register')?.depth, 'address');
  assert.match(byId.get('vzd-latvia-address-register')?.notes.join(' ') ?? '', /cross-checking/i);
  assert.equal(byId.get('vzd-latvia-cadastral-buildings')?.depth, 'building');
  assert.match(byId.get('vzd-latvia-cadastral-buildings')?.notes.join(' ') ?? '', /explicit VZD relation/i);
  assert.equal(byId.get('vzd-latvia-administrative-boundaries')?.depth, 'geo-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'LV',
    source: 'Latvijas Pasts postcode directory',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Lithuanian postal, civic-address, building, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('LT');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('lietuvos-pastas-postcode-search')?.authority, 'postal-operator');
  assert.equal(byId.get('lietuvos-pastas-postcode-search')?.trustTier, 'authoritative');
  assert.match(byId.get('lietuvos-pastas-postcode-search')?.notes.join(' ') ?? '', /not a canonical postcode polygon/i);
  assert.equal(byId.get('registru-centras-address-register')?.authority, 'government');
  assert.equal(byId.get('registru-centras-address-register')?.depth, 'address');
  assert.match(byId.get('registru-centras-address-register')?.notes.join(' ') ?? '', /cross-checking/i);
  assert.equal(byId.get('registru-centras-ntr-buildings')?.depth, 'building');
  assert.match(byId.get('registru-centras-ntr-buildings')?.notes.join(' ') ?? '', /explicit registry relation/i);
  assert.equal(byId.get('registru-centras-address-boundaries')?.depth, 'geo-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'LT',
    source: 'Lietuvos pastas postal code search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Liechtenstein shared postal, local delivery, sovereign address, building, and boundary authority', () => {
  const sources = getOfficialPostalSourcesForCountry('LI');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('swiss-post-postcodes')?.authority, 'postal-operator');
  assert.equal(byId.get('swiss-post-postcodes')?.trustTier, 'authoritative');
  assert.match(byId.get('swiss-post-postcodes')?.notes.join(' ') ?? '', /contract-partitioned/i);
  assert.equal(byId.get('swisstopo-plzo-postal-localities')?.depth, 'postcode');
  assert.match(byId.get('swisstopo-plzo-postal-localities')?.notes.join(' ') ?? '', /domicile-address/i);
  assert.equal(byId.get('liechtenstein-post-access-points')?.depth, 'delivery-point');
  assert.match(byId.get('liechtenstein-post-access-points')?.notes.join(' ') ?? '', /non-area/i);
  assert.equal(byId.get('llv-liechtenstein-building-addresses')?.depth, 'address');
  assert.match(byId.get('llv-liechtenstein-building-addresses')?.notes.join(' ') ?? '', /not a footprint/i);
  assert.equal(byId.get('llv-liechtenstein-gwr-public')?.depth, 'building');
  assert.match(byId.get('llv-liechtenstein-gwr-public')?.notes.join(' ') ?? '', /dwelling.*excluded/i);
  assert.equal(byId.get('llv-liechtenstein-official-survey')?.depth, 'building');
  assert.match(byId.get('llv-liechtenstein-official-survey')?.notes.join(' ') ?? '', /explicit common identifier/i);
  assert.equal(byId.get('llv-liechtenstein-sovereign-boundaries')?.depth, 'geo-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'LI',
    source: 'Swiss Post postcodes and address geodata',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Azerbaijan postal, address-register, cadastral, and catalog authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AZ');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('azerpost-address-reference')?.authority, 'postal-operator');
  assert.equal(byId.get('azerpost-address-reference')?.trustTier, 'authoritative');
  assert.match(byId.get('azerpost-address-reference')?.notes.join(' ') ?? '', /not a canonical postcode polygon/i);
  assert.equal(byId.get('azerbaijan-address-register')?.depth, 'address');
  assert.equal(byId.get('azerbaijan-address-register')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('azerbaijan-address-register')?.notes.join(' ') ?? '', /address point is not a footprint/i);
  assert.equal(byId.get('azerbaijan-state-committee-property')?.depth, 'building');
  assert.equal(byId.get('azerbaijan-state-committee-property')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('azerbaijan-state-committee-property')?.notes.join(' ') ?? '', /explicit common identifier/i);
  assert.equal(byId.get('azerbaijan-open-data')?.depth, 'geo-only');
  assert.equal(byId.get('azerbaijan-open-data')?.validationReadiness, 'metadata-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'AZ',
    source: 'Azerpost postcode and branch search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});
test('separates Albania postal, address-system, cadastral-building, and geoportal authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AL');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('posta-shqiptare-postcodes')?.authority, 'postal-operator');
  assert.equal(byId.get('posta-shqiptare-postcodes')?.trustTier, 'authoritative');
  assert.match(byId.get('posta-shqiptare-postcodes')?.notes.join(' ') ?? '', /not a canonical postcode polygon/i);
  assert.equal(byId.get('albania-national-address-system')?.depth, 'address');
  assert.equal(byId.get('albania-national-address-system')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('albania-national-address-system')?.notes.join(' ') ?? '', /not automatically a cadastral footprint/i);
  assert.equal(byId.get('ashk-albania-cadastral-buildings')?.depth, 'building');
  assert.equal(byId.get('ashk-albania-cadastral-buildings')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ashk-albania-cadastral-buildings')?.notes.join(' ') ?? '', /explicit common identifier/i);
  assert.equal(byId.get('asig-albania')?.depth, 'geo-only');
  assert.equal(byId.get('asig-albania')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('asig-albania')?.notes.join(' ') ?? '', /not postal assignment authority/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'AL',
    source: 'Posta Shqiptare postcode directory',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Armenia postal, address-register, building, and cadastral-map authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AM');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('haypost-am')?.authority, 'postal-operator');
  assert.equal(byId.get('haypost-am')?.trustTier, 'authoritative');
  assert.match(byId.get('haypost-am')?.notes.join(' ') ?? '', /not a canonical postcode polygon/i);
  assert.equal(byId.get('armenia-real-estate-address-register')?.depth, 'address');
  assert.equal(byId.get('armenia-real-estate-address-register')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('armenia-real-estate-address-register')?.notes.join(' ') ?? '', /address point is not a building footprint/i);
  assert.equal(byId.get('armenia-national-geoportal-buildings')?.depth, 'building');
  assert.equal(byId.get('armenia-national-geoportal-buildings')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('armenia-national-geoportal-buildings')?.notes.join(' ') ?? '', /explicit common identifier/i);
  assert.equal(byId.get('cadastre-armenia')?.depth, 'geo-only');
  assert.equal(byId.get('cadastre-armenia')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('cadastre-armenia')?.notes.join(' ') ?? '', /not postal assignment authority/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'AM',
    source: 'HayPost postal index and post-office directory',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
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
