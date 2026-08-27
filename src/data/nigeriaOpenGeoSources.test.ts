import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = [
  'nipost-postcode',
  'nipost-national-digital-postcode-2026',
  'nipost-addressing-standard-2017',
  'upu-nigeria-addressing-2022',
  'npc-nigeria-ead-2023',
  'fcta-nigeria-agis',
  'ndpc-nigeria-data-protection-act-2023',
  'ndpc-nigeria-gaid-2025',
] as const;

test('Nigeria registry separates current numeric reference, future digital launch, standards, census/admin, cadastre, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('NG'));
  for (const id of [...OFFICIAL, 'osm-nigeria'] as const) assert.ok(ids.has(id));
  assert.equal(AFRICA_OPEN_GEO_SOURCES['nipost-postcode'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['nipost-postcode'].notes, /numeric postcode.*no stable documented public API.*building relation.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nipost-national-digital-postcode-2026'].notes, /1 October 2026.*11-character.*Before.*effective date.*prelaunch/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nipost-addressing-standard-2017'].notes, /six-digit.*building-identification.*not.*database.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-nigeria-addressing-2022'].notes, /six digits.*P\.O\. Boxes.*not.*current.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['npc-nigeria-ead-2023'].license ?? '', /cost.*contract.*confidentiality.*redistribution/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['fcta-nigeria-agis'].notes, /FCT.*jurisdiction.*not.*national NIPOST.*address-to-building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ndpc-nigeria-data-protection-act-2023'].notes, /cross-border.*precise private addresses.*query/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ndpc-nigeria-gaid-2025'].notes, /DPIA.*security.*cross-border/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-nigeria'].license ?? '', /ODbL.*separate/i);
});

test('Nigeria official catalog exposes matching current, future, geometry-rights, building and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('NG').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id), id);
  assert.equal(sources.get('nipost-postcode')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('nipost-postcode')?.availability, 'web-search');
  assert.equal(sources.get('nipost-national-digital-postcode-2026')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('nipost-national-digital-postcode-2026')?.depth, 'building');
  assert.equal(sources.get('nipost-addressing-standard-2017')?.sourceRole, 'context-only');
  assert.equal(sources.get('upu-nigeria-addressing-2022')?.sourceRole, 'context-only');
  assert.equal(sources.get('npc-nigeria-ead-2023')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('fcta-nigeria-agis')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('ndpc-nigeria-data-protection-act-2023')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('ndpc-nigeria-gaid-2025')?.sourceRole, 'legal-framework-only');
});
