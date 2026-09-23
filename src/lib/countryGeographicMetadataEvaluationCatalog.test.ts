import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_CATALOG_VERSION,
  buildApprovedCountryGeographicMetadataEvaluationIndex,
  listCountryGeographicMetadataCatalogEntries,
} from './countryGeographicMetadataEvaluationCatalog';
import { projectCountryGeographicMetadataReadiness } from './countryGeographicMetadataEvaluationIndex';

test('registers Guatemala official-source metadata only with reuse, version, scope, and correction evidence', () => {
  const entries = listCountryGeographicMetadataCatalogEntries();
  assert.equal(COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_CATALOG_VERSION, 'country-geographic-metadata-evaluation-catalog-v4');
  assert.equal(entries.length, 4);

  const guatemala = entries.find(entry => entry.source.countryCode === 'GT')!;
  assert.equal(guatemala.source.countryCode, 'GT');
  assert.equal(guatemala.source.authorityStatus, 'official-country-or-territory');
  assert.equal(guatemala.source.reuseStatus, 'reuse-approved');
  assert.equal(guatemala.source.versionStatus, 'verified-current');
  assert.equal(guatemala.source.coverageStatus, 'country-or-territory-coverage-evidenced');
  assert.equal(guatemala.source.correctionPathStatus, 'source-record-publisher-contact-confirmed');
  assert.equal(guatemala.source.rawPrivateMaterialStored, false);
  for (const url of Object.values(guatemala.evidence).filter(value => value.startsWith('https://'))) {
    assert.match(url, /^https:\/\//);
  }
  const projectedFields = [
    ...Object.keys(guatemala.source),
    ...Object.keys(guatemala.syntheticAdministrativeKeys[0] || {}),
  ];
  for (const forbiddenField of [
    'address',
    'recipient',
    'postcode',
    'latitude',
    'longitude',
    'credential',
    'secret',
  ]) {
    assert.ok(!projectedFields.includes(forbiddenField), `${forbiddenField} is not catalogued`);
  }
});

test('registers Australia ABS ASGS Edition 4 as current CC BY synthetic state-and-territory evidence only', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const australia = index.sources.find(source => source.countryCode === 'AU');

  assert.deepEqual(australia, {
    countryCode: 'AU',
    sourceId: 'abs-au-asgs-edition-4-main-2026',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceVersion: 'asgs-edition-4-main-structure-released-2026-07-22',
    sourceUrl: 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031',
    authorityEvidenceUrl: 'https://www.abs.gov.au/about',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.abs.gov.au/website-privacy-copyright-and-disclaimer',
    declaredScope: 'country',
    correctionUrl: 'https://www.abs.gov.au/about/contact-us',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvedAdministrativeKeyKinds: ['first-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    syntheticAdministrativeKeyCount: 1,
    deliveryClaimsEnabled: false,
  });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(index, 'AU'), [{
    countryCode: 'AU',
    sourceId: 'abs-au-asgs-edition-4-main-2026',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 1,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
});

test('registers the current Stats NZ geographic-boundaries release for synthetic administrative evaluation only', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const newZealand = index.sources.find(source => source.countryCode === 'NZ');

  assert.deepEqual(newZealand, {
    countryCode: 'NZ',
    sourceId: 'stats-nz-geographic-boundaries-2026',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceVersion: 'geographic-boundaries-as-at-2026-01-01-published-2025-12-10',
    sourceUrl: 'https://www.stats.govt.nz/information-releases/geographic-boundaries-annual-release-as-at-1-january-2026/',
    authorityEvidenceUrl: 'https://www.stats.govt.nz/assets/Methods/Statistical-standard-for-geographic-areas-2023/statistical-standard-for-geographic-areas-2023-updated-december-2023.pdf',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.stats.govt.nz/',
    declaredScope: 'country',
    correctionUrl: 'https://portal.apis.stats.govt.nz/contact-us',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'second-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    syntheticAdministrativeKeyCount: 2,
    deliveryClaimsEnabled: false,
  });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(index, 'NZ'), [{
    countryCode: 'NZ',
    sourceId: 'stats-nz-geographic-boundaries-2026',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 2,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
});

test('registers Panama INEC political-division metadata under the CC BY source license', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const panama = index.sources.find(source => source.countryCode === 'PA');

  assert.deepEqual(panama, {
    countryCode: 'PA',
    sourceId: 'inec-pa-political-division-2020',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceVersion: 'political-division-2020-published-2024-05-30',
    sourceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    authorityEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    declaredScope: 'country',
    correctionUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'second-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    syntheticAdministrativeKeyCount: 2,
    deliveryClaimsEnabled: false,
  });
  assert.deepEqual(projectCountryGeographicMetadataReadiness(index, 'PA'), [{
    countryCode: 'PA',
    sourceId: 'inec-pa-political-division-2020',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 2,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
});

test('projects current approved sources only for synthetic administrative evaluation', () => {
  const current = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  assert.equal(current.sources.length, 4);
  assert.deepEqual(projectCountryGeographicMetadataReadiness(current, 'GT'), [{
    countryCode: 'GT',
    sourceId: 'segeplan-gt-nbi-municipal-2018',
    sourceOrigin: 'official-publication',
    approvedAdministrativeKeyCount: 2,
    syntheticAdministrativeEvaluationEligible: true,
    deliveryClaimsEnabled: false,
  }]);

  const expired = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-08-26T00:00:00Z' });
  assert.equal(expired.sources.length, 0);
  assert.ok(expired.blockedCandidates.some(candidate => candidate.reason === 'current-review-required'));
});
