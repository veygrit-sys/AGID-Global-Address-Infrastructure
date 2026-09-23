import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = [
  'niger-poste',
  'niger-poste-agencies',
  'upu-niger-addressing-2005',
  'ignniger-national-geography',
  'hapdp-niger-data-protection-2022',
] as const;

test('Niger registry separates postal routing, offices, dated address rules, national geography, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('NE'));
  for (const id of [...OFFICIAL, 'osm-niger'] as const) assert.ok(ids.has(id), id);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['niger-poste'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['niger-poste'].notes, /four-digit.*locality.*region.*eight regions.*post office.*no boundary.*building.*licence/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['niger-poste-agencies'].notes, /office-identity.*not.*catchment.*civic address.*building.*subscriber/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-niger-addressing-2005'].notes, /first digit region.*remaining digits post office.*left of locality.*P\.O\. Box.*2005.*not.*live assignments.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ignniger-national-geography'].notes, /cartographic.*spatial-database.*administrative.*cadastral.*cannot prove.*postcode polygon.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['hapdp-niger-data-protection-2022'].notes, /Law 2022-59.*purpose.*security.*retention.*addresses.*query histories.*not public/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-niger'].license ?? '', /ODbL.*separate/i);
});

test('Niger official catalog exposes the same assignment, non-geometry, building-rights and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('NE').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id), id);
  assert.equal(sources.get('niger-poste')?.trustTier, 'authoritative');
  assert.equal(sources.get('niger-poste')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('niger-poste-agencies')?.sourceRole, 'context-only');
  assert.equal(sources.get('upu-niger-addressing-2005')?.sourceRole, 'context-only');
  assert.equal(sources.get('ignniger-national-geography')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('ignniger-national-geography')?.depth, 'geo-only');
  assert.equal(sources.get('hapdp-niger-data-protection-2022')?.sourceRole, 'legal-framework-only');
});
