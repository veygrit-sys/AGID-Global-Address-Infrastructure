import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = ['seychelles-postal-regulator-nas', 'seychelles-statehouse-nas-2024', 'seychelles-finance-nas-2025', 'seychelles-statehouse-nas-bill-2026', 'seychelles-postal-regulator-operators', 'seychelles-nbs-gis', 'seychelles-lands-webgis', 'seychelles-webgis-disclaimer', 'seychelles-land-registration-act', 'seychelles-data-protection-act-2023'] as const;

test('Seychelles registry separates no-postcode transition, NAS, operators, statistics, WebGIS, cadastre, privacy and community buildings', () => {
  const ids = new Set(getAfricaOpenSourceIds('SC'));
  for (const id of [...OFFICIAL, 'osm-seychelles', 'osm-seychelles-building-import'] as const) assert.ok(ids.has(id));
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-postal-regulator-nas'].notes, /coming soon.*does not publish.*postcode assignment.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-statehouse-nas-bill-2026'].notes, /0000.*placeholder.*Bill.*not enactment.*assign(?:ed|ment)/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-finance-nas-2025'].notes, /Beau Vallon.*underway.*future.*not.*complete current/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-nbs-gis'].notes, /enumeration-area.*household.*not postal.*exact-address/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-lands-webgis'].notes, /parcel.*informational.*controlled.*rights.*lineage/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-webgis-disclaimer'].notes, /not live.*licensed surveys.*not official court/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['seychelles-data-protection-act-2023'].notes, /privacy by design.*cross-border/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-seychelles'].license ?? '', /ODbL.*separate/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-seychelles-building-import'].notes, /2018.*31,000.*not.*current national address/i);
});

test('Seychelles official catalog exposes matching transition, legal, building, geographic and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SC').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('seychelles-postal-regulator-nas')?.availability, 'no-normal-postcode');
  assert.equal(sources.get('seychelles-postal-regulator-nas')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('seychelles-statehouse-nas-2024')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('seychelles-finance-nas-2025')?.depth, 'building');
  assert.equal(sources.get('seychelles-statehouse-nas-bill-2026')?.availability, 'no-normal-postcode');
  assert.equal(sources.get('seychelles-postal-regulator-operators')?.depth, 'delivery-point');
  assert.equal(sources.get('seychelles-nbs-gis')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('seychelles-lands-webgis')?.requiresCredential, true);
  assert.equal(sources.get('seychelles-webgis-disclaimer')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('seychelles-land-registration-act')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('seychelles-data-protection-act-2023')?.sourceRole, 'legal-framework-only');
});
