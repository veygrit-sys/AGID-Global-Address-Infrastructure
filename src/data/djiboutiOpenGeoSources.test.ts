import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const EXPECTED = ['mcpt-djibouti-poste', 'upu-djibouti-addressing-2020', 'upu-djibouti-postcode-length-2026', 'upu-postcode-database-licensing-2026', 'djibouti-decentralisation-cartography', 'osm-djibouti'] as const;

test('Djibouti sources separate postal reference, contract, administration and community context', () => {
  const ids = getAfricaOpenSourceIds('DJ');
  for (const id of EXPECTED) assert.ok(ids.includes(id));
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-djibouti-addressing-2020'].notes, /ten public.*not proven complete.*no postal geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-postcode-database-licensing-2026'].license ?? '', /Licence contract.*non-disclosure.*rates/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['djibouti-decentralisation-cartography'].notes, /administrative context.*do not define.*postcode/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-djibouti'].license ?? '', /ODbL.*separate/i);
});

test('official catalog exposes the current format and dated assignment references without promoting geometry', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('DJ').map(source => [source.id, source]));
  for (const id of ['mcpt-djibouti-poste', 'upu-djibouti-addressing-2020', 'upu-djibouti-postcode-length-2026', 'djibouti-decentralisation-cartography']) assert.ok(sources.has(id));
  assert.equal(sources.get('upu-djibouti-addressing-2020')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('djibouti-decentralisation-cartography')?.depth, 'geo-only');
});
