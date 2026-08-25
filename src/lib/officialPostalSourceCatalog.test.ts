import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyPostalSourceTrust,
  getOfficialPostalSourcesForCountry,
  getPreferredPostalSourceIdsForCountry,
  OFFICIAL_POSTAL_SOURCE_CATALOG,
} from './officialPostalSourceCatalog';

test('registers official and open postal sources for the priority rollout countries', () => {
  for (const countryCode of ['JP', 'US', 'GB', 'BR', 'SG', 'FR', 'NL', 'AU', 'HK', 'AQ', 'DE', 'CZ', 'DK', 'MT', 'MC', 'FI', 'BE', 'ME', 'RO', 'TW', 'LV', 'LT', 'LI', 'PT', 'JE', 'IM', 'GI']) {
    const sources = getOfficialPostalSourcesForCountry(countryCode);
    assert.ok(sources.length > 0, `${countryCode} should have at least one registered source`);
    assert.ok(getPreferredPostalSourceIdsForCountry(countryCode).length > 0, `${countryCode} should expose preferred source ids`);
  }
});

test('prefers country-specific official sources before the UPU global fallback', () => {
  const countrySpecificCountries = ['AO', 'DJ', 'DZ', 'EG', 'ET', 'GH', 'KE', 'LR', 'MA', 'MW', 'MZ', 'NA', 'NG', 'SC', 'SO', 'SS', 'TN', 'TZ', 'UG', 'RW', 'ZM', 'ZW', 'MG', 'MU', 'BW', 'AT', 'CH', 'DE', 'CZ', 'DK', 'MT', 'MC', 'FI', 'BG', 'BY', 'BE', 'ME', 'TW', 'LV', 'LT', 'LI', 'NL', 'PT', 'JE', 'IM', 'GI'];

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
  assert.ok(getOfficialPostalSourcesForCountry('BG').some(source => source.id === 'bulgarian-posts-postcode-reference'));
  assert.ok(getOfficialPostalSourcesForCountry('BY').some(source => source.id === 'nca-belarus-postal-code-zones'));
  assert.ok(getOfficialPostalSourcesForCountry('BE').some(source => source.id === 'bpost-belgium-postal-cantons'));
  assert.ok(getOfficialPostalSourcesForCountry('ME').some(source => source.id === 'posta-crne-gore-postcode-office-directory'));
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

test('separates Andorra postal, government-address, topographic-building, and parish authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AD');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('correos-andorra-postcodes')?.authority, 'postal-operator');
  assert.equal(byId.get('correos-andorra-postcodes')?.trustTier, 'authoritative');
  assert.equal(byId.get('correos-andorra-postcodes')?.availability, 'licensed-bulk-data');
  assert.match(byId.get('correos-andorra-postcodes')?.notes.join(' ') ?? '', /manifest.*Andorra scope.*parish coding.*not.*polygon/i);
  assert.equal(byId.get('andorra-urban-address-guide')?.depth, 'address');
  assert.equal(byId.get('andorra-urban-address-guide')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('andorra-urban-address-guide')?.notes.join(' ') ?? '', /interactive.*not a bulk license.*not a building footprint/i);
  assert.equal(byId.get('andorra-topographic-buildings')?.depth, 'building');
  assert.equal(byId.get('andorra-topographic-buildings')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('andorra-topographic-buildings')?.notes.join(' ') ?? '', /common authoritative identifier.*proximity/i);
  assert.equal(byId.get('andorra-cartografia')?.depth, 'geo-only');
  assert.equal(byId.get('andorra-cartografia')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('andorra-cartografia')?.notes.join(' ') ?? '', /dataset-specific.*not postal assignment authority/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'AD',
    source: 'correos andorra',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Greece postal, point, cadastral, building, and planned-register authority', () => {
  const sources = getOfficialPostalSourcesForCountry('GR');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('elta-gr')?.authority, 'postal-operator');
  assert.equal(byId.get('elta-gr')?.trustTier, 'authoritative');
  assert.equal(byId.get('elta-gr')?.availability, 'web-search');
  assert.match(byId.get('elta-gr')?.notes.join(' ') ?? '', /five-digit.*NNN NN.*not a bulk.*polygon.*deliverability/i);
  assert.equal(byId.get('gisco-greece-postcode-points')?.trustTier, 'official-derived');
  assert.match(byId.get('gisco-greece-postcode-points')?.notes.join(' ') ?? '', /point.*omissions.*incorrect locations.*not an ELTA perimeter/i);
  assert.equal(byId.get('ktimatologio-greece')?.depth, 'geo-only');
  assert.equal(byId.get('ktimatologio-greece')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ktimatologio-greece')?.notes.join(' ') ?? '', /not a blanket bulk licence.*parcel.*owner.*exact building linkage/i);
  assert.equal(byId.get('elstat-greece-digital-cartography')?.depth, 'building');
  assert.equal(byId.get('elstat-greece-digital-cartography')?.availability, 'commercial-or-restricted');
  assert.match(byId.get('elstat-greece-digital-cartography')?.notes.join(' ') ?? '', /census-vintage.*reuse terms.*statistical boundaries.*address-to-building/i);
  assert.equal(byId.get('greece-national-streets-numbers-plan')?.sourceRole, 'legal-framework-only');
  assert.equal(byId.get('greece-national-streets-numbers-plan')?.validationReadiness, 'metadata-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'GR',
    source: 'ELTA Postal Code and Address Finder',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const planOnly = classifyPostalSourceTrust({
    countryCode: 'GR',
    source: 'Greece National Streets and Numbers Register plan',
  });
  assert.equal(planOnly.strength, 'weak');
});

test('separates Croatia operator, delivery-area, address, building, parcel, and point authority', () => {
  const sources = getOfficialPostalSourcesForCountry('HR');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('croatian-post-postcode-downloads')?.authority, 'postal-operator');
  assert.equal(byId.get('croatian-post-postcode-downloads')?.availability, 'commercial-or-restricted');
  assert.match(byId.get('croatian-post-postcode-downloads')?.notes.join(' ') ?? '', /Excel\/XML.*five digits.*not.*open redistribution.*perimeter.*delivery/i);
  assert.equal(byId.get('upu-croatia-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.match(byId.get('upu-croatia-addressing')?.notes.join(' ') ?? '', /five domestic digits.*HR-.*PO-box.*not prove current allocation/i);
  assert.equal(byId.get('dgu-croatia-spatial-unit-register')?.trustTier, 'authoritative');
  assert.equal(byId.get('dgu-croatia-spatial-unit-register')?.depth, 'postcode');
  assert.match(byId.get('dgu-croatia-spatial-unit-register')?.notes.join(' ') ?? '', /delivery-office areas.*not automatically.*postcode perimeter.*crosswalk/i);
  assert.equal(byId.get('dgu-croatia-inspire-addresses')?.depth, 'address');
  assert.match(byId.get('dgu-croatia-inspire-addresses')?.notes.join(' ') ?? '', /Open Licence.*identifier.*building linkage.*separate/i);
  assert.equal(byId.get('dgu-croatia-inspire-buildings')?.depth, 'building');
  assert.match(byId.get('dgu-croatia-inspire-buildings')?.notes.join(' ') ?? '', /explicit relationship.*common authoritative identifier.*proximity.*candidate-only/i);
  assert.equal(byId.get('dgu-croatia-inspire-administrative-units')?.depth, 'geo-only');
  assert.match(byId.get('dgu-croatia-inspire-administrative-units')?.notes.join(' ') ?? '', /do not create postcode membership.*delivery coverage/i);
  assert.equal(byId.get('dgu-croatia-cadastral-parcels')?.trustTier, 'official');
  assert.match(byId.get('dgu-croatia-cadastral-parcels')?.notes.join(' ') ?? '', /parcel is not a building.*postal area.*owners.*title/i);
  assert.equal(byId.get('gisco-croatia-postcode-points')?.trustTier, 'official-derived');
  assert.match(byId.get('gisco-croatia-postcode-points')?.notes.join(' ') ?? '', /omissions.*incorrect locations.*not.*delivery-area perimeter/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'HR',
    source: 'Croatian Post',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Georgia operator, address, building, parcel, administrative, and statistical authority', () => {
  const sources = getOfficialPostalSourcesForCountry('GE');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('georgian-post-postcode-finder')?.authority, 'postal-operator');
  assert.equal(byId.get('georgian-post-postcode-finder')?.trustTier, 'authoritative');
  assert.match(byId.get('georgian-post-postcode-finder')?.notes.join(' ') ?? '', /four-digit.*not an open bulk.*not an official postcode polygon.*syntax.*allocation/i);
  assert.equal(byId.get('georgian-post-addressing-guide')?.depth, 'address');
  assert.equal(byId.get('georgian-post-addressing-guide')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('georgian-post-addressing-guide')?.notes.join(' ') ?? '', /postcode before the locality.*not an allocation database.*geometry/i);
  assert.equal(byId.get('napr-georgia-address-registry')?.depth, 'address');
  assert.equal(byId.get('napr-georgia-address-registry')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('napr-georgia-address-registry')?.notes.join(' ') ?? '', /unique text record.*not a bulk release.*not a building footprint/i);
  assert.equal(byId.get('nsdi-georgia-address-layer')?.depth, 'address');
  assert.match(byId.get('nsdi-georgia-address-layer')?.notes.join(' ') ?? '', /resource-specific access licence.*not a blanket open licence.*postcode/i);
  assert.equal(byId.get('nsdi-georgia-registered-buildings')?.depth, 'building');
  assert.match(byId.get('nsdi-georgia-registered-buildings')?.notes.join(' ') ?? '', /explicit relationship.*common authoritative identifier.*proximity.*candidate-only/i);
  assert.equal(byId.get('nsdi-georgia-registered-parcels')?.depth, 'geo-only');
  assert.match(byId.get('nsdi-georgia-registered-parcels')?.notes.join(' ') ?? '', /not a building.*address link.*postcode area.*owners.*rightsholders/i);
  assert.equal(byId.get('nsdi-georgia-administrative-boundaries')?.depth, 'geo-only');
  assert.match(byId.get('nsdi-georgia-administrative-boundaries')?.notes.join(' ') ?? '', /never create postcode membership.*sovereignty.*coverage gap/i);
  assert.equal(byId.get('geostat-georgia-administrative-classification')?.depth, 'geo-only');
  assert.match(byId.get('geostat-georgia-administrative-classification')?.notes.join(' ') ?? '', /statistical classification.*not postal assignment.*not geometry/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'GE',
    source: 'Georgian Post Postcode Finder',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const addressOnly = classifyPostalSourceTrust({
    countryCode: 'GE',
    source: 'NAPR Georgia Address Registry',
  });
  assert.equal(addressOnly.strength, 'weak');
  assert.equal(addressOnly.tier, 'weak');
});

test('separates Slovakia operator, access-point, address, building, parcel, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('SK');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('slovak-post-postcode-search')?.authority, 'postal-operator');
  assert.equal(byId.get('slovak-post-postcode-search')?.trustTier, 'authoritative');
  assert.match(byId.get('slovak-post-postcode-search')?.notes.join(' ') ?? '', /five-digit.*street.*municipality.*not an open bulk.*not an official.*polygon.*delivery/i);
  assert.equal(byId.get('slovak-post-access-point-xml')?.depth, 'delivery-point');
  assert.equal(byId.get('slovak-post-access-point-xml')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('slovak-post-access-point-xml')?.notes.join(' ') ?? '', /post offices.*PoštaPOINT.*BalíkoBOX.*not a PSČ assignment.*postcode area/i);
  assert.equal(byId.get('slovakia-register-addresses-portal')?.depth, 'address');
  assert.equal(byId.get('slovakia-register-addresses-portal')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('slovakia-register-addresses-portal')?.notes.join(' ') ?? '', /central.*data-consistent.*physical buildings.*not.*bulk release.*footprint/i);
  assert.equal(byId.get('slovakia-register-addresses-openapi')?.depth, 'building');
  assert.match(byId.get('slovakia-register-addresses-openapi')?.notes.join(' ') ?? '', /address points.*building identifiers.*endpoint.*licence.*nearest.*not an exact building link/i);
  assert.equal(byId.get('zbgis-slovakia-inspire-buildings')?.depth, 'building');
  assert.match(byId.get('zbgis-slovakia-inspire-buildings')?.notes.join(' ') ?? '', /common authoritative identifier.*proximity.*candidate-only.*dataset-specific licence/i);
  assert.equal(byId.get('zbgis-slovakia-administrative-units')?.depth, 'geo-only');
  assert.match(byId.get('zbgis-slovakia-administrative-units')?.notes.join(' ') ?? '', /CC BY 4\.0.*do not create PSČ membership.*delivery coverage/i);
  assert.equal(byId.get('zbgis-slovakia-cadastral-parcels')?.depth, 'geo-only');
  assert.match(byId.get('zbgis-slovakia-cadastral-parcels')?.notes.join(' ') ?? '', /parcel is not a building.*address link.*postcode area.*owners.*rightsholders/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'SK',
    source: 'Slovenská pošta PSČ Search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const accessPointOnly = classifyPostalSourceTrust({
    countryCode: 'SK',
    source: 'Slovenská pošta Access Point XML',
  });
  assert.equal(accessPointOnly.strength, 'weak');
  assert.equal(accessPointOnly.tier, 'weak');
});

test('separates Slovenia normal, special, service-area, postal-district, address, building, parcel, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('SI');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('posta-slovenije-postcode-csv')?.authority, 'postal-operator');
  assert.equal(byId.get('posta-slovenije-postcode-csv')?.trustTier, 'authoritative');
  assert.match(byId.get('posta-slovenije-postcode-csv')?.notes.join(' ') ?? '', /four-digit.*post-office.*not.*redistribution.*not.*polygon.*delivery/i);
  assert.equal(byId.get('posta-slovenije-special-postcodes')?.depth, 'delivery-point');
  assert.equal(byId.get('posta-slovenije-special-postcodes')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('posta-slovenije-special-postcodes')?.notes.join(' ') ?? '', /organization.*institution.*non-area.*residential/i);
  assert.equal(byId.get('posta-slovenije-delivery-area-webgis')?.depth, 'geo-only');
  assert.match(byId.get('posta-slovenije-delivery-area-webgis')?.notes.join(' ') ?? '', /A\/B\/C.*unaddressed.*not normal postcode.*GURS postal district/i);
  assert.equal(byId.get('gurs-slovenia-postal-districts')?.depth, 'geo-only');
  assert.match(byId.get('gurs-slovenia-postal-districts')?.notes.join(' ') ?? '', /poštni okoliš.*CC BY 4\.0.*explicit.*crosswalk.*not automatically.*operator-authored/i);
  assert.equal(byId.get('gurs-slovenia-address-register')?.depth, 'address');
  assert.match(byId.get('gurs-slovenia-address-register')?.notes.join(' ') ?? '', /unique address number.*centroid.*not.*footprint.*postal assignment/i);
  assert.equal(byId.get('gurs-slovenia-public-features-api')?.availability, 'public-api');
  assert.match(byId.get('gurs-slovenia-public-features-api')?.notes.join(' ') ?? '', /WFS.*OGC API.*CC BY 4\.0.*EPSG:3794.*WGS84 transform/i);
  assert.equal(byId.get('gurs-slovenia-real-estate-cadastre-buildings')?.depth, 'building');
  assert.match(byId.get('gurs-slovenia-real-estate-cadastre-buildings')?.notes.join(' ') ?? '', /address-building relation.*centroid containment.*candidate-only.*protected/i);
  assert.equal(byId.get('gurs-slovenia-spatial-unit-register')?.depth, 'geo-only');
  assert.match(byId.get('gurs-slovenia-spatial-unit-register')?.notes.join(' ') ?? '', /CC BY 4\.0.*municipality.*settlement.*do not create postcode.*service coverage/i);
  assert.equal(byId.get('gurs-slovenia-cadastral-parcels')?.depth, 'geo-only');
  assert.match(byId.get('gurs-slovenia-cadastral-parcels')?.notes.join(' ') ?? '', /parcel is not a building.*address link.*postal district.*owners.*title.*value/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'SI',
    source: 'Pošta Slovenije Postal Code and Post Office CSV',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const specialOnly = classifyPostalSourceTrust({
    countryCode: 'SI',
    source: 'Pošta Slovenije Special Postal Codes',
  });
  assert.equal(specialOnly.strength, 'weak');
  assert.equal(specialOnly.tier, 'weak');
});

test('separates Norway assignment, area, address, unit, building, and territory authority', () => {
  const sources = getOfficialPostalSourcesForCountry('NO');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('posten-bring-norway-postcode-register')?.authority, 'postal-operator');
  assert.equal(byId.get('posten-bring-norway-postcode-register')?.trustTier, 'authoritative');
  assert.match(byId.get('posten-bring-norway-postcode-register')?.notes.join(' ') ?? '', /four-digit.*G.*P.*B.*S.*does not provide polygon.*terms.*Svalbard.*Jan Mayen/i);
  assert.equal(byId.get('kartverket-norway-postcode-areas')?.availability, 'bulk-open-data');
  assert.match(byId.get('kartverket-norway-postcode-areas')?.notes.join(' ') ?? '', /official.*CC BY 4\.0.*month end.*post-office-box.*non-area.*invented/i);
  assert.equal(byId.get('kartverket-norway-address-api')?.availability, 'public-api');
  assert.match(byId.get('kartverket-norway-address-api')?.notes.join(' ') ?? '', /individual-address.*daily.*bulk.*downloads.*licence.*not.*building footprint/i);
  assert.equal(byId.get('kartverket-norway-matrikkelen-address')?.depth, 'address');
  assert.match(byId.get('kartverket-norway-matrikkelen-address')?.notes.join(' ') ?? '', /official.*address identity.*point.*postcode-district.*not a building footprint/i);
  assert.equal(byId.get('kartverket-norway-matrikkelen-address-unit')?.depth, 'address');
  assert.match(byId.get('kartverket-norway-matrikkelen-address-unit')?.notes.join(' ') ?? '', /addressId plus bruksenhetId.*composite.*not.*occupant.*household/i);
  assert.equal(byId.get('kartverket-norway-matrikkelen-building-points')?.depth, 'building');
  assert.match(byId.get('kartverket-norway-matrikkelen-building-points')?.notes.join(' ') ?? '', /building number.*representation point.*address.*identifiers.*not a footprint/i);
  assert.equal(byId.get('geovekst-norway-fkb-buildings')?.availability, 'licensed-bulk-data');
  assert.equal(byId.get('geovekst-norway-fkb-buildings')?.requiresCredential, true);
  assert.match(byId.get('geovekst-norway-fkb-buildings')?.notes.join(' ') ?? '', /1:1.*building number.*Norge digitalt.*private.*purchased.*not open redistribution/i);
  assert.equal(byId.get('kartverket-norway-administrative-units')?.depth, 'geo-only');
  assert.match(byId.get('kartverket-norway-administrative-units')?.notes.join(' ') ?? '', /county.*municipality.*context only.*do not create postcode.*NO.*ISO SJ/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'NO',
    source: 'Posten Bring Norway Postcode Register',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const fkb = classifyPostalSourceTrust({
    countryCode: 'NO',
    source: 'Geovekst FKB-Bygning',
  });
  assert.equal(fkb.strength, 'strong');
  assert.equal(fkb.tier, 'official');
});
test('separates Hungary operator assignment, KCR address, derived geometry, building, and administrative authority', () => {
  const sources = getOfficialPostalSourcesForCountry('HU');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('magyar-posta-partner-extra-postcodes')?.authority, 'postal-operator');
  assert.equal(byId.get('magyar-posta-partner-extra-postcodes')?.availability, 'bulk-open-data');
  assert.match(byId.get('magyar-posta-partner-extra-postcodes')?.notes.join(' ') ?? '', /four-digit.*XML.*application background.*terms.*no official postcode polygon.*delivery guarantee/i);
  assert.equal(byId.get('magyar-posta-addressing-database')?.depth, 'address');
  assert.match(byId.get('magyar-posta-addressing-database')?.notes.join(' ') ?? '', /post-office-box.*dedicated.*not.*bulk address.*polygon.*building-footprint/i);
  assert.equal(byId.get('hungary-central-address-register-kcr')?.availability, 'licensed-bulk-data');
  assert.equal(byId.get('hungary-central-address-register-kcr')?.requiresCredential, true);
  assert.match(byId.get('hungary-central-address-register-kcr')?.notes.join(' ') ?? '', /unique address ID.*unit.*coordinate.*cadastral.*statutory.*not authorize.*public mirror.*not a footprint.*resident/i);
  assert.equal(byId.get('lechner-hungary-eha')?.depth, 'address');
  assert.match(byId.get('lechner-hungary-eha')?.notes.join(' ') ?? '', /inside the parcel.*entrance.*geometric centre.*not automatically.*building footprint/i);
  assert.equal(byId.get('lechner-hungary-inspire-buildings')?.depth, 'building');
  assert.match(byId.get('lechner-hungary-inspire-buildings')?.notes.join(' ') ?? '', /exact feed.*coverage.*licence.*sample.*not nationwide.*nearest.*not.*exact address/i);
  assert.equal(byId.get('lechner-hungary-nta-buildings')?.availability, 'auth-required-api');
  assert.equal(byId.get('lechner-hungary-nta-buildings')?.requiresCredential, true);
  assert.match(byId.get('lechner-hungary-nta-buildings')?.notes.join(' ') ?? '', /generalized WMTS.*orthophoto.*tile.*not.*editable vector.*exact footprint.*not unrestricted redistribution/i);
  assert.equal(byId.get('hungary-land-registry-cadastral-map')?.availability, 'commercial-or-restricted');
  assert.match(byId.get('hungary-land-registry-cadastral-map')?.notes.join(' ') ?? '', /parcel.*building.*house number.*not a building.*paid.*not.*public bulk.*owner.*title.*rightsholder/i);
  assert.equal(byId.get('ksh-hungary-administrative-units')?.depth, 'geo-only');
  assert.match(byId.get('ksh-hungary-administrative-units')?.notes.join(' ') ?? '', /region.*county.*district.*municipality.*context only.*does not create postcode.*delivery.*building.*sovereignty/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'HU',
    source: 'Magyar Posta Partner Extra Postcodes',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const kcr = classifyPostalSourceTrust({
    countryCode: 'HU',
    source: 'Hungary KCR Central Address Register',
  });
  assert.equal(kcr.strength, 'strong');
  assert.equal(kcr.tier, 'authoritative');
  const nta = classifyPostalSourceTrust({
    countryCode: 'HU',
    source: 'Lechner NTA Buildings',
  });
  assert.equal(nta.strength, 'strong');
  assert.equal(nta.tier, 'official');
});

test('separates Finland operator assignment, Paavo statistics, address, building, and FI/AX authority', () => {
  const sources = getOfficialPostalSourcesForCountry('FI');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('posti-finland-postal-code-services')?.authority, 'postal-operator');
  assert.equal(byId.get('posti-finland-postal-code-services')?.availability, 'bulk-open-data');
  assert.match(byId.get('posti-finland-postal-code-services')?.notes.join(' ') ?? '', /five-digit|valid Finnish postcodes/i);
  assert.match(byId.get('posti-finland-postal-code-services')?.notes.join(' ') ?? '', /no map data.*not.*delivery perimeter.*canonical polygon/i);
  assert.equal(byId.get('posti-finland-basic-address-file')?.depth, 'address');
  assert.match(byId.get('posti-finland-basic-address-file')?.notes.join(' ') ?? '', /street.*house-number.*excludes Aland.*no map geometry.*not.*building/i);
  assert.equal(byId.get('statistics-finland-paavo-postal-areas')?.trustTier, 'official-derived');
  assert.match(byId.get('statistics-finland-paavo-postal-areas')?.notes.join(' ') ?? '', /annual.*CC BY 4\.0.*building-address.*year.*variant.*EPSG:3067.*may differ.*not a Posti delivery perimeter/i);
  assert.equal(byId.get('dvv-finland-building-dwelling-register')?.availability, 'licensed-bulk-data');
  assert.equal(byId.get('dvv-finland-building-dwelling-register')?.requiresCredential, true);
  assert.match(byId.get('dvv-finland-building-dwelling-register')?.notes.join(' ') ?? '', /address.*dwelling.*building.*permanent-identifier.*not a public bulk mirror.*resident.*owner/i);
  assert.equal(byId.get('syke-finland-ryhti-building-addresses')?.depth, 'building');
  assert.match(byId.get('syke-finland-ryhti-building-addresses')?.notes.join(' ') ?? '', /permanent identifier.*source-defined relation.*transition.*2028.*detailed.*contract/i);
  assert.equal(byId.get('nls-finland-topographic-road-addresses')?.depth, 'address');
  assert.match(byId.get('nls-finland-topographic-road-addresses')?.notes.join(' ') ?? '', /calculated.*interpolated.*not an exact entrance.*building footprint/i);
  assert.equal(byId.get('nls-finland-topographic-buildings')?.depth, 'building');
  assert.match(byId.get('nls-finland-topographic-buildings')?.notes.join(' ') ?? '', /independent.*common identifier.*crosswalk.*proximity.*containment/i);
  assert.equal(byId.get('nls-finland-municipal-division')?.depth, 'geo-only');
  assert.match(byId.get('nls-finland-municipal-division')?.notes.join(' ') ?? '', /region.*subregion.*municipality.*context only.*never establishes postcode/i);
  assert.equal(byId.get('aland-post-postal-services')?.authority, 'postal-operator');
  assert.match(byId.get('aland-post-postal-services')?.notes.join(' ') ?? '', /AX.*Posti Basic Address File excludes Aland.*not expanded.*FI\/AX.*never silently merge/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'FI',
    source: 'Posti Finland Postal Code Services',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const paavo = classifyPostalSourceTrust({
    countryCode: 'FI',
    source: 'Statistics Finland Paavo Postal Code Areas',
  });
  assert.equal(paavo.strength, 'strong');
  assert.equal(paavo.tier, 'official-derived');
});


test('separates Belarus operator assignment, official-derived postal zones, controlled address, building, and administration', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BY').map(source => [source.id, source]));

  assert.equal(sources.get('belpost-belarus-postcode-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('belpost-belarus-postcode-reference')?.availability, 'web-search');
  assert.equal(sources.get('nca-belarus-postal-code-zones')?.trustTier, 'official-derived');
  assert.equal(sources.get('nca-belarus-postal-code-zones')?.depth, 'postcode');
  assert.equal(sources.get('nca-belarus-address-register')?.depth, 'address');
  assert.equal(sources.get('nca-belarus-address-register')?.requiresCredential, true);
  assert.equal(sources.get('nca-belarus-capital-structure-addresses')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('nca-belarus-real-estate-register')?.depth, 'building');
  assert.equal(sources.get('nca-belarus-property-characteristics-register')?.requiresCredential, true);
  assert.equal(sources.get('nca-belarus-ate-register')?.depth, 'geo-only');
  assert.equal(sources.get('nca-belarus-soato-classifier')?.depth, 'locality');
  assert.equal(sources.get('nca-belarus-public-cadastral-map')?.availability, 'web-search');

  const classification = classifyPostalSourceTrust({ countryCode: 'BY', source: 'NCA Belarus Postal Code Zones' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'official-derived');
});

test('separates Bulgaria postal routing, controlled address, cadastral building, and EKATTE authority', () => {
  const sources = getOfficialPostalSourcesForCountry('BG');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('bulgarian-posts-postcode-reference')?.authority, 'postal-operator');
  assert.equal(byId.get('bulgarian-posts-postcode-reference')?.availability, 'web-search');
  assert.match(byId.get('bulgarian-posts-postcode-reference')?.notes.join(' ') ?? '', /four-digit.*pinned.*no nationwide.*polygon.*deliverability/i);
  assert.equal(byId.get('bulgarian-posts-post-office-directory')?.depth, 'delivery-point');
  assert.match(byId.get('bulgarian-posts-post-office-directory')?.notes.join(' ') ?? '', /service-point.*not a postcode area.*delivery guarantee.*bulk redistribution/i);
  assert.equal(byId.get('grao-bulgaria-address-classifier')?.availability, 'commercial-or-restricted');
  assert.equal(byId.get('grao-bulgaria-address-classifier')?.requiresCredential, true);
  assert.match(byId.get('grao-bulgaria-address-classifier')?.notes.join(' ') ?? '', /actual authorized.*roadmap.*not production.*residence.*excluded/i);
  assert.equal(byId.get('agcc-bulgaria-cadastral-map')?.depth, 'building');
  assert.equal(byId.get('agcc-bulgaria-cadastral-map')?.requiresCredential, true);
  assert.match(byId.get('agcc-bulgaria-cadastral-map')?.notes.join(' ') ?? '', /building identifier.*parcel.*independent object.*not a building.*owners.*excluded/i);
  assert.equal(byId.get('agcc-bulgaria-inspire-buildings')?.depth, 'building');
  assert.match(byId.get('agcc-bulgaria-inspire-buildings')?.notes.join(' ') ?? '', /exact endpoint.*INSPIRE.*not.*unrestricted licence.*common identifier/i);
  assert.equal(byId.get('nsi-bulgaria-ekatte')?.depth, 'locality');
  assert.match(byId.get('nsi-bulgaria-ekatte')?.notes.join(' ') ?? '', /district.*municipality.*settlement.*context only.*never establishes postcode/i);
  assert.equal(byId.get('nsi-bulgaria-administrative-spatial-data')?.depth, 'geo-only');
  assert.match(byId.get('nsi-bulgaria-administrative-spatial-data')?.notes.join(' ') ?? '', /EPSG:4326.*EPSG:9391.*separate.*neither.*postal geometry/i);
  const classification = classifyPostalSourceTrust({ countryCode: 'BG', source: 'Bulgarian Posts Postcode Reference' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Serbia postcode, PAK, API, open address, building, parcel, administration, and territory authority', () => {
  const sources = getOfficialPostalSourcesForCountry('RS');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('posta-srbije-post-office-list')?.authority, 'postal-operator');
  assert.equal(byId.get('posta-srbije-post-office-list')?.trustTier, 'authoritative');
  assert.match(byId.get('posta-srbije-post-office-list')?.notes.join(' ') ?? '', /five-digit.*post-office.*not.*perimeter.*delivery guarantee.*terms.*digest/i);
  assert.equal(byId.get('posta-srbije-pak-definition')?.depth, 'street');
  assert.equal(byId.get('posta-srbije-pak-definition')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('posta-srbije-pak-definition')?.notes.join(' ') ?? '', /six-digit PAK.*part of a street.*side.*house-number range.*not.*five-digit.*polygon.*building.*resident/i);
  assert.equal(byId.get('posta-srbije-pak-lookup')?.availability, 'web-search');
  assert.match(byId.get('posta-srbije-pak-lookup')?.notes.join(' ') ?? '', /street.*house number.*five-digit postcode.*destination post office.*six-digit PAK.*not.*bulk.*geometry/i);
  assert.equal(byId.get('posta-srbije-wsp-address-api')?.availability, 'auth-required-api');
  assert.equal(byId.get('posta-srbije-wsp-address-api')?.requiresCredential, true);
  assert.match(byId.get('posta-srbije-wsp-address-api')?.notes.join(' ') ?? '', /registered-user.*postcode.*PAK.*documentation is not authorization.*credentials.*private.*not a postal polygon/i);
  assert.equal(byId.get('rgz-serbia-address-register-open-data')?.availability, 'bulk-open-data');
  assert.equal(byId.get('rgz-serbia-address-register-open-data')?.depth, 'address');
  assert.match(byId.get('rgz-serbia-address-register-open-data')?.notes.join(' ') ?? '', /weekly.*CSV.*GPKG.*Serbian Open Data License.*unique address code.*house-number point.*source.*download date.*not.*building footprint.*PAK/i);
  assert.equal(byId.get('rgz-serbia-spatial-unit-register')?.depth, 'geo-only');
  assert.match(byId.get('rgz-serbia-spatial-unit-register')?.notes.join(' ') ?? '', /administrative.*coverage.*territorial vintage.*do not create postcode.*PAK.*sovereignty/i);
  assert.equal(byId.get('rgz-serbia-geosrbija-buildings')?.depth, 'building');
  assert.match(byId.get('rgz-serbia-geosrbija-buildings')?.notes.join(' ') ?? '', /portal visibility is not.*licence.*address-building relation.*containment.*candidate-only/i);
  assert.equal(byId.get('rgz-serbia-real-estate-cadastre')?.depth, 'geo-only');
  assert.match(byId.get('rgz-serbia-real-estate-cadastre')?.notes.join(' ') ?? '', /parcel is not a building.*address.*postcode.*PAK.*owner.*title.*value/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'RS',
    source: 'Pošta Srbije Post Office List',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const query = classifyPostalSourceTrust({
    countryCode: 'RS',
    source: 'Pošta Srbije Find PAK',
  });
  assert.equal(query.strength, 'strong');
  assert.equal(query.tier, 'authoritative');
  const semanticOnly = classifyPostalSourceTrust({
    countryCode: 'RS',
    source: 'Pošta Srbije Postal Address Code (PAK)',
  });
  assert.equal(semanticOnly.strength, 'weak');
  assert.equal(semanticOnly.tier, 'weak');
  const datahubOnly = classifyPostalSourceTrust({
    countryCode: 'RS',
    source: 'DataHub postal-codes-rs',
  });
  assert.equal(datahubOnly.strength, 'weak');
  assert.equal(datahubOnly.tier, 'weak');
});

test('separates Cyprus postal, DLS, statistical-sector, and legal-context authority', () => {
  const sources = getOfficialPostalSourcesForCountry('CY');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('cyprus-post-postcode-directory')?.authority, 'postal-operator');
  assert.equal(byId.get('cyprus-post-postcode-directory')?.availability, 'bulk-open-data');
  assert.match(byId.get('cyprus-post-postcode-directory')?.notes.join(' ') ?? '', /four-digit.*text.*street range.*not a postal polygon.*control evidence/i);
  assert.equal(byId.get('cyprus-post-postcode-api')?.availability, 'auth-required-api');
  assert.match(byId.get('cyprus-post-postcode-api')?.notes.join(' ') ?? '', /request-based.*not a bulk license.*perimeter/i);
  assert.equal(byId.get('cyprus-dls-inspire-addresses')?.depth, 'address');
  assert.match(byId.get('cyprus-dls-inspire-addresses')?.notes.join(' ') ?? '', /address point.*building relation.*parcel relation.*proximity/i);
  assert.equal(byId.get('cyprus-dls-inspire-buildings')?.depth, 'building');
  assert.match(byId.get('cyprus-dls-inspire-buildings')?.notes.join(' ') ?? '', /footprint.*does not prove postal assignment.*explicit relationship/i);
  assert.equal(byId.get('cyprus-dls-administrative-units')?.depth, 'geo-only');
  assert.match(byId.get('cyprus-dls-administrative-units')?.notes.join(' ') ?? '', /not postal membership.*effective control.*sovereignty/i);
  assert.equal(byId.get('cystat-postal-sectors')?.trustTier, 'official-derived');
  assert.match(byId.get('cystat-postal-sectors')?.notes.join(' ') ?? '', /statistical.*not a current Cyprus Post perimeter.*control/i);
  assert.equal(byId.get('eu-cyprus-protocol-10')?.sourceRole, 'legal-framework-only');
  assert.equal(byId.get('eu-cyprus-protocol-10')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('eu-cyprus-protocol-10')?.notes.join(' ') ?? '', /legal context only.*separate from sovereignty.*never.*postal validation/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'CY',
    source: 'Cyprus Post Code Directory',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
  const legalOnly = classifyPostalSourceTrust({
    countryCode: 'CY',
    source: 'Cyprus Protocol 10',
  });
  assert.equal(legalOnly.strength, 'weak');
});

test('separates Austria postal, contract address, BEV, statistical-region, boundary, and GWR authority', () => {
  const sources = getOfficialPostalSourcesForCountry('AT');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('austrian-post-postcode')?.authority, 'postal-operator');
  assert.equal(byId.get('austrian-post-postcode')?.trustTier, 'authoritative');
  assert.match(byId.get('austrian-post-postcode')?.notes.join(' ') ?? '', /four-digit.*text.*not automatically.*polygon.*country identity/i);
  assert.equal(byId.get('austrian-post-address-data')?.depth, 'address');
  assert.equal(byId.get('austrian-post-address-data')?.availability, 'commercial-or-restricted');
  assert.match(byId.get('austrian-post-address-data')?.notes.join(' ') ?? '', /contract-partitioned.*does not grant public redistribution.*household/i);
  assert.equal(byId.get('bev-austria-address-register')?.depth, 'building');
  assert.equal(byId.get('bev-austria-address-register')?.availability, 'bulk-open-data');
  assert.match(byId.get('bev-austria-address-register')?.notes.join(' ') ?? '', /Adresscode.*Subcode.*specific.*release.*proximity/i);
  assert.equal(byId.get('statistics-austria-postcode-regions')?.trustTier, 'official-derived');
  assert.match(byId.get('statistics-austria-postcode-regions')?.notes.join(' ') ?? '', /official statistical.*not an Austrian Post perimeter.*special codes/i);
  assert.equal(byId.get('bev-austria-administrative-boundaries')?.depth, 'geo-only');
  assert.match(byId.get('bev-austria-administrative-boundaries')?.notes.join(' ') ?? '', /not postal assignment authority.*country identity/i);
  assert.equal(byId.get('statistics-austria-gwr')?.availability, 'commercial-or-restricted');
  assert.match(byId.get('statistics-austria-gwr')?.notes.join(' ') ?? '', /restricted individual data.*not a microdata license.*residents/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'AT',
    source: 'Österreichische Post postal encyclopedia',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('separates Ukraine postal, operational, address-register, building, and NSDI authority', () => {
  const sources = getOfficialPostalSourcesForCountry('UA');
  const byId = new Map(sources.map(source => [source.id, source]));
  assert.equal(byId.get('ukrposhta-postcodes-open-data')?.authority, 'postal-operator');
  assert.equal(byId.get('ukrposhta-postcodes-open-data')?.trustTier, 'authoritative');
  assert.equal(byId.get('ukrposhta-postcodes-open-data')?.availability, 'bulk-open-data');
  assert.match(byId.get('ukrposhta-postcodes-open-data')?.notes.join(' ') ?? '', /five-digit.*text.*not an official polygon.*sovereignty/i);
  assert.equal(byId.get('ukrposhta-index-and-address-api')?.depth, 'address');
  assert.equal(byId.get('ukrposhta-index-and-address-api')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ukrposhta-index-and-address-api')?.notes.join(' ') ?? '', /LOCK_CODE.*time-specific service evidence.*territorial identity/i);
  assert.equal(byId.get('ukraine-unified-address-register')?.depth, 'address');
  assert.equal(byId.get('ukraine-unified-address-register')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ukraine-unified-address-register')?.notes.join(' ') ?? '', /not a bulk release.*not a building footprint/i);
  assert.equal(byId.get('ukraine-building-register')?.depth, 'building');
  assert.equal(byId.get('ukraine-building-register')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ukraine-building-register')?.notes.join(' ') ?? '', /common authoritative identifier.*proximity/i);
  assert.equal(byId.get('ukraine-nsdi')?.depth, 'geo-only');
  assert.equal(byId.get('ukraine-nsdi')?.validationReadiness, 'metadata-only');
  assert.match(byId.get('ukraine-nsdi')?.notes.join(' ') ?? '', /restricted during martial law.*not postal assignment authority/i);
  const classification = classifyPostalSourceTrust({
    countryCode: 'UA',
    source: 'Ukrposhta postcodes open data',
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

test('Belgium catalog separates postal cantons, federal address consolidation, regional buildings, cadastre, and administration', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BE').map(source => [source.id, source]));

  assert.equal(sources.get('bpost-belgium-postcode-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('bpost-belgium-postal-cantons')?.depth, 'postcode');
  assert.equal(sources.get('bpost-belgium-postal-cantons')?.trustTier, 'authoritative');
  assert.equal(sources.get('bpost-address-validation')?.depth, 'address');
  assert.equal(sources.get('bosa-belgium-best-address')?.depth, 'address');
  assert.equal(sources.get('digitaal-vlaanderen-address-register')?.availability, 'public-api');
  assert.equal(sources.get('digitaal-vlaanderen-building-register')?.depth, 'building');
  assert.equal(sources.get('spw-wallonia-icar-addresses')?.depth, 'address');
  assert.equal(sources.get('spw-wallonia-picc-buildings')?.depth, 'building');
  assert.equal(sources.get('paradigm-brussels-urbis-buildings-addresses')?.depth, 'building');
  assert.equal(sources.get('fps-finance-belgium-cadastral-plan')?.trustTier, 'official');
  assert.equal(sources.get('fps-finance-belgium-administrative-units')?.depth, 'geo-only');
});

test('Montenegro catalog separates post-office assignment, PAK, address, cadastre, geoportal, and spatial authority', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ME').map(source => [source.id, source]));
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-crne-gore-postcode-office-directory')?.depth, 'postcode');
  assert.equal(sources.get('posta-crne-gore-pak-addressing')?.depth, 'street');
  assert.equal(sources.get('uzn-montenegro-address-register')?.depth, 'address');
  assert.equal(sources.get('uzn-montenegro-address-register')?.requiresCredential, true);
  assert.equal(sources.get('uzn-montenegro-real-estate-cadastre')?.depth, 'building');
  assert.equal(sources.get('uzn-montenegro-geoportal')?.trustTier, 'official');
  assert.equal(sources.get('uzn-montenegro-spatial-unit-record')?.depth, 'geo-only');
  assert.equal(sources.get('monstat-montenegro-spatial-register')?.depth, 'locality');
});

test('Romania catalog separates operator assignment, dated geography status, RENNS, INIS, property viewer, and SIRUTA authority', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('RO').map(source => [source.id, source]));
  assert.equal(sources.get('posta-romana-postcode-search')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-romana-postcode-search')?.depth, 'address');
  assert.equal(sources.get('posta-romana-postcode-structure')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('posta-romana-infocod')?.requiresCredential, true);
  assert.equal(sources.get('posta-romana-postcode-geography-status')?.depth, 'postcode');
  assert.match(sources.get('posta-romana-postcode-geography-status')?.notes.join(' ') ?? '', /lacked geographic coordinates.*newer.*operator geography/i);
  assert.equal(sources.get('ancpi-romania-renns')?.depth, 'address');
  assert.equal(sources.get('ancpi-romania-inis-addresses-buildings')?.depth, 'building');
  assert.match(sources.get('ancpi-romania-inis-addresses-buildings')?.notes.join(' ') ?? '', /EPSG:3844.*explicit address relation.*queryability.*not unrestricted redistribution/i);
  assert.equal(sources.get('ancpi-romania-registered-property-viewer')?.trustTier, 'official');
  assert.equal(sources.get('insse-romania-siruta-localities')?.depth, 'locality');
  const classification = classifyPostalSourceTrust({
    countryCode: 'RO',
    source: 'Poșta Română Postcode Search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Taiwan catalog separates 3+3 assignment, legal terms, doorplates, buildings, administration, and cadastral authority', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('TW').map(source => [source.id, source]));
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.authority, 'postal-operator');
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.trustTier, 'authoritative');
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.depth, 'street');
  assert.match(sources.get('chunghwa-post-3plus3-data')?.notes.join(' ') ?? '', /address-range.*delivery-specific.*not canonical polygons/i);
  assert.equal(sources.get('chunghwa-post-3plus3-lookup')?.depth, 'address');
  assert.equal(sources.get('chunghwa-post-3plus3-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('moi-taiwan-national-doorplate-location')?.validationReadiness, 'metadata-only');
  assert.match(sources.get('moi-taiwan-national-doorplate-location')?.notes.join(' ') ?? '', /point is not a building footprint.*household/i);
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.depth, 'building');
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.requiresCredential, true);
  assert.match(sources.get('nlsc-taiwan-emap-buildings')?.notes.join(' ') ?? '', /source-defined address relation.*WMS.*not an open vector/i);
  assert.equal(sources.get('nlsc-taiwan-emap-doorplates')?.depth, 'address');
  assert.equal(sources.get('nlsc-taiwan-administrative-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('nlsc-taiwan-cadastral-map')?.trustTier, 'official');
  const classification = classifyPostalSourceTrust({
    countryCode: 'TW',
    source: 'Chunghwa Post 3+3 Postal Code Data',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Korea catalog separates postcode semantics, official districts, address identifiers, buildings, and cadastre', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('KR').map(source => [source.id, source]));
  assert.equal(sources.get('korea-post-postcode-system')?.authority, 'postal-operator');
  assert.equal(sources.get('korea-post-postcode-system')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('korea-post-postcode-api')?.availability, 'auth-required-api');
  assert.equal(sources.get('mois-juso-basic-districts')?.trustTier, 'authoritative');
  assert.equal(sources.get('mois-juso-basic-districts')?.depth, 'postcode');
  assert.match(sources.get('mois-juso-basic-districts')?.notes.join(' ') ?? '', /same five-digit.*canonical postal geometry.*model geometry cannot fill/i);
  assert.equal(sources.get('mois-juso-road-address-api')?.depth, 'address');
  assert.equal(sources.get('mois-juso-building-db')?.depth, 'building');
  assert.equal(sources.get('mois-juso-electronic-map')?.requiresCredential, true);
  assert.match(sources.get('mois-juso-electronic-map')?.notes.join(' ') ?? '', /documented source relation.*containment.*do not suffice.*not unrestricted/i);
  assert.equal(sources.get('molit-korea-gis-integrated-buildings')?.depth, 'building');
  assert.equal(sources.get('molit-korea-continuous-cadastral-map')?.trustTier, 'official');
  assert.equal(sources.get('molit-korea-continuous-cadastral-map')?.validationReadiness, 'metadata-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'KR',
    source: 'Korea Post Postcode API',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('catalog source ids are unique and sorted by trust for a country lookup', () => {
  const ids = OFFICIAL_POSTAL_SOURCE_CATALOG.map(source => source.id);
  assert.equal(new Set(ids).size, ids.length);

  const jpSources = getOfficialPostalSourcesForCountry('JP');
  assert.equal(jpSources[0].id, 'japan-post-digital-address-api');
  assert.ok(jpSources.find(source => source.id === 'zipcloud-jp'));
});
