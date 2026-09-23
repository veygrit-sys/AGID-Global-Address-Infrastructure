import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['posta-kenya', 'posta-kenya-customer-service-charter-2022', 'posta-kenya-properties-2026', 'upu-kenya-addressing-2004', 'ca-kenya-national-addressing-system', 'kenya-national-addressing-policy-2023', 'survey-of-kenya-mapping-policy-2021', 'ardhisasa-kenya', 'odpc-kenya-address-location-privacy', 'osm-kenya'] as const;
const OFFICIAL = EXPECTED.filter(id => id !== 'osm-kenya');

test('Kenya registry separates postcode, box and virtual address, NASK, mapping, land, privacy and community data', () => {
  const ids = getAfricaOpenSourceIds('KE');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['posta-kenya'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['posta-kenya'].notes, /five-digit.*individual post office.*not.*catchment polygon.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['posta-kenya-customer-service-charter-2022'].notes, /P\.O\. Box.*post-office code.*separate.*EMS.*not reusable/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['posta-kenya-properties-2026'].notes, /2026.*postcodes.*counties.*not.*complete.*geometry.*open-data/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-kenya-addressing-2004'].notes, /five-digit.*delivery-post-office.*not.*current.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ca-kenya-national-addressing-system'].notes, /June 2026.*Bill 2025.*not.*operational nationwide/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['survey-of-kenya-mapping-policy-2021'].notes, /mapping authority.*property-boundary.*not.*postcode/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ardhisasa-kenya'].notes, /property.*survey.*not.*crosswalk.*owner/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['odpc-kenya-address-location-privacy'].notes, /address.*location.*personal data.*property.*sensitive/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-kenya'].license ?? '', /ODbL.*separate/i);
});

test('Kenya official catalog exposes matching authority, legislation status, access and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('KE').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('posta-kenya')?.trustTier, 'authoritative');
  assert.equal(sources.get('posta-kenya-properties-2026')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('ca-kenya-national-addressing-system')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('survey-of-kenya-mapping-policy-2021')?.depth, 'geo-only');
  assert.equal(sources.get('ardhisasa-kenya')?.depth, 'building');
  assert.equal(sources.get('ardhisasa-kenya')?.requiresCredential, true);
  assert.equal(sources.get('odpc-kenya-address-location-privacy')?.sourceRole, 'legal-framework-only');
});