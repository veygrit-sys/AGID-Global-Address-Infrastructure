import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = [
  'la-poste-tunisienne-codes',
  'upu-tunisia-addressing-2014',
  'tunisian-open-data-national-license',
  'tunisian-open-data-delegations-2025',
  'tunisian-open-data-governorates-2025',
  'otc-tunisia-cadastral-geoportal',
  'inpdp-tunisia-law-2004-63',
  'la-poste-tunisienne-privacy',
] as const;

test('Tunisia registry separates La Poste assignment, dated format, admin geometry, cadastre, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('TN'));
  for (const id of [...OFFICIAL, 'osm-tunisia'] as const) assert.ok(ids.has(id));
  assert.equal(AFRICA_OPEN_GEO_SOURCES['la-poste-tunisienne-codes'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['la-poste-tunisienne-codes'].notes, /governorate.*delegation.*locality.*not.*bulk.*catchment.*building.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-tunisia-addressing-2014'].notes, /four digits.*delivery office.*building.*examples.*not.*current.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['tunisian-open-data-delegations-2025'].license ?? '', /licence not specified.*no bundling/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['tunisian-open-data-governorates-2025'].notes, /coarse.*not.*postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['otc-tunisia-cadastral-geoportal'].notes, /parcel.*not.*postcode.*address-to-building.*owner/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['inpdp-tunisia-law-2004-63'].notes, /Articles 50-52.*foreign transfers.*authorization/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['la-poste-tunisienne-privacy'].notes, /postal addresses.*geolocation.*foreign-transfer/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-tunisia'].license ?? '', /ODbL.*separate/i);
});

test('Tunisia official catalog exposes matching assignment, geometry-rights, cadastre, building and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('TN').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id), id);
  assert.equal(sources.get('la-poste-tunisienne-codes')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('la-poste-tunisienne-codes')?.availability, 'web-search');
  assert.equal(sources.get('upu-tunisia-addressing-2014')?.sourceRole, 'context-only');
  assert.equal(sources.get('tunisian-open-data-national-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('tunisian-open-data-delegations-2025')?.availability, 'web-search');
  assert.equal(sources.get('tunisian-open-data-governorates-2025')?.availability, 'bulk-open-data');
  assert.equal(sources.get('otc-tunisia-cadastral-geoportal')?.depth, 'geo-only');
  assert.equal(sources.get('inpdp-tunisia-law-2004-63')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('la-poste-tunisienne-privacy')?.sourceRole, 'legal-framework-only');
});
