import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = [
  'tcra-tanzania-postcodes',
  'tcra-tanzania-postcode-plan-2026',
  'tcra-tanzania-addressing',
  'tanzania-postal-regulations-2018',
  'nbs-tanzania-wards-2022',
  'tcra-tanzania-napa',
  'pdpc-tanzania-act-2022',
  'pdpc-tanzania-enforcement-2026',
] as const;

test('Tanzania registry separates TCRA assignment/category evidence, restricted boundaries, physical addressing, privacy and community data', () => {
  const ids = new Set(getAfricaOpenSourceIds('TZ'));
  for (const id of [...OFFICIAL, 'osm-tanzania'] as const) assert.ok(ids.has(id));
  assert.equal(AFRICA_OPEN_GEO_SOURCES['tcra-tanzania-postcodes'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['tcra-tanzania-postcodes'].notes, /region.*district.*five-digit.*not.*bulk.*category.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['tcra-tanzania-postcode-plan-2026'].notes, /five digits.*wards.*post offices.*big mailers.*landmarks.*temporary events.*cannot identify an area/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['tanzania-postal-regulations-2018'].notes, /sole disseminator.*address files.*does not grant unrestricted/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nbs-tanzania-wards-2022'].license ?? '', /research only.*no redistribution.*written agreement/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nbs-tanzania-wards-2022'].notes, /Arc 1960.*not TCRA postcode polygons.*Zanzibar\/shehia/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['tcra-tanzania-napa'].notes, /LGAs.*house numbers.*explicit.*address-to-building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['pdpc-tanzania-enforcement-2026'].notes, /9 April 2026.*controller\/processor/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-tanzania'].license ?? '', /ODbL.*separate/i);
});

test('Tanzania official catalog exposes matching assignment, category, geometry-rights, building and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('TZ').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id), id);
  assert.equal(sources.get('tcra-tanzania-postcodes')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('tcra-tanzania-postcode-plan-2026')?.sourceRole, 'context-only');
  assert.equal(sources.get('tcra-tanzania-addressing')?.depth, 'address');
  assert.equal(sources.get('tanzania-postal-regulations-2018')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('nbs-tanzania-wards-2022')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('nbs-tanzania-wards-2022')?.depth, 'geo-only');
  assert.equal(sources.get('tcra-tanzania-napa')?.depth, 'building');
  assert.equal(sources.get('tcra-tanzania-napa')?.requiresCredential, true);
  assert.equal(sources.get('pdpc-tanzania-act-2022')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('pdpc-tanzania-enforcement-2026')?.sourceRole, 'legal-framework-only');
});
