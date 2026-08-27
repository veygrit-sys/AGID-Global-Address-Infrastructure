import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['ethiopost-branches', 'ethiopost-delivery-address-form', 'upu-ethiopia-addressing-2002', 'ethiopia-ssgi-edas', 'ethiopia-nsdi-geoportal', 'ethiopia-bishoftu-address-book', 'ethiopia-addis-land-registration-edas', 'osm-ethiopia'] as const;
const OFFICIAL = EXPECTED.filter(id => id !== 'osm-ethiopia');

test('Ethiopia registry separates operator observations, dated postcode semantics, eDAS, NSDI, land registration, and community data', () => {
  const ids = getAfricaOpenSourceIds('ET');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['ethiopost-branches'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopost-branches'].notes, /official.*branch.*region.*service.*not.*complete four-digit.*perimeter.*bulk/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopost-delivery-address-form'].notes, /sub-city.*woreda.*house number.*postal-code.*not.*assignment rows.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-ethiopia-addressing-2002'].notes, /Dated.*four-digit.*region.*central-office.*delivery-office.*not.*current.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopia-ssgi-edas'].notes, /buildings.*parcels.*neighbourhoods.*city by city.*not.*nationwide row-level.*postal-code geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopia-nsdi-geoportal'].notes, /OGC.*public or access-controlled.*owner.*licence.*CRS.*not postal authority/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopia-bishoftu-address-book'].notes, /city-specific.*buildings.*parcels.*not nationwide.*unrestricted building geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ethiopia-addis-land-registration-edas'].notes, /land-registration.*no address rows.*crosswalk.*postal assignment/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-ethiopia'].license ?? '', /ODbL.*separate/i);
});

test('Ethiopia official catalog exposes matching authority and reuse boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ET').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('ethiopost-branches')?.trustTier, 'authoritative');
  assert.equal(sources.get('upu-ethiopia-addressing-2002')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ethiopia-ssgi-edas')?.depth, 'address');
  assert.equal(sources.get('ethiopia-nsdi-geoportal')?.depth, 'geo-only');
  assert.equal(sources.get('ethiopia-bishoftu-address-book')?.depth, 'building');
});
